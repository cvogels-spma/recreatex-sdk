/**
 * Sync OrganisedVisits → local rows. Mirrors the kpi-dashboard sync job.
 */

import { ReCreateXClient, ymdWindow } from '@recreatex-sdk/core';
import {
  SHOP_ID,
  categorizeVisit,
  mapBirthdayBooking,
  mapEscapeBooking,
} from '@recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl: 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
});

const { fromYmd, untilYmd } = ymdWindow(30, 90);
const visits = await rx.expositions.findOrganisedVisits({ fromYmd, untilYmd });

const birthdays = visits.filter((v) => categorizeVisit(v) === 'birthday').map(mapBirthdayBooking);
const escapes = visits.filter((v) => categorizeVisit(v) === 'escape').map(mapEscapeBooking);

console.log(`${birthdays.length} birthdays, ${escapes.length} escape bookings in window`);
console.log(birthdays.slice(0, 3));
