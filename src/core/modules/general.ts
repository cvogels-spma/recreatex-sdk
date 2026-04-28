/**
 * General namespace.
 *
 * Endpoints:
 *  - `General/FindAccessZones`     → live occupancy + zone metadata
 *  - `General/GetReaders`          → all RFID/barcode readers
 *  - `General/ListDivisions`       → divisions (Space Magic, Webshop, Admin)
 *  - `General/GetPointOfSales`     → POS terminals
 *  - `General/ListPaymentMethods`  → 32 payment methods
 *  - `General/FindPerson`          → look up person records
 *  - `General/FindSales`           → low-level transactions
 *  - `General/ReCalculateBasket`   → totals/discounts (web shop flow)
 *  - `General/LockBasketItems`     → reserve items (web shop flow)
 *  - `General/CheckoutBasket`      → finalise + create sale (web shop flow)
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type {
  AccessZone,
  FindAccessZonesCriteria,
  Reader,
  Division,
  PointOfSale,
  PaymentMethod,
  Person,
  FindPersonCriteria,
  Sale,
  FindSalesCriteria,
  GiftCertificate,
  FindGiftCertificatesCriteria,
} from '../types/general.js';
import type { Basket, BasketItem, CheckoutResponse } from '../types/basket.js';
import { dayRangeDotted } from '../helpers/dates.js';

interface FindAccessZonesResponse {
  accessZones?: AccessZone[];
  zones?: AccessZone[];
  result?: { zones?: AccessZone[]; accessZones?: AccessZone[] };
  succes?: boolean;
  message?: string;
}

interface GetReadersResponse {
  readers?: Reader[];
  succes?: boolean;
  message?: string;
}

interface ListDivisionsResponse {
  divisions?: Division[];
  succes?: boolean;
  message?: string;
}

interface GetPointOfSalesResponse {
  pointOfSales?: PointOfSale[];
  succes?: boolean;
  message?: string;
}

interface ListPaymentMethodsResponse {
  paymentMethods?: PaymentMethod[];
  succes?: boolean;
  message?: string;
}

interface FindPersonResponse {
  persons?: Person[];
  result?: { persons?: Person[] };
  succes?: boolean;
  message?: string;
}

interface FindSalesResponse {
  sales?: Sale[];
  succes?: boolean;
  message?: string;
}

interface FindGiftCertificatesResponse {
  findGiftCertificatesResult?: { giftCertificates?: GiftCertificate[] };
  giftCertificates?: GiftCertificate[];
  succes?: boolean;
  message?: string;
}

interface RecalcResponse {
  Basket?: Basket;
  Result?: { BasketValidationResult?: { IsValid?: boolean; Message?: string; brokenRuleName?: string } };
  succes?: boolean;
  message?: string;
}

interface LockResponse {
  LockBasketResult?: { IsLocked: boolean; LockExpiry?: string; Message?: string };
  succes?: boolean;
  message?: string;
}

export class GeneralModule {
  constructor(private readonly client: ReCreateXClient) {}

  /**
   * Live occupancy + zone metadata.
   *
   *  ⚠ `visitorsToday` and `visitorsCurrent` ALWAYS reflect "right now".
   *  `OccupancyFrom`/`OccupancyUntil` is accepted but ignored for those
   *  fields — historic counts are not retrievable via this endpoint.
   *
   * @example
   *   const zones = await client.general.findAccessZones({ today: true });
   */
  async findAccessZones(
    criteria: FindAccessZonesCriteria & { today?: boolean } = {},
    callOpts?: CallOptions,
  ): Promise<AccessZone[]> {
    const Criteria: Record<string, unknown> = {
      Id: criteria.id ?? null,
      Includes: {
        EntranceReaders: criteria.includes?.entranceReaders ?? false,
        ExitReaders: criteria.includes?.exitReaders ?? false,
        Occupancy: criteria.includes?.occupancy ?? true,
        InactiveZoneControl: criteria.includes?.inactiveZoneControl ?? false,
      },
    };
    if (criteria.today) {
      const range = dayRangeDotted();
      Criteria.OccupancyFrom = range.from;
      Criteria.OccupancyUntil = range.until;
    } else {
      if (criteria.occupancyFrom) Criteria.OccupancyFrom = criteria.occupancyFrom;
      if (criteria.occupancyUntil) Criteria.OccupancyUntil = criteria.occupancyUntil;
    }

    const data = await this.client.post<FindAccessZonesResponse>(
      'Json/General/FindAccessZones',
      { Criteria },
      callOpts ?? {},
    );
    return (
      data.accessZones ??
      data.zones ??
      data.result?.accessZones ??
      data.result?.zones ??
      []
    );
  }

  /** All readers (eCarts, Laser Tag, vending, etc.). */
  async getReaders(callOpts?: CallOptions): Promise<Reader[]> {
    const data = await this.client.post<GetReadersResponse>(
      'Json/General/GetReaders',
      {},
      callOpts ?? {},
    );
    return data.readers ?? [];
  }

  /** All divisions (Space Magic, Webshop, Admin). */
  async listDivisions(callOpts?: CallOptions): Promise<Division[]> {
    const data = await this.client.post<ListDivisionsResponse>(
      'Json/General/ListDivisions',
      {},
      callOpts ?? {},
    );
    return data.divisions ?? [];
  }

  /** All POS terminals. */
  async getPointOfSales(callOpts?: CallOptions): Promise<PointOfSale[]> {
    const data = await this.client.post<GetPointOfSalesResponse>(
      'Json/General/GetPointOfSales',
      {},
      callOpts ?? {},
    );
    return data.pointOfSales ?? [];
  }

  /** All payment methods (~32 entries). */
  async listPaymentMethods(callOpts?: CallOptions): Promise<PaymentMethod[]> {
    const data = await this.client.post<ListPaymentMethodsResponse>(
      'Json/General/ListPaymentMethods',
      {},
      callOpts ?? {},
    );
    return data.paymentMethods ?? [];
  }

  /** Look up persons. Provide at least one filter. */
  async findPerson(criteria: FindPersonCriteria, callOpts?: CallOptions): Promise<Person[]> {
    const Criteria: Record<string, unknown> = {};
    if (criteria.id) Criteria.Id = criteria.id;
    if (criteria.email) Criteria.Email = criteria.email;
    if (criteria.firstName) Criteria.FirstName = criteria.firstName;
    if (criteria.lastName) Criteria.LastName = criteria.lastName;
    if (criteria.username) Criteria.Username = criteria.username;

    const data = await this.client.post<FindPersonResponse>(
      'Json/General/FindPerson',
      { Criteria },
      callOpts ?? {},
    );
    return data.persons ?? data.result?.persons ?? [];
  }

  /** Low-level sales (only Nachzahlautomat / Checkins, not all POS). */
  async findSales(criteria: FindSalesCriteria, callOpts?: CallOptions): Promise<Sale[]> {
    const Criteria: Record<string, unknown> = {
      From: criteria.from,
      Until: criteria.until,
    };
    if (criteria.pointOfSaleId) Criteria.PointOfSaleId = criteria.pointOfSaleId;
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;

    const data = await this.client.post<FindSalesResponse>(
      'Json/General/FindSales',
      { Criteria },
      callOpts ?? {},
    );
    return data.sales ?? [];
  }

  // ---- Basket flow -------------------------------------------------------

  /** Recalculate prices, discounts, VAT for a basket without committing. */
  async reCalculateBasket(basket: Basket, callOpts?: CallOptions): Promise<Basket> {
    const data = await this.client.post<RecalcResponse>(
      'Json/General/ReCalculateBasket',
      { Basket: basket },
      callOpts ?? {},
    );
    if (!data.Basket) {
      throw new Error('ReCalculateBasket: no Basket in response');
    }
    return data.Basket;
  }

  /** Lock basket items for the duration of payment. */
  async lockBasketItems(
    items: BasketItem[],
    callOpts?: CallOptions,
  ): Promise<{ isLocked: boolean; lockExpiry?: string; message?: string }> {
    const data = await this.client.post<LockResponse>(
      'Json/General/LockBasketItems',
      { BasketItems: items },
      callOpts ?? {},
    );
    const r = data.LockBasketResult;
    const result: { isLocked: boolean; lockExpiry?: string; message?: string } = {
      isLocked: r?.IsLocked ?? false,
    };
    if (r?.LockExpiry !== undefined) result.lockExpiry = r.LockExpiry;
    if (r?.Message !== undefined) result.message = r.Message;
    return result;
  }

  /**
   * Finalise the basket (creates the sale).
   *
   * @returns full `Result` object including `SalesOrderNumber` and
   *   `SalesItems[]` (use `SalesItems[].Id` as `SalesLineId` for the
   *   document service).
   */
  async checkoutBasket(basket: Basket, callOpts?: CallOptions): Promise<CheckoutResponse['Result']> {
    const data = await this.client.post<CheckoutResponse & { succes?: boolean; message?: string }>(
      'Json/General/CheckoutBasket',
      { Basket: basket },
      callOpts ?? {},
    );
    if (!data.Result) {
      throw new Error('CheckoutBasket: no Result in response');
    }
    return data.Result;
  }

  // ---- Gift certificates -----------------------------------------------

  /**
   * Find gift certificates, e.g. by customer or by id. Newest first.
   *
   * @example
   *   const certs = await client.general.findGiftCertificates({
   *     customerId: GUEST_CUSTOMER_ID, pageSize: 20,
   *   });
   *   const cert = certs.find((c) => c.salesSeriesID === checkoutResult.SalesSeriesId);
   */
  async findGiftCertificates(
    criteria: FindGiftCertificatesCriteria,
    callOpts?: CallOptions,
  ): Promise<GiftCertificate[]> {
    const Criteria: Record<string, unknown> = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 20,
      },
    };
    if (criteria.customerId) Criteria.CustomerId = criteria.customerId;
    if (criteria.id) Criteria.Id = criteria.id;
    if (criteria.number) Criteria.Number = criteria.number;

    const data = await this.client.post<FindGiftCertificatesResponse>(
      'Json/General/FindGiftCertificates',
      { Criteria },
      callOpts ?? {},
    );
    return (
      data.findGiftCertificatesResult?.giftCertificates ??
      data.giftCertificates ??
      []
    );
  }

  /**
   * Mark a gift certificate as printed/delivered. Recreatex sets `printDate`
   * on the cert. Best-effort — if it fails, the voucher is still valid; the
   * back-office staff can reprint.
   */
  async setGiftCertificatePrinted(
    giftCertificateId: string,
    callOpts?: CallOptions,
  ): Promise<void> {
    await this.client.post(
      'Json/General/SetGiftCertificatePrinted',
      { Criteria: { Id: giftCertificateId } },
      callOpts ?? {},
    );
  }
}
