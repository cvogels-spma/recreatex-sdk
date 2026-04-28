# recreatex-sdk

TypeScript SDK for the **Recreatex / Vintia / Gantner** JSON API
(`wsdlspacemagic.recreatex.be` and friends).

Two packages:

| Package | Purpose |
|---|---|
| `@recreatex-sdk/core` | Domain-agnostic API client (HTTP, types, retry, pagination, basket flow) |
| `@recreatex-sdk/spacemagic` | Space-Magic-specific helpers (voucher SKUs, gastro groups, visit mappers) |

## Quickstart

```ts
import { ReCreateXClient } from '@recreatex-sdk/core';
import { SHOP_ID, GUEST_CUSTOMER_ID, VOUCHER_SKUS } from '@recreatex-sdk/spacemagic';

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
```

## Install

```bash
# from a consuming project (npm or pnpm)
npm install git+https://github.com/cvogels-spma/recreatex-sdk.git#v0.1.0
# or pin a specific commit:
npm install git+https://github.com/cvogels-spma/recreatex-sdk.git#abc1234
```

When the workspace publishes both packages from a single repo, the consumer
gets `@recreatex-sdk/core` and (optionally) `@recreatex-sdk/spacemagic` in
one install.

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
- known-pitfalls hard-coded so you don't trip the `Article: null` /
  `MissingCustomer` / `PayLater` traps

## Repo layout

```
packages/
  core/         @recreatex-sdk/core
  spacemagic/   @recreatex-sdk/spacemagic
docs/
examples/
```

## Develop

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

Smoke-tests against the live API live in `scripts/smoke.ts` and read
credentials from `.env.local` (gitignored).
