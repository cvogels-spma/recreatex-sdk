/**
 * Birthday booking helpers for Space Magic.
 *
 * The birthday-landing-page checkout funnel ends in
 * `General/CheckoutBasket` with an `ExpositionPeriodReservation` item.
 * This file owns the basket assembly so the consumer (Pages Function)
 * just hands over the booking + payment details and gets a ready-to-post
 * `Basket` back.
 *
 * Verified live (see `space-magic-birthday-landing-page/scripts/`):
 *  - `ExpositionPeriodId` MUST come from `Expositions/ListExpositionPeriods`
 *    — `FindExpositionOverviewByDay` does not include it.
 *  - `Entries: [{ PriceGroupId, Quantity }]` is how the price tier
 *    ("Partypaket - Space" 29 € vs. "Partypaket - Magic" 34 €) is bound
 *    to the seat count.
 *  - `Basket.Payments[].Amount = depositAmount`, `Basket.Balance =
 *    grossTotal - depositAmount` is the deposit-with-open-rest pattern;
 *    PayLater stays `false`.
 */
import type {
  Basket,
  BasketPayment,
  BasketItem,
  ExpositionPeriodReservationItem,
  ExpositionPeriodReservationEntry,
  AnonymousPerson,
} from '../core/types/basket.js';
import { BasketTypeStrings } from '../core/types/basket.js';
import { uuidv4 } from '../core/context.js';
import {
  GUEST_CUSTOMER_ID,
  DIVISION_IDS,
  PAYMENT_METHOD_ID_KARTENZAHLUNG,
} from './ids.js';

/**
 * Single price tier within a birthday slot. Pulled out of
 * `Expositions/FindExpositions` (`Includes.Pricing=true`).
 *
 * ⚠ `priceGroupId` must be `prices[].group.id`, NOT `prices[].id`.
 * `FindExpositionOverviewByDay` labels its field "priceGroupId" but
 * returns the price id — Recreatex rejects baskets built from that
 * with `OrganisedVisitValidPriceGroupsRule`.
 */
export interface BirthdayPriceTier {
  /** GUID — `prices[].group.id`. */
  priceGroupId: string;
  /** Per-ticket amount in EUR. */
  unitPrice: number;
  /** Optional human label, kept for diagnostics. */
  name?: string;
}

/** Optional add-on article (Cosmoo plush, snack pack, …). */
export interface BirthdayExtraArticle {
  articleId: string;
  unitPrice: number;
  quantity?: number;
  extraDescription?: string;
}

export interface BirthdayBookingInput {
  /** Exposition GUID — e.g. "Geburtstagstisch" / "Raumschiff X". */
  expositionId: string;
  /** Period GUID from `Expositions/ListExpositionPeriods`. */
  expositionPeriodId: string;
  /** Price tier pinned to the package the user picked (Space / Magic / …). */
  priceTier: BirthdayPriceTier;
  /**
   * Number of paying guests, bound to the chosen price tier. Must match
   * the tier's `minSaleQuantity` ≤ count ≤ `maxSaleQuantity`.
   */
  paidGuests: number;

  /** Buyer / contact details for the AnonymousPerson block. */
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    street?: string | null;
    zipCode?: string | null;
    city?: string | null;
    country?: string | null;
  };

  /**
   * Deposit (50 % of `grossTotal`). Must be > 0; the remaining
   * `grossTotal - depositAmount` will be set on `Basket.Balance`
   * so Recreatex shows it as an open rest.
   */
  depositAmount: number;
  /** Total cart value (paid guests × tier price + extras). */
  grossTotal: number;

  /** Free-text comment shown in the back-office on the OrganisedVisit. */
  comment?: string;

  /** Optional extras booked as ArticleSale lines on the same basket. */
  extras?: BirthdayExtraArticle[];

  /** Webshop order number (our `SM-BD-…` reference). */
  orderNumber: string;

  /** Mollie transaction id (e.g. `tr_xxx`) — written to BasketPayment. */
  molliePaymentId: string;

  /** Payment method GUID — defaults to KARTENZAHLUNG. */
  paymentMethodId?: string;

  /** Division GUID — defaults to DIVISION_IDS.spaceMagic. */
  divisionId?: string;

  /** Customer GUID — defaults to GUEST_CUSTOMER_ID (anonymous webshop). */
  customerId?: string;
}

const ZERO_GUID = '00000000-0000-0000-0000-000000000000';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Builds a Recreatex {@link Basket} for a webshop birthday booking with
 * a 50 % deposit. The remainder is left open via `Basket.Balance` so the
 * back-office can collect it on the day of the party.
 *
 * The returned basket is ready for `client.general.checkoutBasket(...)`.
 */
