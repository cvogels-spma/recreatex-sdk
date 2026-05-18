/**
 * Build invoice-ready data from historical OrganisedVisit bookings.
 *
 * Recreatex exposes the booking, sales lines and customer-ish guest data, but
 * not a public "create a back-office invoice after the fact" endpoint. These
 * helpers produce a stable draft that an app can render to HTML/PDF or hand to
 * accounting.
 */

import type {
  CallOptions,
  OrganisedVisit,
  OrganisedVisitArticle,
  OrganisedVisitPeriodReservation,
  ReCreateXClient,
  Ymd,
} from '../core/index.js';

export interface BookingInvoiceLookupCriteria {
  organisedVisitId?: string;
  orderNumber?: string;
  /** OrganisedVisit `no` / booking number. Requires a date window. */
  bookingNo?: number | string;
  fromYmd?: Ymd;
  untilYmd?: Ymd;
}

export interface BookingInvoiceDraftOptions {
  /** Keep free/zero-value linked articles on the invoice draft. Defaults to false. */
  includeZeroAmountLines?: boolean;
}

export interface BookingInvoiceCustomer {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string | null;
  street?: string;
  number?: string;
  zipCode?: string;
  town?: string;
  country?: string | null;
}

export interface BookingInvoiceLine {
  source: 'periodReservation' | 'article';
  id?: string;
  articleId?: string;
  articleCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  lineAmount: number;
  vatAmount: number;
  vatPercentage?: number;
  expositionName?: string;
  periodFrom?: string;
  periodUntil?: string;
}

export interface BookingInvoiceSalesInfo {
  salesSeriesId: string;
  salesNo: number;
  salesDate: string;
  invoiceNumber?: number;
  invoiceDate?: string;
}

export interface BookingInvoiceDraft {
  bookingId: string;
  bookingNo: number;
  orderNumber?: string;
  startDate: string;
  endDate: string;
  purchaseDate?: string;
  comment?: string;
  customer: BookingInvoiceCustomer;
  lines: BookingInvoiceLine[];
  totals: {
    amount: number;
    lineAmount: number;
    vatAmount: number;
    paidAmount: number;
    balance: number;
    couponDiscount: number;
  };
  salesInfos: BookingInvoiceSalesInfo[];
  raw: OrganisedVisit;
}

export async function getBookingInvoiceDraft(
  client: Pick<ReCreateXClient, 'expositions'>,
  criteria: BookingInvoiceLookupCriteria,
  options: BookingInvoiceDraftOptions = {},
  callOpts?: CallOptions,
): Promise<BookingInvoiceDraft> {
  const visit = await findBookingForInvoice(client, criteria, callOpts);
  return buildBookingInvoiceDraft(visit, options);
}

export async function findBookingForInvoice(
  client: Pick<ReCreateXClient, 'expositions'>,
  criteria: BookingInvoiceLookupCriteria,
  callOpts?: CallOptions,
): Promise<OrganisedVisit> {
  const baseCriteria = {
    includes: { periodReservations: true, articles: true, personDetails: true },
  };
  if (criteria.organisedVisitId) {
    const visits = await client.expositions.findOrganisedVisits(
      { ...baseCriteria, organisedVisitId: criteria.organisedVisitId },
      { maxPages: 1 },
      callOpts,
    );
    return oneVisit(visits, 'organisedVisitId');
  }
  if (criteria.orderNumber) {
    const visits = await client.expositions.findOrganisedVisits(
      { ...baseCriteria, orderNumber: criteria.orderNumber },
      { maxPages: 5 },
      callOpts,
    );
    return oneVisit(visits, 'orderNumber');
  }
  if (criteria.bookingNo !== undefined) {
    if (!criteria.fromYmd || !criteria.untilYmd) {
      throw new Error('bookingNo lookup requires fromYmd and untilYmd');
    }
    const visits = await client.expositions.findOrganisedVisits(
      {
        ...baseCriteria,
        fromYmd: criteria.fromYmd,
        untilYmd: criteria.untilYmd,
      },
      { maxPages: 50 },
      callOpts,
    );
    const bookingNo = String(criteria.bookingNo);
    return oneVisit(visits.filter((visit) => String(visit.no) === bookingNo), 'bookingNo');
  }
  throw new Error('Provide organisedVisitId, orderNumber, or bookingNo');
}

