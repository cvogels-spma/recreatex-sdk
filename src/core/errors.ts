/**
 * Error hierarchy.
 *
 * Catch the base {@link RecreatexError} when you want to handle anything
 * the SDK throws. Catch a more specific subclass when you want to act on
 * just one failure mode.
 */

export class RecreatexError extends Error {
  /** Endpoint path that triggered the error, if known. */
  public readonly endpoint?: string;

  constructor(message: string, options?: { endpoint?: string; cause?: unknown }) {
    super(message);
    this.name = 'RecreatexError';
    this.endpoint = options?.endpoint;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/** HTTP-level error (non-2xx response). Body is captured if available. */
export class RecreatexHttpError extends RecreatexError {
  public readonly status: number;
  public readonly body?: string;

  constructor(
    status: number,
    endpoint: string,
    body?: string,
    options?: { cause?: unknown },
  ) {
    super(`Recreatex ${endpoint} HTTP ${status}`, { endpoint, cause: options?.cause });
    this.name = 'RecreatexHttpError';
    this.status = status;
    this.body = body;
  }
}

/**
 * API-level error — HTTP succeeded (2xx) but the response signalled
 * failure via either:
 *  - `data.succes === false` (most Find/List endpoints), or
 *  - `data.Result.BasketValidationResult.IsValid === false` (basket flow).
 *
 * `raw` keeps the full response so callers can inspect `brokenRuleName`,
 * `BasketItemValidationResults`, etc.
 */
export class RecreatexApiError extends RecreatexError {
  public readonly raw: unknown;
  public readonly brokenRuleName?: string;

  constructor(
    message: string,
    endpoint: string,
    raw: unknown,
    options?: { brokenRuleName?: string },
  ) {
    super(`Recreatex ${endpoint}: ${message}`, { endpoint });
    this.name = 'RecreatexApiError';
    this.raw = raw;
    this.brokenRuleName = options?.brokenRuleName;
  }
}

/** Request exceeded the configured timeout. */
export class RecreatexTimeoutError extends RecreatexError {
  public readonly timeoutMs: number;

  constructor(endpoint: string, timeoutMs: number) {
    super(`Recreatex ${endpoint} timed out after ${timeoutMs}ms`, { endpoint });
    this.name = 'RecreatexTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
