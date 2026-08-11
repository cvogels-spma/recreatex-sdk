/**
 * Expositions namespace.
 *
 * Endpoints:
 *  - `Expositions/FindExpositions`               → room/exposition catalogue
 *  - `Expositions/FindExpositionPeriodDates`     → free days in a window
 *  - `Expositions/FindExpositionOverviewByDay`   → slots + capacity for a day
 *  - `Expositions/ListExpositionPeriods`         → addressable Period IDs (used to build `ExpositionPeriodReservation` baskets)
 *  - `Expositions/FindOrganisedVisits`           → list bookings (paginated)
 *  - `Expositions/AdjustOrganisedVisit`          → change quantities of an existing visit
 *  - `Expositions/CancelOrganisedVisit`          → cancel + refund prep
 *  - `Expositions/GetOrganisedVisitRebookingCosts` → preview slot-change cost delta
 *
 *  ⚠ `findOverviewByDay` does NOT include the period `id` — it only carries
 *  `from / until / occupancy / prices`. Use {@link ExpositionsModule.listPeriods}
 *  to obtain the addressable `ExpositionPeriodId` you need for a
 *  `ExpositionPeriodReservation` basket item.
 *
 *  ⚠ The "apply rebook" endpoint is not exposed as a JSON endpoint at the
 *  time of writing. The CheckoutBasket flow with an OrganisedVisitRebooking
 *  basket item appears to be the path — pending confirmation from Lukas
 *  Goetz @ Gantner. Use Cancel-then-Rebuy as the documented fallback.
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type {
  Exposition,
  ExpositionPeriodDate,
  ExpositionPeriodRef,
  ExpositionDayOverview,
  OrganisedVisit,
  FindOrganisedVisitsCriteria,
  OrganisedVisitTicketAdjustment,
  OrganisedVisitSaleAdjustment,
  OrganisedVisitPeriodTransfer,
} from '../types/expositions.js';
import type { Ymd } from '../types/common.js';
import { dayRangeIso } from '../helpers/dates.js';
import { paginate, type PaginateOptions } from '../helpers/pagination.js';

interface FindExpositionsResponse {
  result?: { expositions?: Exposition[] };
  expositions?: Exposition[];
  succes?: boolean;
  message?: string;
}

interface FindExpositionPeriodDatesResponse {
  dates?: ExpositionPeriodDate[];
  succes?: boolean;
  message?: string;
}

interface FindExpositionOverviewByDayResponse {
  validateExpositionSubscriptionItemResult?: ExpositionDayOverview[];
  succes?: boolean;
  message?: string;
}

interface ListExpositionPeriodsResponse {
  expositionPeriods?: ExpositionPeriodRef[];
  succes?: boolean;
  message?: string;
}

interface FindOrganisedVisitsResponse {
  organisedVisits?: OrganisedVisit[];
  succes?: boolean;
  message?: string;
}

export interface FindExpositionsCriteria {
  namePattern?: string;
  pageIndex?: number;
  pageSize?: number;
  includes?: { pricing?: boolean };
}

export interface AdjustOrganisedVisitInput {
  organisedVisitId: string;
  ticketAdjustments?: OrganisedVisitTicketAdjustment[];
  saleAdjustments?: OrganisedVisitSaleAdjustment[];
}

export interface CancelOrganisedVisitInput {
  organisedVisitId: string;
  reasonId: string;
  paymentMethodId?: string;
}

export interface CancelOrganisedVisitResult {
  returnAmount: number;
  salesSerieId?: string;
  isValid: boolean;
  message?: string;
}

export interface GetRebookingCostsInput {
  organisedVisitId: string;
  transfers: OrganisedVisitPeriodTransfer[];
}

export class ExpositionsModule {
  constructor(private readonly client: ReCreateXClient) {}

  /** List expositions matching `namePattern`. */
  async findExpositions(
    criteria: FindExpositionsCriteria = {},
    callOpts?: CallOptions,
  ): Promise<Exposition[]> {
    const SearchCriteria: Record<string, unknown> = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 50,
      },
      Includes: { Pricing: criteria.includes?.pricing ?? false },
    };
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;

    const data = await this.client.post<FindExpositionsResponse>(
      'Json/Expositions/FindExpositions',
      { SearchCriteria },
      callOpts ?? {},
    );
    return data.result?.expositions ?? data.expositions ?? [];
  }

  /** List free/blocked days for an exposition in `[fromIso, untilIso]`. */
  async findPeriodDates(
    expositionId: string,
    fromIso: string,
    untilIso: string,
    callOpts?: CallOptions,
  ): Promise<ExpositionPeriodDate[]> {
    const data = await this.client.post<FindExpositionPeriodDatesResponse>(
      'Json/Expositions/FindExpositionPeriodDates',
      {
        SearchCriteria: { ExpositionId: expositionId, From: fromIso, Until: untilIso },
      },
      callOpts ?? {},
    );
    return data.dates ?? [];
  }

  /** Slots + capacity for a single day. */
  async findOverviewByDay(
    expositionId: string,
    date: Ymd,
    callOpts?: CallOptions,
  ): Promise<ExpositionDayOverview[]> {
    const { from, until } = dayRangeIso(date);
    const data = await this.client.post<FindExpositionOverviewByDayResponse>(
      'Json/Expositions/FindExpositionOverviewByDay',
      {
        Criteria: {
          ExpositionId: expositionId,
          StartTime: from,
          EndTime: until,
          Includes: { Pricing: true },
          ExpositionIdList: [expositionId],
        },
      },
      callOpts ?? {},
    );
    return data.validateExpositionSubscriptionItemResult ?? [];
  }

  /**
   * Addressable Period entries (carries the `id` you need for an
   * `ExpositionPeriodReservation` basket item).
   *
   *  ⚠ Use this and NOT {@link findOverviewByDay} when you need to
   *  build a checkout basket — `findOverviewByDay` does not include
   *  the period id.
   *
   *  ⚠⚠ **Auto-paginated since 2026-08-11, and that is a bug fix, not a feature.**
   *  This method used to send no `Paging` criterion and therefore returned only the
   *  first **ten** periods of the range — silently. See {@link listPeriodsPage} for
   *  what that cost. Callers keep their existing signature and simply get the whole
   *  day now.
   *
   * @param expositionId — the Exposition GUID.
   * @param fromIso — ISO datetime, e.g. `'2026-05-07T00:00:00'`.
   * @param untilIso — ISO datetime, e.g. `'2026-05-07T23:59:59'`.
   * @param callOpts — per-call transport options (timeout, retry, signal).
   * @param paginateOpts — page size / hard page cap. ⚠ Deliberately the **fifth**
   *   parameter rather than the fourth, unlike {@link findOrganisedVisits}:
   *   `CallOptions` and `PaginateOptions` both carry `signal`, so swapping their
   *   positions would let an existing `callOpts` argument slide into the paging slot
   *   and lose its timeout **without any type error**. Consistency is not worth a
   *   silent breakage.
   *
   * @example
   *   const periods = await client.expositions.listPeriods(
   *     'c9b017fe-fafc-ef11-9596-b28721114d72',
   *     '2026-05-07T00:00:00', '2026-05-07T23:59:59',
   *   );
   *   const slot = periods.find((p) => p.from === '2026-05-07T14:00:00');
   *   // → slot.id is the ExpositionPeriodId
   */
  async listPeriods(
    expositionId: string,
    fromIso: string,
    untilIso: string,
    callOpts?: CallOptions,
    paginateOpts: PaginateOptions = {},
  ): Promise<ExpositionPeriodRef[]> {
    const pageOptions: PaginateOptions = { pageSize: 200, ...paginateOpts };
    return paginate(
      ({ pageIndex, pageSize }) =>
        this.listPeriodsPage(
          expositionId,
          fromIso,
          untilIso,
          { PageIndex: pageIndex, PageSize: pageSize },
          callOpts,
        ),
      pageOptions,
    );
  }

  /**
   * One page of Period entries.
   *
   * ⚠⚠ **`Paging` IS NOT OPTIONAL HERE — measured 2026-08-11.** Without a `Paging`
   * criterion `ListExpositionPeriods` silently returns only the **first ten**
   * periods of the range. It does not error, it does not say the result was cut,
   * and there is no total count in the response to notice it by.
   *
   * That cost real money. Space Magic's entry checkout resolves the guest's time
   * slot by matching `from` against this list. For 2026-08-11 the API holds **17**
   * periods (10:00 through 18:00); unpaginated it returned ten, ending at 14:30.
   * Every booking for a later slot was rejected with *"kein Zeitfenster mit Beginn
   * 15:00"* and fell back to a plain article sale — so those guests got a sale
   * without an `OrganisedVisit`, and their QR code does not open the till. The
   * operator was told to create the missing backoffice periods; they existed all
   * along.
   *
   * ⭐ The lesson generalises to this whole API: **a short answer is not a fact
   * about the data until you have checked that you asked for all of it.** Silent
   * caps look exactly like "nothing there". The number `10` is the tell.
   */
  async listPeriodsPage(
    expositionId: string,
    fromIso: string,
    untilIso: string,
    paging?: { PageIndex: number; PageSize: number },
    callOpts?: CallOptions,
  ): Promise<ExpositionPeriodRef[]> {
    const data = await this.client.post<ListExpositionPeriodsResponse>(
      'Json/Expositions/ListExpositionPeriods',
      {
        SearchCriteria: {
          ExpositionId: expositionId,
          From: fromIso,
          Until: untilIso,
          Paging: paging ?? { PageIndex: 0, PageSize: 200 },
        },
      },
      callOpts ?? {},
    );
    return data.expositionPeriods ?? [];
  }

  /**
   * Fetch a single page of OrganisedVisits.
   *
   *  ⚠ The `From`/`Until` filter applies to `purchaseDate`, NOT `startDate`.
   *  For sync use cases pull a generous window and filter client-side by
   *  `startDate` (see {@link ymdWindow}).
   */
  async findOrganisedVisitsPage(
    criteria: FindOrganisedVisitsCriteria,
    callOpts?: CallOptions,
  ): Promise<OrganisedVisit[]> {
    const SearchCriteria: Record<string, unknown> = {
      Paging: criteria.paging ?? { PageIndex: 0, PageSize: 200 },
      Includes: {
        PeriodReservations: criteria.includes?.periodReservations ?? true,
        Articles: criteria.includes?.articles ?? true,
        PersonDetails: criteria.includes?.personDetails ?? true,
      },
    };
    if (criteria.fromYmd) SearchCriteria.From = `${criteria.fromYmd} 00:00:00.000`;
    if (criteria.untilYmd) SearchCriteria.Until = `${criteria.untilYmd} 23:59:59.000`;
    if (criteria.organisedVisitId) SearchCriteria.OrganisedVisitId = criteria.organisedVisitId;
    if (criteria.personId) SearchCriteria.PersonId = criteria.personId;
    if (criteria.orderNumber) SearchCriteria.OrderNumber = criteria.orderNumber;

    const data = await this.client.post<FindOrganisedVisitsResponse>(
      'Json/Expositions/FindOrganisedVisits',
      { SearchCriteria },
      callOpts ?? {},
    );
    return data.organisedVisits ?? [];
  }

  /**
   * Auto-paginated list of OrganisedVisits.
   *
   * @example
   *   const visits = await client.expositions.findOrganisedVisits({
   *     fromYmd: '2026-04-01', untilYmd: '2026-04-30',
   *   });
   */
  async findOrganisedVisits(
    criteria: FindOrganisedVisitsCriteria,
    paginateOpts: PaginateOptions = {},
    callOpts?: CallOptions,
  ): Promise<OrganisedVisit[]> {
    const pageOptions: PaginateOptions = {
      pageSize: criteria.paging?.PageSize ?? 200,
      ...paginateOpts,
    };
    return paginate(
      ({ pageIndex, pageSize }) =>
        this.findOrganisedVisitsPage(
          { ...criteria, paging: { PageIndex: pageIndex, PageSize: pageSize } },
          callOpts,
        ),
      pageOptions,
    );
  }

  /** Adjust quantities on an existing visit (more kids, extra food). */
  async adjustOrganisedVisit(
    input: AdjustOrganisedVisitInput,
    callOpts?: CallOptions,
  ): Promise<{ isValid: boolean; message?: string }> {
    const body: Record<string, unknown> = {
      OrganisedVisitId: input.organisedVisitId,
      OrganisedVisitTicketAdjustments: (input.ticketAdjustments ?? []).map((t) => ({
        PriceGroupId: t.priceGroupId,
        Quantity: t.quantity,
      })),
      OrganisedVisitSaleAdjustments: (input.saleAdjustments ?? []).map((s) => ({
        ArticleId: s.articleId,
        Quantity: s.quantity,
        ...(s.unitPrice !== undefined && { UnitPrice: s.unitPrice }),
      })),
    };
    const data = await this.client.post<{
      isValid?: boolean;
      message?: string;
      succes?: boolean;
    }>('Json/Expositions/AdjustOrganisedVisit', body, callOpts ?? {});
    const result: { isValid: boolean; message?: string } = { isValid: data.isValid ?? true };
    if (data.message !== undefined) result.message = data.message;
    return result;
  }

  /** Cancel a visit. Returns the amount to refund. */
  async cancelOrganisedVisit(
    input: CancelOrganisedVisitInput,
    callOpts?: CallOptions,
  ): Promise<CancelOrganisedVisitResult> {
    const body: Record<string, unknown> = {
      OrganisedVisitId: input.organisedVisitId,
      ReasonId: input.reasonId,
    };
    if (input.paymentMethodId) body.PaymentMethodId = input.paymentMethodId;

    const data = await this.client.post<{
      ReturnAmount?: number;
      SalesSerieId?: string;
      IsValid?: boolean;
      Message?: string;
      succes?: boolean;
    }>('Json/Expositions/CancelOrganisedVisit', body, callOpts ?? {});

    const result: CancelOrganisedVisitResult = {
      returnAmount: data.ReturnAmount ?? 0,
      isValid: data.IsValid ?? true,
    };
    if (data.SalesSerieId !== undefined) result.salesSerieId = data.SalesSerieId;
    if (data.Message !== undefined) result.message = data.Message;
    return result;
  }

  /** Preview the cost delta for a slot change (no apply). */
  async getRebookingCosts(
    input: GetRebookingCostsInput,
    callOpts?: CallOptions,
  ): Promise<{ rebookingCosts: number }> {
    const body = {
      OrganisedVisitId: input.organisedVisitId,
      OrganisedVisitPeriodTransfers: input.transfers.map((t) => ({
        OldPeriodId: t.oldPeriodId,
        NewPeriodId: t.newPeriodId,
        Quantity: t.quantity,
      })),
    };
    const data = await this.client.post<{
      RebookingCosts?: number;
      succes?: boolean;
    }>('Json/Expositions/GetOrganisedVisitRebookingCosts', body, callOpts ?? {});
    return { rebookingCosts: data.RebookingCosts ?? 0 };
  }
}
