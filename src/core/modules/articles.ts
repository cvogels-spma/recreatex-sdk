/**
 * Articles namespace.
 *
 * Endpoints:
 *  - `Articles/FindArticles`                → list/search article catalogue
 *  - `Articles/ListArticleGroups`            → article-group taxonomy
 *  - `Articles/GetArticlePriceInformation`   → detailed price info
 *  - `Articles/FindArticleSalesOrders`       → sold article history
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type {
  Article,
  ArticleGroup,
  ArticlePriceInformation,
  ArticlePriceInformationCriteria,
  ArticleSalesHistoryBucket,
  ArticleSalesReport,
  ArticleSalesReportCriteria,
  ArticleSalesReportLine,
  ArticleSalesOrder,
  FindArticlesCriteria,
  FindArticleSalesOrdersCriteria,
} from '../types/articles.js';
import { paginate, type PaginateOptions } from '../helpers/pagination.js';

interface FindArticlesResponse {
  articles?: Article[];
  result?: { articles?: Article[] };
  succes?: boolean;
  message?: string;
}

interface ListArticleGroupsResponse {
  articleGroups?: ArticleGroup[];
  succes?: boolean;
  message?: string;
}

interface GetArticlePriceInformationResponse {
  articlePriceInformation?: ArticlePriceInformation;
  ArticlePriceInformation?: ArticlePriceInformation;
  result?: {
    articlePriceInformation?: ArticlePriceInformation;
    ArticlePriceInformation?: ArticlePriceInformation;
  };
  succes?: boolean;
  message?: string;
}

interface FindArticleSalesOrdersResponse {
  articleSalesOrders?: ArticleSalesOrder[];
  ArticleSalesOrders?: ArticleSalesOrder[];
  result?: {
    articleSalesOrders?: ArticleSalesOrder[];
    ArticleSalesOrders?: ArticleSalesOrder[];
  };
  succes?: boolean;
  message?: string;
}

export class ArticlesModule {
  constructor(private readonly client: ReCreateXClient) {}

  /**
   * Fetch a single page of articles. Use {@link findArticles} for auto-pagination.
   */
  async findArticlesPage(
    criteria: FindArticlesCriteria = {},
    callOpts?: CallOptions,
  ): Promise<Article[]> {
    const SearchCriteria: Record<string, unknown> = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 50,
      },
      Includes: {
        Price: criteria.includes?.price ?? true,
        ImageUrl: criteria.includes?.imageUrl ?? true,
        ...(criteria.includes?.image !== undefined && { Image: criteria.includes.image }),
        ...(criteria.includes?.group !== undefined && { Group: criteria.includes.group }),
        Vat: criteria.includes?.vat ?? true,
        ...(criteria.includes?.stock !== undefined && { Stock: criteria.includes.stock }),
        ...(criteria.includes?.barcodes !== undefined && { Barcodes: criteria.includes.barcodes }),
        ...(criteria.includes?.activePeriods !== undefined && { ActivePeriods: criteria.includes.activePeriods }),
        ...(criteria.includes?.articleCategories !== undefined && { ArticleCategories: criteria.includes.articleCategories }),
        ...(criteria.includes?.soldOutArticles !== undefined && { SoldOutArticles: criteria.includes.soldOutArticles }),
        ...(criteria.includes?.saleArticles !== undefined && { SaleArticles: criteria.includes.saleArticles }),
        ...(criteria.includes?.rentArticles !== undefined && { RentArticles: criteria.includes.rentArticles }),
        ...(criteria.includes?.freeArticles !== undefined && { FreeArticles: criteria.includes.freeArticles }),
        Translations: criteria.includes?.translations ?? false,
        ...(criteria.includes?.priceInfo !== undefined && { PriceInfo: criteria.includes.priceInfo }),
      },
    };
    if (criteria.articleId) SearchCriteria.ArticleID = criteria.articleId;
    if (criteria.articleGroupId) SearchCriteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;
    if (criteria.code) SearchCriteria.Code = criteria.code;
    if (criteria.barcode) SearchCriteria.Barcode = criteria.barcode;
    if (criteria.divisionId) SearchCriteria.DivisionId = criteria.divisionId;
    if (criteria.includeDetail !== undefined) SearchCriteria.IncludeDetail = criteria.includeDetail;
    if (criteria.stockLocationId) SearchCriteria.StockLocationId = criteria.stockLocationId;
    if (criteria.articleCategoryId) SearchCriteria.ArticleCategoryId = criteria.articleCategoryId;
    if (criteria.forVouchers !== undefined) SearchCriteria.ForVouchers = criteria.forVouchers;
    if (criteria.ignoreActivePeriodsFilter !== undefined) {
      SearchCriteria.IgnoreActivePeriodsFilter = criteria.ignoreActivePeriodsFilter;
    }

    const data = await this.client.post<FindArticlesResponse>(
      'Json/Articles/FindArticles',
      { SearchCriteria },
      callOpts ?? {},
    );
    return data.result?.articles ?? data.articles ?? [];
  }

  /**
   * Fetch all articles matching the criteria. Pages internally.
   *
   * @example
   *   const vouchers = await client.articles.findArticles({ namePattern: 'Gutschein' });
   */
  async findArticles(
    criteria: FindArticlesCriteria = {},
    paginateOpts: PaginateOptions = {},
    callOpts?: CallOptions,
  ): Promise<Article[]> {
    const pageOptions: PaginateOptions = {
      pageSize: criteria.pageSize ?? 50,
      ...paginateOpts,
    };
    return paginate(
      ({ pageIndex, pageSize }) =>
        this.findArticlesPage({ ...criteria, pageIndex, pageSize }, callOpts),
      pageOptions,
    );
  }

  /** Fetch a single article by GUID. */
  async findArticleById(articleId: string, callOpts?: CallOptions): Promise<Article | undefined> {
    const articles = await this.findArticlesPage(
      {
        articleId,
        pageSize: 1,
        includes: { price: true, imageUrl: true, vat: true, group: true },
      },
      callOpts,
    );
    return articles[0];
  }

  /** List all article groups (e.g. F&B categories, voucher types). */
  async listArticleGroups(callOpts?: CallOptions): Promise<ArticleGroup[]> {
    const data = await this.client.post<ListArticleGroupsResponse>(
      'Json/Articles/ListArticleGroups',
      {},
      callOpts ?? {},
    );
    return data.articleGroups ?? [];
  }

  /** Detailed price information for an article, optionally customer-specific. */
  async getArticlePriceInformation(
    criteria: ArticlePriceInformationCriteria,
    callOpts?: CallOptions,
  ): Promise<ArticlePriceInformation | undefined> {
    const SearchCriteria: Record<string, unknown> = { ArticleId: criteria.articleId };
    if (criteria.customerId) SearchCriteria.CustomerId = criteria.customerId;

    const data = await this.client.post<GetArticlePriceInformationResponse>(
      'Json/Articles/GetArticlePriceInformation',
      { SearchCriteria },
      callOpts ?? {},
    );
    return (
      data.articlePriceInformation ??
      data.ArticlePriceInformation ??
      data.result?.articlePriceInformation ??
      data.result?.ArticlePriceInformation
    );
  }

  /** Fetch a single page of historical sold article lines. */
  async findArticleSalesOrdersPage(
    criteria: FindArticleSalesOrdersCriteria = {},
    callOpts?: CallOptions,
  ): Promise<ArticleSalesOrder[]> {
    const SearchCriteria: Record<string, unknown> = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 200,
      },
    };
    if (criteria.id) SearchCriteria.Id = criteria.id;
    if (criteria.personId) SearchCriteria.PersonId = criteria.personId;
    if (criteria.from) SearchCriteria.From = criteria.from;
    if (criteria.until) SearchCriteria.Until = criteria.until;
    if (criteria.type !== undefined) SearchCriteria.Type = encodeArticleSalesOrderType(criteria.type);

    const data = await this.client.post<FindArticleSalesOrdersResponse>(
      'Json/Articles/FindArticleSalesOrders',
      { SearchCriteria },
      callOpts ?? {},
    );
    return (
      data.articleSalesOrders ??
      data.ArticleSalesOrders ??
      data.result?.articleSalesOrders ??
      data.result?.ArticleSalesOrders ??
      []
    );
  }

  /** Fetch all historical sold article lines matching the criteria. */
  async findArticleSalesOrders(
    criteria: FindArticleSalesOrdersCriteria = {},
    paginateOpts: PaginateOptions = {},
    callOpts?: CallOptions,
  ): Promise<ArticleSalesOrder[]> {
    const pageOptions: PaginateOptions = {
      pageSize: criteria.pageSize ?? 200,
      ...paginateOpts,
    };
    return paginate(
      ({ pageIndex, pageSize }) =>
        this.findArticleSalesOrdersPage({ ...criteria, pageIndex, pageSize }, callOpts),
      pageOptions,
    );
  }

  /**
   * Article dossier: current catalogue/price data plus sold quantity,
   * revenue and a day/month history for a single article.
   */
  async getArticleSalesReport(
    criteria: ArticleSalesReportCriteria,
    paginateOpts: PaginateOptions = {},
    callOpts?: CallOptions,
  ): Promise<ArticleSalesReport> {
    const article = await this.resolveReportArticle(criteria, callOpts);
    const articleId = criteria.articleId ?? article?.id;
    const matchMode = criteria.matchMode ?? 'exact';
    const sales = await this.findArticleSalesOrders(
      {
        from: criteria.from,
        until: criteria.until,
        personId: criteria.personId,
        type: criteria.type ?? 'Sales',
        pageSize: criteria.pageSize ?? 200,
      },
      paginateOpts,
      callOpts,
    );
    const lines = sales
      .filter((line) => matchesArticleSalesOrder(line, { article, articleId, criteria, matchMode }))
      .map(toReportLine);

    const totals = summarizeLines(lines);
    const history = groupLines(lines, criteria.historyGroup ?? 'day');
    const priceInfo = articleId
      ? await this.getArticlePriceInformation({ articleId }, callOpts)
      : undefined;

    const report: ArticleSalesReport = {
      ...(article && { article }),
      ...(articleId && { articleId }),
      currentPrice: article?.price ?? priceInfo?.totalPrice ?? null,
      ...(priceInfo && { priceInfo }),
      from: criteria.from,
      until: criteria.until,
      matchMode,
      totals,
      history,
    };
    if (criteria.includeLines ?? true) report.lines = lines;
    return report;
  }

  private async resolveReportArticle(
    criteria: ArticleSalesReportCriteria,
    callOpts?: CallOptions,
  ): Promise<Article | undefined> {
    if (criteria.articleId) {
      return this.findArticleById(criteria.articleId, callOpts);
    }
    if (!criteria.code && !criteria.namePattern) return undefined;

    const matches = await this.findArticles(
      {
        code: criteria.code,
        namePattern: criteria.namePattern,
        divisionId: criteria.divisionId,
        includes: { price: true, imageUrl: true, vat: true, group: true },
      },
      { pageSize: criteria.pageSize ?? 50, maxPages: 5 },
      callOpts,
    );
    if (matches.length === 0) {
      throw new Error('Article sales report: no article matched the given criteria');
    }
    if (criteria.code) {
      const exactCode = matches.find((a) => same(a.code, criteria.code));
      if (exactCode) return exactCode;
    }
    if (criteria.namePattern) {
      const exactName = matches.filter((a) => same(a.name, criteria.namePattern));
      if (exactName.length === 1) return exactName[0];
    }
    if (matches.length === 1) return matches[0];

    const labels = matches.slice(0, 5).map((a) => `${a.code || '?'} · ${a.name}`).join(', ');
    throw new Error(
      `Article sales report: multiple articles matched; narrow by code or articleId (${labels})`,
    );
  }
}

