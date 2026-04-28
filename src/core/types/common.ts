/**
 * Common types shared across all Recreatex endpoints.
 *
 * The Recreatex JSON API uses PascalCase field names on the wire. The SDK
 * exposes camelCase TypeScript interfaces and translates at the boundary —
 * keep that asymmetry in mind when reading raw responses.
 */

/**
 * Authentication context attached to every request body.
 *
 * The SDK builds this for you via {@link buildContext}; you only need to
 * touch it directly when bypassing the high-level client.
 *
 * @remarks
 * - `SessionId` is a UUID. Most endpoints accept the same SessionId across
 *   calls, but the voucher checkout flow expects a fresh UUID per buyer
 *   session.
 * - `DivisionId`, `Origin`, `Encode`, `AccessToken` are optional and
 *   rarely required.
 */
export interface RecreatexContext {
  Language: string;
  ShopId: string;
  SessionId: string;
  Password: string;
  DivisionId?: string;
  Origin?: number;
  Encode?: boolean;
  AccessToken?: string;
}

/** Inclusive paging window. PageIndex is zero-based. */
export interface Paging {
  PageIndex: number;
  PageSize: number;
}

/** Generic envelope used by most "Find*"/"List*" responses.
 *
 * Note the typo: the API spells the success flag `succes` (not `success`).
 * Treat `succes === false` as an error condition and throw.
 */
export interface RecreatexEnvelope {
  succes?: boolean;
  message?: string;
  result?: unknown;
}

/** ISO-like local datetime as accepted by Recreatex.
 *
 *  Two flavours:
 *  - "2026-04-12 00:00:00.000" — used by ManagerApp and General namespaces
 *  - "2026-04-12T14:00:00"     — used by Expositions namespace
 *
 *  Always pre-format with the SDK's date helpers so you don't drift between
 *  the two.
 */
export type RecreatexDateTime = string;

/** YYYY-MM-DD calendar date. */
export type Ymd = string;
