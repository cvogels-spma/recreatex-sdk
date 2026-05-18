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

import type { Article, ArticleSalesOrder, CallOptions, ReCreateXClient, Ymd } from '../core/index.js';

export const GASTRO_GROUP_MAP: ReadonlyMap<string, string> = new Map([
  ['d33c73eb-22ab-ef11-9595-9a21964517de', 'Alkohol'],
  ['cc3c73eb-22ab-ef11-9595-9a21964517de', 'Burger'],
  ['cb3c73eb-22ab-ef11-9595-9a21964517de', 'Fingerfood'],
  ['b2bbfab5-1019-f011-9596-b28721114d72', 'Heißgetränke'],
  ['01440a27-e67c-f011-9596-b28721114d72', 'Kuchen/Gebäck'],
  ['d03c73eb-22ab-ef11-9595-9a21964517de', 'Milchreis'],
  ['c83c73eb-22ab-ef11-9595-9a21964517de', 'Nudeln'],
  ['d13c73eb-22ab-ef11-9595-9a21964517de', 'Obst'],
  ['ce3c73eb-22ab-ef11-9595-9a21964517de', 'Pfannkuchen'],
  ['ca3c73eb-22ab-ef11-9595-9a21964517de', 'Pizza'],
  ['cf3c73eb-22ab-ef11-9595-9a21964517de', 'Salat'],
  ['ffa9dc4b-048f-f011-9596-b28721114d72', 'Soft Drinks Empf.'],
  ['d43c73eb-22ab-ef11-9595-9a21964517de', 'Softdrinks'],
  ['159d138d-f520-f011-9596-b28721114d72', 'Suppen'],
  ['d23c73eb-22ab-ef11-9595-9a21964517de', 'Süßigkeiten'],
  ['cf1ef454-5f8d-f011-9596-b28721114d72', 'Süßigkeiten Empf.'],
  ['cd3c73eb-22ab-ef11-9595-9a21964517de', 'Würstchen'],
]);

/** Look up the human label for an articleGroupID; returns the UUID itself if unknown. */
export function gastroGroupName(articleGroupId: string | null | undefined): string {
  if (!articleGroupId) return 'Unbekannt';
  return GASTRO_GROUP_MAP.get(articleGroupId) ?? articleGroupId;
}

/** True if the given articleGroupID is mapped as a gastro category. */
export function isGastroGroup(articleGroupId: string | null | undefined): boolean {
  return !!articleGroupId && GASTRO_GROUP_MAP.has(articleGroupId);
}

export interface ListGastroArticlesOptions {
  /** Optional division filter, e.g. `DIVISION_IDS.spaceMagic`. */
  divisionId?: string;
  /** Fetch options/barcodes/stock detail too. Defaults to false. */
  includeDetail?: boolean;
  /** Include groups even when Recreatex returns no articles for them. */
  includeEmptyGroups?: boolean;
  /** Forwarded to `FindArticles.IgnoreActivePeriodsFilter`. */
  ignoreActivePeriodsFilter?: boolean;
  /** Page size for each `FindArticles` group query. Defaults to 200. */
  pageSize?: number;
}

export interface GastroArticleCatalogItem {
  groupId: string;
  groupName: string;
  id: string;
  code: string;
  name: string;
  price: number;
  vatPercentage?: number;
  imageUrl?: string | null;
  article: Article;
}

export interface GastroArticleCatalogGroup {
  groupId: string;
  groupName: string;
  articles: GastroArticleCatalogItem[];
}

export interface SyncGastroSalesOptions extends ListGastroArticlesOptions {
  fromYmd: Ymd;
  untilYmd: Ymd;
  articleIds?: string[];
  articleCodes?: string[];
  /** Defaults to false to avoid double-counting duplicated names like Coca Cola. */
  includeAmbiguousDescriptionMatches?: boolean;
  /** Include all non-gastro / unmatched sales lines in `issues`. Defaults to false. */
  includeUnmatchedIssues?: boolean;
  /** Max Recreatex pages per day for `FindArticleSalesOrders`. Defaults to 100. */
  maxPagesPerDay?: number;
}

export interface GastroSalesSyncRow {
  date: Ymd;
  groupId: string;
  groupName: string;
  articleId: string;
  code: string;
  name: string;
  cataloguePrice: number;
  quantity: number;
  totalPrice: number;
  lineCount: number;
  averageUnitPrice: number | null;
}

export interface GastroSalesSyncIssue {
  date: Ymd;
  description: string;
  quantity: number;
  totalPrice: number;
  reason: 'unmatched' | 'ambiguous-description';
  candidateArticleIds?: string[];
}

