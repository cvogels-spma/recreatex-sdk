import { O as OrganisedVisitTicketAdjustment, a as OrganisedVisitSaleAdjustment, E as Exposition, b as ExpositionPeriodDate, Y as Ymd, c as ExpositionDayOverview, d as ExpositionPeriodRef, F as FindOrganisedVisitsCriteria, e as OrganisedVisit, f as OrganisedVisitPeriodTransfer, R as RecreatexDateTime, B as Basket, g as BasketItem, C as CheckoutResponse, h as RecreatexContext, i as RecreatexEnvelope } from './basket--qI8o_rw.js';
export { A as AnonymousPerson, j as ArticleSaleItem, k as BasketPayment, l as BasketTypeString, m as BasketTypeStrings, n as BasketValidationResult, o as CheckoutResult, p as ExpositionPeriod, q as ExpositionPeriodPrice, r as ExpositionPeriodReservationEntry, s as ExpositionPeriodReservationItem, t as OrganisedVisitArticle, u as OrganisedVisitPeriodReservation, v as OrganisedVisitPerson, w as OrganisedVisitPersonAddress, x as OrganisedVisitRebookingItem, y as OrganisedVisitSaleGuest, z as OrganisedVisitSaleInfo, P as Paging } from './basket--qI8o_rw.js';

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
    /** Substring match on article name. */
    namePattern?: string;
    /** Exact code match. */
    code?: string;
    /** Restrict to a division (e.g. `DIVISION_IDS.spaceMagic`). */
    divisionId?: string;
    /** Page index/size; SDK's `paginate: 'auto'` mode iterates these for you. */
    pageIndex?: number;
    pageSize?: number;
    includes?: {
        price?: boolean;
        imageUrl?: boolean;
        vat?: boolean;
        translations?: boolean;
        priceInfo?: boolean;
    };
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
 *  - `Articles/FindArticles`     → list/search article catalogue
 *  - `Articles/ListArticleGroups` → article-group taxonomy
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
    /** List all article groups (e.g. F&B categories, voucher types). */
    listArticleGroups(callOpts?: CallOptions): Promise<ArticleGroup[]>;
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

export { type AccessZone, type AccessZoneOccupancy, type AccessZoneReader, type AdjustOrganisedVisitInput, type Article, type ArticleGroup, type ArticleGroupRef, type ArticleVat, ArticlesModule, Basket, BasketItem, type CallOptions, type CancelOrganisedVisitInput, type CancelOrganisedVisitResult, CheckoutResponse, type ContextOptions, type Division, DocumentsModule, Exposition, ExpositionDayOverview, ExpositionPeriodDate, ExpositionPeriodRef, ExpositionsModule, type FetchLike, type FindAccessZonesCriteria, type FindArticlesCriteria, type FindExpositionsCriteria, type FindGiftCertificatesCriteria, FindOrganisedVisitsCriteria, type FindPersonCriteria, type FindSalesCriteria, GeneralModule, type GetRebookingCostsInput, type GiftCertificate, type GiftCertificatePdfRequest, ManagerModule, OrganisedVisit, OrganisedVisitPeriodTransfer, OrganisedVisitSaleAdjustment, OrganisedVisitTicketAdjustment, type PaginateOptions, type PaymentMethod, type Person, type PersonAddress, type PersonCredential, type PointOfSale, ReCreateXClient, type ReCreateXClientOptions, type Reader, RecreatexApiError, RecreatexContext, RecreatexDateTime, RecreatexEnvelope, RecreatexError, RecreatexHttpError, RecreatexTimeoutError, type RetryOptions, STABLE_SESSION_ID, type Sale, type SaleLine, type SalePaymentLine, type SalesInformationCriteria, type SalesInformationEntry, type VisitingCustomersCriteria, type VisitingCustomersEntry, Ymd, buildContext, dayRangeDotted, dayRangeIso, isRetryableError, paginate, paginateIter, todayYmd, uuidv4, withRetry, ymd, ymdWindow };
