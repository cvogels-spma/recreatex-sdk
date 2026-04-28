/**
 * Read live park occupancy.
 */

import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID, SPACE_MAGIC_ZONE_ID } from 'recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl: 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
});

const zones = await rx.general.findAccessZones({ today: true });
const park = zones.find((z) => z.id === SPACE_MAGIC_ZONE_ID);
if (!park) {
  console.error('Space Magic zone not found');
  process.exit(1);
}
console.log(`In park now: ${park.occupancy?.visitorsCurrent}`);
console.log(`Today total : ${park.occupancy?.visitorsToday}`);
console.log(`Daily cap   : ${park.occupancy?.maxVisitorsPerDay}`);
