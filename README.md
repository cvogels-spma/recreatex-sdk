# recreatex-sdk

TypeScript SDK for the **Recreatex / Vintia / Gantner** JSON API
(`wsdlspacemagic.recreatex.be` and friends). Version **0.4.0**, see
[`CHANGELOG.md`](CHANGELOG.md).

One package, two subpath exports:

| Subpath | Purpose |
|---|---|
| `recreatex-sdk/core` | Domain-agnostic API client (HTTP, types, retry, pagination, basket flow) |
| `recreatex-sdk/spacemagic` | Space-Magic-specific helpers (IDs, voucher SKUs, gastro groups, visit mappers, wristband counting) |

## Quickstart

```ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID, countWristbands } from 'recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl:  'https://wsdlspacemagic.recreatex.be',
  shopId:   SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
});

// Live counter (a bare number: which bands are inside is not available)
const zones = await rx.general.findAccessZones({ today: true });
console.log(`Check-in without check-out: ${zones[0]?.occupancy?.visitorsCurrent ?? 0}`);

// All bons of a day (paginated), and the entries counted from them
const sales = await rx.general.findSales({ from: '2026-10-24 00:00:00.000', until: '2026-10-24 23:59:59.000' });
console.log(`Entries: ${countWristbands(sales).wristbands}`);

// Money left on wristbands (unpaid postings)
const wallets = await rx.general.getDigitalWallets({ includes: { transactions: true } });
const owed = wallets.filter((w) => w.balance < 0);

// Bookings (birthdays, escape rooms, …)
const visits = await rx.expositions.findOrganisedVisits({ fromYmd: '2026-10-01', untilYmd: '2026-10-31' });

// Article dossier: price, sold quantity, revenue, history
const nuggets = await rx.articles.getArticleSalesReport({
  code: '11003-0006', from: '2026-10-01 00:00:00.000', until: '2026-10-31 23:59:59.000', type: 'All',
});
console.log(`Sold: ${nuggets.totals.quantity}`);
```

## Install

The repo has **no release tags**; pin a commit.

```bash
npm install git+https://github.com/cvogels-spma/recreatex-sdk.git#<commit>
# pnpm
pnpm add github:cvogels-spma/recreatex-sdk#<commit>
```

`dist/` is committed, so a git install needs no build step. ⚠ A spec without a
commit (`github:cvogels-spma/recreatex-sdk`) follows `master` whenever the lockfile is
refreshed; see [`docs/MIGRATION.md`](docs/MIGRATION.md) before upgrading.

Known consumers (2026-10-25): `spma-relaunch-2026` (unpinned, lockfile on `537a7ad`),
`spma-dashboard` and `spma-order` (pinned `dc0e7a4`), `spma-app` and the older landing
pages (unpinned).

## Docs

- [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md): every wrapped endpoint, the request fields the
  server ignores, the wristband/wallet facts
- [`docs/AGENTS.md`](docs/AGENTS.md): pitfalls and cheat-sheet for AI agents
- [`docs/MIGRATION.md`](docs/MIGRATION.md): upgrading to 0.4.0, and the original migration
  of the Space Magic projects
- [`CHANGELOG.md`](CHANGELOG.md)
- [`examples/`](examples/): runnable end-to-end snippets
- The server's own endpoint list: `GET https://wsdlspacemagic.recreatex.be/json/documentation`
  (562 endpoints; `/json/documentation/<Method>` shows request and response)

## What it does for you

- one `ReCreateXClient`, one `Context` builder
- typed errors (`RecreatexHttpError`, `RecreatexApiError`, `RecreatexTimeoutError`)
- automatic retry on network + 5xx (also for document downloads), never on validation errors
- auto-pagination for `FindSales`, `FindArticles`, `FindArticleSalesOrders`,
  `FindOrganisedVisits` and `ListExpositionPeriods` (each returned only one page before)
- `dedupSaleLines()` for the duplicate bon lines of `FindSales`
- request fields aligned with `/json/documentation`; where the server ignores a field the
  SDK says so in the type (see ENDPOINTS.md)
- known pitfalls hard-coded so you don't trip the `Article: null` / `MissingCustomer` /
  `PayLater` traps

## Repo layout

```
src/
  core/         → bundled to dist/core.js (subpath: recreatex-sdk/core)
  spacemagic/   → bundled to dist/spacemagic.js (subpath: recreatex-sdk/spacemagic)
test/           → vitest, no network
scripts/smoke.ts → read-only check against the live API
docs/
examples/
```

## Develop

```bash
npm install
npm run typecheck
npm test
npm run build        # rebuilds dist/; commit it, consumers install from git
npm run smoke        # live, read-only; needs RECREATEX_PASSWORD (env or .env.local)
```

Toolchain: TypeScript 6, tsup 9, vitest 5. TypeScript 7 type-checks this code, but tsup
still needs the classic compiler API for the `.d.ts` build.
