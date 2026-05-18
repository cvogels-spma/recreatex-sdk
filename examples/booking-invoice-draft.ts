/**
 * Build invoice-ready data and HTML from a historical OrganisedVisit.
 *
 * Run one of:
 *   RECREATEX_PASSWORD=... npx tsx examples/booking-invoice-draft.ts --id <OrganisedVisitId>
 *   RECREATEX_PASSWORD=... npx tsx examples/booking-invoice-draft.ts --order <OrderNumber>
 *   RECREATEX_PASSWORD=... npx tsx examples/booking-invoice-draft.ts --no 222645 --from 2026-05-01 --until 2026-05-18
 */

import { writeFile } from 'node:fs/promises';
import { ReCreateXClient } from 'recreatex-sdk/core';
import {
  SHOP_ID,
  getBookingInvoiceDraft,
  renderBookingInvoiceHtml,
} from 'recreatex-sdk/spacemagic';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: process.env.RECREATEX_SHOP_ID ?? SHOP_ID,
  password: process.env.RECREATEX_PASSWORD ?? (() => {
    throw new Error('RECREATEX_PASSWORD env var required');
  })(),
});

const draft = await getBookingInvoiceDraft(rx, {
  organisedVisitId: arg('--id'),
  orderNumber: arg('--order'),
  bookingNo: arg('--no'),
  fromYmd: arg('--from'),
  untilYmd: arg('--until'),
});

const html = renderBookingInvoiceHtml(draft);
const out = `booking-${draft.bookingNo}-invoice-draft.html`;
await writeFile(out, html);
console.log(JSON.stringify({ bookingNo: draft.bookingNo, totals: draft.totals, html: out }, null, 2));
