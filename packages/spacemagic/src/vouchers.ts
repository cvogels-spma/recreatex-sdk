/**
 * Voucher catalogue (13 SKUs).
 *
 * Codes follow the prefix scheme:
 *  - `10901-*` → Postal (printed, mailed)
 *  - `10902-*` → Digital (PDF email, instant)
 *  - `10904-*` → On-site (pick-up)
 *
 * `*-0005` (digital) and `10904-0001` (on-site) are variable-amount —
 * `allowPriceChangeWebshop: true`.
 */

import { DIVISION_IDS } from './ids.js';

export type VoucherDeliveryType = 'postal' | 'digital' | 'on-site';

export interface VoucherSku {
  id: string;
  code: string;
  name: string;
  /** Default amount in EUR. Variable vouchers carry the placeholder amount. */
  price: number;
  delivery: VoucherDeliveryType;
  /** True when buyer can override `UnitPrice`. */
  variable: boolean;
  divisionId: string;
}

/** All 13 voucher SKUs as captured 2026-04-20. */
export const VOUCHER_SKUS: VoucherSku[] = [
  { id: '976e83a9-bbbb-ef11-9595-9a21964517de', code: '10901-0006', name: 'Gutschein Post - zu Null',     price: 0,   delivery: 'postal',  variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '7eb005b1-56ab-ef11-9595-9a21964517de', code: '10902-0004', name: 'Gutschein: 100€',              price: 100, delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '9ca0a47b-43ab-ef11-9595-9a21964517de', code: '10901-0004', name: 'Gutschein: 100€ - Post',       price: 100, delivery: 'postal',  variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: 'b5a39085-5cad-ef11-9595-9a21964517de', code: '10902-0007', name: 'Gutschein: 18€',               price: 18,  delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '7c92d44a-c1ad-ef11-9595-9a21964517de', code: '10902-0001', name: 'Gutschein: 25€',               price: 25,  delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '0d4b7d2a-d5ad-ef11-9595-9a21964517de', code: '10901-0001', name: 'Gutschein: 25€ - Post',        price: 25,  delivery: 'postal',  variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '1d3e0a06-50ad-ef11-9595-9a21964517de', code: '10902-0006', name: 'Gutschein: 28€',               price: 28,  delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '2298a04a-c1ad-ef11-9595-9a21964517de', code: '10902-0002', name: 'Gutschein: 50€',               price: 50,  delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: 'fe9e6a25-d5ad-ef11-9595-9a21964517de', code: '10901-0002', name: 'Gutschein: 50€ - Post',        price: 50,  delivery: 'postal',  variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '5c4ce64f-c1ad-ef11-9595-9a21964517de', code: '10902-0003', name: 'Gutschein: 75€',               price: 75,  delivery: 'digital', variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: '7d9d6a25-d5ad-ef11-9595-9a21964517de', code: '10901-0003', name: 'Gutschein: 75€ - Post',        price: 75,  delivery: 'postal',  variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: 'aaae62a4-c1ad-ef11-9595-9a21964517de', code: '10902-0005', name: 'Gutschein: Variabel',          price: 1,   delivery: 'digital', variable: true,  divisionId: DIVISION_IDS.spaceMagic },
  { id: 'bb89cd58-d5ad-ef11-9595-9a21964517de', code: '10904-0001', name: 'Gutschein: Variabel - vor Ort', price: 25, delivery: 'on-site', variable: true,  divisionId: DIVISION_IDS.spaceMagic },
];

/** Look up by code. */
export function findVoucher(code: string): VoucherSku | undefined {
  return VOUCHER_SKUS.find((v) => v.code === code);
}

/** Classify a voucher by code prefix. Useful when you only have the code. */
export function classifyVoucher(code: string): VoucherDeliveryType | 'unknown' {
  if (code.startsWith('10901')) return 'postal';
  if (code.startsWith('10902')) return 'digital';
  if (code.startsWith('10904')) return 'on-site';
  return 'unknown';
}
