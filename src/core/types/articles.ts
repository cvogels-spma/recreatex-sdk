/**
 * Article catalogue types.
 *
 * Source: live captures from `Articles/FindArticles` against the Space Magic
 * shop. Only fields verified to be populated are typed strictly; the rest
 * are loose `unknown`/optional.
 */

export interface ArticleVat {
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
export interface Article {
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

export interface ArticleGroupRef {
  id: string;
  code?: string;
  name?: string;
}

export interface ArticleGroup {
  id: string;
  code?: string;
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}

/** Search input for `Articles/FindArticles`. */
export interface FindArticlesCriteria {
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

export interface ArticlePriceInformationCriteria {
  articleId: string;
  customerId?: string;
}

export interface ArticlePriceInformation {
  totalPrice?: number;
  priceGroup?: string | null;
  familyComposition?: string | null;
  subsidizationPrice?: string | number | null;
  additionSupplementPrice?: number | null;
  donationPrice?: number | null;
  [extra: string]: unknown;
}

export type ArticleSalesOrderType =
  | 'All'
  | 'Sales'
  | 'Warranty'
  | 'WaitingList'
  | 'Service'
  | 'ChipKnip'
  | 'LessonGroup'
  | 'Purchase'
  | 'PriceGroup'
  | 'Credit'
  | 'Rental'
  | 'Subscription'
  | 'PurchaseCredit'
  | 'Family'
  | 'GiftCertificate'
  | 'ConsumptionCoupon'
  | 'FollowUp'
  | 'SpendingCredit'
  | 'ETicket';

/** Search input for `Articles/FindArticleSalesOrders`. */
export interface FindArticleSalesOrdersCriteria {
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
export interface ArticleSalesOrder {
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

export type ArticleSalesHistoryGroup = 'day' | 'month';

export type ArticleSalesMatchMode = 'exact' | 'includes';

export interface ArticleSalesReportCriteria {
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

export interface ArticleSalesReportLine {
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

export interface ArticleSalesHistoryBucket {
  period: string;
  quantity: number;
  totalPrice: number;
  lineCount: number;
  averageUnitPrice: number | null;
}

export interface ArticleSalesReport {
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
