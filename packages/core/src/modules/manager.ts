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

export class ManagerModule {
  constructor(private readonly client: ReCreateXClient) {}

  /** Aggregated revenue. Combine `groupBy*` flags as needed. */
  async listSalesInformation(
    criteria: SalesInformationCriteria,
    callOpts?: CallOptions,
  ): Promise<SalesInformationEntry[]> {
    const Criteria: Record<string, unknown> = {
      From: criteria.from,
      Until: criteria.until,
    };
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;
    if (criteria.articleGroupId) Criteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.groupByDate) Criteria.GroupByDate = true;
    if (criteria.groupByDivision) Criteria.GroupByDivision = true;
    if (criteria.groupByArticleGroup) Criteria.GroupByArticleGroup = true;

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
    const Criteria: Record<string, unknown> = {
      From: criteria.from,
      Until: criteria.until,
    };
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;
    if (criteria.articleGroupId) Criteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.groupByDate) Criteria.GroupByDate = true;
    if (criteria.groupByDivision) Criteria.GroupByDivision = true;
    if (criteria.groupByArticleGroup) Criteria.GroupByArticleGroup = true;

    const data = await this.client.post<VisitingCustomersResponse>(
      'Json/ManagerApp/ListVisitingCustomersInformation',
      { Criteria },
      callOpts ?? {},
    );
    return data.visitingCustomersInformation ?? [];
  }
}
