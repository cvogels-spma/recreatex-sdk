/**
 * Categorise an OrganisedVisit into a Space-Magic-specific bucket.
 */

import type { OrganisedVisit } from '../../core/index.js';

export type VisitCategory = 'birthday' | 'escape' | 'regular' | 'other';

const ESCAPE_KEYWORDS = ['hexenmeister', 'landekapsel', 'escape'];

/**
 * Classify by the first PeriodReservation's exposition + comment.
 *
 *  - `raumschiff` / `geburtstagstisch` exposition → birthday
 *  - comment containing `geburtstag` / `vereinsfeier` → birthday
 *  - escape-room keyword on exposition or article → escape
 *  - exposition mentioning `regular` → regular
 *  - else → other
 */
export function categorizeVisit(visit: OrganisedVisit): VisitCategory {
  const exposition = (visit.periodReservations?.[0]?.expositionName || '').toLowerCase();
  const articleName = (visit.periodReservations?.[0]?.articleName || '').toLowerCase();
  const comment = (visit.comment || '').toLowerCase();

  if (exposition.includes('raumschiff') || exposition.includes('geburtstagstisch')) return 'birthday';
  if (comment.includes('geburtstag') || comment.includes('vereinsfeier')) return 'birthday';
  if (ESCAPE_KEYWORDS.some((kw) => exposition.includes(kw) || articleName.includes(kw))) return 'escape';
  if (exposition.includes('regular')) return 'regular';
  return 'other';
}
