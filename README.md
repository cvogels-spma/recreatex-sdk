# recreatex-sdk

TypeScript SDK for the **Recreatex / Vintia / Gantner** JSON API
(`wsdlspacemagic.recreatex.be` and friends).

One package, two subpath exports:

| Subpath | Purpose |
|---|---|
| `recreatex-sdk/core` | Domain-agnostic API client (HTTP, types, retry, pagination, basket flow) |
| `recreatex-sdk/spacemagic` | Space-Magic-specific helpers (voucher SKUs, gastro groups, visit mappers) |

## Quickstart

```ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import {
  SHOP_ID,
  GUEST_CUSTOMER_ID,
  VOUCHER_SKUS,
  getBookingInvoiceDraft,
  listGastroArticles,
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
- [`docs/AGENTS.md`](docs/AGENTS.md) — pitfalls + cheat-sheet for AI agents
- [`docs/MIGRATION.md`](docs/MIGRATION.md) — moving the three Space Magic projects to the SDK
- [`examples/`](examples/) — runnable end-to-end snippets

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

Smoke-tests against the live API live in `scripts/smoke.ts` and read
credentials from `.env.local` (gitignored).
