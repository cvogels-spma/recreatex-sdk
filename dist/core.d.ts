import { O as OrganisedVisitTicketAdjustment, a as OrganisedVisitSaleAdjustment, E as Exposition, b as ExpositionPeriodDate, Y as Ymd, c as ExpositionDayOverview, d as ExpositionPeriodRef, F as FindOrganisedVisitsCriteria, e as OrganisedVisit, f as OrganisedVisitPeriodTransfer, g as FindAccessZonesCriteria, A as AccessZone, R as Reader, D as Division, P as PointOfSale, h as PaymentMethod, i as FindPersonCriteria, j as Person, k as FindSalesCriteria, l as FindSalesPaging, S as Sale, B as Basket, m as BasketItem, C as CheckoutResponse, n as FindGiftCertificatesCriteria, G as GiftCertificate, o as FindPersonCardsCriteria, p as PersonCard, q as GetDigitalWalletsCriteria, r as DigitalWallet, s as DigitalWalletIncludes, t as RecreatexDateTime, u as RecreatexContext, v as RecreatexEnvelope, w as SaleLine } from './basket-DB0OLSPh.js';
export { x as AccessZoneOccupancy, y as AccessZoneReader, z as AnonymousPerson, H as ArticleSaleItem, I as BasketPayment, J as BasketTypeString, K as BasketTypeStrings, L as BasketValidationResult, M as CheckoutResult, N as DigitalWalletTransaction, Q as DivisionCard, T as ExpositionPeriod, U as ExpositionPeriodPrice, V as ExpositionPeriodReservationEntry, W as ExpositionPeriodReservationItem, X as OrganisedVisitArticle, Z as OrganisedVisitPeriodReservation, _ as OrganisedVisitPerson, $ as OrganisedVisitPersonAddress, a0 as OrganisedVisitRebookingItem, a1 as OrganisedVisitSaleGuest, a2 as OrganisedVisitSaleInfo, a3 as Paging, a4 as PersonAddress, a5 as PersonCredential, a6 as SalePaymentLine } from './basket-DB0OLSPh.js';

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
     *  ⚠⚠ **Auto-paginated since 2026-08-11, and that is a bug fix, not a feature.**
     *  This method used to send no `Paging` criterion and therefore returned only the
     *  first **ten** periods of the range — silently. See {@link listPeriodsPage} for
     *  what that cost. Callers keep their existing signature and simply get the whole
     *  day now.
     *
     * @param expositionId — the Exposition GUID.
     * @param fromIso — ISO datetime, e.g. `'2026-05-07T00:00:00'`.
     * @param untilIso — ISO datetime, e.g. `'2026-05-07T23:59:59'`.
     * @param callOpts — per-call transport options (timeout, retry, signal).
     * @param paginateOpts — page size / hard page cap. ⚠ Deliberately the **fifth**
     *   parameter rather than the fourth, unlike {@link findOrganisedVisits}:
     *   `CallOptions` and `PaginateOptions` both carry `signal`, so swapping their
     *   positions would let an existing `callOpts` argument slide into the paging slot
     *   and lose its timeout **without any type error**. Consistency is not worth a
     *   silent breakage.
     *
     * @example
     *   const periods = await client.expositions.listPeriods(
     *     'c9b017fe-fafc-ef11-9596-b28721114d72',
     *     '2026-05-07T00:00:00', '2026-05-07T23:59:59',
     *   );
     *   const slot = periods.find((p) => p.from === '2026-05-07T14:00:00');
     *   // → slot.id is the ExpositionPeriodId
     */
    listPeriods(expositionId: string, fromIso: string, untilIso: string, callOpts?: CallOptions, paginateOpts?: PaginateOptions): Promise<ExpositionPeriodRef[]>;
    /**
     * One page of Period entries.
     *
     * ⚠⚠ **`Paging` IS NOT OPTIONAL HERE — measured 2026-08-11.** Without a `Paging`
     * criterion `ListExpositionPeriods` silently returns only the **first ten**
     * periods of the range. It does not error, it does not say the result was cut,
     * and there is no total count in the response to notice it by.
     *
     * That cost real money. Space Magic's entry checkout resolves the guest's time
     * slot by matching `from` against this list. For 2026-08-11 the API holds **17**
     * periods (10:00 through 18:00); unpaginated it returned ten, ending at 14:30.
     * Every booking for a later slot was rejected with *"kein Zeitfenster mit Beginn
     * 15:00"* and fell back to a plain article sale — so those guests got a sale
     * without an `OrganisedVisit`, and their QR code does not open the till. The
     * operator was told to create the missing backoffice periods; they existed all
     * along.
     *
     * ⭐ The lesson generalises to this whole API: **a short answer is not a fact
     * about the data until you have checked that you asked for all of it.** Silent
     * caps look exactly like "nothing there". The number `10` is the tell.
     */
    listPeriodsPage(expositionId: string, fromIso: string, untilIso: string, paging?: {
        PageIndex: number;
        PageSize: number;
    }, callOpts?: CallOptions): Promise<ExpositionPeriodRef[]>;
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
 * General namespace.
 *
 * Endpoints:
 *  - `General/FindAccessZones`     → live occupancy + zone metadata
 *  - `General/GetReaders`          → all RFID/barcode readers
 *  - `General/ListDivisions`       → divisions (Space Magic, Webshop, Admin)
 *  - `General/GetPointOfSales`     → POS terminals
 *  - `General/ListPaymentMethods`  → 32 payment methods
 *  - `General/FindPerson`          → look up person records
 *  - `General/FindSales`           → low-level transactions (paginated, see findSales)
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
    /**
     * One page of `General/FindSales`.
     *
     * ⚠ The `Paging` object belongs INSIDE `Criteria`. Sent at the top level it is ignored,
     * and so is a request without it: either way Recreatex answers with its silent default of
     * TEN bons (the most recent ones of the window). Use {@link findSales} unless you stream.
     */
    findSalesPage(criteria: FindSalesCriteria, paging: FindSalesPaging, callOpts?: CallOptions): Promise<Sale[]>;
    /**
     * All bons of the window, paginated to completion.
     *
     * ⚠⚠ Regression guard, 2026-10-14. Up to v0.2.0 this method sent no `Paging` criterion and
     * returned only the latest TEN bons of the window, silently: on a Sunday with 187 bons and
     * 334 guests it answered with 10. That is where the old note "FindSales only returns a
     * subset (Nachzahlautomat, Checkins)" came from. With paging it returns every bon of the
     * check-in, Nachzahlautomat, Drehkreuz, Backoffice and Nachrutsche terminals. The F&B tills
     * and the QR order app are still NOT part of this endpoint (verified 2026-10-08 over 586
     * days); use `ManagerApp/ListSalesInformation` per article group for complete revenue.
     *
     * ⚠ Lines still come duplicated: run each bon through {@link dedupSaleLines}.
     *
     * ⚠ Reaching `maxPages` with a full last page THROWS instead of returning a truncated list.
     * A cut-off sales list looks exactly like a quiet day.
     *
     * @param paginateOpts page size (default 500) and hard page cap (default 200, i.e.
     *   100,000 bons). Fifth-parameter rule as in `listPeriods`: `CallOptions` and
     *   `PaginateOptions` both carry `signal`, so they are never swapped.
     */
    findSales(criteria: FindSalesCriteria, callOpts?: CallOptions, paginateOpts?: PaginateOptions): Promise<Sale[]>;
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
     * Look up cards (RFID wristbands, subscription cards, voucher cards).
     *
     * Probing showed that guessed names like `FindCards`, `GetCards`,
     * `FindCustomerCards`, `FindCardTransactions`, `GetCardBalance` and the
     * whole `Access/` and `Cards/` namespaces 404. ⚠ That list was GUESSED; the
     * server's own endpoint list (`/json/documentation`, 562 entries) has more
     * card-level calls: `GetCard`, `GetDigitalWallets`/`GetDigitalWallet` (the
     * money on a band, see {@link getDigitalWallets}) and
     * `Counter/GetCreditSalesByDivisionCard`. Check that list before concluding
     * something does not exist.
     *
     * ⚠ `card` is an object ({@link DivisionCard}), verified 2026-10-24.
     *
     * ⚠ This does NOT enumerate "currently inside the park". Live occupancy is
     * a counter on the access zone (`findAccessZones().occupancy`), and no
     * endpoint maps that count back to the individual bands behind it.
     *
     * @example
     *   const cards = await client.general.findPersonCards({ number: '1234' });
     */
    findPersonCards(criteria?: FindPersonCardsCriteria, callOpts?: CallOptions): Promise<PersonCard[]>;
    /**
     * The wallets of the wristbands: balance and (with `includes.transactions`)
     * the open postings (gastro and add-ons booked onto the band, `salesNo: 0`,
     * not paid yet). A negative `balance` is money that left the park unpaid, or
     * is still inside it.
     *
     * ⚠ Without `personId` this returns ALL wallets (one call; Space Magic
     * 2026-10-24: 3,090 wallets, 3.5 MB with transactions, 3–5 s). Hence the
     * default timeout of 60 s here. With `personId` only that customer's wallets.
     *
     * ⚠ Use `balance` for money, not a sum over transaction lines (see
     * {@link DigitalWalletTransaction}).
     *
     * ⚠ Does NOT say which bands are inside the park.
     *
     * @example
     *   const wallets = await rx.general.getDigitalWallets({ includes: { transactions: true } });
     *   const owed = wallets.filter((w) => w.balance < 0);
     */
    getDigitalWallets(criteria?: GetDigitalWalletsCriteria, callOpts?: CallOptions): Promise<DigitalWallet[]>;
    /**
     * The wallet of one wristband, by its card number (e.g. the Gantner UID
     * `048363CA801D91`). `null` for an unknown number (verified 2026-10-24).
     */
    getDigitalWallet(cardNumber: string, includes?: DigitalWalletIncludes, callOpts?: CallOptions): Promise<DigitalWallet | null>;
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

