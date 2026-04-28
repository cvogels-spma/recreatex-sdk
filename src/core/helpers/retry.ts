/**
 * Retry helpers. Only network-level failures and 5xx HTTP errors are
 * retried — never 4xx, never API-validation errors. Honours an
 * `AbortSignal`.
 */

import { RecreatexHttpError, RecreatexError } from '../errors.js';

export interface RetryOptions {
  /** Total attempts including the first. Default `3`. */
  attempts?: number;
  /** Base delay in ms; doubles each retry. Default `250`. */
  backoffMs?: number;
  /** Max delay between retries. Default `4000`. */
  maxBackoffMs?: number;
  /** Optional cancellation signal. */
  signal?: AbortSignal;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof RecreatexHttpError) {
    return err.status >= 500 && err.status < 600;
  }
  if (err instanceof RecreatexError) return false;
  return true;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseBackoff = Math.max(0, opts.backoffMs ?? 250);
  const maxBackoff = Math.max(baseBackoff, opts.maxBackoffMs ?? 4000);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (opts.signal?.aborted) {
      throw opts.signal.reason ?? new Error('Aborted');
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isRetryableError(err)) throw err;
      const delay = Math.min(maxBackoff, baseBackoff * 2 ** (attempt - 1));
      const jitter = Math.random() * delay * 0.25;
      await sleep(delay + jitter, opts.signal);
    }
  }
  throw lastErr;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason ?? new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
