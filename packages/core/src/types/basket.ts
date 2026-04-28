/**
 * Basket types — used by `ReCalculateBasket`, `LockBasketItems`,
 * `CheckoutBasket`.
 *
 * All basket items are a discriminated union over the `$type` field. The
 * SDK exports {@link BasketTypeStrings} as a const map of every known
 * subtype string so you don't have to hand-type the
 * `ReCreateX.WebShop.WebServices.Contracts.…, ReCreateX.WebShop.WebServices.Contracts`
 * incantation.
 *
 * Pitfalls verified against the live API:
 *  - `Article: null` on an `ArticleSale` item → API throws
 *    "Object reference not set to an instance of an object".
 *    Always pass `Article: { Id: "<guid>" }`.
 *  - `PayLater: true` on a Gift Certificate basket → `InvalidPayLaterPayment`.
 *    Provide a `Payments[]` array with a real `BasketPayment`.
 *  - `CustomerId: "00000000-..."` → `MissingCustomer`. Use the
 *    Webshop-Guest-Person GUID
 *    (Space Magic: `119d9f06-66ad-ef11-9595-9a21964517de`) instead.
 *  - `BasketPayment.PaymentMethod: { ... }` (nested) → type-not-found error.
 *    The structure is FLAT: `PaymentMethodId: "<guid>"` directly on the
 *    `BasketPayment`.
 */

const BCT = 'ReCreateX.WebShop.WebServices.Contracts';
const SUFFIX = `, ${BCT}`;

/** Discriminator strings for `$type` on basket items / payments / costs. */
export const BasketTypeStrings = {
  // ---- Basket items (sales) ----
  ArticleSale: `${BCT}.ArticleSale${SUFFIX}`,
  /** Webshop-flavoured ArticleSale used by the OMG voucher shop. */
  SalesArticleSale: `${BCT}.SalesArticleSale${SUFFIX}`,
  ExpositionPeriodReservation: `${BCT}.ExpositionPeriodReservation${SUFFIX}`,
  CombiExpositionReservation: `${BCT}.CombiExpositionReservation${SUFFIX}`,
  OrganisedVisitRebooking: `${BCT}.OrganisedVisitRebooking${SUFFIX}`,
  CombiOrganisedVisitRebooking: `${BCT}.CombiOrganisedVisitRebooking${SUFFIX}`,
  CultureEventReservation: `${BCT}.CultureEventReservation${SUFFIX}`,
  RentalReservation: `${BCT}.RentalReservation${SUFFIX}`,
  ActivityReservation: `${BCT}.ActivityReservation${SUFFIX}`,
  TableSale: `${BCT}.TableSale${SUFFIX}`,

  // ---- Payments ----
  BasketPayment: `${BCT}.BasketPayment${SUFFIX}`,

  // ---- Discounts ----
  GiftCertificateDiscount: `${BCT}.GiftCertificateDiscount${SUFFIX}`,
  CouponCodeDiscount: `${BCT}.CouponCodeDiscount${SUFFIX}`,
} as const;

export type BasketTypeString = (typeof BasketTypeStrings)[keyof typeof BasketTypeStrings];

interface BasketItemBase {
  $type: BasketTypeString;
  Id: string;
  DivisionId: string;
  Quantity: number;
  UnitPrice: number;
  CustomerContactId?: string;
  RuleNamesToIgnore?: string[] | null;
  AdvancementPrice?: number | null;
  AsReseller?: boolean;
  PromotionRuleDiscountAmount?: number;
  LockTicket?: unknown;
}

/** Article line — F&B, voucher, ticket. `Article` MUST be `{ Id }`, never null. */
export interface ArticleSaleItem extends BasketItemBase {
  $type: typeof BasketTypeStrings.ArticleSale | typeof BasketTypeStrings.SalesArticleSale;
  Article: { Id: string };
  CustomPrice?: number;
  ExtraDescription?: string | null;
}

export interface ExpositionPeriodReservationItem extends BasketItemBase {
  $type: typeof BasketTypeStrings.ExpositionPeriodReservation;
  ExpositionId: string;
  ExpositionPeriodId: string;
  CustomerId?: string | null;
  Comments?: string | null;
}

export interface OrganisedVisitRebookingItem extends BasketItemBase {
  $type: typeof BasketTypeStrings.OrganisedVisitRebooking;
  OrganisedVisitId: string;
  OrganisedVisitPeriodTransfers?: Array<{
    OldPeriodId: string;
    NewPeriodId: string;
    Quantity: number;
  }> | null;
}

export type BasketItem =
  | ArticleSaleItem
  | ExpositionPeriodReservationItem
  | OrganisedVisitRebookingItem
  | (BasketItemBase & { [extra: string]: unknown });

/**
 * Payment block. Note the FLAT structure — `PaymentMethodId` is a sibling,
 * not nested inside a `PaymentMethod` object.
 *
 * `TrxId` / `OrderId` / `PayId` are v8.3.0+ fields meant for Enviso-Split
 * payments; we re-use them for Mollie reference data.
 */
export interface BasketPayment {
  $type: typeof BasketTypeStrings.BasketPayment;
  Amount: number;
  Currency: string;
  PaymentMethodId: string;
  ExtraInfo1?: string;
  ExtraInfo2?: string;
  OrderId?: string;
  TrxId?: string;
  PayId?: string;
}

/** Anonymous-buyer block used when no person record exists yet. */
export interface AnonymousPerson {
  Name?: string | null;
  FirstName?: string | null;
  Street1?: string | null;
  Street2?: string | null;
  Number?: string | null;
  Box?: string | null;
  Home?: string | null;
  Country?: string | null;
  Email?: string | null;
  Newsletter?: boolean;
  ZipCode?: string | null;
  Telephone?: string | null;
}

export interface Basket {
  /** ALWAYS the Webshop-Guest-Person GUID for anonymous orders, never zero. */
  CustomerId: string;
  Items: BasketItem[];
  Payments?: BasketPayment[] | null;
  CouponCodes?: string[] | null;
  Info1?: string;
  Info2?: string;
  Info3?: string;
  AnonymousPerson?: AnonymousPerson;
  Comment?: string;
  OrderId?: string;
  PayLater?: boolean;
  TrxId?: string;
  PayId?: string;
  /** Catch-all for less-common fields. */
  [extra: string]: unknown;
}

export interface BasketValidationResult {
  IsValid: boolean;
  Message?: string | null;
  brokenRuleName?: string | null;
  BasketItemValidationResults?: unknown;
}

export interface CheckoutResult {
  ResultState: number;
  SalesOrderNumber: string;
  SalesSeriesId?: string | null;
  InvoiceId?: string | null;
  HasCollectLaterLines?: boolean;
  TokenNumber?: string | null;
  BasketValidationResult: BasketValidationResult;
  SalesItems?: Array<{ Id: string; [extra: string]: unknown }> | null;
}

export interface CheckoutResponse {
  Result: CheckoutResult;
}
