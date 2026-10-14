/**
 * Counting park entries from the check-in bons.
 *
 * Every check-in bon carries exactly ONE wallet line per wristband handed out:
 * "Hauskredit Kinder", "Hauskredit Erwachsene" or "Geburtstags Wallet". Their sum is the
 * number of people checked in, the bon time is the time of entry.
 *
 * Verified 2026-10-08 against the Gantner access counter: 337 wristbands vs. 334 counted on
 * 2026-10-04; from June 2025 on every month shows a stable 2.0 to 2.3 Gantner scans per
 * wristband. The counter value the dashboard stored per day (`daily_kpi.visitors`) covered
 * only 36 to 44 % of the entries from June to October 2025, which is why the closed-day value
 * comes from here.
 *
 * ⚠ The line names are the convention of the Space Magic tills, not an API field. If the
 * till articles get renamed, `wristbands` drops to zero; callers must treat 0 on a day with
 * check-in bons as "convention changed", never as "nobody came".
 *
 * ⚠ "Kinder"/"Erwachsene" is the LINE TYPE, not the age: in 2025 the tills booked most
 * children as "Hauskredit Erwachsene". Only the total is reliable over the whole history.
 */

import type { Sale } from '../core/types/general.js';
import { dedupSaleLines } from '../core/helpers/sales.js';
import { isAnonymousCustomer } from './ids.js';

/** Wallet line → bucket. One line per wristband. */
export const WRISTBAND_LINES: Readonly<Record<string, 'kids' | 'adults' | 'birthday'>> = {
  'Hauskredit Kinder': 'kids',
  'Hauskredit Erwachsene': 'adults',
  'Geburtstags Wallet': 'birthday',
};

/**
 * Articles that are a pass or a multi-visit card (annual pass, ten-visit card, season pass,
 * subscription). Their use can only be measured when they are sold to a NAMED customer.
 */
export const PASS_ARTICLE_PATTERN = /jahreskarte|zehnerkarte|saisonkarte|mehrfachkarte|\bpass\b|\babo\b/i;

export interface WristbandCount {
  /** People checked in (sum of the wallet lines, rounded once at the end). */
  wristbands: number;
  kids: number;
  adults: number;
  birthday: number;
  /** Bons with at least one wallet line (≈ groups/families at the till). */
  checkinSales: number;
  /** Entries per hour of the bon time (local park time), 24 slots. */
  byHour: number[];
  /** Pass / multi-visit card units sold to the anonymous customers (usage not traceable). */
  passSalesAnonymous: number;
  /** Pass / multi-visit card units sold to a named customer. */
  passSalesNamed: number;
}

/** Hour of a Recreatex bon timestamp (`2026-10-04T18:52:38`, park-local), or null. */
export function saleHour(date: string | undefined | null): number | null {
  const m = /T(\d{2}):/.exec(date ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  return h >= 0 && h < 24 ? h : null;
}

/**
 * Count entries (wristbands) and pass sales over a list of bons.
 *
 * Lines are deduplicated per bon first. Quantities are summed raw and rounded once per
 * bucket: a handful of lines carry fractional quantities (seen on "Geburtstags Wallet"),
 * and rounding per line would drift.
 */
export function countWristbands(sales: readonly Sale[]): WristbandCount {
  const raw = { kids: 0, adults: 0, birthday: 0 };
  const hours = new Array<number>(24).fill(0);
  let checkinSales = 0;
  let passAnon = 0;
  let passNamed = 0;

  for (const sale of sales) {
    let persons = 0;
    for (const line of dedupSaleLines(sale)) {
      const name = (line.description ?? '').trim();
      const qty = Number(line.quantity) || 0;
      const bucket = WRISTBAND_LINES[name];
      if (bucket) {
        raw[bucket] += qty;
        persons += qty;
        continue;
      }
      if (qty > 0 && (Number(line.totalPrice) || 0) > 0 && PASS_ARTICLE_PATTERN.test(name)) {
        if (isAnonymousCustomer(sale.customerId)) passAnon += qty;
        else passNamed += qty;
      }
    }
    if (persons > 0) {
      checkinSales++;
      const h = saleHour(sale.date);
      if (h !== null) hours[h]! += persons;
    }
  }

  const kids = Math.round(raw.kids);
  const adults = Math.round(raw.adults);
  const birthday = Math.round(raw.birthday);
  return {
    wristbands: Math.round(raw.kids + raw.adults + raw.birthday),
    kids,
    adults,
    birthday,
    checkinSales,
    byHour: hours.map((x) => Math.round(x)),
    passSalesAnonymous: Math.round(passAnon),
    passSalesNamed: Math.round(passNamed),
  };
}
