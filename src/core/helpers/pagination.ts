/**
 * Pagination helpers.
 *
 * Recreatex paging is page-index based (zero-based). The convention used
 * by the SDK: a "full page" means "more pages might exist"; a partial page
 * (`length < pageSize`) means "we're done".
 */

export interface PaginateOptions {
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
export async function paginate<T>(
  fetchPage: (args: { pageIndex: number; pageSize: number }) => Promise<T[]>,
  opts: PaginateOptions = {},
): Promise<T[]> {
  const pageSize = opts.pageSize ?? 200;
  const maxPages = opts.maxPages ?? 50;
  const all: T[] = [];
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    if (opts.signal?.aborted) throw opts.signal.reason ?? new Error('Aborted');
    const page = await fetchPage({ pageIndex, pageSize });
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}

/** Async-iterator variant for streaming consumers (don't accumulate in memory). */
export async function* paginateIter<T>(
  fetchPage: (args: { pageIndex: number; pageSize: number }) => Promise<T[]>,
  opts: PaginateOptions = {},
): AsyncGenerator<T, void, void> {
  const pageSize = opts.pageSize ?? 200;
  const maxPages = opts.maxPages ?? 50;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    if (opts.signal?.aborted) throw opts.signal.reason ?? new Error('Aborted');
    const page = await fetchPage({ pageIndex, pageSize });
    for (const item of page) yield item;
    if (page.length < pageSize) return;
  }
}
