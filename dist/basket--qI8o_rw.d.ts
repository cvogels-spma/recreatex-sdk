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
/**
 * A bookable Exposition slot with its addressable `id`. Use
 * {@link ExpositionsModule.listPeriods} to fetch — `findOverviewByDay`
 * does NOT expose the id, so it cannot be used as the source for the
 * `ExpositionPeriodId` required by `ExpositionPeriodReservation`.
 */
interface ExpositionPeriodRef {
    id: string;
    expositionId: string;
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    occupancy?: {
        current?: number;
        remaining: number;
        maximum: number;
        maxVisitorsPerGroup: number;
        controlType?: number;
    };
    /** Last day on which a webshop reservation can be made. */
    finalSubscriptionDate?: RecreatexDateTime;
    /** Last day on which a backoffice reservation can be made. */
    finalSubscriptionDateBo?: RecreatexDateTime;
    isExcluded?: boolean;
    blocked?: boolean;
    comment?: string;
    resellerCapacity?: number;
    articles?: unknown[];
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

/**
 * Basket types — used by `ReCalculateBasket`, `LockBasketItems`,
 * `CheckoutBasket`.
 *
 * All basket items are a discriminated union over the `$type` field. The
 * SDK exports {@link BasketTypeStrings} as a const map of every known
 * subtype string so you don't have to hand-type the
 * `ReCreateX.WebShop.WebServices.Contracts.…, ReCreateX.WebShop.WebServices.Contracts`
 * incantation.
 *
 * Pitfalls verified against the live API:
 *  - `Article: null` on an `ArticleSale` item → API throws
 *    "Object reference not set to an instance of an object".
 *    Always pass `Article: { Id: "<guid>" }`.
 *  - `PayLater: true` on a Gift Certificate basket → `InvalidPayLaterPayment`.
 *    Provide a `Payments[]` array with a real `BasketPayment`.
 *  - `CustomerId: "00000000-..."` → `MissingCustomer`. Use the
 *    Webshop-Guest-Person GUID
 *    (Space Magic: `119d9f06-66ad-ef11-9595-9a21964517de`) instead.
 *  - `BasketPayment.PaymentMethod: { ... }` (nested) → type-not-found error.
 *    The structure is FLAT: `PaymentMethodId: "<guid>"` directly on the
 *    `BasketPayment`.
 */
/** Discriminator strings for `$type` on basket items / payments / costs. */
declare const BasketTypeStrings: {
    readonly ArticleSale: "ReCreateX.WebShop.WebServices.Contracts.ArticleSale, ReCreateX.WebShop.WebServices.Contracts";
    /** Webshop-flavoured ArticleSale used by the OMG voucher shop. */
    readonly SalesArticleSale: "ReCreateX.WebShop.WebServices.Contracts.SalesArticleSale, ReCreateX.WebShop.WebServices.Contracts";
    readonly ExpositionPeriodReservation: "ReCreateX.WebShop.WebServices.Contracts.ExpositionPeriodReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly CombiExpositionReservation: "ReCreateX.WebShop.WebServices.Contracts.CombiExpositionReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly OrganisedVisitRebooking: "ReCreateX.WebShop.WebServices.Contracts.OrganisedVisitRebooking, ReCreateX.WebShop.WebServices.Contracts";
    readonly CombiOrganisedVisitRebooking: "ReCreateX.WebShop.WebServices.Contracts.CombiOrganisedVisitRebooking, ReCreateX.WebShop.WebServices.Contracts";
    readonly CultureEventReservation: "ReCreateX.WebShop.WebServices.Contracts.CultureEventReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly RentalReservation: "ReCreateX.WebShop.WebServices.Contracts.RentalReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly ActivityReservation: "ReCreateX.WebShop.WebServices.Contracts.ActivityReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly TableSale: "ReCreateX.WebShop.WebServices.Contracts.TableSale, ReCreateX.WebShop.WebServices.Contracts";
    readonly BasketPayment: "ReCreateX.WebShop.WebServices.Contracts.BasketPayment, ReCreateX.WebShop.WebServices.Contracts";
    readonly GiftCertificateDiscount: "ReCreateX.WebShop.WebServices.Contracts.GiftCertificateDiscount, ReCreateX.WebShop.WebServices.Contracts";
    readonly CouponCodeDiscount: "ReCreateX.WebShop.WebServices.Contracts.CouponCodeDiscount, ReCreateX.WebShop.WebServices.Contracts";
};
type BasketTypeString = (typeof BasketTypeStrings)[keyof typeof BasketTypeStrings];
interface BasketItemBase {
    $type: BasketTypeString;
    Id: string;
    DivisionId: string;
    Quantity: number;
    UnitPrice: number;
    CustomerContactId?: string;
    RuleNamesToIgnore?: string[] | null;
    AdvancementPrice?: number | null;
    AsReseller?: boolean;
    PromotionRuleDiscountAmount?: number;
    LockTicket?: unknown;
}
/** Article line — F&B, voucher, ticket. `Article` MUST be `{ Id }`, never null. */
interface ArticleSaleItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.ArticleSale | typeof BasketTypeStrings.SalesArticleSale;
    Article: {
        Id: string;
    };
    CustomPrice?: number;
    ExtraDescription?: string | null;
}
/**
 * A "ticket" within an `ExpositionPeriodReservation`. Pins a count of
 * participants to a specific `PriceGroupId` (e.g. "Partypaket - Space"
 * 29 € vs. "Partypaket - Magic" 34 € on the Geburtstagstisch
 * exposition).
 *
 * ⚠ Verified live 2026-05-04: the field names are
 *   `ParticipantCount` + `Participants[]` (NOT `Quantity` / `Visitors`).
 *
 * ⚠ `PriceGroupId` must be `prices[].group.id` from
 *   `Expositions/FindExpositions(Includes.Pricing=true)`, NOT
 *   `prices[].id` (the latter is what `FindExpositionOverviewByDay`
 *   confusingly labels as `priceGroupId` — that's actually a price id).
 */
