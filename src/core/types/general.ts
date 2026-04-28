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

export interface SaleLine {
  articleId?: string;
  description?: string;
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

export interface Sale {
  id: string;
  saleDate: RecreatexDateTime;
  pointOfSaleId?: string;
  customerId?: string | null;
  totalAmount: number;
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
