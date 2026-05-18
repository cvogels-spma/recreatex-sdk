/**
 * Validate a coupon / voucher code against Recreatex.
 *
 * Run:
 *   RECREATEX_PASSWORD=... npx tsx examples/discount-code-check.ts OPENING10
 */

import { ReCreateXClient } from 'recreatex-sdk/core';
import { GUEST_CUSTOMER_ID, SHOP_ID } from 'recreatex-sdk/spacemagic';

const code = process.argv[2];
if (!code) throw new Error('Pass a coupon/voucher code as first argument');

const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: process.env.RECREATEX_SHOP_ID ?? SHOP_ID,
  password: process.env.RECREATEX_PASSWORD ?? (() => {
    throw new Error('RECREATEX_PASSWORD env var required');
  })(),
});

const basket = {
  CustomerId: GUEST_CUSTOMER_ID,
  Items: [],
  CouponCodes: [code],
};

const [coupon, voucher] = await Promise.all([
  rx.general.couponCalculate(basket),
  rx.general.voucherValidate([code]),
]);

console.log(JSON.stringify({ coupon, voucher }, null, 2));
