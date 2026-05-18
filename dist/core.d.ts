import { R as RecreatexContext, Y as Ymd, a as RecreatexDateTime } from './client-BkF_SWKx.js';
export { A as AccessZone, b as AccessZoneOccupancy, c as AccessZoneReader, d as AdjustOrganisedVisitInput, e as AnonymousPerson, f as Article, g as ArticleGroup, h as ArticleGroupRef, i as ArticlePriceInformation, j as ArticlePriceInformationCriteria, k as ArticleSaleItem, l as ArticleSalesHistoryBucket, m as ArticleSalesHistoryGroup, n as ArticleSalesMatchMode, o as ArticleSalesOrder, p as ArticleSalesOrderType, q as ArticleSalesReport, r as ArticleSalesReportCriteria, s as ArticleSalesReportLine, t as ArticleVat, u as ArticlesModule, B as Basket, v as BasketItem, w as BasketPayment, x as BasketTypeString, y as BasketTypeStrings, z as BasketValidationResult, C as CallOptions, D as CancelOrganisedVisitInput, E as CancelOrganisedVisitResult, F as CheckoutResponse, G as CheckoutResult, H as Division, I as DocumentsModule, J as Exposition, K as ExpositionDayOverview, L as ExpositionPeriod, M as ExpositionPeriodDate, N as ExpositionPeriodPrice, O as ExpositionPeriodRef, P as ExpositionPeriodReservationEntry, Q as ExpositionPeriodReservationItem, S as ExpositionsModule, T as FetchLike, U as FindAccessZonesCriteria, V as FindArticleSalesOrdersCriteria, W as FindArticlesCriteria, X as FindExpositionsCriteria, Z as FindGiftCertificatesCriteria, _ as FindOrganisedVisitsCriteria, $ as FindPersonCriteria, a0 as FindSalesCriteria, a1 as GeneralModule, a2 as GetRebookingCostsInput, a3 as GiftCertificate, a4 as GiftCertificatePdfRequest, a5 as ManagerModule, a6 as OrganisedVisit, a7 as OrganisedVisitArticle, a8 as OrganisedVisitPeriodReservation, a9 as OrganisedVisitPeriodTransfer, aa as OrganisedVisitPerson, ab as OrganisedVisitPersonAddress, ac as OrganisedVisitRebookingItem, ad as OrganisedVisitSaleAdjustment, ae as OrganisedVisitSaleGuest, af as OrganisedVisitSaleInfo, ag as OrganisedVisitTicketAdjustment, ah as PaginateOptions, ai as Paging, aj as PaymentMethod, ak as Person, al as PersonAddress, am as PersonCredential, an as PointOfSale, ao as ReCreateXClient, ap as ReCreateXClientOptions, aq as Reader, ar as RecreatexEnvelope, as as RetryOptions, at as Sale, au as SaleLine, av as SalePaymentLine, aw as SalesInformationCriteria, ax as SalesInformationEntry, ay as VisitingCustomersCriteria, az as VisitingCustomersEntry, aA as isRetryableError, aB as paginate, aC as paginateIter, aD as withRetry } from './client-BkF_SWKx.js';

/**
 * Context construction. The {@link ReCreateXClient} calls this for you;
 * direct use is only needed when reaching past the high-level modules.
 */

/** Stable session UUID accepted by the read-only endpoints. */
declare const STABLE_SESSION_ID = "00000000-0000-0000-0000-000000000001";
interface ContextOptions {
    shopId: string;
    password: string;
    language?: string;
    /** Either a static UUID or a factory that returns a fresh UUID per call. */
    sessionId?: string | (() => string);
    divisionId?: string;
}
declare function buildContext(opts: ContextOptions): RecreatexContext;
/**
 * Cross-runtime UUID v4 generator.
 *
 *  - Browser & Workers: uses `crypto.randomUUID()`.
 *  - Node 19+: ditto.
 *  - Node 18: falls back to `crypto.getRandomValues()`.
 */
declare function uuidv4(): string;

/**
 * Error hierarchy.
 *
 * Catch the base {@link RecreatexError} when you want to handle anything
 * the SDK throws. Catch a more specific subclass when you want to act on
 * just one failure mode.
 */
declare class RecreatexError extends Error {
    /** Endpoint path that triggered the error, if known. */
    readonly endpoint?: string;
    constructor(message: string, options?: {
        endpoint?: string;
        cause?: unknown;
    });
}
/** HTTP-level error (non-2xx response). Body is captured if available. */
declare class RecreatexHttpError extends RecreatexError {
    readonly status: number;
    readonly body?: string;
    constructor(status: number, endpoint: string, body?: string, options?: {
        cause?: unknown;
    });
}
/**
 * API-level error — HTTP succeeded (2xx) but the response signalled
 * failure via either:
 *  - `data.succes === false` (most Find/List endpoints), or
 *  - `data.Result.BasketValidationResult.IsValid === false` (basket flow).
 *
 * `raw` keeps the full response so callers can inspect `brokenRuleName`,
 * `BasketItemValidationResults`, etc.
 */
declare class RecreatexApiError extends RecreatexError {
    readonly raw: unknown;
    readonly brokenRuleName?: string;
    constructor(message: string, endpoint: string, raw: unknown, options?: {
        brokenRuleName?: string;
    });
}
/** Request exceeded the configured timeout. */
declare class RecreatexTimeoutError extends RecreatexError {
    readonly timeoutMs: number;
    constructor(endpoint: string, timeoutMs: number);
}

/**
 * Date helpers.
 *
 * Recreatex accepts two distinct datetime formats:
 *  - "YYYY-MM-DD HH:mm:ss.SSS"  → ManagerApp / General / Articles
 *  - "YYYY-MM-DDTHH:mm:ss"      → Expositions
 *
 * Always pre-format with these helpers; never hand-concat in calling code.
 */

/** Format a `Date` as `YYYY-MM-DD` in the given timezone (default Europe/Berlin). */
declare function ymd(d?: Date, tz?: string): Ymd;
/** `YYYY-MM-DD` for "today" in the given timezone. */
declare function todayYmd(tz?: string): Ymd;
/** `[from, until]` covering the full day (`00:00:00.000` .. `23:59:59.000`)
 *  in the dotted "ManagerApp" datetime format. */
declare function dayRangeDotted(date?: Ymd | Date, tz?: string): {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
};
/** `[from, until]` covering the full day in ISO format (`T00:00:00`..`T23:59:59`)
 *  for the Expositions namespace. */
declare function dayRangeIso(date?: Ymd | Date, tz?: string): {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
};
/** `[fromYmd, untilYmd]` window centred on `today`, spanning -before .. +after days. */
declare function ymdWindow(before: number, after: number, today?: Date, tz?: string): {
    fromYmd: Ymd;
    untilYmd: Ymd;
};

export { type ContextOptions, RecreatexApiError, RecreatexContext, RecreatexDateTime, RecreatexError, RecreatexHttpError, RecreatexTimeoutError, STABLE_SESSION_ID, Ymd, buildContext, dayRangeDotted, dayRangeIso, todayYmd, uuidv4, ymd, ymdWindow };
