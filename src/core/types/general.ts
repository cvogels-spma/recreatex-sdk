/**
 * General namespace — access zones, readers, divisions, persons, sales,
 * payment methods, point-of-sales, basket primitives.
 */

import type { RecreatexDateTime } from './common.js';

export interface AccessZoneOccupancy {
  maxVisitors: number;
  maxVisitorsPerDay: number;
  /** Daily count — IGNORES OccupancyFrom/Until and always reflects "today". */
  visitorsToday: number;
  /** Currently inside the zone. */
  visitorsCurrent: number;
}

export interface AccessZoneReader {
  id: string;
  code?: string;
  name?: string;
  /** 0 = entrance, 1 = exit. */
  type?: 0 | 1;
}

export interface AccessZone {
  id: string;
  code: string;
  name: string;
  number: number;
  occupancy?: AccessZoneOccupancy;
  entranceReaders?: AccessZoneReader[];
  exitReaders?: AccessZoneReader[];
}

export interface FindAccessZonesCriteria {
  id?: string | null;
  /** Recreatex datetime window. SDK's `today: true` shortcut sets this for today (Berlin). */
  occupancyFrom?: RecreatexDateTime;
  occupancyUntil?: RecreatexDateTime;
  includes?: {
    entranceReaders?: boolean;
    exitReaders?: boolean;
    occupancy?: boolean;
    inactiveZoneControl?: boolean;
  };
}

export interface Reader {
  id: string;
  code?: string;
  name?: string;
  number?: number;
  type?: number;
  [extra: string]: unknown;
}

export interface Division {
  id: string;
  code?: string;
  name?: string;
  address?: string;
  [extra: string]: unknown;
}

export interface PointOfSale {
  id: string;
  code?: string;
  name?: string;
  [extra: string]: unknown;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  /** Often a number: 0 = card, 1 = cash, etc. */
  type?: number;
  [extra: string]: unknown;
}

// ---- Persons & sales -----------------------------------------------------

export interface PersonCredential {
  username?: string;
  password?: string;
}

export interface PersonAddress {
  street?: string;
  number?: string;
  zipCode?: string;
  town?: string;
  countryDescription?: string;
  telephone?: string;
}

export interface Person {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cellPhone?: string;
  language?: string;
  credential?: PersonCredential;
  address?: PersonAddress;
  birthDate?: string;
  [extra: string]: unknown;
}