function same(a: string | undefined, b: string | undefined): boolean {
  return normalize(a) === normalize(b);
}

function normalize(v: string | undefined): string {
  return (v ?? '').trim().toLocaleLowerCase('de-DE');
}

const ARTICLE_SALES_ORDER_TYPE_VALUES: Record<string, number> = {
  All: 0,
  Sales: 1,
  Warranty: 2,
  WaitingList: 3,
  Service: 4,
  ChipKnip: 5,
  LessonGroup: 6,
  Purchase: 7,
  PriceGroup: 8,
  Credit: 9,
  Rental: 10,
  Subscription: 11,
  PurchaseCredit: 12,
  Family: 13,
  GiftCertificate: 14,
  ConsumptionCoupon: 15,
  FollowUp: 16,
  SpendingCredit: 17,
  ETicket: 18,
};

function encodeArticleSalesOrderType(type: string | number): string | number {
  return typeof type === 'string' ? ARTICLE_SALES_ORDER_TYPE_VALUES[type] ?? type : type;
}

function matchesArticleSalesOrder(
  line: ArticleSalesOrder,
  opts: {
    article?: Article;
    articleId?: string;
    criteria: ArticleSalesReportCriteria;
    matchMode: 'exact' | 'includes';
  },
): boolean {
  const lineArticleId = readString(line, 'articleId', 'ArticleId', 'ArticleID') ?? readNestedId(line, 'article', 'Article');
  if (opts.articleId && lineArticleId && same(lineArticleId, opts.articleId)) return true;

  const lineCode =
    readString(line, 'articleCode', 'code', 'Code') ??
    readNestedString(line, ['article', 'Article'], ['code', 'Code']);
  if (opts.article?.code && lineCode && same(lineCode, opts.article.code)) return true;
  if (opts.criteria.code && lineCode && same(lineCode, opts.criteria.code)) return true;

  const description = normalize(
    readString(line, 'description', 'Description', 'articleName', 'name', 'Name') ??
      readNestedString(line, ['article', 'Article'], ['name', 'Name']) ??
      '',
  );
  const articleName = normalize(opts.article?.name ?? opts.criteria.namePattern);
  if (!articleName || !description) return false;
  return opts.matchMode === 'includes'
    ? description.includes(articleName)
    : description === articleName;
}

