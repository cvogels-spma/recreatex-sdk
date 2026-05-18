/**
 * The main {@link ReCreateXClient} class.
 *
 * Construct once per worker / per request and reach for `client.expositions`,
 * `client.general`, `client.articles`, `client.manager`, `client.documents`.
 *
 * @example
 *   const rx = new ReCreateXClient({
 *     baseUrl: env.RECREATEX_BASE_URL,
 *     shopId:  env.RECREATEX_SHOP_ID,
 *     password: env.RECREATEX_PASSWORD,
 *   });
 *   const zones = await rx.general.findAccessZones({ today: true });
 */

import { buildContext, STABLE_SESSION_ID } from './context.js';
import { RecreatexHttpError, RecreatexApiError, RecreatexTimeoutError } from './errors.js';
import { withRetry, type RetryOptions } from './helpers/retry.js';
import type { RecreatexContext, RecreatexEnvelope } from './types/common.js';

import { ArticlesModule } from './modules/articles.js';
import { ExpositionsModule } from './modules/expositions.js';
import { GeneralModule } from './modules/general.js';
import { ManagerModule } from './modules/manager.js';
import { DocumentsModule } from './documents/gift-certificates.js';

export type FetchLike = typeof fetch;

export interface ReCreateXClientOptions {
  /** Recreatex JSON API base, e.g. `https://wsdlspacemagic.recreatex.be`. No trailing slash. */
  baseUrl: string;
  shopId: string;
  password: string;
  /** Defaults to `'de'`. Some endpoints (FindAccessZones) historically used `'en'` — overridable per call. */
  language?: string;
  /**
   * Either:
   *  - a fixed UUID string (default `STABLE_SESSION_ID`),
   *  - a factory `() => string` (use {@link uuidv4} for the voucher checkout flow).
   */
  sessionId?: string | (() => string);
  /** Inject a custom fetch (tests, MSW, undici). Default `globalThis.fetch`. */
  fetch?: FetchLike;
  /** Per-request timeout in milliseconds. Default `15000`. */
  timeoutMs?: number;
  /** Retry policy applied to every call. Default 3 attempts, 250ms backoff. */
  retry?: RetryOptions;
  /** Optional default DivisionId injected into every Context. */
  divisionId?: string;
  /** Optional document service base, defaults to `${baseUrl}/WebShopDocumentService.svc`. */
  documentServiceUrl?: string;
}

export interface CallOptions {
  /** Override the language for this single call. */
  language?: string;
  /** Override the session-id for this single call. */
  sessionId?: string;
  /** Override request timeout for this single call. */
  timeoutMs?: number;
  /** Cancel-token. */
  signal?: AbortSignal;
  /** Disable retries for this call. */
  noRetry?: boolean;
}

export class ReCreateXClient {
  readonly options: Required<Pick<ReCreateXClientOptions, 'baseUrl' | 'shopId' | 'password' | 'language' | 'timeoutMs'>> &
    ReCreateXClientOptions;

  private readonly _fetch: FetchLike;

  readonly articles: ArticlesModule;
  readonly expositions: ExpositionsModule;
  readonly general: GeneralModule;
  readonly manager: ManagerModule;
  readonly documents: DocumentsModule;

  constructor(opts: ReCreateXClientOptions) {
    if (!opts.baseUrl) throw new Error('ReCreateXClient: baseUrl is required');
    if (!opts.shopId) throw new Error('ReCreateXClient: shopId is required');
    if (!opts.password) throw new Error('ReCreateXClient: password is required');

    const baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.options = {
      ...opts,
      baseUrl,
      language: opts.language ?? 'de',
      timeoutMs: opts.timeoutMs ?? 15_000,
    };

    const f = opts.fetch ?? (globalThis.fetch as FetchLike | undefined);
    if (!f) {
      throw new Error(
        'ReCreateXClient: no fetch implementation available. Pass `fetch:` explicitly on Node <18.',
      );
    }
    this._fetch = f.bind(globalThis);

    this.articles = new ArticlesModule(this);
    this.expositions = new ExpositionsModule(this);
    this.general = new GeneralModule(this);
    this.manager = new ManagerModule(this);
    this.documents = new DocumentsModule(this);
  }

  /** Build a fresh Context for a call, honouring per-call overrides. */
  buildContext(overrides?: { language?: string; sessionId?: string }): RecreatexContext {
    return buildContext({
      shopId: this.options.shopId,
      password: this.options.password,
      language: overrides?.language ?? this.options.language,
      sessionId: overrides?.sessionId ?? this.options.sessionId ?? STABLE_SESSION_ID,
      ...(this.options.divisionId !== undefined && { divisionId: this.options.divisionId }),
    });
  }

