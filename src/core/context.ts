/**
 * Context construction. The {@link ReCreateXClient} calls this for you;
 * direct use is only needed when reaching past the high-level modules.
 */

import type { RecreatexContext } from './types/common.js';

/** Stable session UUID accepted by the read-only endpoints. */
export const STABLE_SESSION_ID = '00000000-0000-0000-0000-000000000001';

export interface ContextOptions {
  shopId: string;
  password: string;
  language?: string;
  /** Either a static UUID or a factory that returns a fresh UUID per call. */
  sessionId?: string | (() => string);
  divisionId?: string;
}

export function buildContext(opts: ContextOptions): RecreatexContext {
  const session =
    typeof opts.sessionId === 'function' ? opts.sessionId() : (opts.sessionId ?? STABLE_SESSION_ID);

  const ctx: RecreatexContext = {
    Language: opts.language ?? 'de',
    ShopId: opts.shopId,
    SessionId: session,
    Password: opts.password,
  };
  if (opts.divisionId) ctx.DivisionId = opts.divisionId;
  return ctx;
}

/**
 * Cross-runtime UUID v4 generator.
 *
 *  - Browser & Workers: uses `crypto.randomUUID()`.
 *  - Node 19+: ditto.
 *  - Node 18: falls back to `crypto.getRandomValues()`.
 */
export function uuidv4(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string; getRandomValues?: (b: Uint8Array) => Uint8Array } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}
