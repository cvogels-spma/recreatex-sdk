/**
 * Space Magic-specific GUIDs and constants.
 *
 * Verified live against `wsdlspacemagic.recreatex.be` on 2026-04-20.
 * Update via grep + a fresh probe if anything moves.
 */

export const SHOP_ID = 'f2262f27-11c3-44fa-b790-cf4b900204b0';

export const DIVISION_IDS = {
  /** Physical park (Fischteichweg 15-17, 26603 Aurich). */
  spaceMagic: '59850967-c29e-ec11-8bd7-000c298735fd',
  /** Web shop. */
  webshop: 'dc6e9df0-d53b-414d-b561-41ef8de459f3',
  /** Backoffice / Administration. */
  administration: '88791f99-1148-4129-b2d7-592aa0cb6847',
} as const;

/**
 * Webshop-Guest Person GUID. Use this as `Basket.CustomerId` for anonymous
 * voucher / ticket checkouts. The all-zero GUID would trigger
 * `MissingCustomer`.
 */
export const GUEST_CUSTOMER_ID = '119d9f06-66ad-ef11-9595-9a21964517de';

/** AccessZone for the whole park. `maxVisitors` ≈ 900. */
export const SPACE_MAGIC_ZONE_ID = 'f2bd4439-52ab-ef11-9595-9a21964517de';

/** Confirmed-working PaymentMethodId for "KARTENZAHLUNG" (use for any
 *  Mollie card-style payment flow). */
export const PAYMENT_METHOD_ID_KARTENZAHLUNG = 'a0d0dc4c-1f18-ea11-a2d2-8fcb7a700801';