export interface GastroSalesSyncResult {
  fromYmd: Ymd;
  untilYmd: Ymd;
  articleCount: number;
  rows: GastroSalesSyncRow[];
  totals: {
    quantity: number;
    totalPrice: number;
    lineCount: number;
    averageUnitPrice: number | null;
  };
  issues: GastroSalesSyncIssue[];
}

/**
 * Fetch all known Space Magic gastro articles from Recreatex, grouped by the
 * article groups used in the KPI dashboard.
 */
export async function listGastroArticles(
  client: Pick<ReCreateXClient, 'articles'>,
  options: ListGastroArticlesOptions = {},
  callOpts?: CallOptions,
): Promise<GastroArticleCatalogGroup[]> {
  const groups = await Promise.all(
    [...GASTRO_GROUP_MAP.entries()].map(async ([groupId, groupName]) => {
      const articles = await client.articles.findArticles(
        {
          articleGroupId: groupId,
          ...(options.divisionId && { divisionId: options.divisionId }),
          ...(options.includeDetail !== undefined && { includeDetail: options.includeDetail }),
          ...(options.ignoreActivePeriodsFilter !== undefined && {
            ignoreActivePeriodsFilter: options.ignoreActivePeriodsFilter,
          }),
          pageSize: options.pageSize ?? 200,
          includes: {
            price: true,
            imageUrl: true,
            group: true,
            vat: true,
            ...(options.includeDetail && { barcodes: true, stock: true }),
          },
        },
        { pageSize: options.pageSize ?? 200 },
        callOpts,
      );
      return {
        groupId,
        groupName,
        articles: articles.map((article) => toGastroCatalogItem(article, groupId, groupName)),
      };
    }),
  );

  return groups
    .map((group) => ({
      ...group,
      articles: group.articles.sort(compareGastroArticles),
    }))
    .filter((group) => options.includeEmptyGroups || group.articles.length > 0);
}

/**
 * Robust article-level gastro sales sync.
 *
 * Recreatex cannot reliably filter `FindArticleSalesOrders` by article id, so
 * this pulls sales lines day-by-day, then maps them to the known gastro
 * catalogue by article id/code when present and by exact description when it is
 * unique. Ambiguous description-only matches are reported in `issues` by
 * default instead of being double-counted.
 */
export async function syncGastroSales(
  client: Pick<ReCreateXClient, 'articles'>,
  options: SyncGastroSalesOptions,
  callOpts?: CallOptions,
): Promise<GastroSalesSyncResult> {
  const catalog = await listGastroArticles(client, options, callOpts);
  const articles = catalog
    .flatMap((group) => group.articles)
    .filter((article) => !options.articleIds || options.articleIds.includes(article.id))
    .filter((article) => !options.articleCodes || options.articleCodes.includes(article.code));
  const byId = new Map(articles.map((article) => [normalize(article.id), article]));
  const byCode = new Map(articles.map((article) => [normalize(article.code), article]));
  const byName = new Map<string, GastroArticleCatalogItem[]>();
  for (const article of articles) {
    const key = normalize(article.name);
    byName.set(key, [...(byName.get(key) ?? []), article]);
  }

  const buckets = new Map<string, GastroSalesSyncRow>();
  const issues: GastroSalesSyncIssue[] = [];
  for (const date of eachYmd(options.fromYmd, options.untilYmd)) {
    const sales = await client.articles.findArticleSalesOrders(
      {
        from: `${date} 00:00:00.000`,
        until: `${date} 23:59:59.000`,
        type: 'Sales',
        pageSize: options.pageSize ?? 200,
      },
      { pageSize: options.pageSize ?? 200, maxPages: options.maxPagesPerDay ?? 100 },
      callOpts,
    );
    for (const line of sales) {
      const matches = matchGastroSalesLine(line, byId, byCode, byName);
      if (matches.length === 0) {
        if (options.includeUnmatchedIssues) issues.push(toSalesIssue(date, line, 'unmatched'));
        continue;
      }
      if (matches.length > 1 && !options.includeAmbiguousDescriptionMatches) {
        issues.push(toSalesIssue(date, line, 'ambiguous-description', matches));
        continue;
      }
      for (const article of matches) addSalesLineToBucket(buckets, date, article, line);
    }
  }

  const rows = [...buckets.values()].sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.groupName.localeCompare(b.groupName, 'de-DE') ||
    a.name.localeCompare(b.name, 'de-DE'),
  );
  return {
    fromYmd: options.fromYmd,
    untilYmd: options.untilYmd,
    articleCount: articles.length,
    rows,
    totals: summarizeRows(rows),
    issues,
  };
}

