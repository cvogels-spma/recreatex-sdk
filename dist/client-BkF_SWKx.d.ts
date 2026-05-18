/**
 * Retry helpers. Only network-level failures and 5xx HTTP errors are
 * retried — never 4xx, never API-validation errors. Honours an
 * `AbortSignal`.
 */
interface RetryOptions {
    /** Total attempts including the first. Default `3`. */
    attempts?: number;
    /** Base delay in ms; doubles each retry. Default `250`. */
    backoffMs?: number;
    /** Max delay between retries. Default `4000`. */
    maxBackoffMs?: number;
    /** Optional cancellation signal. */
    signal?: AbortSignal;
}
declare function isRetryableError(err: unknown): boolean;
declare function withRetry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T>;

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
 * Article catalogue types.
 *
 * Source: live captures from `Articles/FindArticles` against the Space Magic
 * shop. Only fields verified to be populated are typed strictly; the rest
 * are loose `unknown`/optional.
 */
interface ArticleVat {
    percentage?: number;
    id?: string;
    description?: string;
}
/**
 * A sellable article (ticket, voucher, F&B item, etc.).
 *
 * The `$type` discriminator is always
 * `ReCreateX.WebShop.WebServices.Contracts.Article` and is irrelevant for
 * reading — only relevant when echoed back into a basket.
 */
interface Article {
    id: string;
    code: string;
    name: string;
    ticketDescription?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    divisionId: string;
    imageUrl?: string | null;
    /** True when the buyer can override `UnitPrice` (variable-amount vouchers). */
    allowPriceChangeWebshop: boolean;
    /** Loosely-typed; only present on Webshop-aware articles. */
    vat?: ArticleVat | null;
    group?: ArticleGroupRef | null;
    /** Recreatex info1..info5 — free-form text fields. */
    info1?: string;
    info2?: string;
    info3?: string;
    info4?: string;
    info5?: string;
    /** Open-ended for fields the SDK doesn't model strictly. */
    [extra: string]: unknown;
}
interface ArticleGroupRef {
    id: string;
    code?: string;
    name?: string;
}
interface ArticleGroup {
    id: string;
    code?: string;
    name?: string;
    parentId?: string | null;
    sortOrder?: number;
}
/** Search input for `Articles/FindArticles`. */
interface FindArticlesCriteria {
    /** Exact article GUID. Wire name is `ArticleID` in the Recreatex docs. */
    articleId?: string;
    /** Restrict to an article group GUID. */
    articleGroupId?: string;
    /** Substring match on article name. */
    namePattern?: string;
    /** Exact code match. */
    code?: string;
    /** Exact barcode match. */
    barcode?: string;
    /** Restrict to a division (e.g. `DIVISION_IDS.spaceMagic`). */
    divisionId?: string;
    /** Include article options, ingredients and warehouses. */
    includeDetail?: boolean;
    /** Restrict to a stock location / warehouse. */
    stockLocationId?: string;
    /** Restrict to an article category. */
    articleCategoryId?: string;
    /** Restrict to voucher-marked articles. */
    forVouchers?: boolean;
    /** Ignore configured active-period filters. */
    ignoreActivePeriodsFilter?: boolean;
    /** Page index/size; SDK's `paginate: 'auto'` mode iterates these for you. */
    pageIndex?: number;
    pageSize?: number;
    includes?: {
        price?: boolean;
        imageUrl?: boolean;
        image?: boolean;
        group?: boolean;
        vat?: boolean;
        stock?: boolean;
        barcodes?: boolean;
        activePeriods?: boolean;
        articleCategories?: boolean;
        soldOutArticles?: boolean;
        saleArticles?: boolean;
        rentArticles?: boolean;
        freeArticles?: boolean;
        translations?: boolean;
        priceInfo?: boolean;
    };
}
interface ArticlePriceInformationCriteria {
    articleId: string;
    customerId?: string;
}
interface ArticlePriceInformation {
    totalPrice?: number;
    priceGroup?: string | null;
    familyComposition?: string | null;
    subsidizationPrice?: string | number | null;
    additionSupplementPrice?: number | null;
    donationPrice?: number | null;
    [extra: string]: unknown;
}
type ArticleSalesOrderType = 'All' | 'Sales' | 'Warranty' | 'WaitingList' | 'Service' | 'ChipKnip' | 'LessonGroup' | 'Purchase' | 'PriceGroup' | 'Credit' | 'Rental' | 'Subscription' | 'PurchaseCredit' | 'Family' | 'GiftCertificate' | 'ConsumptionCoupon' | 'FollowUp' | 'SpendingCredit' | 'ETicket';
/** Search input for `Articles/FindArticleSalesOrders`. */
interface FindArticleSalesOrdersCriteria {
    /** Unique sale-line GUID. */
    id?: string;
    /** Customer/person GUID. Omit for all customers. */
    personId?: string;
    /** Recreatex datetime lower bound. */
    from?: string;
    /** Recreatex datetime upper bound. */
    until?: string;
    /** Defaults to `Sales` in high-level report helpers. */
    type?: ArticleSalesOrderType | number;
    pageIndex?: number;
    pageSize?: number;
}
/**
 * A historical article sales line as returned by
 * `Articles/FindArticleSalesOrders`.
 */
