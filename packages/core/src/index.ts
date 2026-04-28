/**
 * @recreatex-sdk/core — TypeScript client for the Recreatex JSON API.
 *
 * @example
 *   import { ReCreateXClient } from '@recreatex-sdk/core';
 *
 *   const rx = new ReCreateXClient({
 *     baseUrl: 'https://wsdlspacemagic.recreatex.be',
 *     shopId:  process.env.RECREATEX_SHOP_ID!,
 *     password: process.env.RECREATEX_PASSWORD!,
 *   });
 *
 *   const zones = await rx.general.findAccessZones({ today: true });
 *   console.log(zones[0]?.occupancy?.visitorsCurrent);
 */

export { ReCreateXClient, type ReCreateXClientOptions, type CallOptions, type FetchLike } from './client.js';
export { buildContext, uuidv4, STABLE_SESSION_ID, type ContextOptions } from './context.js';
export {
  RecreatexError,
  RecreatexHttpError,
  RecreatexApiError,
  RecreatexTimeoutError,
} from './errors.js';

export * from './types/index.js';
export * from './helpers/index.js';
export * from './modules/index.js';
export { DocumentsModule } from './documents/gift-certificates.js';
