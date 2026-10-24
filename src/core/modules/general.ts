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
 *  - `General/FindSales`           → low-level transactions (paginated, see findSales)
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
  FindSalesPaging,
  GiftCertificate,
  FindGiftCertificatesCriteria,
  PersonCard,
  FindPersonCardsCriteria,
  DigitalWallet,
  DigitalWalletIncludes,
  GetDigitalWalletsCriteria,
} from '../types/general.js';
import type { Basket, BasketItem, CheckoutResponse } from '../types/basket.js';
import { dayRangeDotted } from '../helpers/dates.js';
import { paginate, type PaginateOptions } from '../helpers/pagination.js';

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

interface FindPersonCardsResponse {
  findPersonCardsResult?: { personCards?: PersonCard[] };
  personCards?: PersonCard[];
  cards?: PersonCard[];
  succes?: boolean;
  message?: string;
}

interface GetDigitalWalletsResponse {
  digitalWallets?: DigitalWallet[] | null;
  /** PascalCase fallback for older Recreatex builds. */
  DigitalWallets?: DigitalWallet[] | null;
  succes?: boolean;
  message?: string;
}

interface GetDigitalWalletResponse {
  digitalWallet?: DigitalWallet | null;
  DigitalWallet?: DigitalWallet | null;
  succes?: boolean;
  message?: string;
}

