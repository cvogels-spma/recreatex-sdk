/**
 * Date helpers.
 *
 * Recreatex accepts two distinct datetime formats:
 *  - "YYYY-MM-DD HH:mm:ss.SSS"  → ManagerApp / General / Articles
 *  - "YYYY-MM-DDTHH:mm:ss"      → Expositions
 *
 * Always pre-format with these helpers; never hand-concat in calling code.
 */

import type { Ymd, RecreatexDateTime } from '../types/common.js';

const DEFAULT_TZ = 'Europe/Berlin';

/** Format a `Date` as `YYYY-MM-DD` in the given timezone (default Europe/Berlin). */
export function ymd(d: Date = new Date(), tz: string = DEFAULT_TZ): Ymd {
  return d.toLocaleDateString('sv-SE', { timeZone: tz });
}

/** `YYYY-MM-DD` for "today" in the given timezone. */
export function todayYmd(tz: string = DEFAULT_TZ): Ymd {
  return ymd(new Date(), tz);
}

/** `[from, until]` covering the full day (`00:00:00.000` .. `23:59:59.000`)
 *  in the dotted "ManagerApp" datetime format. */
export function dayRangeDotted(date: Ymd | Date = new Date(), tz: string = DEFAULT_TZ): {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
} {
  const d = typeof date === 'string' ? date : ymd(date, tz);
  return {
    from: `${d} 00:00:00.000`,
    until: `${d} 23:59:59.000`,
  };
}

/** `[from, until]` covering the full day in ISO format (`T00:00:00`..`T23:59:59`)
 *  for the Expositions namespace. */
export function dayRangeIso(date: Ymd | Date = new Date(), tz: string = DEFAULT_TZ): {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
} {
  const d = typeof date === 'string' ? date : ymd(date, tz);
  return {
    from: `${d}T00:00:00`,
    until: `${d}T23:59:59`,
  };
}

/** `[fromYmd, untilYmd]` window centred on `today`, spanning -before .. +after days. */
export function ymdWindow(
  before: number,
  after: number,
  today: Date = new Date(),
  tz: string = DEFAULT_TZ,
): { fromYmd: Ymd; untilYmd: Ymd } {
  const from = new Date(today);
  from.setDate(from.getDate() - before);
  const until = new Date(today);
  until.setDate(until.getDate() + after);
  return { fromYmd: ymd(from, tz), untilYmd: ymd(until, tz) };
}
