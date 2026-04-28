/**
 * Map an OrganisedVisit into the row shape used by the KPI dashboard's D1
 * `bookings` / `escape_bookings` tables.
 *
 * If you persist visits in a different shape, copy these functions and
 * adapt — they're reference impls, not law.
 */

import type { OrganisedVisit } from '../../core/index.js';
import {
  extractEssen,
  extractKind,
  extractKontakt,
  extractPaket,
} from './extract.js';

export interface BookingRow {
  id: string;
  kontakt: string;
  /** YYYY-MM-DD */
  datum: string;
  /** HH:MM */
  zeit: string;
  anzahl: number;
  /** "Raumschiff 1" | "Geburtstagstisch" | "" */
  raum: string;
  /** "Space" | "Magic" | "" */
  paket: string;
  kind: string;
  essen: string;
  upgrade: 0 | 1;
  bezahlt: number;
  offen: number;
  gesamt: number;
  /** Free-text remainder when the comment isn't a Geburtstag / Name pattern. */
  hinweis: string;
  cancelled: 0 | 1;
}

export interface EscapeRow {
  id: string;
  kontakt: string;
  datum: string;
  zeit: string;
  anzahl: number;
  raum: string;
  bezahlt: number;
  offen: number;
  gesamt: number;
  cancelled: 0 | 1;
}

export function mapBirthdayBooking(visit: OrganisedVisit): BookingRow {
  const pr = visit.periodReservations?.[0];
  const raum = pr?.expositionName || '';
  const anzahl = (visit.periodReservations || []).reduce(
    (sum, r) => sum + (r.quantity || 0),
    0,
  );
  const { essen, upgrade } = extractEssen(visit.articles);
  const kind = extractKind(visit.comment);
  const hinweis = kind ? '' : (visit.comment || '').trim();
  return {
    id: String(visit.no),
    kontakt: extractKontakt(visit),
    datum: visit.startDate.slice(0, 10),
    zeit: visit.startDate.slice(11, 16),
    anzahl,
    raum,
    paket: extractPaket(visit.periodReservations, visit.articles),
    kind,
    essen,
    upgrade,
    bezahlt: Number(visit.postedAmount || 0),
    offen: Number(visit.balance || 0),
    gesamt: Number(visit.totalAmount || 0),
    hinweis,
    cancelled: visit.cancelled ? 1 : 0,
  };
}

export function mapEscapeBooking(visit: OrganisedVisit): EscapeRow {
  const pr = visit.periodReservations?.[0];
  const anzahl = (visit.periodReservations || []).reduce(
    (sum, r) => sum + (r.quantity || 0),
    0,
  );
  return {
    id: String(visit.no),
    kontakt: extractKontakt(visit),
    datum: visit.startDate.slice(0, 10),
    zeit: visit.startDate.slice(11, 16),
    anzahl,
    raum: pr?.expositionName || '',
    bezahlt: Number(visit.postedAmount || 0),
    offen: Number(visit.balance || 0),
    gesamt: Number(visit.totalAmount || 0),
    cancelled: visit.cancelled ? 1 : 0,
  };
}