export function buildBirthdayBasket(input: BirthdayBookingInput): Basket {
  const divisionId = input.divisionId ?? DIVISION_IDS.spaceMagic;
  const customerId = input.customerId ?? GUEST_CUSTOMER_ID;
  const paymentMethodId = input.paymentMethodId ?? PAYMENT_METHOD_ID_KARTENZAHLUNG;
  const extras = input.extras ?? [];

  const depositAmount = round2(input.depositAmount);
  const grossTotal = round2(input.grossTotal);
  const balance = round2(grossTotal - depositAmount);

  // ⚠ Verified live: the field is `ParticipantCount` (NOT `Quantity`)
  //   and the visitor list is `Participants: []` (NOT `Visitors`).
  //   Without those exact names Recreatex rejects with
  //   `OrganisedVisitHasVisitorsRule`.
  const ENTRY_TYPE =
    'ReCreateX.WebShop.WebServices.Contracts.ExpositionPeriodReservationEntry, ReCreateX.WebShop.WebServices.Contracts';
  const entries: ExpositionPeriodReservationEntry[] = [
    {
      $type: ENTRY_TYPE,
      PriceGroupId: input.priceTier.priceGroupId,
      ParticipantCount: input.paidGuests,
      Participants: [],
      Cards: [],
      CustomerCardUsages: [],
      PromotionRuleDiscountAmount: 0,
    },
  ];

  // Recreatex (verified live 2026-05-04): outer `Quantity` is rejected
  // for ExpositionPeriodReservation with
  //   "Quantity is not supported For ExpositionPeriodReservation.
  //    Use ExpositionPeriodReservationEntry instead."
  // We send `Quantity: 0` (the BasketItemBase requires the field) and
  // carry the real seat count on `Entries[].ParticipantCount`.
  const periodReservation: ExpositionPeriodReservationItem = {
    $type: BasketTypeStrings.ExpositionPeriodReservation,
    Id: uuidv4(),
    DivisionId: divisionId,
    ExpositionId: input.expositionId,
    ExpositionPeriodId: input.expositionPeriodId,
    Quantity: 0,
    UnitPrice: input.priceTier.unitPrice,
    Entries: entries,
    Comments: input.comment ?? null,
    OrderWithoutPayment: false,
    AsReseller: false,
    PromotionRuleDiscountAmount: 0,
    CustomerContactId: ZERO_GUID,
  };

  const items: BasketItem[] = [periodReservation];

  for (const extra of extras) {
    const qty = extra.quantity ?? 1;
    items.push({
      $type: BasketTypeStrings.ArticleSale,
      Id: uuidv4(),
      DivisionId: divisionId,
      Article: { Id: extra.articleId },
      Quantity: qty,
      UnitPrice: extra.unitPrice,
      CustomPrice: extra.unitPrice,
      ExtraDescription: extra.extraDescription ?? '',
      AsReseller: false,
      PromotionRuleDiscountAmount: 0,
      CustomerContactId: ZERO_GUID,
    } as BasketItem);
  }

  const payment: BasketPayment = {
    $type: BasketTypeStrings.BasketPayment,
    Amount: depositAmount,
    Currency: 'EUR',
    PaymentMethodId: paymentMethodId,
    ExtraInfo1: 'Mollie',
    ExtraInfo2: input.molliePaymentId,
    OrderId: input.orderNumber,
    TrxId: input.molliePaymentId,
    PayId: '',
  };

  const anon: AnonymousPerson = {
    Name: input.buyer.lastName,
    FirstName: input.buyer.firstName,
    Email: input.buyer.email,
    Telephone: input.buyer.phone ?? null,
    Street1: input.buyer.street ?? null,
    ZipCode: input.buyer.zipCode ?? null,
    Home: input.buyer.city ?? null,
    Country: input.buyer.country ?? null,
    Newsletter: false,
  };

  return {
    CustomerId: customerId,
    Items: items,
    Payments: [payment],
    AnonymousPerson: anon,
    OrderId: input.orderNumber,
    TrxId: input.molliePaymentId,
    PayId: '',
    PayLater: false,
    Balance: balance,
    Comment: input.comment ?? '',
    CouponCodes: [],
  };
}

/**
 * Result of {@link buildBirthdayBasket}-+-{@link checkoutBasket}.
 * `organisedVisitId` is `salesItems[0].id` (the period reservation,
 * which is the OrganisedVisit's primary line in Recreatex).
 */
export interface BirthdayCheckoutResult {
  salesOrderNumber: string;
  organisedVisitId: string;
  /** All `salesItems[*].id` — index 0 is the period reservation, the rest are extras. */
  salesLineIds: string[];
  salesSeriesId: string | null;
  balanceRemaining: number;
}
