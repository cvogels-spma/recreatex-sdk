/**
 * Field-extraction helpers tuned for Space Magic's data conventions.
 *
 * These exist because the staff workflow encodes structured info in free
 * text (comment line, article names). If you see odd output, the staff
 * convention probably drifted — update the regex here.
 */

import type {
  OrganisedVisit,
  OrganisedVisitArticle,
  OrganisedVisitPeriodReservation,
} from '@recreatex-sdk/core';

const NON_KIND_PREFIX_RE =
  /^(vereinsfeier|firmenfeier|jga|junggesell\w*|gruppenbuchung|gruppenfeier|kindergruppe|jubil(ae|ä)um|abschluss(feier)?|teamfeier|klassenfeier)\b/i;

/**
 * Birthday-child name from the visit comment.
 *
 * Examples that yield a name:
 *   "Geburtstag / Milan"   → "Milan"
 *   "Geburtstag, Falk"     → "Falk"
 *   "Tyler Küpker"         → "Tyler Küpker" (bare, ≤60 chars)
 *
 * Examples that stay empty (and should land in `hinweis`):
 *   "Vereinsfeier / C-Jugend ..." → ""
 *   "Yusuf/Lena Feier"            → "" (has `/`)
 */
export function extractKind(comment: string): string {
  const c = (comment || '').trim();
  if (!c) return '';
  const m = c.match(/Geburtstag\s*[/,]\s*(.+)/i);
  if (m && m[1]) return m[1].trim();
  if (c.includes('/')) return '';
  if (NON_KIND_PREFIX_RE.test(c)) return '';
  if (c.length <= 60) return c;
  return '';
}

/**
 * Map the booking's `Partypaket - Space|Magic` indicator to "Space"|"Magic"|"".
 *
 * Lives on `periodReservations[].articleName` (not on the side-articles).
 * Falls back to `articles[]` for safety.
 */
export function extractPaket(
  periodReservations?: OrganisedVisitPeriodReservation[],
  articles?: OrganisedVisitArticle[],
): string {
  const probe = (s?: string): string => {
    const m = (s || '').match(/Partypaket\s*-?\s*(Space|Magic)/i);
    return m && m[1] ? m[1] : '';
  };
  for (const pr of periodReservations || []) {
    const hit = probe(pr.articleName);
    if (hit) return hit;
  }
  for (const a of articles || []) {
    const hit = probe(a.articleName);
    if (hit) return hit;
  }
  return '';
}

/**
 * Identify the food choice and "Upgrade Raumschiff" flag.
 * Only the first non-upgrade match wins.
 */
export function extractEssen(
  articles?: OrganisedVisitArticle[],
): { essen: string; upgrade: 0 | 1 } {
  if (!articles) return { essen: '', upgrade: 0 };
  let essen = '';
  let upgrade: 0 | 1 = 0;
  for (const a of articles) {
    const name = (a.articleName || '').toLowerCase();
    if (name.includes('upgrade raumschiff')) {
      upgrade = 1;
      if (!essen) essen = 'Upgrade Raumschiff';
    } else if (name.includes('pizza')) {
      essen = 'Pizza';
    } else if (name.includes('pasta')) {
      essen = 'Pasta';
    } else if (name.includes('pommes') || name.includes('nuggets')) {
      essen = 'Pommes & Nuggets';
    }
  }
  return { essen, upgrade };
}

/**
 * Best-effort booker name. Priority:
 *   1. `person.firstName + lastName`        (returning customers)
 *   2. `salesInfos[].guest`                 (Webshop guest checkouts — most cases)
 *   3. `person.email` / `credential.username` (last-ditch fallback)
 */
export function extractKontakt(visit: OrganisedVisit): string {
  const p = visit.person;
  if (p) {
    const name = `${(p.firstName || '').trim()} ${(p.lastName || '').trim()}`.trim();
    if (name) return name;
  }
  for (const si of visit.salesInfos || []) {
    const g = si.guest;
    if (!g) continue;
    const guestName = `${(g.firstName || '').trim()} ${(g.name || '').trim()}`.trim();
    if (guestName) return guestName;
  }
  return (p?.email || p?.credential?.username || '').trim();
}
