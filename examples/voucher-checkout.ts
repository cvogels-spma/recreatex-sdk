/**
 * End-to-end voucher checkout.
 *
 * Flow:
 *   1. List vouchers from the catalogue.
 *   2. ReCalculateBasket → confirms price/VAT.
 *   3. (Server-side) create Mollie payment, get TrxId.
 *   4. LockBasketItems.
 *   5. After Mollie reports `paid`, CheckoutBasket with the BasketPayment block.
 *   6. Download the gift-certificate PDF for each line.
 *
 * This example focuses on the SDK pieces; replace the Mollie steps with
 * your own integration.
 */

import { ReCreateXClient, BasketTypeStrings, uuidv4 } from '@recreatex-sdk/core';
import type { Basket } from '@recreatex-sdk/core';
import {
  SHOP_ID,
  GUEST_CUSTOMER_ID,
  PAYMENT_METHOD_ID_KARTENZAHLUNG,
  findVoucher,
} from '@recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl: 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
  // Voucher checkout: fresh SessionId per buyer.
  sessionId: () => uuidv4(),
});

const voucher = findVoucher('10902-0001'); // 25 € digital
if (!voucher) throw new Error('voucher not found');

const orderId = `SM-VG-${Date.now()}`;
const trxId = 'tr_PLACEHOLDER';

const basket: Basket = {
  CustomerId: GUEST_CUSTOMER_ID,
  Items: [
    {
      $type: BasketTypeStrings.SalesArticleSale,
      Id: '00000000-0000-0000-0000-000000000000',
      DivisionId: voucher.divisionId,
      Quantity: 1,
      UnitPrice: voucher.price,
      Article: { Id: voucher.id },
    },
  ],
  Payments: [
    {
      $type: BasketTypeStrings.BasketPayment,
      Amount: voucher.price,
      Currency: 'EUR',
      PaymentMethodId: PAYMENT_METHOD_ID_KARTENZAHLUNG,
      ExtraInfo1: 'Mollie',
      ExtraInfo2: trxId,
      OrderId: orderId,
      TrxId: trxId,
      PayId: '',
    },
  ],
  OrderId: orderId,
  TrxId: trxId,
};

// 1) Recalculate
const recalc = await rx.general.reCalculateBasket(basket);
console.log('Total after recalc:', recalc.Price ?? '(unknown)');

// 2) Lock
await rx.general.lockBasketItems(basket.Items);

// 3) ... Mollie payment dance happens here ...

// 4) Checkout
const result = await rx.general.checkoutBasket(basket);
console.log('SalesOrderNumber:', result.SalesOrderNumber);

// 5) PDF
const lineId = result.SalesItems?.[0]?.Id;
if (lineId) {
  const pdf = await rx.documents.giftCertificatePdf({ salesLineId: lineId });
  console.log(`PDF: ${pdf.size} bytes`);
}
