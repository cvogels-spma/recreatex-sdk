/**
 * Helpers for `General/FindSales` bons.
 */

import type { Sale, SaleLine } from '../types/general.js';

/**
 * The lines of a bon, deduplicated by line `id`.
 *
 * ⚠⚠ Recreatex returns the SAME line several times (identical `id`, `sequenceNumber` and
 * amount), mostly on booking-bound lines (`mainOrganisedVisitId`). One production month read
 * 284,934.70 € instead of 200,237.10 € before deduplication. Every evaluation of bon lines
 * goes through this helper.
 *
 * Lines WITHOUT an `id` are kept as they are: one line too many is a smaller error than a
 * real position that silently disappears.
 */
export function dedupSaleLines(sale: Pick<Sale, 'lines'>): SaleLine[] {
  const seen = new Set<string>();
  const out: SaleLine[] = [];
  for (const line of sale.lines ?? []) {
    const id = typeof line.id === 'string' ? line.id : '';
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(line);
  }
  return out;
}
