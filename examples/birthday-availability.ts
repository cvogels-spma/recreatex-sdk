/**
 * Show free slots for an exposition on a given day.
 *
 *   tsx examples/birthday-availability.ts <expositionId> 2026-05-12
 */

import { ReCreateXClient } from '@recreatex-sdk/core';
import { SHOP_ID } from '@recreatex-sdk/spacemagic';

const [, , expositionId, dateYmd = '2026-05-12'] = process.argv;
if (!expositionId) {
  console.error('Usage: tsx examples/birthday-availability.ts <expositionId> [YYYY-MM-DD]');
  process.exit(1);
}

const rx = new ReCreateXClient({
  baseUrl: 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD ?? (() => {
    throw new Error('RECREATEX_PASSWORD env var required');
  })(),
});

const overview = await rx.expositions.findOverviewByDay(expositionId, dateYmd);
for (const day of overview) {
  for (const period of day.periods ?? []) {
    const occ = period.occupancy;
    console.log(
      `${period.from} → ${period.until}   ${occ?.remaining ?? '?'}/${occ?.maximum ?? '?'} free`,
    );
  }
}