interface ExpositionPeriodReservationEntry {
    /** Discriminator. */
    $type?: string;
    /** GUID — `prices[].group.id`, NOT `prices[].id`. */
    PriceGroupId: string;
    /** Number of seats / kids in this price tier. */
    ParticipantCount: number;
    /** Visitor records (empty array for webshop / `askNames: false`). */
    Participants?: unknown[];
    Cards?: unknown[];
    CustomerCardUsages?: unknown[];
    /** Server-computed; passing it as a hint is harmless. */
    Amount?: number;
    PromotionRuleDiscountAmount?: number;
    ExtraInfo?: string | null;
    ExternalSaleIntegration?: boolean;
    [extra: string]: unknown;
}
interface ExpositionPeriodReservationItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.ExpositionPeriodReservation;
    ExpositionId: string;
    ExpositionPeriodId: string;
    CustomerId?: string | null;
    Comments?: string | null;
    /** Tickets per PriceGroup — required for OrganisedVisits with priced tiers. */
    Entries?: ExpositionPeriodReservationEntry[] | null;
    /** Add-on ArticleSale lines (extras: Cosmoo plush, snacks). */
    ArticleSales?: Array<Record<string, unknown>> | null;
    ArticleOptionalSales?: Array<Record<string, unknown>> | null;
    AutomaticArticleSales?: Array<Record<string, unknown>> | null;
    /** `true` only for back-office collect-later flows; stays `false` for Webshop. */
    OrderWithoutPayment?: boolean;
    PersonalizedMessage?: string | null;
    LanguageId?: string | null;
    TargetAudienceId?: string | null;
    TargetSkillSubCategoryIds?: string[] | null;
    CombiExpositionExpositionId?: string | null;
    Donation?: unknown;
    GiftAid?: unknown;
}
interface OrganisedVisitRebookingItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.OrganisedVisitRebooking;
    OrganisedVisitId: string;
    OrganisedVisitPeriodTransfers?: Array<{
        OldPeriodId: string;
        NewPeriodId: string;
        Quantity: number;
    }> | null;
}
type BasketItem = ArticleSaleItem | ExpositionPeriodReservationItem | OrganisedVisitRebookingItem | (BasketItemBase & {
    [extra: string]: unknown;
});
/**
 * Payment block. Note the FLAT structure — `PaymentMethodId` is a sibling,
 * not nested inside a `PaymentMethod` object.
 *
 * `TrxId` / `OrderId` / `PayId` are v8.3.0+ fields meant for Enviso-Split
 * payments; we re-use them for Mollie reference data.
 */
