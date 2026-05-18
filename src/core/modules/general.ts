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
 *  - `General/CouponCalculate`     → validate/calculate discount codes
 *  - `General/CouponReserve`       → reserve discount codes for checkout
 *  - `General/CouponRelease`       → release reserved discount codes
 *  - `General/VoucherValidate`     → validate voucher codes
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
  CouponCalculationResult,
  CouponReservationResult,
  CouponReleaseResult,
  GiftCertificateCalculationResult,
  VoucherValidateResult,
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

interface CouponCalculateResponse {
  couponCalculateResult?: CouponCalculationResult;
  CouponCalculateResult?: CouponCalculationResult;
  result?: CouponCalculationResult;
  Result?: CouponCalculationResult;
  succes?: boolean;
  message?: string;
}

interface CouponReserveResponse {
  couponReserveResult?: CouponReservationResult;
  CouponReserveResult?: CouponReservationResult;
  result?: CouponReservationResult;
  Result?: CouponReservationResult;
  succes?: boolean;
  message?: string;
}

interface CouponReleaseResponse {
  couponReleaseResult?: CouponReleaseResult;
  CouponReleaseResult?: CouponReleaseResult;
  result?: CouponReleaseResult;
  Result?: CouponReleaseResult;
  succes?: boolean;
  message?: string;
}

interface GiftCertificateCalculateResponse {
  giftCertificateCalculateResult?: GiftCertificateCalculationResult;
  GiftCertificateCalculateResult?: GiftCertificateCalculationResult;
  result?: GiftCertificateCalculationResult;
  Result?: GiftCertificateCalculationResult;
  succes?: boolean;
  message?: string;
}

interface VoucherValidateResponse {
  voucherValidateResult?: VoucherValidateResult;
  VoucherValidateResult?: VoucherValidateResult;
  result?: VoucherValidateResult;
  Result?: VoucherValidateResult;
  succes?: boolean;
  message?: string;
}

interface CheckoutEnvelopeResponse {
  result?: CheckoutResponse['result'];
  /** PascalCase fallback for older Recreatex builds. */
  Result?: CheckoutResponse['result'];
  succes?: boolean;
  message?: string;
}

interface RecalcResponse {
  basket?: Basket;
  /** PascalCase fallback for older Recreatex builds. */
  Basket?: Basket;
  result?: { basketValidationResult?: { isValid?: boolean; message?: string; brokenRuleName?: string } };
  succes?: boolean;
  message?: string;
}

interface LockResponse {
  lockBasketResult?: { isLocked: boolean; lockExpiry?: string; message?: string };
  /** PascalCase fallback for older Recreatex builds. */
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

  // ---- Discount codes / vouchers ---------------------------------------

  /** Validate and calculate coupon-code discounts for the current basket. */
  async couponCalculate(basket: Basket, callOpts?: CallOptions): Promise<CouponCalculationResult> {
    const data = await this.client.post<CouponCalculateResponse>(
      'Json/General/CouponCalculate',
      { Criteria: { Basket: basket } },
      callOpts ?? {},
    );
    const result =
      data.couponCalculateResult ??
      data.CouponCalculateResult ??
      data.result ??
      data.Result;
    if (!result) throw new Error('CouponCalculate: no result in response');
    return normalizeCouponResult(result);
  }

  /** Reserve coupon-code discounts for checkout; release with {@link couponRelease}. */
  async couponReserve(basket: Basket, callOpts?: CallOptions): Promise<CouponReservationResult> {
    const data = await this.client.post<CouponReserveResponse>(
      'Json/General/CouponReserve',
      { Criteria: { Basket: basket } },
      callOpts ?? {},
    );
    const result =
      data.couponReserveResult ??
      data.CouponReserveResult ??
      data.result ??
      data.Result;
    if (!result) throw new Error('CouponReserve: no result in response');
    return {
      ...normalizeCouponResult(result),
      couponReservations: result.couponReservations ?? [],
    };
  }

