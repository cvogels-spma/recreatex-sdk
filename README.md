# recreatex-sdk

TypeScript SDK for the **Recreatex / Vintia / Gantner** JSON API
(`wsdlspacemagic.recreatex.be` and friends).

One package, two subpath exports:

| Subpath | Purpose |
|---|---|
| `recreatex-sdk/core` | Domain-agnostic API client (HTTP, types, retry, pagination, basket flow) |
| `recreatex-sdk/spacemagic` | Space-Magic-specific helpers (voucher SKUs, gastro groups, visit mappers) |

## What you can ask it for

- **Gastro article catalogue**: all configured Space Magic F&B articles with
  group, code, id, current price and VAT.
- **Article-level sales**: "How many Cheeseburger normal did we sell between
  two dates, at what realised prices, and with which daily history?"
- **Robust gastro sales sync**: day-by-day sync of sold F&B lines so long
  month/year ranges do not silently lose older rows behind Recreatex
  pagination.
- **Revenue and visitor KPIs**: manager-app revenue aggregates, low-level
  sales, live occupancy, and visitor scan aggregates.
- **Discount and voucher checks**: validate known coupon/voucher codes and
  reserve/release coupon discounts for a checkout session.
- **Historical bookings**: look up OrganisedVisits by id, order number or
  booking number, download configured Recreatex booking PDFs, and build an
  invoice-ready draft from the booking rows.

## Quickstart

```ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import {
  DIVISION_IDS,
  SHOP_ID,
  GUEST_CUSTOMER_ID,
  VOUCHER_SKUS,
  getBookingInvoiceDraft,
  listGastroArticles,
  renderBookingInvoiceHtml,
  syncGastroSales,
} from 'recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl:  'https://wsdlspacemagic.recreatex.be',
  shopId:   SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
});

// Live park occupancy
const zones = await rx.general.findAccessZones({ today: true });
console.log(`In park right now: ${zones[0]?.occupancy?.visitorsCurrent ?? 0}`);

// All birthday & escape bookings (last 30 d)
const visits = await rx.expositions.findOrganisedVisits({
  fromYmd: '2026-04-01', untilYmd: '2026-04-30',
});

// Gastro article catalogue
const gastro = await listGastroArticles(rx);
console.table(gastro.flatMap((g) => g.articles.map((a) => ({
  group: g.groupName,
  code: a.code,
  article: a.name,
  price: a.price,
}))));

// Article-level sales dossier
const hamburger = await rx.articles.getArticleSalesReport({
  namePattern: 'Hamburger',
  from: '2026-05-01 00:00:00.000',
  until: '2026-05-31 23:59:59.000',
});
console.log(`Hamburger sold: ${hamburger.totals.quantity}`);

// Robust day-by-day gastro sales sync
const gastroSales = await syncGastroSales(rx, { fromYmd: '2026-05-01', untilYmd: '2026-05-18' });
console.log(gastroSales.totals);

// Invoice-ready draft for a historical booking
const invoice = await getBookingInvoiceDraft(rx, { organisedVisitId: '...' });
console.log(invoice.totals);
```

## Environment

Keep credentials in your app environment, never in source control:

```bash
export RECREATEX_BASE_URL="https://wsdlspacemagic.recreatex.be"
export RECREATEX_SHOP_ID="<shop uuid>"
export RECREATEX_PASSWORD="<webservice password>"
```

Then construct one client and reuse it:

```ts
const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: process.env.RECREATEX_SHOP_ID!,
  password: process.env.RECREATEX_PASSWORD!,
});
```

## Install

```bash
# from a consuming project (npm or pnpm)
npm install git+https://github.com/cvogels-spma/recreatex-sdk.git#v0.2.0
# or pin a specific commit:
npm install git+https://github.com/cvogels-spma/recreatex-sdk.git#abc1234
```

A single `npm install` from the git URL gives you both subpaths.

## Docs

- [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md) — every endpoint, one line each
- [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) — operational recipes for Gastro,
  Shop KPIs, discounts and booking invoices
- [`docs/AGENTS.md`](docs/AGENTS.md) — pitfalls + cheat-sheet for AI agents
- [`docs/MIGRATION.md`](docs/MIGRATION.md) — moving the three Space Magic projects to the SDK
- [`examples/`](examples/) — runnable end-to-end snippets

## Common workflows

### 1. Map all Gastro articles

Use this first whenever you need item-level F&B reporting. Recreatex sales
history is most reliable when you can match by article id or article code
instead of only by description.

```ts
const catalog = await listGastroArticles(rx, {
  divisionId: DIVISION_IDS.spaceMagic,
});

const rows = catalog.flatMap((group) =>
  group.articles.map((article) => ({
    group: group.groupName,
    code: article.code,
    name: article.name,
    price: article.price,
    articleId: article.id,
    vat: article.vatPercentage,
  })),
);

console.table(rows);
```

Each row contains the Recreatex article id, article code, group id/name,
display name, current catalogue price and the raw `Article` object.

### 2. Get sales for one article

Use `getArticleSalesReport()` for a single item such as "Hamburger" or
"Cheeseburger normal":

```ts
const report = await rx.articles.getArticleSalesReport({
  code: '11004-0002',
  from: '2026-05-01 00:00:00.000',
  until: '2026-05-31 23:59:59.000',
  historyGroup: 'day',
});

console.log(report.article?.name);
console.log(report.currentPrice);
console.log(report.totals.quantity);
console.log(report.totals.totalPrice);
console.table(report.history);
```

Prefer `code` or `articleId` when available. `namePattern` is supported, but
the helper intentionally throws if multiple catalogue articles match.