interface ArticleSalesOrder {
    id: string;
    description?: string;
    date: string;
    personId?: string | null;
    number?: number;
    sequenceNumber?: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    /**
     * Not listed in the public PDF, but some Recreatex JSON responses include
     * richer article references. Report helpers use it when available.
     */
    articleId?: string;
    articleCode?: string;
    articleName?: string;
    [extra: string]: unknown;
}
type ArticleSalesHistoryGroup = 'day' | 'month';
type ArticleSalesMatchMode = 'exact' | 'includes';
interface ArticleSalesReportCriteria {
    from: string;
    until: string;
    articleId?: string;
    code?: string;
    namePattern?: string;
    divisionId?: string;
    personId?: string;
    type?: ArticleSalesOrderType | number;
    matchMode?: ArticleSalesMatchMode;
    historyGroup?: ArticleSalesHistoryGroup;
    includeLines?: boolean;
    pageSize?: number;
}
interface ArticleSalesReportLine {
    saleLineId: string;
    date: string;
    description: string;
    personId?: string | null;
    number?: number;
    sequenceNumber?: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
interface ArticleSalesHistoryBucket {
    period: string;
    quantity: number;
    totalPrice: number;
    lineCount: number;
    averageUnitPrice: number | null;
}
interface ArticleSalesReport {
    article?: Article;
    articleId?: string;
    currentPrice: number | null;
    priceInfo?: ArticlePriceInformation;
    from: string;
    until: string;
    matchMode: ArticleSalesMatchMode;
    totals: {
        quantity: number;
        totalPrice: number;
        lineCount: number;
        averageUnitPrice: number | null;
    };
    history: ArticleSalesHistoryBucket[];
    lines?: ArticleSalesReportLine[];
}

/**
 * Pagination helpers.
 *
 * Recreatex paging is page-index based (zero-based). The convention used
 * by the SDK: a "full page" means "more pages might exist"; a partial page
 * (`length < pageSize`) means "we're done".
 */
interface PaginateOptions {
    pageSize?: number;
    /** Hard cap on pages requested, regardless of returned size. Default `50`. */
    maxPages?: number;
    /** Optional cancellation signal. */
    signal?: AbortSignal;
}
/**
 * Drive a page-by-page fetcher to completion.
 *
 * @example
 *   const all = await paginate(
 *     ({ pageIndex, pageSize }) => client.expositions.findOrganisedVisitsPage({
 *       fromYmd, untilYmd, paging: { PageIndex: pageIndex, PageSize: pageSize }
 *     }),
 *     { pageSize: 200 },
 *   );
 */
declare function paginate<T>(fetchPage: (args: {
    pageIndex: number;
    pageSize: number;
}) => Promise<T[]>, opts?: PaginateOptions): Promise<T[]>;
/** Async-iterator variant for streaming consumers (don't accumulate in memory). */
declare function paginateIter<T>(fetchPage: (args: {
    pageIndex: number;
    pageSize: number;
}) => Promise<T[]>, opts?: PaginateOptions): AsyncGenerator<T, void, void>;

/**
 * Articles namespace.
 *
 * Endpoints:
 *  - `Articles/FindArticles`                → list/search article catalogue
 *  - `Articles/ListArticleGroups`            → article-group taxonomy
 *  - `Articles/GetArticlePriceInformation`   → detailed price info
 *  - `Articles/FindArticleSalesOrders`       → sold article history
 */

declare class ArticlesModule {
    private readonly client;
    constructor(client: ReCreateXClient);
    /**
     * Fetch a single page of articles. Use {@link findArticles} for auto-pagination.
     */
    findArticlesPage(criteria?: FindArticlesCriteria, callOpts?: CallOptions): Promise<Article[]>;
    /**
     * Fetch all articles matching the criteria. Pages internally.
     *
     * @example
     *   const vouchers = await client.articles.findArticles({ namePattern: 'Gutschein' });
     */
    findArticles(criteria?: FindArticlesCriteria, paginateOpts?: PaginateOptions, callOpts?: CallOptions): Promise<Article[]>;
    /** Fetch a single article by GUID. */
    findArticleById(articleId: string, callOpts?: CallOptions): Promise<Article | undefined>;
    /** List all article groups (e.g. F&B categories, voucher types). */
    listArticleGroups(callOpts?: CallOptions): Promise<ArticleGroup[]>;
    /** Detailed price information for an article, optionally customer-specific. */
    getArticlePriceInformation(criteria: ArticlePriceInformationCriteria, callOpts?: CallOptions): Promise<ArticlePriceInformation | undefined>;
    /** Fetch a single page of historical sold article lines. */
    findArticleSalesOrdersPage(criteria?: FindArticleSalesOrdersCriteria, callOpts?: CallOptions): Promise<ArticleSalesOrder[]>;
    /** Fetch all historical sold article lines matching the criteria. */
    findArticleSalesOrders(criteria?: FindArticleSalesOrdersCriteria, paginateOpts?: PaginateOptions, callOpts?: CallOptions): Promise<ArticleSalesOrder[]>;
    /**
     * Article dossier: current catalogue/price data plus sold quantity,
     * revenue and a day/month history for a single article.
     */
    getArticleSalesReport(criteria: ArticleSalesReportCriteria, paginateOpts?: PaginateOptions, callOpts?: CallOptions): Promise<ArticleSalesReport>;
    private resolveReportArticle;
}

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
 * Expositions namespace.
 *
 * Endpoints:
 *  - `Expositions/FindExpositions`               → room/exposition catalogue
 *  - `Expositions/FindExpositionPeriodDates`     → free days in a window
 *  - `Expositions/FindExpositionOverviewByDay`   → slots + capacity for a day
 *  - `Expositions/ListExpositionPeriods`         → addressable Period IDs (used to build `ExpositionPeriodReservation` baskets)
 *  - `Expositions/FindOrganisedVisits`           → list bookings (paginated)
 *  - `Expositions/AdjustOrganisedVisit`          → change quantities of an existing visit
 *  - `Expositions/CancelOrganisedVisit`          → cancel + refund prep
 *  - `Expositions/GetOrganisedVisitRebookingCosts` → preview slot-change cost delta
 *
 *  ⚠ `findOverviewByDay` does NOT include the period `id` — it only carries
 *  `from / until / occupancy / prices`. Use {@link ExpositionsModule.listPeriods}
 *  to obtain the addressable `ExpositionPeriodId` you need for a
 *  `ExpositionPeriodReservation` basket item.
 *
 *  ⚠ The "apply rebook" endpoint is not exposed as a JSON endpoint at the
 *  time of writing. The CheckoutBasket flow with an OrganisedVisitRebooking
 *  basket item appears to be the path — pending confirmation from Lukas
 *  Goetz @ Gantner. Use Cancel-then-Rebuy as the documented fallback.
 */

interface FindExpositionsCriteria {
    namePattern?: string;
    pageIndex?: number;
    pageSize?: number;
    includes?: {
        pricing?: boolean;
    };
}
interface AdjustOrganisedVisitInput {
    organisedVisitId: string;
    ticketAdjustments?: OrganisedVisitTicketAdjustment[];
    saleAdjustments?: OrganisedVisitSaleAdjustment[];
}
interface CancelOrganisedVisitInput {
    organisedVisitId: string;
    reasonId: string;
    paymentMethodId?: string;
}
interface CancelOrganisedVisitResult {
    returnAmount: number;
    salesSerieId?: string;
    isValid: boolean;
    message?: string;
}
interface GetRebookingCostsInput {
    organisedVisitId: string;
    transfers: OrganisedVisitPeriodTransfer[];
}
declare class ExpositionsModule {
    private readonly client;
    constructor(client: ReCreateXClient);
    /** List expositions matching `namePattern`. */
    findExpositions(criteria?: FindExpositionsCriteria, callOpts?: CallOptions): Promise<Exposition[]>;
    /** List free/blocked days for an exposition in `[fromIso, untilIso]`. */
    findPeriodDates(expositionId: string, fromIso: string, untilIso: string, callOpts?: CallOptions): Promise<ExpositionPeriodDate[]>;
    /** Slots + capacity for a single day. */
    findOverviewByDay(expositionId: string, date: Ymd, callOpts?: CallOptions): Promise<ExpositionDayOverview[]>;
    /**
     * Addressable Period entries (carries the `id` you need for an
     * `ExpositionPeriodReservation` basket item).
     *
     *  ⚠ Use this and NOT {@link findOverviewByDay} when you need to
     *  build a checkout basket — `findOverviewByDay` does not include
     *  the period id.
     *
     * @param expositionId — the Exposition GUID.
     * @param fromIso — ISO datetime, e.g. `'2026-05-07T00:00:00'`.
     * @param untilIso — ISO datetime, e.g. `'2026-05-07T23:59:59'`.
     *
     * @example
     *   const periods = await client.expositions.listPeriods(
     *     'c9b017fe-fafc-ef11-9596-b28721114d72',
     *     '2026-05-07T00:00:00', '2026-05-07T23:59:59',
     *   );
     *   const slot = periods.find((p) => p.from === '2026-05-07T14:00:00');
     *   // → slot.id is the ExpositionPeriodId
     */
    listPeriods(expositionId: string, fromIso: string, untilIso: string, callOpts?: CallOptions): Promise<ExpositionPeriodRef[]>;
    /**
     * Fetch a single page of OrganisedVisits.
     *
     *  ⚠ The `From`/`Until` filter applies to `purchaseDate`, NOT `startDate`.
     *  For sync use cases pull a generous window and filter client-side by
     *  `startDate` (see {@link ymdWindow}).
     */
    findOrganisedVisitsPage(criteria: FindOrganisedVisitsCriteria, callOpts?: CallOptions): Promise<OrganisedVisit[]>;
    /**
     * Auto-paginated list of OrganisedVisits.
     *
     * @example
     *   const visits = await client.expositions.findOrganisedVisits({
     *     fromYmd: '2026-04-01', untilYmd: '2026-04-30',
     *   });
     */
    findOrganisedVisits(criteria: FindOrganisedVisitsCriteria, paginateOpts?: PaginateOptions, callOpts?: CallOptions): Promise<OrganisedVisit[]>;
    /** Adjust quantities on an existing visit (more kids, extra food). */
    adjustOrganisedVisit(input: AdjustOrganisedVisitInput, callOpts?: CallOptions): Promise<{
        isValid: boolean;
        message?: string;
    }>;
    /** Cancel a visit. Returns the amount to refund. */
    cancelOrganisedVisit(input: CancelOrganisedVisitInput, callOpts?: CallOptions): Promise<CancelOrganisedVisitResult>;
    /** Preview the cost delta for a slot change (no apply). */
    getRebookingCosts(input: GetRebookingCostsInput, callOpts?: CallOptions): Promise<{
        rebookingCosts: number;
    }>;
}

/**
 * General namespace — access zones, readers, divisions, persons, sales,
 * payment methods, point-of-sales, basket primitives.
 */

interface AccessZoneOccupancy {
    maxVisitors: number;
    maxVisitorsPerDay: number;
    /** Daily count — IGNORES OccupancyFrom/Until and always reflects "today". */
    visitorsToday: number;
    /** Currently inside the zone. */
    visitorsCurrent: number;
}
interface AccessZoneReader {
    id: string;
    code?: string;
    name?: string;
    /** 0 = entrance, 1 = exit. */
    type?: 0 | 1;
}
interface AccessZone {
    id: string;
    code: string;
    name: string;
    number: number;
    occupancy?: AccessZoneOccupancy;
    entranceReaders?: AccessZoneReader[];
    exitReaders?: AccessZoneReader[];
}
interface FindAccessZonesCriteria {
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
interface Reader {
    id: string;
    code?: string;
    name?: string;
    number?: number;
    type?: number;
    [extra: string]: unknown;
}
interface Division {
    id: string;
    code?: string;
    name?: string;
    address?: string;
    [extra: string]: unknown;
}
interface PointOfSale {
    id: string;
    code?: string;
    name?: string;
    [extra: string]: unknown;
}
interface PaymentMethod {
    id: string;
    code: string;
    name: string;
    /** Often a number: 0 = card, 1 = cash, etc. */
    type?: number;
    [extra: string]: unknown;
}
interface PersonCredential {
    username?: string;
    password?: string;
}
interface PersonAddress {
    street?: string;
    number?: string;
    zipCode?: string;
    town?: string;
    countryDescription?: string;
    telephone?: string;
}
interface Person {
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
interface FindPersonCriteria {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}
interface SaleLine {
    articleId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    [extra: string]: unknown;
}
interface SalePaymentLine {
    paymentMethodId: string;
    amount: number;
    [extra: string]: unknown;
}
interface Sale {
    id: string;
    saleDate: RecreatexDateTime;
    pointOfSaleId?: string;
    customerId?: string | null;
    totalAmount: number;
    lines?: SaleLine[];
    paymentLines?: SalePaymentLine[];
    [extra: string]: unknown;
}
interface FindSalesCriteria {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    pointOfSaleId?: string;
    divisionId?: string;
}
/**
 * A single gift-certificate record as returned by `FindGiftCertificates`.
 *
 * Heads-up: `number` is typically null for a freshly-created certificate
 * (the PersonCard isn't populated yet). The visible voucher code lives in
 * the DocumentService PDF — use this record only to discover the
 * GiftCertificate `id` (for `SetGiftCertificatePrinted`) or to match a
 * cert via `salesSeriesID` to a CheckoutBasket result.
 */
interface GiftCertificate {
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
interface FindGiftCertificatesCriteria {
    /** Recreatex Person GUID — typically the customer who placed the order. */
    customerId?: string;
    id?: string;
    number?: string;
    pageIndex?: number;
    pageSize?: number;
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

/**
 * General namespace.
 *
 * Endpoints:
 *  - `General/FindAccessZones`     → live occupancy + zone metadata
 *  - `General/GetReaders`          → all RFID/barcode readers
 *  - `General/ListDivisions`       → divisions (Space Magic, Webshop, Admin)
 *  - `General/GetPointOfSales`     → POS terminals
 *  - `General/ListPaymentMethods`  → 32 payment methods
 *  - `General/FindPerson`          → look up person records
 *  - `General/FindSales`           → low-level transactions
 *  - `General/ReCalculateBasket`   → totals/discounts (web shop flow)
 *  - `General/LockBasketItems`     → reserve items (web shop flow)
 *  - `General/CheckoutBasket`      → finalise + create sale (web shop flow)
 */

declare class GeneralModule {
    private readonly client;
    constructor(client: ReCreateXClient);
    /**
     * Live occupancy + zone metadata.
     *
     *  ⚠ `visitorsToday` and `visitorsCurrent` ALWAYS reflect "right now".
     *  `OccupancyFrom`/`OccupancyUntil` is accepted but ignored for those
     *  fields — historic counts are not retrievable via this endpoint.
     *
     * @example
     *   const zones = await client.general.findAccessZones({ today: true });
     */
    findAccessZones(criteria?: FindAccessZonesCriteria & {
        today?: boolean;
    }, callOpts?: CallOptions): Promise<AccessZone[]>;
    /** All readers (eCarts, Laser Tag, vending, etc.). */
    getReaders(callOpts?: CallOptions): Promise<Reader[]>;
    /** All divisions (Space Magic, Webshop, Admin). */
    listDivisions(callOpts?: CallOptions): Promise<Division[]>;
    /** All POS terminals. */
    getPointOfSales(callOpts?: CallOptions): Promise<PointOfSale[]>;
    /** All payment methods (~32 entries). */
    listPaymentMethods(callOpts?: CallOptions): Promise<PaymentMethod[]>;
    /** Look up persons. Provide at least one filter. */
    findPerson(criteria: FindPersonCriteria, callOpts?: CallOptions): Promise<Person[]>;
    /** Low-level sales (only Nachzahlautomat / Checkins, not all POS). */
    findSales(criteria: FindSalesCriteria, callOpts?: CallOptions): Promise<Sale[]>;
    /** Recalculate prices, discounts, VAT for a basket without committing. */
    reCalculateBasket(basket: Basket, callOpts?: CallOptions): Promise<Basket>;
    /** Lock basket items for the duration of payment. */
    lockBasketItems(items: BasketItem[], callOpts?: CallOptions): Promise<{
        isLocked: boolean;
        lockExpiry?: string;
        message?: string;
    }>;
    /**
     * Finalise the basket (creates the sale).
     *
     * @returns full `Result` object including `SalesOrderNumber` and
     *   `SalesItems[]` (use `SalesItems[].Id` as `SalesLineId` for the
     *   document service).
     */
    checkoutBasket(basket: Basket, callOpts?: CallOptions): Promise<CheckoutResponse['result']>;
    /**
     * Find gift certificates, e.g. by customer or by id. Newest first.
     *
     * @example
     *   const certs = await client.general.findGiftCertificates({
     *     customerId: GUEST_CUSTOMER_ID, pageSize: 20,
     *   });
     *   const cert = certs.find((c) => c.salesSeriesID === checkoutResult.SalesSeriesId);
     */
    findGiftCertificates(criteria: FindGiftCertificatesCriteria, callOpts?: CallOptions): Promise<GiftCertificate[]>;
    /**
     * Mark a gift certificate as printed/delivered. Recreatex sets `printDate`
     * on the cert. Best-effort — if it fails, the voucher is still valid; the
     * back-office staff can reprint.
     */
    setGiftCertificatePrinted(giftCertificateId: string, callOpts?: CallOptions): Promise<void>;
}

/**
 * ManagerApp namespace — historical sales and visitor metrics.
 *
 * Both endpoints (`ListSalesInformation`, `ListVisitingCustomersInformation`)
 * support GroupByDate / GroupByDivision / GroupByArticleGroup, which can be
 * combined.
 *
 * Caveats:
 * - `ListSalesInformation.amount` is the GROSS booking value, not the
 *   actual cash-flow. Webshop pre-payments inflate this above the real
 *   payments-received total.
 * - `ListVisitingCustomersInformation.totalVisitors` counts SCANS, not
 *   distinct guests — typically ~2× the real headcount. For real guest
 *   counts use `FindAccessZones.visitorsToday` (live only) and persist it
 *   yourself.
 */

interface SalesInformationCriteria {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    divisionId?: string;
    articleGroupId?: string;
    groupByDate?: boolean;
    groupByDivision?: boolean;
    groupByArticleGroup?: boolean;
}
interface SalesInformationEntry {
    /** Gross amount. */
    amount: number;
    /** Net amount (without VAT). */
    lineAmount: number;
    /** VAT only. */
    vatAmount: number;
    /** Populated when `groupByDate: true`. */
    date?: string | null;
    /** Populated when `groupByArticleGroup: true`. */
    articleGroupID?: string | null;
    /** Populated when `groupByDivision: true`. */
    divisionId?: string | null;
}
interface VisitingCustomersCriteria {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    divisionId?: string;
    articleGroupId?: string;
    groupByDate?: boolean;
    groupByDivision?: boolean;
    groupByArticleGroup?: boolean;
}
interface VisitingCustomersEntry {
    /** Total scans (NOT distinct guests). */
    totalVisitors: number;
    /** Subscription-card visits. */
    subscriptionVisitors: number;
    /** Pay-on-entry visits. */
    saleVisitors: number;
    date?: string | null;
    articleGroupID?: string | null;
    divisionId?: string | null;
}

/**
 * ManagerApp namespace.
 *
 * Endpoints:
 *  - `ManagerApp/ListSalesInformation`              → revenue
 *  - `ManagerApp/ListVisitingCustomersInformation`  → visitor scans
 *
 * For caveats see ../types/manager.ts.
 */

declare class ManagerModule {
    private readonly client;
    constructor(client: ReCreateXClient);
    /** Aggregated revenue. Combine `groupBy*` flags as needed. */
    listSalesInformation(criteria: SalesInformationCriteria, callOpts?: CallOptions): Promise<SalesInformationEntry[]>;
    /**
     * Visitor scans (NOT distinct guests — see manager.ts caveats).
     *
     * For real guest counts use {@link GeneralModule.findAccessZones} with
     * `today: true` and persist `visitorsToday` yourself.
     */
    listVisitingCustomersInformation(criteria: VisitingCustomersCriteria, callOpts?: CallOptions): Promise<VisitingCustomersEntry[]>;
}

/**
 * Document service types — separate hostname/path from the JSON API.
 *
 * Endpoints live under `/WebShopDocumentService.svc/...` (note: capital
 * `WebShop`, with `.svc`). Output is binary PDF, not JSON, so the SDK
 * surfaces these via dedicated download helpers that return a `Blob`.
 */
interface GiftCertificatePdfRequest {
    /** SalesLineId from `CheckoutBasket.Result.SalesItems[].Id`. */
    salesLineId: string;
    /** ISO language code; the Space Magic template only ships `de`. */
    language?: 'de' | 'en' | 'nl' | 'fr';
    /** Override the shop ID (else taken from the client config). */
    shopId?: string;
}

/**
 * WebShopDocumentService.svc — binary downloads (PDFs).
 *
 * The host AND path differ from the JSON API:
 *
 *   `${baseUrl}/WebShopDocumentService.svc/GiftCertificates/{ShopId}/{lang}/{SalesLineId}`
 *
 * Note the capital `WebShop` and the `.svc` suffix. These are GET requests,
 * unlike everything else in the SDK.
 */

declare class DocumentsModule {
    private readonly client;
    constructor(client: ReCreateXClient);
    private get base();
    /**
     * Download a Gift Certificate PDF.
     *
     * @param req.salesLineId — `SalesItems[].Id` from the
     *   {@link GeneralModule.checkoutBasket} response.
     * @returns binary `Blob` (~377 KB for the Space Magic template).
     *
     * @example
     *   const result = await client.general.checkoutBasket(basket);
     *   const lineId = result.SalesItems?.[0]?.Id;
     *   if (lineId) {
     *     const pdf = await client.documents.giftCertificatePdf({ salesLineId: lineId });
     *   }
     */
    giftCertificatePdf(req: GiftCertificatePdfRequest, callOpts?: CallOptions): Promise<Blob>;
    /** Discover the merge-fields supported by the configured Word template. */
    giftCertificateHelp(language?: 'de' | 'en' | 'nl' | 'fr', callOpts?: CallOptions): Promise<Blob>;
}

/**
 * The main {@link ReCreateXClient} class.
 *
 * Construct once per worker / per request and reach for `client.expositions`,
 * `client.general`, `client.articles`, `client.manager`, `client.documents`.
 *
 * @example
 *   const rx = new ReCreateXClient({
 *     baseUrl: env.RECREATEX_BASE_URL,
 *     shopId:  env.RECREATEX_SHOP_ID,
 *     password: env.RECREATEX_PASSWORD,
 *   });
 *   const zones = await rx.general.findAccessZones({ today: true });
 */

type FetchLike = typeof fetch;
interface ReCreateXClientOptions {
    /** Recreatex JSON API base, e.g. `https://wsdlspacemagic.recreatex.be`. No trailing slash. */
    baseUrl: string;
    shopId: string;
    password: string;
    /** Defaults to `'de'`. Some endpoints (FindAccessZones) historically used `'en'` — overridable per call. */
    language?: string;
    /**
     * Either:
     *  - a fixed UUID string (default `STABLE_SESSION_ID`),
     *  - a factory `() => string` (use {@link uuidv4} for the voucher checkout flow).
     */
    sessionId?: string | (() => string);
    /** Inject a custom fetch (tests, MSW, undici). Default `globalThis.fetch`. */
    fetch?: FetchLike;
    /** Per-request timeout in milliseconds. Default `15000`. */
    timeoutMs?: number;
    /** Retry policy applied to every call. Default 3 attempts, 250ms backoff. */
    retry?: RetryOptions;
    /** Optional default DivisionId injected into every Context. */
    divisionId?: string;
    /** Optional document service base, defaults to `${baseUrl}/WebShopDocumentService.svc`. */
    documentServiceUrl?: string;
}
interface CallOptions {
    /** Override the language for this single call. */
    language?: string;
    /** Override the session-id for this single call. */
    sessionId?: string;
    /** Override request timeout for this single call. */
    timeoutMs?: number;
    /** Cancel-token. */
    signal?: AbortSignal;
    /** Disable retries for this call. */
    noRetry?: boolean;
}
declare class ReCreateXClient {
    readonly options: Required<Pick<ReCreateXClientOptions, 'baseUrl' | 'shopId' | 'password' | 'language' | 'timeoutMs'>> & ReCreateXClientOptions;
    private readonly _fetch;
    readonly articles: ArticlesModule;
    readonly expositions: ExpositionsModule;
    readonly general: GeneralModule;
    readonly manager: ManagerModule;
    readonly documents: DocumentsModule;
    constructor(opts: ReCreateXClientOptions);
    /** Build a fresh Context for a call, honouring per-call overrides. */
    buildContext(overrides?: {
        language?: string;
        sessionId?: string;
    }): RecreatexContext;
    /**
     * Low-level POST. Builds the URL as `${baseUrl}/${path}/`, injects Context,
     * applies timeout + retry, and parses JSON. Throws {@link RecreatexHttpError},
     * {@link RecreatexApiError}, or {@link RecreatexTimeoutError}.
     *
     * @internal Used by the module classes; exposed for advanced callers.
     */
    post<TResponse extends RecreatexEnvelope = RecreatexEnvelope>(path: string, body: Record<string, unknown>, callOpts?: CallOptions): Promise<TResponse>;
    /** Low-level GET — only used by the document service for binary downloads. */
    getBinary(url: string, callOpts?: CallOptions): Promise<Blob>;
}

export { type FindPersonCriteria as $, type AccessZone as A, type Basket as B, type CallOptions as C, type CancelOrganisedVisitInput as D, type CancelOrganisedVisitResult as E, type CheckoutResponse as F, type CheckoutResult as G, type Division as H, DocumentsModule as I, type Exposition as J, type ExpositionDayOverview as K, type ExpositionPeriod as L, type ExpositionPeriodDate as M, type ExpositionPeriodPrice as N, type ExpositionPeriodRef as O, type ExpositionPeriodReservationEntry as P, type ExpositionPeriodReservationItem as Q, type RecreatexContext as R, ExpositionsModule as S, type FetchLike as T, type FindAccessZonesCriteria as U, type FindArticleSalesOrdersCriteria as V, type FindArticlesCriteria as W, type FindExpositionsCriteria as X, type Ymd as Y, type FindGiftCertificatesCriteria as Z, type FindOrganisedVisitsCriteria as _, type RecreatexDateTime as a, type FindSalesCriteria as a0, GeneralModule as a1, type GetRebookingCostsInput as a2, type GiftCertificate as a3, type GiftCertificatePdfRequest as a4, ManagerModule as a5, type OrganisedVisit as a6, type OrganisedVisitArticle as a7, type OrganisedVisitPeriodReservation as a8, type OrganisedVisitPeriodTransfer as a9, isRetryableError as aA, paginate as aB, paginateIter as aC, withRetry as aD, type OrganisedVisitPerson as aa, type OrganisedVisitPersonAddress as ab, type OrganisedVisitRebookingItem as ac, type OrganisedVisitSaleAdjustment as ad, type OrganisedVisitSaleGuest as ae, type OrganisedVisitSaleInfo as af, type OrganisedVisitTicketAdjustment as ag, type PaginateOptions as ah, type Paging as ai, type PaymentMethod as aj, type Person as ak, type PersonAddress as al, type PersonCredential as am, type PointOfSale as an, ReCreateXClient as ao, type ReCreateXClientOptions as ap, type Reader as aq, type RecreatexEnvelope as ar, type RetryOptions as as, type Sale as at, type SaleLine as au, type SalePaymentLine as av, type SalesInformationCriteria as aw, type SalesInformationEntry as ax, type VisitingCustomersCriteria as ay, type VisitingCustomersEntry as az, type AccessZoneOccupancy as b, type AccessZoneReader as c, type AdjustOrganisedVisitInput as d, type AnonymousPerson as e, type Article as f, type ArticleGroup as g, type ArticleGroupRef as h, type ArticlePriceInformation as i, type ArticlePriceInformationCriteria as j, type ArticleSaleItem as k, type ArticleSalesHistoryBucket as l, type ArticleSalesHistoryGroup as m, type ArticleSalesMatchMode as n, type ArticleSalesOrder as o, type ArticleSalesOrderType as p, type ArticleSalesReport as q, type ArticleSalesReportCriteria as r, type ArticleSalesReportLine as s, type ArticleVat as t, ArticlesModule as u, type BasketItem as v, type BasketPayment as w, type BasketTypeString as x, BasketTypeStrings as y, type BasketValidationResult as z };
