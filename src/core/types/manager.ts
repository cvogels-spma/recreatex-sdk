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

import type { RecreatexDateTime } from './common.js';

/**
 * Filter + grouping for both ManagerApp endpoints.
 *
 * ⚠ The wire fields are the LISTS `DivisionIds` / `ArticleGroupIds`. The singular options are
 * kept for compatibility and are sent as one-element lists (until v0.3 they were sent as
 * singular fields and silently ignored by the server).
 */
export interface SalesInformationCriteria {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
  divisionIds?: string[];
  articleGroupIds?: string[];
  /** Shorthand for `divisionIds: [id]`. */
  divisionId?: string;
  /** Shorthand for `articleGroupIds: [id]`. */
  articleGroupId?: string;
  groupByDate?: boolean;
  groupByDivision?: boolean;
  groupByArticleGroup?: boolean;
}

/** Field names as the server sends them (`…ID`, verified 2026-10-24). */
export interface SalesInformationEntry {
  id?: string | null;
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
  divisionID?: string | null;
  /** @deprecated Never filled; the server sends `divisionID`. */
  divisionId?: string | null;
  consolidationCodeItemID?: string | null;
  consolidationCodeActivityID?: string | null;
  consolidationCodeSalesID?: string | null;
}

export type VisitingCustomersCriteria = SalesInformationCriteria;

/** Field names as the server sends them (`…ID`, verified 2026-10-25). */
export interface VisitingCustomersEntry {
  id?: string | null;
  /** Total scans (NOT distinct guests). */
  totalVisitors: number;
  /** Subscription-card visits. */
  subscriptionVisitors: number;
  /** Pay-on-entry visits. */
  saleVisitors: number;
  date?: string | null;
  articleGroupID?: string | null;
  divisionID?: string | null;
  /** @deprecated Never filled; the server sends `divisionID`. */
  divisionId?: string | null;
  consolidationCodeItemID?: string | null;
  consolidationCodeActivityID?: string | null;
  /** ⚠ Singular `Sale` here, `Sales` in SalesInformationEntry; both as sent by the server. */
  consolidationCodeSaleID?: string | null;
}