function toReportLine(line: ArticleSalesOrder): ArticleSalesReportLine {
  const quantity = readNumber(line, 'quantity', 'Quantity') ?? 0;
  const unitPrice = readNumber(line, 'unitPrice', 'UnitPrice') ?? 0;
  const totalPrice = readNumber(line, 'totalPrice', 'TotalPrice') ?? round2(quantity * unitPrice);
  const out: ArticleSalesReportLine = {
    saleLineId: readString(line, 'id', 'Id') ?? '',
    date: readString(line, 'date', 'Date') ?? '',
    description: readString(line, 'description', 'Description') ?? '',
    quantity,
    unitPrice,
    totalPrice,
  };
  const personId = readString(line, 'personId', 'PersonId');
  if (personId !== undefined) out.personId = personId;
  const number = readNumber(line, 'number', 'Number');
  if (number !== undefined) out.number = number;
  const sequenceNumber = readNumber(line, 'sequenceNumber', 'SequenceNumber');
  if (sequenceNumber !== undefined) out.sequenceNumber = sequenceNumber;
  return out;
}

function summarizeLines(lines: ArticleSalesReportLine[]): ArticleSalesReport['totals'] {
  const quantity = round2(lines.reduce((sum, line) => sum + line.quantity, 0));
  const totalPrice = round2(lines.reduce((sum, line) => sum + line.totalPrice, 0));
  return {
    quantity,
    totalPrice,
    lineCount: lines.length,
    averageUnitPrice: quantity > 0 ? round2(totalPrice / quantity) : null,
  };
}

function groupLines(
  lines: ArticleSalesReportLine[],
  group: 'day' | 'month',
): ArticleSalesHistoryBucket[] {
  const buckets = new Map<string, ArticleSalesReportLine[]>();
  for (const line of lines) {
    const period = group === 'month' ? line.date.slice(0, 7) : line.date.slice(0, 10);
    const existing = buckets.get(period) ?? [];
    existing.push(line);
    buckets.set(period, existing);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, bucket]) => ({ period, ...summarizeLines(bucket) }));
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function readNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

function readNestedId(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      const id = readString(value as Record<string, unknown>, 'id', 'Id', 'ID');
      if (id) return id;
    }
  }
  return undefined;
}

function readNestedString(
  obj: Record<string, unknown>,
  objectKeys: string[],
  valueKeys: string[],
): string | undefined {
  for (const objectKey of objectKeys) {
    const value = obj[objectKey];
    if (value && typeof value === 'object') {
      const found = readString(value as Record<string, unknown>, ...valueKeys);
      if (found) return found;
    }
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