  /** Release coupon reservations tied to the current session id. */
  async couponRelease(callOpts?: CallOptions): Promise<CouponReleaseResult> {
    const data = await this.client.post<CouponReleaseResponse>(
      'Json/General/CouponRelease',
      {},
      callOpts ?? {},
    );
    const result =
      data.couponReleaseResult ??
      data.CouponReleaseResult ??
      data.result ??
      data.Result;
    if (!result) throw new Error('CouponRelease: no result in response');
    return result;
  }

  /** Calculate gift-certificate discounts for the current basket. */
  async giftCertificateCalculate(
    basket: Basket,
    callOpts?: CallOptions,
  ): Promise<GiftCertificateCalculationResult> {
    const data = await this.client.post<GiftCertificateCalculateResponse>(
      'Json/General/GiftCertificateCalculate',
      { Criteria: { Basket: basket } },
      callOpts ?? {},
    );
    const result =
      data.giftCertificateCalculateResult ??
      data.GiftCertificateCalculateResult ??
      data.result ??
      data.Result;
    if (!result) throw new Error('GiftCertificateCalculate: no result in response');
    return {
      ...result,
      discounts: result.discounts ?? [],
    };
  }

  /** Validate voucher codes and return voucher states / linked coupon details. */
  async voucherValidate(
    voucherCodes: string[],
    callOpts?: CallOptions,
  ): Promise<VoucherValidateResult> {
    const data = await this.client.post<VoucherValidateResponse>(
      'Json/General/VoucherValidate',
      { Criteria: { VoucherCodes: voucherCodes } },
      callOpts ?? {},
    );
    const result =
      data.voucherValidateResult ??
      data.VoucherValidateResult ??
      data.result ??
      data.Result;
    if (!result) throw new Error('VoucherValidate: no result in response');
    return {
      ...result,
      voucherStates: result.voucherStates ?? [],
      couponDetails: result.couponDetails ?? [],
    };
  }

  // ---- Basket flow -------------------------------------------------------

  /** Recalculate prices, discounts, VAT for a basket without committing. */
  async reCalculateBasket(basket: Basket, callOpts?: CallOptions): Promise<Basket> {
    const data = await this.client.post<RecalcResponse>(
      'Json/General/ReCalculateBasket',
      { Basket: basket },
      callOpts ?? {},
    );
    const out = data.basket ?? data.Basket;
    if (!out) {
      throw new Error('ReCalculateBasket: no Basket in response');
    }
    return out;
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
    const lower = data.lockBasketResult;
    const upper = data.LockBasketResult;
    const result: { isLocked: boolean; lockExpiry?: string; message?: string } = {
      isLocked: lower?.isLocked ?? upper?.IsLocked ?? false,
    };
    const expiry = lower?.lockExpiry ?? upper?.LockExpiry;
    if (expiry !== undefined) result.lockExpiry = expiry;
    const msg = lower?.message ?? upper?.Message;
    if (msg !== undefined) result.message = msg;
    return result;
  }

  /**
   * Finalise the basket (creates the sale).
   *
   * @returns full `Result` object including `SalesOrderNumber` and
   *   `SalesItems[]` (use `SalesItems[].Id` as `SalesLineId` for the
   *   document service).
   */
  async checkoutBasket(basket: Basket, callOpts?: CallOptions): Promise<CheckoutResponse['result']> {
    const data = await this.client.post<CheckoutEnvelopeResponse>(
      'Json/General/CheckoutBasket',
      { Basket: basket },
      callOpts ?? {},
    );
    const result = data.result ?? data.Result;
    if (!result) {
      throw new Error('CheckoutBasket: no result in response');
    }
    return result;
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

function normalizeCouponResult<T extends CouponCalculationResult>(result: T): T {
  return {
    ...result,
    discounts: result.discounts ?? [],
  };
}
