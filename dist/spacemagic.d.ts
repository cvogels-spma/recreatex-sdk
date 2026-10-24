import { OrganisedVisit, OrganisedVisitArticle, OrganisedVisitPeriodReservation, Basket, Sale } from './core.js';

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
/**
 * The anonymous walk-in customer the park tills book onto ("Laufkundschaft").
 * Measured 2026-10-08: 32,997 of 42,742 check-in bons since the opening carry this id,
 * 7,424 carry {@link GUEST_CUSTOMER_ID} (pre-booked online), the rest a named person.
 * A sale on either of the two cannot be tied to a household.
 */
declare const WALK_IN_CUSTOMER_ID = "032a299f-45ea-4144-ad66-93b965b37f0b";
/** True for the two anonymous customers (or a missing customer). */
declare function isAnonymousCustomer(customerId: string | null | undefined): boolean;
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

/**
 * Birthday booking helpers for Space Magic.
 *
 * The birthday-landing-page checkout funnel ends in
 * `General/CheckoutBasket` with an `ExpositionPeriodReservation` item.
 * This file owns the basket assembly so the consumer (Pages Function)
 * just hands over the booking + payment details and gets a ready-to-post
 * `Basket` back.
 *
 * Verified live (see `space-magic-birthday-landing-page/scripts/`):
 *  - `ExpositionPeriodId` MUST come from `Expositions/ListExpositionPeriods`
 *    — `FindExpositionOverviewByDay` does not include it.
 *  - `Entries: [{ PriceGroupId, Quantity }]` is how the price tier
 *    ("Partypaket - Space" 29 € vs. "Partypaket - Magic" 34 €) is bound
 *    to the seat count.
 *  - `Basket.Payments[].Amount = depositAmount`, `Basket.Balance =
 *    grossTotal - depositAmount` is the deposit-with-open-rest pattern;
 *    PayLater stays `false`.
 */

/**
 * Single price tier within a birthday slot. Pulled out of
 * `Expositions/FindExpositions` (`Includes.Pricing=true`).
 *
 * ⚠ `priceGroupId` must be `prices[].group.id`, NOT `prices[].id`.
 * `FindExpositionOverviewByDay` labels its field "priceGroupId" but
 * returns the price id — Recreatex rejects baskets built from that
 * with `OrganisedVisitValidPriceGroupsRule`.
 */
interface BirthdayPriceTier {
    /** GUID — `prices[].group.id`. */
    priceGroupId: string;
    /** Per-ticket amount in EUR. */
    unitPrice: number;
    /** Optional human label, kept for diagnostics. */
    name?: string;
}
/** Optional add-on article (Cosmoo plush, snack pack, …). */
interface BirthdayExtraArticle {
    articleId: string;
    unitPrice: number;
    quantity?: number;
    extraDescription?: string;
}
interface BirthdayBookingInput {
    /** Exposition GUID — e.g. "Geburtstagstisch" / "Raumschiff X". */
    expositionId: string;
    /** Period GUID from `Expositions/ListExpositionPeriods`. */
    expositionPeriodId: string;
    /** Price tier pinned to the package the user picked (Space / Magic / …). */
    priceTier: BirthdayPriceTier;
    /**
     * Number of paying guests, bound to the chosen price tier. Must match
     * the tier's `minSaleQuantity` ≤ count ≤ `maxSaleQuantity`.
     */
    paidGuests: number;
    /** Buyer / contact details for the AnonymousPerson block. */
    buyer: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        street?: string | null;
        zipCode?: string | null;
        city?: string | null;
        country?: string | null;
    };
    /**
     * Deposit (50 % of `grossTotal`). Must be > 0; the remaining
     * `grossTotal - depositAmount` will be set on `Basket.Balance`
     * so Recreatex shows it as an open rest.
     */
    depositAmount: number;
    /** Total cart value (paid guests × tier price + extras). */
    grossTotal: number;
    /** Free-text comment shown in the back-office on the OrganisedVisit. */
    comment?: string;
    /** Optional extras booked as ArticleSale lines on the same basket. */
    extras?: BirthdayExtraArticle[];
    /** Webshop order number (our `SM-BD-…` reference). */
    orderNumber: string;
    /** Mollie transaction id (e.g. `tr_xxx`) — written to BasketPayment. */
    molliePaymentId: string;
    /** Payment method GUID — defaults to KARTENZAHLUNG. */
    paymentMethodId?: string;
    /** Division GUID — defaults to DIVISION_IDS.spaceMagic. */
    divisionId?: string;
    /** Customer GUID — defaults to GUEST_CUSTOMER_ID (anonymous webshop). */
    customerId?: string;
}
/**
 * Builds a Recreatex {@link Basket} for a webshop birthday booking with
 * a 50 % deposit. The remainder is left open via `Basket.Balance` so the
 * back-office can collect it on the day of the party.
 *
 * The returned basket is ready for `client.general.checkoutBasket(...)`.
 */