export function buildBookingInvoiceDraft(
  visit: OrganisedVisit,
  options: BookingInvoiceDraftOptions = {},
): BookingInvoiceDraft {
  const lines = [
    ...(visit.periodReservations ?? []).map(periodReservationLine),
    ...(visit.articles ?? []).map(articleLine),
  ].filter((line) => options.includeZeroAmountLines || line.amount !== 0 || line.lineAmount !== 0);

  const totals = {
    amount: round2(sum(lines, 'amount') || numberValue(visit.totalAmount)),
    lineAmount: round2(sum(lines, 'lineAmount')),
    vatAmount: round2(sum(lines, 'vatAmount')),
    paidAmount: numberValue(visit.postedAmount),
    balance: numberValue(visit.balance),
    couponDiscount: numberValue(visit.couponDiscount),
  };

  return {
    bookingId: visit.id,
    bookingNo: visit.no,
    ...(visit.orderNumber && { orderNumber: visit.orderNumber }),
    startDate: visit.startDate,
    endDate: visit.endDate,
    ...(visit.purchaseDate && { purchaseDate: visit.purchaseDate }),
    ...(visit.comment && { comment: visit.comment }),
    customer: readInvoiceCustomer(visit),
    lines,
    totals,
    salesInfos: (visit.salesInfos ?? []).map((info) => ({
      salesSeriesId: info.id,
      salesNo: info.salesNo,
      salesDate: info.salesDate,
      ...(info.invoiceNumber !== undefined && { invoiceNumber: info.invoiceNumber }),
      ...(info.invoiceDate && { invoiceDate: info.invoiceDate }),
    })),
    raw: visit,
  };
}

