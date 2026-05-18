/**
 * Robust day-by-day gastro article sales sync.
 *
 * Run:
 *   RECREATEX_PASSWORD=... npx tsx examples/gastro-sales-sync.ts 2026-05-01 2026-05-18
 */

import { ReCreateXClient } from 'recreatex-sdk/core';
import { DIVISION_IDS, SHOP_ID, syncGastroSales } from 'recreatex-sdk/spacemagic';

const fromYmd = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const untilYmd = process.argv[3] ?? fromYmd;

const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: process.env.RECREATEX_SHOP_ID ?? SHOP_ID,
  password: process.env.RECREATEX_PASSWORD ?? (() => {
    throw new Error('RECREATEX_PASSWORD env var required');
  })(),
});

const result = await syncGastroSales(rx, {
  fromYmd,
  untilYmd,
  divisionId: DIVISION_IDS.spaceMagic,
});

console.table(result.rows.map((row) => ({
  Datum: row.date,
  Gruppe: row.groupName,
  Code: row.code,
  Artikel: row.name,
  Menge: row.quantity,
  Umsatz: row.totalPrice,
  Durchschnitt: row.averageUnitPrice ?? '',
})));
console.log('Totals:', result.totals);
console.log('Issues:', result.issues.length);
