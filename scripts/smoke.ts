/**
 * Read-only smoke test of every READ wrapper against the live API.
 *
 *   RECREATEX_PASSWORD=… npm run smoke            (or put it into .env.local)
 *   npm run smoke -- 2026-10-24                   (day for the date-based calls)
 *
 * ⚠ Calls ONLY reading endpoints. Basket, checkout, lock, cancel, adjust and
 * SetGiftCertificatePrinted are never called here: they change data.
 *
 * Prints one line per wrapper: count or error. Exit code 1 if any call failed.
 */
import { ReCreateXClient } from '../src/core/index.js';
import { SHOP_ID } from '../src/spacemagic/index.js';

try {
  process.loadEnvFile('.env.local');
} catch {
  // no .env.local: environment variables only
}

const password = process.env.RECREATEX_PASSWORD;
if (!password) {
  console.error('RECREATEX_PASSWORD fehlt (Umgebung oder .env.local).');
  process.exit(2);
}

const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: process.env.RECREATEX_SHOP_ID ?? SHOP_ID,
  password,
  timeoutMs: 60_000,
});

const tag = process.argv[2] ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const von = `${tag} 00:00:00.000`;
const bis = `${tag} 23:59:59.000`;

const groesse = (x: unknown): string =>
  Array.isArray(x) ? `${x.length} entries` : x == null ? 'null' : typeof x === 'object' ? 'object' : String(x);

const merk: { artikelId?: string; ausstellungId?: string; band?: string } = {};
const proben: Array<[string, () => Promise<unknown>]> = [
  ['general.findAccessZones', () => rx.general.findAccessZones({ today: true })],
  ['general.getReaders', () => rx.general.getReaders()],
  ['general.listDivisions', () => rx.general.listDivisions()],
  ['general.getPointOfSales', () => rx.general.getPointOfSales()],
  ['general.listPaymentMethods', () => rx.general.listPaymentMethods()],
  ['general.findSales (day, all pages)', () => rx.general.findSales({ from: von, until: bis })],
  ['general.findPersonCards (5)', () => rx.general.findPersonCards({ pageSize: 5 })],
  ['general.getDigitalWallets (all)', async () => {
    const w = await rx.general.getDigitalWallets();
    merk.band = w[0]?.cardNumber ?? undefined;
    return w;
  }],
  ['general.getDigitalWallet', () => rx.general.getDigitalWallet(merk.band ?? '0')],
  ['manager.listSalesInformation', () => rx.manager.listSalesInformation({ from: von, until: bis })],
  ['manager.listVisitingCustomersInformation', () => rx.manager.listVisitingCustomersInformation({ from: von, until: bis })],
  ['articles.findArticles', async () => {
    const a = await rx.articles.findArticles({});
    merk.artikelId = a[0]?.id;
    return a;
  }],
  ['articles.listArticleGroups', () => rx.articles.listArticleGroups()],
  ['articles.findArticleById', () => rx.articles.findArticleById(merk.artikelId ?? '')],
  ['articles.getArticlePriceInformation', () => rx.articles.getArticlePriceInformation({ articleId: merk.artikelId ?? '' })],
  ['articles.findArticleSalesOrders (day, All)', () => rx.articles.findArticleSalesOrders({ from: von, until: bis, type: 'All' })],
  ['expositions.findExpositions', async () => {
    const e = await rx.expositions.findExpositions({});
    merk.ausstellungId = e[0]?.id;
    return e;
  }],
  ['expositions.listPeriods (day)', () => rx.expositions.listPeriods(merk.ausstellungId ?? '', `${tag}T00:00:00`, `${tag}T23:59:59`)],
  ['expositions.findOverviewByDay', () => rx.expositions.findOverviewByDay(merk.ausstellungId ?? '', tag)],
  ['expositions.findOrganisedVisits (day)', () => rx.expositions.findOrganisedVisits({ fromYmd: tag, untilYmd: tag })],
];

let fehler = 0;
console.log(`Smoke test against ${rx.options.baseUrl}, day ${tag}`);
for (const [name, aufruf] of proben) {
  const t0 = Date.now();
  try {
    const r = await aufruf();
    console.log(`ok     ${name}: ${groesse(r)} (${Date.now() - t0} ms)`);
  } catch (e) {
    fehler++;
    console.log(`ERROR  ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
process.exit(fehler ? 1 : 0);