export function renderBookingInvoiceHtml(draft: BookingInvoiceDraft): string {
  const lineRows = draft.lines.map((line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatEur(line.unitPrice)}</td>
        <td class="num">${formatEur(line.amount)}</td>
      </tr>`).join('');
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Rechnung Buchung ${draft.bookingNo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    .num { text-align: right; }
    .muted { color: #666; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; }
  </style>
</head>
<body>
  <h1>Rechnung / Buchungsbeleg</h1>
  <div class="muted">Buchung ${draft.bookingNo}${draft.orderNumber ? ` · Order ${escapeHtml(draft.orderNumber)}` : ''}</div>

  <p>
    <strong>${escapeHtml(draft.customer.name || 'Gast')}</strong><br>
    ${escapeHtml([draft.customer.street, draft.customer.number].filter(Boolean).join(' '))}<br>
    ${escapeHtml([draft.customer.zipCode, draft.customer.town].filter(Boolean).join(' '))}
  </p>

  <p>
    Leistungszeitraum: ${escapeHtml(draft.startDate)} bis ${escapeHtml(draft.endDate)}
  </p>

  <table>
    <thead><tr><th>Position</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Betrag</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Netto</td><td class="num">${formatEur(draft.totals.lineAmount)}</td></tr>
    <tr><td>MwSt.</td><td class="num">${formatEur(draft.totals.vatAmount)}</td></tr>
    <tr><td><strong>Gesamt</strong></td><td class="num"><strong>${formatEur(draft.totals.amount)}</strong></td></tr>
    <tr><td>Bezahlt</td><td class="num">${formatEur(draft.totals.paidAmount)}</td></tr>
    <tr><td>Offen</td><td class="num">${formatEur(draft.totals.balance)}</td></tr>
  </table>
</body>
</html>`;
}

function periodReservationLine(item: OrganisedVisitPeriodReservation): BookingInvoiceLine {
  const raw = item as OrganisedVisitPeriodReservation & Record<string, unknown>;
  return {
    source: 'periodReservation',
    id: readString(raw, 'id'),
    articleId: item.articleId,
    ...(item.articleCode && { articleCode: item.articleCode }),
    description: item.articleName || item.expositionName || 'Buchung',
    quantity: numberValue(item.quantity),
    unitPrice: numberValue(item.unitPrice),
    amount: numberValue(item.amount),
    lineAmount: numberValue(item.lineAmount),
    vatAmount: numberValue(item.vatAmount),
    ...(readNumber(raw, 'vatPercentage') !== undefined && { vatPercentage: readNumber(raw, 'vatPercentage') }),
    ...(item.expositionName && { expositionName: item.expositionName }),
    ...(item.expositionPeriodFrom && { periodFrom: item.expositionPeriodFrom }),
    ...(item.expositionPeriodUntil && { periodUntil: item.expositionPeriodUntil }),
  };
}

function articleLine(item: OrganisedVisitArticle): BookingInvoiceLine {
  const raw = item as OrganisedVisitArticle & Record<string, unknown>;
  const lineAmount = readNumber(raw, 'lineAmount') ?? numberValue(item.amount);
  const vatAmount = readNumber(raw, 'vatAmount') ?? 0;
  return {
    source: 'article',
    id: readString(raw, 'id'),
    articleId: item.articleId,
    ...(item.articleCode && { articleCode: item.articleCode }),
    description: item.articleName || 'Artikel',
    quantity: numberValue(item.quantity),
    unitPrice: numberValue(item.unitPrice),
    amount: numberValue(item.amount),
    lineAmount,
    vatAmount,
    ...(readNumber(raw, 'vatPercentage') !== undefined && { vatPercentage: readNumber(raw, 'vatPercentage') }),
  };
}

function readInvoiceCustomer(visit: OrganisedVisit): BookingInvoiceCustomer {
  const guest = (visit.salesInfos ?? []).map((info) => info.guest).find(Boolean);
  if (guest) {
    const firstName = guest.firstName?.trim();
    const lastName = guest.name?.trim();
    return {
      name: [firstName, lastName].filter(Boolean).join(' ') || guest.email || '',
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(guest.email && { email: guest.email }),
      ...(guest.telephone !== undefined && { telephone: guest.telephone }),
      ...(guest.street1 && { street: guest.street1 }),
      ...(guest.street2 && { number: guest.street2 }),
      ...(guest.zipCode && { zipCode: guest.zipCode }),
      ...(guest.home && { town: guest.home }),
    };
  }

  const person = visit.person as (OrganisedVisit['person'] & Record<string, unknown>) | undefined;
  const nestedName = person?.name as Record<string, unknown> | undefined;
  const firstName = person?.firstName ?? readString(nestedName, 'first');
  const lastName = person?.lastName ?? readString(nestedName, 'last');
  const address = person?.address;
  return {
    name: [firstName, lastName].filter(Boolean).join(' ') || person?.email || '',
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(person?.email && { email: person.email }),
    ...(person?.cellPhone && { telephone: person.cellPhone }),
    ...(address?.street && { street: address.street }),
    ...(address?.number && { number: address.number }),
    ...(address?.zipCode && { zipCode: address.zipCode }),
    ...(address?.town && { town: address.town }),
    ...(address?.countryDescription && { country: address.countryDescription }),
  };
}

function oneVisit(visits: OrganisedVisit[], label: string): OrganisedVisit {
  if (visits.length === 0) throw new Error(`No OrganisedVisit matched ${label}`);
  if (visits.length > 1) throw new Error(`Multiple OrganisedVisits matched ${label}`);
  return visits[0] as OrganisedVisit;
}

function sum(lines: BookingInvoiceLine[], key: 'amount' | 'lineAmount' | 'vatAmount'): number {
  return lines.reduce((total, line) => total + numberValue(line[key]), 0);
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readString(obj: Record<string, unknown> | undefined, ...keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function readNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatEur(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} EUR`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