declare function buildBirthdayBasket(input: BirthdayBookingInput): Basket;
/**
 * Result of {@link buildBirthdayBasket}-+-{@link checkoutBasket}.
 * `organisedVisitId` is `salesItems[0].id` (the period reservation,
 * which is the OrganisedVisit's primary line in Recreatex).
 */
interface BirthdayCheckoutResult {
    salesOrderNumber: string;
    organisedVisitId: string;
    /** All `salesItems[*].id` — index 0 is the period reservation, the rest are extras. */
    salesLineIds: string[];
    salesSeriesId: string | null;
    balanceRemaining: number;
}

/**
 * Counting park entries from the check-in bons.
 *
 * Every check-in bon carries exactly ONE wallet line per wristband handed out:
 * "Hauskredit Kinder", "Hauskredit Erwachsene" or "Geburtstags Wallet". Their sum is the
 * number of people checked in, the bon time is the time of entry.
 *
 * Verified 2026-10-08 against the Gantner access counter: 337 wristbands vs. 334 counted on
 * 2026-10-04; from June 2025 on every month shows a stable 2.0 to 2.3 Gantner scans per
 * wristband. The counter value the dashboard stored per day (`daily_kpi.visitors`) covered
 * only 36 to 44 % of the entries from June to October 2025, which is why the closed-day value
 * comes from here.
 *
 * ⚠ The line names are the convention of the Space Magic tills, not an API field. If the
 * till articles get renamed, `wristbands` drops to zero; callers must treat 0 on a day with
 * check-in bons as "convention changed", never as "nobody came".
 *
 * ⚠ "Kinder"/"Erwachsene" is the LINE TYPE, not the age: in 2025 the tills booked most
 * children as "Hauskredit Erwachsene". Only the total is reliable over the whole history.
 */

/** Wallet line → bucket. One line per wristband. */
declare const WRISTBAND_LINES: Readonly<Record<string, 'kids' | 'adults' | 'birthday'>>;
/**
 * Articles that are a pass or a multi-visit card (annual pass, ten-visit card, season pass,
 * subscription). Their use can only be measured when they are sold to a NAMED customer.
 */
declare const PASS_ARTICLE_PATTERN: RegExp;
interface WristbandCount {
    /** People checked in (sum of the wallet lines, rounded once at the end). */
    wristbands: number;
    kids: number;
    adults: number;
    birthday: number;
    /** Bons with at least one wallet line (≈ groups/families at the till). */
    checkinSales: number;
    /** Entries per hour of the bon time (local park time), 24 slots. */
    byHour: number[];
    /** Pass / multi-visit card units sold to the anonymous customers (usage not traceable). */
    passSalesAnonymous: number;
    /** Pass / multi-visit card units sold to a named customer. */
    passSalesNamed: number;
}
/** Hour of a Recreatex bon timestamp (`2026-10-04T18:52:38`, park-local), or null. */
declare function saleHour(date: string | undefined | null): number | null;
/**
 * Count entries (wristbands) and pass sales over a list of bons.
 *
 * Lines are deduplicated per bon first. Quantities are summed raw and rounded once per
 * bucket: a handful of lines carry fractional quantities (seen on "Geburtstags Wallet"),
 * and rounding per line would drift.
 */
declare function countWristbands(sales: readonly Sale[]): WristbandCount;

export { DIVISION_IDS, GASTRO_GROUP_MAP, GUEST_CUSTOMER_ID, PASS_ARTICLE_PATTERN, PAYMENT_METHOD_ID_KARTENZAHLUNG, SHOP_ID, SPACE_MAGIC_ZONE_ID, VOUCHER_SKUS, WALK_IN_CUSTOMER_ID, WRISTBAND_LINES, buildBirthdayBasket, categorizeVisit, classifyVoucher, countWristbands, extractEssen, extractKind, extractKontakt, extractPaket, findVoucher, gastroGroupName, isAnonymousCustomer, isGastroGroup, mapBirthdayBooking, mapEscapeBooking, saleHour };
export type { BirthdayBookingInput, BirthdayCheckoutResult, BirthdayExtraArticle, BirthdayPriceTier, BookingRow, EscapeRow, VisitCategory, VoucherDeliveryType, VoucherSku, WristbandCount };
