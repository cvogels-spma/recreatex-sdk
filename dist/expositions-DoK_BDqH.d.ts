/**
 * Common types shared across all Recreatex endpoints.
 *
 * The Recreatex JSON API uses PascalCase field names on the wire. The SDK
 * exposes camelCase TypeScript interfaces and translates at the boundary —
 * keep that asymmetry in mind when reading raw responses.
 */
/**
 * Authentication context attached to every request body.
 *
 * The SDK builds this for you via {@link buildContext}; you only need to
 * touch it directly when bypassing the high-level client.
 *
 * @remarks
 * - `SessionId` is a UUID. Most endpoints accept the same SessionId across
 *   calls, but the voucher checkout flow expects a fresh UUID per buyer
 *   session.
 * - `DivisionId`, `Origin`, `Encode`, `AccessToken` are optional and
 *   rarely required.
 */
interface RecreatexContext {
    Language: string;
    ShopId: string;
    SessionId: string;
    Password: string;
    DivisionId?: string;
    Origin?: number;
    Encode?: boolean;
    AccessToken?: string;
}
/** Inclusive paging window. PageIndex is zero-based. */
interface Paging {
    PageIndex: number;
    PageSize: number;
}
/** Generic envelope used by most "Find*"/"List*" responses.
 *
 * Note the typo: the API spells the success flag `succes` (not `success`).
 * Treat `succes === false` as an error condition and throw.
 */
interface RecreatexEnvelope {
    succes?: boolean;
    message?: string;
    result?: unknown;
}
/** ISO-like local datetime as accepted by Recreatex.
 *
 *  Two flavours:
 *  - "2026-04-12 00:00:00.000" — used by ManagerApp and General namespaces
 *  - "2026-04-12T14:00:00"     — used by Expositions namespace
 *
 *  Always pre-format with the SDK's date helpers so you don't drift between
 *  the two.
 */
type RecreatexDateTime = string;
/** YYYY-MM-DD calendar date. */
type Ymd = string;

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

interface Exposition {
    id: string;
    code: string;
    name: string;
    /** Capacity per slot (= per period). */
    maxVisitorsPerPeriod?: number;
    /** Soft cap per group (e.g. 12 for birthday rooms). */
    maxVisitorsPerGroup?: number;
    [extra: string]: unknown;
}
interface ExpositionPeriodDate {
    date: string;
    isAvailable: boolean;
}
interface ExpositionPeriodPrice {
    priceGroupId: string;
    name?: string;
    price: number;
}
interface ExpositionPeriod {
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
interface ExpositionDayOverview {
    expositionId?: string;
    periods?: ExpositionPeriod[];
    [extra: string]: unknown;
}
interface OrganisedVisitPeriodReservation {
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
interface OrganisedVisitArticle {
    articleId: string;
    articleName?: string;
    articleCode?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}
interface OrganisedVisitPersonAddress {
    telephone?: string;
    street?: string;
    number?: string;
    zipCode?: string;
    town?: string;
    countryDescription?: string;
}
interface OrganisedVisitPerson {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    cellPhone?: string;
    language?: string;
    credential?: {
        username?: string;
    };
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
interface OrganisedVisitSaleGuest {
    name?: string;
    firstName?: string;
    email?: string;
    telephone?: string | null;
    street1?: string;
    street2?: string;
    zipCode?: string;
    home?: string;
}
interface OrganisedVisitSaleInfo {
    id: string;
    salesNo: number;
    salesDate: RecreatexDateTime;
    guest?: OrganisedVisitSaleGuest;
}
interface OrganisedVisit {
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
interface FindOrganisedVisitsCriteria {
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
interface OrganisedVisitTicketAdjustment {
    priceGroupId: string;
    quantity: number;
}
interface OrganisedVisitSaleAdjustment {
    articleId: string;
    quantity: number;
    unitPrice?: number;
}
interface OrganisedVisitPeriodTransfer {
    /** Old ExpositionPeriodId. */
    oldPeriodId: string;
    /** New ExpositionPeriodId. */
    newPeriodId: string;
    quantity: number;
}

export type { Exposition as E, FindOrganisedVisitsCriteria as F, OrganisedVisitTicketAdjustment as O, Paging as P, RecreatexDateTime as R, Ymd as Y, OrganisedVisitSaleAdjustment as a, ExpositionPeriodDate as b, ExpositionDayOverview as c, OrganisedVisit as d, OrganisedVisitPeriodTransfer as e, RecreatexContext as f, RecreatexEnvelope as g, ExpositionPeriod as h, ExpositionPeriodPrice as i, OrganisedVisitArticle as j, OrganisedVisitPeriodReservation as k, OrganisedVisitPerson as l, OrganisedVisitPersonAddress as m, OrganisedVisitSaleGuest as n, OrganisedVisitSaleInfo as o };
