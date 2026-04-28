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