  /**
   * Low-level POST. Builds the URL as `${baseUrl}/${path}/`, injects Context,
   * applies timeout + retry, and parses JSON. Throws {@link RecreatexHttpError},
   * {@link RecreatexApiError}, or {@link RecreatexTimeoutError}.
   *
   * @internal Used by the module classes; exposed for advanced callers.
   */
  async post<TResponse extends RecreatexEnvelope = RecreatexEnvelope>(
    path: string,
    body: Record<string, unknown>,
    callOpts: CallOptions = {},
  ): Promise<TResponse> {
    const endpoint = path.replace(/^\/+/, '').replace(/\/+$/, '');
    const url = `${this.options.baseUrl}/${endpoint}/`;
    const ctx = this.buildContext({
      ...(callOpts.language !== undefined && { language: callOpts.language }),
      ...(callOpts.sessionId !== undefined && { sessionId: callOpts.sessionId }),
    });
    const payload = JSON.stringify({ Context: ctx, ...body });
    const timeoutMs = callOpts.timeoutMs ?? this.options.timeoutMs;
    const retryOpts: RetryOptions = callOpts.noRetry
      ? { attempts: 1, ...(callOpts.signal && { signal: callOpts.signal }) }
      : { ...(this.options.retry ?? {}), ...(callOpts.signal && { signal: callOpts.signal }) };

    return withRetry(async () => {
      const ac = new AbortController();
      const onParentAbort = () => ac.abort(callOpts.signal?.reason);
      callOpts.signal?.addEventListener('abort', onParentAbort, { once: true });
      const timer = setTimeout(() => ac.abort(new RecreatexTimeoutError(endpoint, timeoutMs)), timeoutMs);

      let res: Response;
      try {
        res = await this._fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: payload,
          signal: ac.signal,
        });
      } catch (err) {
        if (ac.signal.reason instanceof RecreatexTimeoutError) throw ac.signal.reason;
        throw err;
      } finally {
        clearTimeout(timer);
        callOpts.signal?.removeEventListener('abort', onParentAbort);
      }

      if (!res.ok) {
        const text = await safeReadText(res);
        throw new RecreatexHttpError(res.status, endpoint, text);
      }

      const data = (await res.json()) as TResponse;
      assertOk<TResponse>(data, endpoint);
      return data;
    }, retryOpts);
  }

  /** Low-level GET — only used by the document service for binary downloads. */
  async getBinary(url: string, callOpts: CallOptions = {}): Promise<Blob> {
    const timeoutMs = callOpts.timeoutMs ?? this.options.timeoutMs;
    const retryOpts: RetryOptions = callOpts.noRetry
      ? { attempts: 1, ...(callOpts.signal && { signal: callOpts.signal }) }
      : { ...(this.options.retry ?? {}), ...(callOpts.signal && { signal: callOpts.signal }) };

    return withRetry(async () => {
      const ac = new AbortController();
      const onParentAbort = () => ac.abort(callOpts.signal?.reason);
      callOpts.signal?.addEventListener('abort', onParentAbort, { once: true });
      const timer = setTimeout(() => ac.abort(new RecreatexTimeoutError(url, timeoutMs)), timeoutMs);
      try {
        const res = await this._fetch(url, { method: 'GET', signal: ac.signal });
        if (!res.ok) {
          const text = await safeReadText(res);
          throw new RecreatexHttpError(res.status, url, text);
        }
        return await res.blob();
      } catch (err) {
        if (ac.signal.reason instanceof RecreatexTimeoutError) throw ac.signal.reason;
        throw err;
      } finally {
        clearTimeout(timer);
        callOpts.signal?.removeEventListener('abort', onParentAbort);
      }
    }, retryOpts);
  }
}

function assertOk<T extends RecreatexEnvelope>(data: T, endpoint: string): asserts data is T {
  if (data && typeof data === 'object') {
    if ((data as { succes?: boolean }).succes === false) {
      const message = (data as { message?: string }).message ?? 'unknown error';
      throw new RecreatexApiError(message, endpoint, data);
    }
    // Recreatex returns checkout/recalc envelopes as camelCase
    // (`result.basketValidationResult.isValid`); older builds
    // sometimes serialise PascalCase. Accept both.
    const lowerResult = (data as {
      result?: { basketValidationResult?: { isValid?: boolean; message?: string; brokenRuleName?: string } };
    }).result;
    const upperResult = (data as {
      Result?: { BasketValidationResult?: { IsValid?: boolean; Message?: string; brokenRuleName?: string } };
    }).Result;
    const lowerVal = lowerResult?.basketValidationResult;
    const upperVal = upperResult?.BasketValidationResult;
    const isValid = lowerVal?.isValid ?? upperVal?.IsValid;
    if (isValid === false) {
      const brokenRuleName = lowerVal?.brokenRuleName ?? upperVal?.brokenRuleName;
      const message =
        lowerVal?.message ?? upperVal?.Message ?? brokenRuleName ?? 'basket validation failed';
      const opts =
        brokenRuleName !== undefined && brokenRuleName !== null
          ? { brokenRuleName }
          : undefined;
      throw new RecreatexApiError(message, endpoint, data, opts);
    }
  }
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
