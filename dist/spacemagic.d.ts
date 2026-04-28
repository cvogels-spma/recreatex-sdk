import { d as OrganisedVisit, j as OrganisedVisitArticle, k as OrganisedVisitPeriodReservation } from './expositions-DoK_BDqH.js';

/**
 * Space Magic-specific GUIDs and constants.
 *
 * Verified live against `wsdlspacemagic.recreatex.be` on 2026-04-20.
 * Update via grep + a fresh probe if anything moves.
 */
declare const SHOP_ID = "f2262f27-11c3-44fa-b790-cf4b900204b0";
declare const DIVISION_IDS: {
    /** Physical park (Fischteichweg 15-17, 26603 Aurich). */
    readonly spaceMagic: "59850967-c29e-ec11-8bd7-000c298735fd";
    /** Web shop. */
    readonly webshop: "dc6e9df0-d53b-414d-b561-41ef8de459f3";
    /** Backoffice / Administration. */
    readonly administration: "88791f99-1148-4129-b2d7-592aa0cb6847";
};
/**
 * Webshop-Guest Person GUID. Use this as `Basket.CustomerId` for anonymous
 * voucher / ticket checkouts. The all-zero GUID would trigger
 * `MissingCustomer`.
 */
declare const GUEST_CUSTOMER_ID = "119d9f06-66ad-ef11-9595-9a21964517de";
/** AccessZone for the whole park. `maxVisitors` ≈ 900. */
declare const SPACE_MAGIC_ZONE_ID = "f2bd4439-52ab-ef11-9595-9a21964517de";
/** Confirmed-working PaymentMethodId for "KARTENZAHLUNG" (use for any
 *  Mollie card-style payment flow). */
declare const PAYMENT_METHOD_ID_KARTENZAHLUNG = "a0d0dc4c-1f18-ea11-a2d2-8fcb7a700801";

/**
 * Voucher catalogue (13 SKUs).
 *
 * Codes follow the prefix scheme:
 *  - `10901-*` → Postal (printed, mailed)
 *  - `10902-*` → Digital (PDF email, instant)
 *  - `10904-*` → On-site (pick-up)
 *
 * `*-0005` (digital) and `10904-0001` (on-site) are variable-amount —
 * `allowPriceChangeWebshop: true`.
 */
type VoucherDeliveryType = 'postal' | 'digital' | 'on-site';
interface VoucherSku {
    id: string;
    code: string;
    name: string;
    /** Default amount in EUR. Variable vouchers carry the placeholder amount. */
    price: number;
    delivery: VoucherDeliveryType;
    /** True when buyer can override `UnitPrice`. */
    variable: boolean;
    divisionId: string;
}
/** All 13 voucher SKUs as captured 2026-04-20. */
declare const VOUCHER_SKUS: VoucherSku[];
/** Look up by code. */
declare function findVoucher(code: string): VoucherSku | undefined;
/** Classify a voucher by code prefix. Useful when you only have the code. */
declare function classifyVoucher(code: string): VoucherDeliveryType | 'unknown';

/**
 * Gastro article-group mapping.
 *
 * Use {@link gastroGroupName} to translate the
 * `ListSalesInformation.articleGroupID` UUIDs from
 * `groupByArticleGroup: true` queries into human-readable bucket names.
 *
 * Source of truth: live KPI dashboard `routes/gastro-analytics.ts` as of
 * 2026-04-28. Add new entries whenever a fresh article group is created
 * in the Recreatex backoffice.
 */
declare const GASTRO_GROUP_MAP: ReadonlyMap<string, string>;
/** Look up the human label for an articleGroupID; returns the UUID itself if unknown. */
declare function gastroGroupName(articleGroupId: string | null | undefined): string;
/** True if the given articleGroupID is mapped as a gastro category. */
declare function isGastroGroup(articleGroupId: string | null | undefined): boolean;

/**
 * Categorise an OrganisedVisit into a Space-Magic-specific bucket.
 */

type VisitCategory = 'birthday' | 'escape' | 'regular' | 'other';
/**
 * Classify by the first PeriodReservation's exposition + comment.
 *
 *  - `raumschiff` / `geburtstagstisch` exposition → birthday
 *  - comment containing `geburtstag` / `vereinsfeier` → birthday
 *  - escape-room keyword on exposition or article → escape
 *  - exposition mentioning `regular` → regular
 *  - else → other
 */
declare function categorizeVisit(visit: OrganisedVisit): VisitCategory;

/**
 * Field-extraction helpers tuned for Space Magic's data conventions.
 *
 * These exist because the staff workflow encodes structured info in free
 * text (comment line, article names). If you see odd output, the staff
 * convention probably drifted — update the regex here.
 */

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
declare function extractKind(comment: string): string;
/**
 * Map the booking's `Partypaket - Space|Magic` indicator to "Space"|"Magic"|"".
 *
 * Lives on `periodReservations[].articleName` (not on the side-articles).
 * Falls back to `articles[]` for safety.
 */
declare function extractPaket(periodReservations?: OrganisedVisitPeriodReservation[], articles?: OrganisedVisitArticle[]): string;
/**
 * Identify the food choice and "Upgrade Raumschiff" flag.
 * Only the first non-upgrade match wins.
 */
declare function extractEssen(articles?: OrganisedVisitArticle[]): {
    essen: string;
    upgrade: 0 | 1;
};
/**
 * Best-effort booker name. Priority:
 *   1. `person.firstName + lastName`        (returning customers)
 *   2. `salesInfos[].guest`                 (Webshop guest checkouts — most cases)
 *   3. `person.email` / `credential.username` (last-ditch fallback)
 */
declare function extractKontakt(visit: OrganisedVisit): string;

/**
 * Map an OrganisedVisit into the row shape used by the KPI dashboard's D1
 * `bookings` / `escape_bookings` tables.
 *
 * If you persist visits in a different shape, copy these functions and
 * adapt — they're reference impls, not law.
 */

interface BookingRow {
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
interface EscapeRow {
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
declare function mapBirthdayBooking(visit: OrganisedVisit): BookingRow;
declare function mapEscapeBooking(visit: OrganisedVisit): EscapeRow;

export { type BookingRow, DIVISION_IDS, type EscapeRow, GASTRO_GROUP_MAP, GUEST_CUSTOMER_ID, PAYMENT_METHOD_ID_KARTENZAHLUNG, SHOP_ID, SPACE_MAGIC_ZONE_ID, VOUCHER_SKUS, type VisitCategory, type VoucherDeliveryType, type VoucherSku, categorizeVisit, classifyVoucher, extractEssen, extractKind, extractKontakt, extractPaket, findVoucher, gastroGroupName, isGastroGroup, mapBirthdayBooking, mapEscapeBooking };