export interface FindPersonCriteria {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

/**
 * A single line on a FindSales bon.
 *
 * ⚠ **Recreatex returns duplicate line objects.** The same line comes back
 * repeatedly with an identical `id`, `sequenceNumber` and amount — the
 * repetition factor appears to follow the number of joined records upstream,
 * and it mainly hits lines carrying a `mainOrganisedVisitId` (booking-bound
 * articles such as "Ausstellung Vorauszahlung"). Verified 2026-07-26: a bon
 * holding ONE real 806 € line came back 8× = 6.448 €.
 *
 * **Always deduplicate by `id` before summing.** Summing `lines` raw inflates
 * revenue massively — on one production month it turned a reconciled
 * 200.237,10 € into 284.934,70 €.
 */
export interface SaleLine {
  /** Line GUID. Duplicates share it — dedupe on this. */
  id?: string;
  /** Stable within the bon; duplicates share it too. */
  sequenceNumber?: number;
  articleId?: string;
  description?: string;
  /** Set on booking-bound lines; correlates with the duplication. */
  mainOrganisedVisitId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [extra: string]: unknown;
}

export interface SalePaymentLine {
  paymentMethodId: string;
  amount: number;
  [extra: string]: unknown;
}

/**
 * A bon from `General/FindSales`.
 *
 * Field list verified against production on 2026-07-26: `$type`, `customerId`,
 * `date`, `divisonId`, `id`, `lines`, `number`, `paymentLines`,
 * `pointOfSaleId`, `salesSeriesId`.
 *
 * ⚠ Two traps:
 *  1. The timestamp is **`date`**, not `saleDate` — older versions of this
 *     type declared `saleDate` as required, which silently yielded `undefined`.
 *  2. There is **no card / wristband reference** on a bon. A bon cannot be
 *     traced back to the RFID band it was booked on through this API.
 *
 * See {@link SaleLine} for the line-duplication trap.
 */
export interface Sale {
  id: string;
  /** Bon timestamp, e.g. `"2025-08-06T09:52:30"`. THIS is the real field. */
  date?: RecreatexDateTime;
  /** @deprecated Not emitted by Recreatex — use {@link Sale.date}. */
  saleDate?: RecreatexDateTime;
  /** Human-readable bon number, e.g. `1000008439`. */
  number?: number;
  pointOfSaleId?: string;
  /** Note the upstream typo — one `i`. */
  divisonId?: string;
  customerId?: string | null;
  salesSeriesId?: string;
  /** @deprecated Not emitted by Recreatex — sum the deduped {@link Sale.lines}. */
  totalAmount?: number;
  /** ⚠ Contains duplicates — dedupe by `id`. See {@link SaleLine}. */
  lines?: SaleLine[];
  paymentLines?: SalePaymentLine[];
  [extra: string]: unknown;
}

export interface FindSalesCriteria {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
  pointOfSaleId?: string;
  divisionId?: string;
}

// ---- Person cards (RFID wristbands, subscription & voucher cards) --------

/**
 * A card record as returned by `General/FindPersonCards`.
 *
 * In a Gantner-driven park this is the entity behind a **physical RFID
 * wristband** as well as behind subscription and gift-certificate cards —
 * they all live in the same PersonCard table, distinguished by their type
 * and by whether a person is attached.
 *
 * Field list verified against production on 2026-07-27: `$type`, `id`,
 * `description`, `card`, `personId`, `person`.
 *
 * ⚠ **There is no balance field.** The stored value of an RFID wristband lives
 * in the Gantner purse and is not reachable through this API — no endpoint
 * exposes it (see `docs/ENDPOINTS.md`). Do not promise "remaining credit" to a
 * caller based on this record.
 *
 * ⚠ This endpoint also has no "currently open / checked in" filter, so it
 * cannot enumerate the bands still inside the park.
 */
export interface PersonCard {
  id: string;
  /** Card number as encoded on the wristband. */
  card?: string | null;
  /** Plain-text label of the card. */
  description?: string | null;
  /** Attached person, when the card is not anonymous. */
  personId?: string | null;
  person?: unknown;
  /** Unmapped upstream fields. */
  [extra: string]: unknown;
}

export interface FindPersonCardsCriteria {
  id?: string;
  /** Card number as printed/encoded on the wristband. */
  number?: string;
  personId?: string;
  customerId?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ---- Gift certificates --------------------------------------------------

/**
 * A single gift-certificate record as returned by `FindGiftCertificates`.
 *
 * Heads-up: `number` is typically null for a freshly-created certificate
 * (the PersonCard isn't populated yet). The visible voucher code lives in
 * the DocumentService PDF — use this record only to discover the
 * GiftCertificate `id` (for `SetGiftCertificatePrinted`) or to match a
 * cert via `salesSeriesID` to a CheckoutBasket result.
 */
export interface GiftCertificate {
  id: string;
  number: string | null;
  amount: number | null;
  purchaseDate: string | null;
  salesSeriesID: string | null;
  shortName: string | null;
  description: string | null;
  ticketDescription: string | null;
  extraDescription: string | null;
  validFrom: string | null;
  validTill: string | null;
  /** ISO timestamp once SetGiftCertificatePrinted has fired; otherwise null. */
  printDate: string | null;
}

export interface FindGiftCertificatesCriteria {
  /** Recreatex Person GUID — typically the customer who placed the order. */
  customerId?: string;
  id?: string;
  number?: string;
  pageIndex?: number;
  pageSize?: number;
}
