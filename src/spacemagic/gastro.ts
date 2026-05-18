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

import type { Article, CallOptions, ReCreateXClient } from '../core/index.js';

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