function toGastroCatalogItem(
  article: Article,
  groupId: string,
  groupName: string,
): GastroArticleCatalogItem {
  return {
    groupId,
    groupName,
    id: article.id,
    code: article.code,
    name: article.name,
    price: article.price,
    ...(article.vat?.percentage !== undefined && { vatPercentage: article.vat.percentage }),
    ...(article.imageUrl !== undefined && { imageUrl: article.imageUrl }),
    article,
  };
}

function compareGastroArticles(a: GastroArticleCatalogItem, b: GastroArticleCatalogItem): number {
  return a.name.localeCompare(b.name, 'de-DE') || a.code.localeCompare(b.code, 'de-DE');
}

function matchGastroSalesLine(
  line: ArticleSalesOrder,
  byId: Map<string, GastroArticleCatalogItem>,
  byCode: Map<string, GastroArticleCatalogItem>,
  byName: Map<string, GastroArticleCatalogItem[]>,
): GastroArticleCatalogItem[] {
  const raw = line as ArticleSalesOrder & Record<string, unknown>;
  const articleId =
    readString(raw, 'articleId', 'ArticleId', 'ArticleID') ??
    readNestedString(raw, ['article', 'Article'], ['id', 'Id', 'ID']);
  if (articleId) {
    const match = byId.get(normalize(articleId));
    if (match) return [match];
  }

  const code =
    readString(raw, 'articleCode', 'code', 'Code') ??
    readNestedString(raw, ['article', 'Article'], ['code', 'Code']);
  if (code) {
    const match = byCode.get(normalize(code));
    if (match) return [match];
  }

  const description =
    readString(raw, 'description', 'Description', 'articleName', 'name', 'Name') ??
    readNestedString(raw, ['article', 'Article'], ['name', 'Name']);
  return byName.get(normalize(description)) ?? [];
}

function addSalesLineToBucket(
  buckets: Map<string, GastroSalesSyncRow>,
  date: Ymd,
  article: GastroArticleCatalogItem,
  line: ArticleSalesOrder,
): void {
  const key = `${date}|${article.id}`;
  const existing = buckets.get(key) ?? {
    date,
    groupId: article.groupId,
    groupName: article.groupName,
    articleId: article.id,
    code: article.code,
    name: article.name,
    cataloguePrice: article.price,
    quantity: 0,
    totalPrice: 0,
    lineCount: 0,
    averageUnitPrice: null,
  };
  const quantity = readSalesNumber(line, 'quantity', 'Quantity') ?? 0;
  const totalPrice =
    readSalesNumber(line, 'totalPrice', 'TotalPrice') ??
    round2(quantity * (readSalesNumber(line, 'unitPrice', 'UnitPrice') ?? 0));
  existing.quantity = round2(existing.quantity + quantity);
  existing.totalPrice = round2(existing.totalPrice + totalPrice);
  existing.lineCount += 1;
  existing.averageUnitPrice =
    existing.quantity > 0 ? round2(existing.totalPrice / existing.quantity) : null;
  buckets.set(key, existing);
}

function summarizeRows(rows: GastroSalesSyncRow[]): GastroSalesSyncResult['totals'] {
  const quantity = round2(rows.reduce((sum, row) => sum + row.quantity, 0));
  const totalPrice = round2(rows.reduce((sum, row) => sum + row.totalPrice, 0));
  const lineCount = rows.reduce((sum, row) => sum + row.lineCount, 0);
  return {
    quantity,
    totalPrice,
    lineCount,
    averageUnitPrice: quantity > 0 ? round2(totalPrice / quantity) : null,
  };
}

function toSalesIssue(
  date: Ymd,
  line: ArticleSalesOrder,
  reason: GastroSalesSyncIssue['reason'],
  candidates: GastroArticleCatalogItem[] = [],
): GastroSalesSyncIssue {
  const raw = line as ArticleSalesOrder & Record<string, unknown>;
  return {
    date,
    description: readString(raw, 'description', 'Description') ?? '',
    quantity: readSalesNumber(line, 'quantity', 'Quantity') ?? 0,
    totalPrice: readSalesNumber(line, 'totalPrice', 'TotalPrice') ?? 0,
    reason,
    ...(candidates.length > 0 && { candidateArticleIds: candidates.map((article) => article.id) }),
  };
}

function eachYmd(fromYmd: Ymd, untilYmd: Ymd): Ymd[] {
  const out: Ymd[] = [];
  const cursor = new Date(`${fromYmd}T00:00:00.000Z`);
  const end = new Date(`${untilYmd}T00:00:00.000Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function normalize(v: string | undefined): string {
  return (v ?? '').trim().toLocaleLowerCase('de-DE');
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
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

function readSalesNumber(line: ArticleSalesOrder, ...keys: string[]): number | undefined {
  const raw = line as ArticleSalesOrder & Record<string, unknown>;
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
