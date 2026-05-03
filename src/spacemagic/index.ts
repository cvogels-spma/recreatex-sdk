/**
 * `recreatex-sdk/spacemagic` — Space Magic-specific helpers on top of
 * `recreatex-sdk/core`.
 *
 *  - {@link SHOP_ID}, {@link DIVISION_IDS}, {@link GUEST_CUSTOMER_ID},
 *    {@link SPACE_MAGIC_ZONE_ID}
 *  - {@link VOUCHER_SKUS} catalogue + helpers
 *  - {@link GASTRO_GROUP_MAP} / {@link gastroGroupName}
 *  - Visit-categorisation + extraction helpers
 *  - {@link mapBirthdayBooking}, {@link mapEscapeBooking}
 */

export * from './ids.js';
export * from './vouchers.js';
export * from './gastro.js';
export * from './visits/index.js';
export * from './birthday.js';