/**
 * Helpers for `General/FindSales` bons.
 */

/**
 * The lines of a bon, deduplicated by line `id`.
 *
 * ⚠⚠ Recreatex returns the SAME line several times (identical `id`, `sequenceNumber` and
 * amount), mostly on booking-bound lines (`mainOrganisedVisitId`). One production month read
 * 284,934.70 € instead of 200,237.10 € before deduplication. Every evaluation of bon lines
 * goes through this helper.
 *
 * Lines WITHOUT an `id` are kept as they are: one line too many is a smaller error than a
 * real position that silently disappears.
 */
declare function dedupSaleLines(sale: Pick<Sale, 'lines'>): SaleLine[];

export { AccessZone, type AdjustOrganisedVisitInput, type Article, type ArticleGroup, type ArticleGroupRef, type ArticlePriceInformation, type ArticlePriceInformationCriteria, type ArticleSalesHistoryBucket, type ArticleSalesHistoryGroup, type ArticleSalesMatchMode, type ArticleSalesOrder, type ArticleSalesOrderType, type ArticleSalesReport, type ArticleSalesReportCriteria, type ArticleSalesReportLine, type ArticleVat, ArticlesModule, Basket, BasketItem, type CallOptions, type CancelOrganisedVisitInput, type CancelOrganisedVisitResult, CheckoutResponse, type ContextOptions, DigitalWallet, DigitalWalletIncludes, Division, DocumentsModule, Exposition, ExpositionDayOverview, ExpositionPeriodDate, ExpositionPeriodRef, ExpositionsModule, type FetchLike, FindAccessZonesCriteria, type FindArticleSalesOrdersCriteria, type FindArticlesCriteria, type FindExpositionsCriteria, FindGiftCertificatesCriteria, FindOrganisedVisitsCriteria, FindPersonCardsCriteria, FindPersonCriteria, FindSalesCriteria, FindSalesPaging, GeneralModule, GetDigitalWalletsCriteria, type GetRebookingCostsInput, GiftCertificate, type GiftCertificatePdfRequest, ManagerModule, OrganisedVisit, OrganisedVisitPeriodTransfer, OrganisedVisitSaleAdjustment, OrganisedVisitTicketAdjustment, type PaginateOptions, PaymentMethod, Person, PersonCard, PointOfSale, ReCreateXClient, type ReCreateXClientOptions, Reader, RecreatexApiError, RecreatexContext, RecreatexDateTime, RecreatexEnvelope, RecreatexError, RecreatexHttpError, RecreatexTimeoutError, type RetryOptions, STABLE_SESSION_ID, Sale, SaleLine, type SalesInformationCriteria, type SalesInformationEntry, type VisitingCustomersCriteria, type VisitingCustomersEntry, Ymd, buildContext, dayRangeDotted, dayRangeIso, dedupSaleLines, isRetryableError, paginate, paginateIter, todayYmd, uuidv4, withRetry, ymd, ymdWindow };
