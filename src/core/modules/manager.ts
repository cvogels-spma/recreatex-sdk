/**
 * ManagerApp namespace.
 *
 * Endpoints:
 *  - `ManagerApp/ListSalesInformation`              → revenue
 *  - `ManagerApp/ListVisitingCustomersInformation`  → visitor scans
 *
 * For caveats see ../types/manager.ts.
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type {
  SalesInformationCriteria,
  SalesInformationEntry,
  VisitingCustomersCriteria,
  VisitingCustomersEntry,
} from '../types/manager.js';

interface SalesInformationResponse {
  salesInformation?: SalesInformationEntry[];
  succes?: boolean;
  message?: string;
}

interface VisitingCustomersResponse {
  visitingCustomersInformation?: VisitingCustomersEntry[];
  succes?: boolean;
  message?: string;
}

/**
 * The filter part of both ManagerApp criteria.
 *
 * ⚠ The server only knows the LIST fields `DivisionIds` / `ArticleGroupIds`. Up to v0.3 the SDK
 * sent singular `DivisionId` / `ArticleGroupId`, which the server silently ignored: a call
 * "filtered" to the socks group returned the whole day (16,465.51 € instead of 792.51 €,
 * verified 2026-10-25).
 */
function managerFilter(criteria: SalesInformationCriteria | VisitingCustomersCriteria): Record<string, unknown> {
  const Criteria: Record<string, unknown> = {
    From: criteria.from,
    Until: criteria.until,
  };
  const divisionIds = [...(criteria.divisionIds ?? []), ...(criteria.divisionId ? [criteria.divisionId] : [])];
  const articleGroupIds = [
    ...(criteria.articleGroupIds ?? []),
    ...(criteria.articleGroupId ? [criteria.articleGroupId] : []),
  ];
  if (divisionIds.length) Criteria.DivisionIds = divisionIds;
  if (articleGroupIds.length) Criteria.ArticleGroupIds = articleGroupIds;
  if (criteria.groupByDate) Criteria.GroupByDate = true;
  if (criteria.groupByDivision) Criteria.GroupByDivision = true;
  if (criteria.groupByArticleGroup) Criteria.GroupByArticleGroup = true;
  return Criteria;
}

export class ManagerModule {
  constructor(private readonly client: ReCreateXClient) {}

  /** Aggregated revenue. Combine `groupBy*` flags as needed. */
  async listSalesInformation(
    criteria: SalesInformationCriteria,
    callOpts?: CallOptions,
  ): Promise<SalesInformationEntry[]> {
    const Criteria = managerFilter(criteria);

    const data = await this.client.post<SalesInformationResponse>(
      'Json/ManagerApp/ListSalesInformation',
      { Criteria },
      callOpts ?? {},
    );
    return data.salesInformation ?? [];
  }

  /**
   * Visitor scans (NOT distinct guests — see manager.ts caveats).
   *
   * For real guest counts use {@link GeneralModule.findAccessZones} with
   * `today: true` and persist `visitorsToday` yourself.
   */
  async listVisitingCustomersInformation(
    criteria: VisitingCustomersCriteria,
    callOpts?: CallOptions,
  ): Promise<VisitingCustomersEntry[]> {
    const Criteria = managerFilter(criteria);

    const data = await this.client.post<VisitingCustomersResponse>(
      'Json/ManagerApp/ListVisitingCustomersInformation',
      { Criteria },
      callOpts ?? {},
    );
    return data.visitingCustomersInformation ?? [];
  }
}
