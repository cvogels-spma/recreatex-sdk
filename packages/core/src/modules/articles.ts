/**
 * Articles namespace.
 *
 * Endpoints:
 *  - `Articles/FindArticles`     → list/search article catalogue
 *  - `Articles/ListArticleGroups` → article-group taxonomy
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type { Article, ArticleGroup, FindArticlesCriteria } from '../types/articles.js';
import { paginate, type PaginateOptions } from '../helpers/pagination.js';

interface FindArticlesResponse {
  articles?: Article[];
  succes?: boolean;
  message?: string;
}

interface ListArticleGroupsResponse {
  articleGroups?: ArticleGroup[];
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
        Vat: criteria.includes?.vat ?? true,
        Translations: criteria.includes?.translations ?? false,
        ...(criteria.includes?.priceInfo !== undefined && { PriceInfo: criteria.includes.priceInfo }),
      },
    };
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;
    if (criteria.code) SearchCriteria.Code = criteria.code;
    if (criteria.divisionId) SearchCriteria.DivisionId = criteria.divisionId;

    const data = await this.client.post<FindArticlesResponse>(
      'Json/Articles/FindArticles',
      { SearchCriteria },
      callOpts ?? {},
    );
    return data.articles ?? [];
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

  /** List all article groups (e.g. F&B categories, voucher types). */
  async listArticleGroups(callOpts?: CallOptions): Promise<ArticleGroup[]> {
    const data = await this.client.post<ListArticleGroupsResponse>(
      'Json/Articles/ListArticleGroups',
      {},
      callOpts ?? {},
    );
    return data.articleGroups ?? [];
  }
}
