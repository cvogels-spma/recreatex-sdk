/**
 * Expositions namespace types — covers room/slot lookup AND OrganisedVisit
 * (booking) management.
 *
 * Birthday parties at Space Magic live as OrganisedVisits. A single visit
 * can have:
 *  - one or more `periodReservations` (the actual room slots)
 *  - zero or more `articles` (food, upgrades, extras)
 *  - zero or more `salesInfos` (one per checkout — guest data lives here for
 *    Webshop bookings)
 */

import type { Ymd, RecreatexDateTime, Paging } from './common.js';

export interface Exposition {
  id: string;
  code: string;
  name: string;
  /** Capacity per slot (= per period). */
  maxVisitorsPerPeriod?: number;
  /** Soft cap per group (e.g. 12 for birthday rooms). */
  maxVisitorsPerGroup?: number;
  [extra: string]: unknown;
}

export interface ExpositionPeriodDate {
  date: string;
  isAvailable: boolean;
}

export interface ExpositionPeriodPrice {
  priceGroupId: string;
  name?: string;
  price: number;
}

export interface ExpositionPeriod {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
  occupancy?: {
    remaining: number;
    maximum: number;
    maxVisitorsPerGroup: number;
  };
  prices?: ExpositionPeriodPrice[];
  [extra: string]: unknown;
}

export interface ExpositionDayOverview {
  expositionId?: string;
  periods?: ExpositionPeriod[];
  [extra: string]: unknown;
}

// ---- OrganisedVisits -----------------------------------------------------

export interface OrganisedVisitPeriodReservation {
  articleId: string;
  articleName?: string;
  articleCode?: string;
  expositionId?: string;
  expositionName?: string;
  expositionCode?: string;
  expositionPeriodFrom?: RecreatexDateTime;
  expositionPeriodUntil?: RecreatexDateTime;
  quantity: number;
  unitPrice: number;
  amount: number;
  lineAmount: number;
  vatAmount: number;
}

export interface OrganisedVisitArticle {
  articleId: string;
  articleName?: string;
  articleCode?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface OrganisedVisitPersonAddress {
  telephone?: string;
  street?: string;
  number?: string;
  zipCode?: string;
  town?: string;
  countryDescription?: string;
}

export interface OrganisedVisitPerson {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  cellPhone?: string;
  language?: string;
  credential?: { username?: string };
  address?: OrganisedVisitPersonAddress;
}

/**
 * Sale guest record — populated for Webshop guest checkouts.
 *
 * The visit's `person` record stays generic ("web@omg.de") for those
 * bookings, so the REAL booker name lives here. Field names follow the
 * Recreatex SOAP contract: `name` is the surname, `firstName` is the
 * given name.
 */
export interface OrganisedVisitSaleGuest {
  name?: string;
  firstName?: string;
  email?: string;
  telephone?: string | null;
  street1?: string;
  street2?: string;
  zipCode?: string;
  home?: string;
}

export interface OrganisedVisitSaleInfo {
  id: string;
  salesNo: number;
  salesDate: RecreatexDateTime;
  guest?: OrganisedVisitSaleGuest;
}

export interface OrganisedVisit {
  id: string;
  no: number;
  startDate: RecreatexDateTime;
  endDate: RecreatexDateTime;
  comment: string;
  cancelled: boolean;
  closed: boolean;
  posted: boolean;
  totalAmount: number;
  postedAmount: number;
  balance: number;
  personId?: string;
  person?: OrganisedVisitPerson;
  orderNumber?: string;
  purchaseDate?: RecreatexDateTime;
  periodReservations?: OrganisedVisitPeriodReservation[];
  articles?: OrganisedVisitArticle[];
  salesInfos?: OrganisedVisitSaleInfo[];
}

export interface FindOrganisedVisitsCriteria {
  /** Inclusive `YYYY-MM-DD` lower bound (filters on purchaseDate, NOT startDate). */
  fromYmd?: Ymd;
  /** Inclusive `YYYY-MM-DD` upper bound. */
  untilYmd?: Ymd;
  organisedVisitId?: string;
  personId?: string;
  orderNumber?: string;
  paging?: Paging;
  includes?: {
    periodReservations?: boolean;
    articles?: boolean;
    personDetails?: boolean;
  };
}

// ---- Visit management (Phase C) -----------------------------------------

export interface OrganisedVisitTicketAdjustment {
  priceGroupId: string;
  quantity: number;
}

export interface OrganisedVisitSaleAdjustment {
  articleId: string;
  quantity: number;
  unitPrice?: number;
}

export interface OrganisedVisitPeriodTransfer {
  /** Old ExpositionPeriodId. */
  oldPeriodId: string;
  /** New ExpositionPeriodId. */
  newPeriodId: string;
  quantity: number;
}