/** Recreatex expects every Includes flag spelled out; `null` = server default. */
function walletIncludes(i: DigitalWalletIncludes = {}): Record<string, boolean | null> {
  return {
    Transactions: i.transactions ?? false,
    LinkedCards: i.linkedCards ?? false,
    OnlyTransactionsToday: i.onlyTransactionsToday ?? false,
    ZeroAmountLines: i.zeroAmountLines ?? null,
    CancelledRecords: i.cancelledRecords ?? null,
  };
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

  /**
   * One page of `General/FindSales`.
   *
   * ⚠ The `Paging` object belongs INSIDE `Criteria`. Sent at the top level it is ignored,
   * and so is a request without it: either way Recreatex answers with its silent default of
   * TEN bons (the most recent ones of the window). Use {@link findSales} unless you stream.
   */
  async findSalesPage(
    criteria: FindSalesCriteria,
    paging: FindSalesPaging,
    callOpts?: CallOptions,
  ): Promise<Sale[]> {
    const Criteria: Record<string, unknown> = {
      From: criteria.from,
      Until: criteria.until,
      Paging: paging,
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

  /**
   * All bons of the window, paginated to completion.
   *
   * ⚠⚠ Regression guard, 2026-10-14. Up to v0.2.0 this method sent no `Paging` criterion and
   * returned only the latest TEN bons of the window, silently: on a Sunday with 187 bons and
   * 334 guests it answered with 10. That is where the old note "FindSales only returns a
   * subset (Nachzahlautomat, Checkins)" came from. With paging it returns every bon of the
   * check-in, Nachzahlautomat, Drehkreuz, Backoffice and Nachrutsche terminals. The F&B tills
   * and the QR order app are still NOT part of this endpoint (verified 2026-10-08 over 586
   * days); use `ManagerApp/ListSalesInformation` per article group for complete revenue.
   *
   * ⚠ Lines still come duplicated: run each bon through {@link dedupSaleLines}.
   *
   * ⚠ Reaching `maxPages` with a full last page THROWS instead of returning a truncated list.
   * A cut-off sales list looks exactly like a quiet day.
   *
   * @param paginateOpts page size (default 500) and hard page cap (default 200, i.e.
   *   100,000 bons). Fifth-parameter rule as in `listPeriods`: `CallOptions` and
   *   `PaginateOptions` both carry `signal`, so they are never swapped.
   */
  async findSales(
    criteria: FindSalesCriteria,
    callOpts?: CallOptions,
    paginateOpts: PaginateOptions = {},
  ): Promise<Sale[]> {
    const pageSize = paginateOpts.pageSize ?? 500;
    const maxPages = paginateOpts.maxPages ?? 200;
    let lastPageFull = false;
    const all = await paginate(
      async ({ pageIndex, pageSize: size }) => {
        const page = await this.findSalesPage(criteria, { PageIndex: pageIndex, PageSize: size }, callOpts);
        lastPageFull = page.length >= size;
        return page;
      },
      { ...paginateOpts, pageSize, maxPages },
    );
    if (lastPageFull && all.length >= pageSize * maxPages) {
      throw new Error(
        `FindSales: page cap reached (${maxPages} x ${pageSize} bons) for ${criteria.from} to ${criteria.until}; ` +
          'narrow the window or raise paginateOpts.maxPages',
      );
    }
    return all;
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
   * Look up cards (RFID wristbands, subscription cards, voucher cards).
   *
   * Probing showed that guessed names like `FindCards`, `GetCards`,
   * `FindCustomerCards`, `FindCardTransactions`, `GetCardBalance` and the
   * whole `Access/` and `Cards/` namespaces 404. ⚠ That list was GUESSED; the
   * server's own endpoint list (`/json/documentation`, 562 entries) has more
   * card-level calls: `GetCard`, `GetDigitalWallets`/`GetDigitalWallet` (the
   * money on a band, see {@link getDigitalWallets}) and
   * `Counter/GetCreditSalesByDivisionCard`. Check that list before concluding
   * something does not exist.
   *
   * ⚠ `card` is an object ({@link DivisionCard}), verified 2026-10-24.
   *
   * ⚠ This does NOT enumerate "currently inside the park". Live occupancy is
   * a counter on the access zone (`findAccessZones().occupancy`), and no
   * endpoint maps that count back to the individual bands behind it.
   *
   * @example
   *   const cards = await client.general.findPersonCards({ number: '1234' });
   */
  async findPersonCards(
    criteria: FindPersonCardsCriteria = {},
    callOpts?: CallOptions,
  ): Promise<PersonCard[]> {
    const Criteria: Record<string, unknown> = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 50,
      },
    };
    if (criteria.id) Criteria.Id = criteria.id;
    if (criteria.number) Criteria.Number = criteria.number;
    if (criteria.personId) Criteria.PersonId = criteria.personId;
    if (criteria.customerId) Criteria.CustomerId = criteria.customerId;

    const data = await this.client.post<FindPersonCardsResponse>(
      'Json/General/FindPersonCards',
      { Criteria },
      callOpts ?? {},
    );
    return data.findPersonCardsResult?.personCards ?? data.personCards ?? data.cards ?? [];
  }

  /**
   * The wallets of the wristbands: balance and (with `includes.transactions`)
   * the open postings (gastro and add-ons booked onto the band, `salesNo: 0`,
   * not paid yet). A negative `balance` is money that left the park unpaid, or
   * is still inside it.
   *
   * ⚠ Without `personId` this returns ALL wallets (one call; Space Magic
   * 2026-10-24: 3,090 wallets, 3.5 MB with transactions, 3–5 s). Hence the
   * default timeout of 60 s here. With `personId` only that customer's wallets.
   *
   * ⚠ Use `balance` for money, not a sum over transaction lines (see
   * {@link DigitalWalletTransaction}).
   *
   * ⚠ Does NOT say which bands are inside the park.
   *
   * @example
   *   const wallets = await rx.general.getDigitalWallets({ includes: { transactions: true } });
   *   const owed = wallets.filter((w) => w.balance < 0);
   */
  async getDigitalWallets(
    criteria: GetDigitalWalletsCriteria = {},
    callOpts?: CallOptions,
  ): Promise<DigitalWallet[]> {
    const Criteria: Record<string, unknown> = { Includes: walletIncludes(criteria.includes) };
    // ⚠ Leave the key out entirely: `PersonId: null` is answered with HTTP 500.
    if (criteria.personId) Criteria.PersonId = criteria.personId;

    const data = await this.client.post<GetDigitalWalletsResponse>(
      'Json/General/GetDigitalWallets',
      { Criteria },
      { timeoutMs: 60_000, ...callOpts },
    );
    return data.digitalWallets ?? data.DigitalWallets ?? [];
  }

  /**
   * The wallet of one wristband, by its card number (e.g. the Gantner UID
   * `048363CA801D91`). `null` for an unknown number (verified 2026-10-24).
   */
  async getDigitalWallet(
    cardNumber: string,
    includes?: DigitalWalletIncludes,
    callOpts?: CallOptions,
  ): Promise<DigitalWallet | null> {
    const data = await this.client.post<GetDigitalWalletResponse>(
      'Json/General/GetDigitalWallet',
      { Criteria: { CardNumber: cardNumber, Includes: walletIncludes(includes) } },
      callOpts ?? {},
    );
    return data.digitalWallet ?? data.DigitalWallet ?? null;
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
