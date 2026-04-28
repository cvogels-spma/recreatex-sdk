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

export interface SalesInformationCriteria {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
  divisionId?: string;
  articleGroupId?: string;
  groupByDate?: boolean;
  groupByDivision?: boolean;
  groupByArticleGroup?: boolean;
}

export interface SalesInformationEntry {
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

export interface VisitingCustomersCriteria {
  from: RecreatexDateTime;
  until: RecreatexDateTime;
  divisionId?: string;
  articleGroupId?: string;
  groupByDate?: boolean;
  groupByDivision?: boolean;
  groupByArticleGroup?: boolean;
}

export interface VisitingCustomersEntry {
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