### 3. Sync Gastro sales over longer ranges

For daily, monthly or yearly reporting, prefer `syncGastroSales()`.
It queries `FindArticleSalesOrders` day by day and maps sales lines onto the
known Space Magic gastro catalogue.

```ts
const sales = await syncGastroSales(rx, {
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-31',
  divisionId: DIVISION_IDS.spaceMagic,
});

console.log(sales.totals);
console.table(sales.rows);
```

Filter to one or more articles:

```ts
const cheeseburger = await syncGastroSales(rx, {
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-31',
  articleCodes: ['11004-0002'],
});
```

The result has stable rows by date/article plus totals. Ambiguous
description-only matches are reported as `issues` instead of being
double-counted.

### 4. Revenue and visitor KPIs

Use ManagerApp aggregates for dashboard revenue:

```ts
const revenue = await rx.manager.listSalesInformation({
  from: '2026-05-18 00:00:00.000',
  until: '2026-05-18 23:59:59.000',
  groupByDate: true,
  groupByDivision: true,
  groupByArticleGroup: true,
});
```

Use live occupancy for "right now" and persist snapshots if you need a
historical visitor series:

```ts
const zones = await rx.general.findAccessZones({
  today: true,
  includes: { occupancy: true },
});

console.log(zones[0]?.occupancy?.visitorsCurrent);
console.log(zones[0]?.occupancy?.visitorsToday);
```

`ListVisitingCustomersInformation` is useful for visitor scans, but scan
counts can differ from real guests. `FindAccessZones` is live-only for
occupancy; date filters are accepted by Recreatex but do not produce a true
historical occupancy query.

### 5. Check discount and voucher codes

The public JSON API supports known-code validation and reservation. It does
not expose a reliable "list all historical/future coupon codes" endpoint.

```ts
const basket = {
  CustomerId: GUEST_CUSTOMER_ID,
  Items: [],
  CouponCodes: ['OPENING10'],
};

const coupon = await rx.general.couponCalculate(basket);
const voucher = await rx.general.voucherValidate(['OPENING10']);

console.log(coupon.status, coupon.discounts);
console.log(voucher.voucherStates);
```

For checkout flows, use `couponReserve(basket)` with the same session that
will checkout the basket, and call `couponRelease()` when the checkout is
abandoned.

### 6. Build a draft invoice for a historical booking

Recreatex exposes historical OrganisedVisits and booking PDFs, but no public
mutation was found for creating a new official back-office invoice after the
fact. The SDK therefore gives you two practical paths:

```ts
const draft = await getBookingInvoiceDraft(rx, {
  bookingNo: 222645,
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-18',
});

const html = renderBookingInvoiceHtml(draft);
```

Or, when a Recreatex document template exists:

```ts
const pdf = await rx.documents.organisedVisitPdf({
  organisedVisitId: draft.bookingId,
});
```

The draft includes customer data, booking number, order number, service
period, article/period-reservation lines, VAT amounts where available,
paid amount, balance and raw OrganisedVisit data for audit/debug views.

## Runnable examples

| Example | Purpose |
|---|---|
| `examples/gastro-article-catalog.ts` | Export/map all known Gastro articles |
| `examples/gastro-sales-sync.ts` | Day-by-day Gastro sales sync |
| `examples/discount-code-check.ts` | Validate a known coupon/voucher code |
| `examples/booking-invoice-draft.ts` | Build HTML invoice draft from a booking |
| `examples/kpi-occupancy.ts` | Live occupancy |
| `examples/kpi-sync-organised-visits.ts` | OrganisedVisit sync for dashboards |
| `examples/voucher-checkout.ts` | Gift-certificate checkout flow |

## Why this exists

Three Space Magic projects (`space-magic-birthday-landing-page`,
`space-magic-kpi-dashboard`, `space-magic-voucher-shop-handover`) each had
their own `fetch`-wrapper, their own `Context` block, and their own
type-defs scraped from live captures. This SDK consolidates the lot:

- one `ReCreateXClient`, one `Context` builder
- typed errors (`RecreatexHttpError`, `RecreatexApiError`,
  `RecreatexTimeoutError`)
- automatic retry on network + 5xx, never on validation errors
- auto-pagination for `FindOrganisedVisits` and `FindArticles`
- article-level sales reports (`FindArticleSalesOrders` + price information)
- coupon/voucher validation helpers (`CouponCalculate`, `CouponReserve`, `VoucherValidate`)
- historical booking invoice drafts and OrganisedVisit document downloads
- known-pitfalls hard-coded so you don't trip the `Article: null` /
  `MissingCustomer` / `PayLater` traps

## Repo layout

```
src/
  core/         → bundled to dist/core.js (subpath: recreatex-sdk/core)
  spacemagic/   → bundled to dist/spacemagic.js (subpath: recreatex-sdk/spacemagic)
test/
docs/
examples/
```

## Develop

```bash
npm install
npm run build
npm test
npm run typecheck
```

Ad-hoc live checks should read credentials from environment variables or a
gitignored `.env.local`. Never commit Shop IDs, webservice passwords, voucher
codes from real customers, or raw booking/customer exports.

## Known API limits

- Historical article reporting depends on `FindArticleSalesOrders`; for long
  ranges, sync day by day.
- Coupon/voucher endpoints validate known codes, but the public API docs do
  not expose a list-all-coupon-definitions endpoint.
- `FindAccessZones` occupancy is live-only. Persist snapshots for historical
  visitor charts.
- Historical booking details and PDFs are retrievable. Creating an official
  post-hoc Recreatex invoice is not exposed by the public JSON endpoints found
  so far, so the SDK produces an invoice-ready draft instead.