interface BasketPayment {
    $type: typeof BasketTypeStrings.BasketPayment;
    Amount: number;
    Currency: string;
    PaymentMethodId: string;
    ExtraInfo1?: string;
    ExtraInfo2?: string;
    OrderId?: string;
    TrxId?: string;
    PayId?: string;
}
/** Anonymous-buyer block used when no person record exists yet. */
interface AnonymousPerson {
    Name?: string | null;
    FirstName?: string | null;
    Street1?: string | null;
    Street2?: string | null;
    Number?: string | null;
    Box?: string | null;
    Home?: string | null;
    Country?: string | null;
    Email?: string | null;
    Newsletter?: boolean;
    ZipCode?: string | null;
    Telephone?: string | null;
}
interface Basket {
    /** ALWAYS the Webshop-Guest-Person GUID for anonymous orders, never zero. */
    CustomerId: string;
    Items: BasketItem[];
    Payments?: BasketPayment[] | null;
    CouponCodes?: string[] | null;
    Info1?: string;
    Info2?: string;
    Info3?: string;
    AnonymousPerson?: AnonymousPerson;
    Comment?: string;
    OrderId?: string;
    PayLater?: boolean;
    TrxId?: string;
    PayId?: string;
    /** Catch-all for less-common fields. */
    [extra: string]: unknown;
}
/**
 * Basket validation result.
 *
 * The wire payload is camelCase on the way back from Recreatex
 * (`isValid`, `message`, `brokenRuleName`) — the request side is
 * PascalCase, but the response is serialised lower-first.
 */
interface BasketValidationResult {
    isValid: boolean;
    message?: string | null;
    brokenRuleName?: string | null;
    basketItemValidationResults?: unknown;
}
interface CheckoutResult {
    resultState: number;
    salesOrderNumber: string;
    salesSeriesId?: string | null;
    invoiceId?: string | null;
    hasCollectLaterLines?: boolean;
    tokenNumber?: string | null;
    basketValidationResult: BasketValidationResult;
    salesItems?: Array<{
        id: string;
        salesNumber?: number | null;
        [extra: string]: unknown;
    }> | null;
}
interface CheckoutResponse {
    result: CheckoutResult;
}

export { type AnonymousPerson as A, type Basket as B, type CheckoutResponse as C, type Exposition as E, type FindOrganisedVisitsCriteria as F, type OrganisedVisitTicketAdjustment as O, type Paging as P, type RecreatexDateTime as R, type Ymd as Y, type OrganisedVisitSaleAdjustment as a, type ExpositionPeriodDate as b, type ExpositionDayOverview as c, type ExpositionPeriodRef as d, type OrganisedVisit as e, type OrganisedVisitPeriodTransfer as f, type BasketItem as g, type RecreatexContext as h, type RecreatexEnvelope as i, type ArticleSaleItem as j, type BasketPayment as k, type BasketTypeString as l, BasketTypeStrings as m, type BasketValidationResult as n, type CheckoutResult as o, type ExpositionPeriod as p, type ExpositionPeriodPrice as q, type ExpositionPeriodReservationEntry as r, type ExpositionPeriodReservationItem as s, type OrganisedVisitArticle as t, type OrganisedVisitPeriodReservation as u, type OrganisedVisitPerson as v, type OrganisedVisitPersonAddress as w, type OrganisedVisitRebookingItem as x, type OrganisedVisitSaleGuest as y, type OrganisedVisitSaleInfo as z };
