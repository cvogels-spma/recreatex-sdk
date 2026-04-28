# Migration guide

Three Space Magic projects currently call Recreatex directly. This guide
shows how to swap each over to `recreatex-sdk`.

## 1. space-magic-birthday-landing-page

Current: `functions/_shared/recreatex.js` — JS, Cloudflare Pages-Functions.

Drop-in replacement:

```js
// functions/_shared/recreatex.js (after migration)
import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID } from 'recreatex-sdk/spacemagic';

export function rxClient(env) {
  return new ReCreateXClient({
    baseUrl: 'https://wsdlspacemagic.recreatex.be',
    shopId: SHOP_ID,
    password: env.RECREATEX_PASSWORD,
  });
}

export async function listExpositionsForPackage(env, pkg) {
  const rx = rxClient(env);
  const queries = await Promise.all(
    (pkg.expositionNames || []).map((name) =>
      rx.expositions.findExpositions({ namePattern: name }),
    ),
  );
  // … same dedupe + map as before
}

export async function findPeriodDates(env, expositionId, fromIso, untilIso) {
  return rxClient(env).expositions.findPeriodDates(expositionId, fromIso, untilIso);
}

export async function findOverviewByDay(env, expositionId, dateYmd) {
  return rxClient(env).expositions.findOverviewByDay(expositionId, dateYmd);
}
```

Helper functions `jsonResponse()` / `errorResponse()` stay where they are —
they aren't Recreatex-specific.

## 2. space-magic-kpi-dashboard

Current: `apps/api/src/services/recreatex.ts` plus inlined `fetch` calls
in `routes/{occupancy,live-revenue,gastro-analytics,recreatex-sync}.ts`.

### `services/recreatex.ts`

Replace the entire file with re-exports:

```ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import type { Env } from '../types.js';

export {
  type OrganisedVisit,
  type OrganisedVisitArticle,
  type OrganisedVisitPeriodReservation,
  type OrganisedVisitPerson,
  type OrganisedVisitSaleGuest,
  type OrganisedVisitSaleInfo,
  ymdWindow as defaultSyncWindow,
} from 'recreatex-sdk/core';

export {
  categorizeVisit,
  extractKind,
  extractPaket,
  extractEssen,
  extractKontakt,
  mapBirthdayBooking,
  mapEscapeBooking,
  type VisitCategory,
  type BookingRow,
  type EscapeRow,
} from 'recreatex-sdk/spacemagic';

export function rxClient(env: Env) {
  return new ReCreateXClient({
    baseUrl: env.RECREATEX_BASE_URL,
    shopId: env.RECREATEX_SHOP_ID,
    password: env.RECREATEX_PASSWORD,
  });
}

export async function findOrganisedVisits(
  env: Env,
  opts: { fromYmd: string; untilYmd: string; pageSize?: number; maxPages?: number },
) {
  const fetchOpts: { pageSize?: number; maxPages?: number } = {};
  if (opts.pageSize !== undefined) fetchOpts.pageSize = opts.pageSize;
  if (opts.maxPages !== undefined) fetchOpts.maxPages = opts.maxPages;
  return rxClient(env).expositions.findOrganisedVisits(
    { fromYmd: opts.fromYmd, untilYmd: opts.untilYmd },
    fetchOpts,
  );
}
```

Use `defaultSyncWindow` callers will continue to work since `ymdWindow` is
re-exported under that name. Adapt callsites if the signature changes.

### `routes/occupancy.ts`

Replace the inlined fetch with:

```ts
const zones = await rxClient(c.env).general.findAccessZones({ today: true, includes: { occupancy: true } }, { language: 'en' });
```

### `routes/live-revenue.ts`

```ts
const { from, until } = dayRangeDotted();
const sales = await rxClient(c.env).manager.listSalesInformation({ from, until });
```

### `routes/gastro-analytics.ts`

```ts
import { gastroGroupName } from 'recreatex-sdk/spacemagic';

const sales = await rxClient(c.env).manager.listSalesInformation({
  from, until, groupByArticleGroup: true,
});
const enriched = sales.map((s) => ({ ...s, groupName: gastroGroupName(s.articleGroupID) }));
```

The `GASTRO_GROUPS` constant in this file can be deleted — it's now in the
SDK as `GASTRO_GROUP_MAP`.

### Verification

`/api/recreatex/sync` should run end-to-end and write the same
`last_recreatex_sync.summary` counts as before. Snapshot before, migrate,
diff after.

## 3. space-magic-voucher-shop (greenfield)

The shop hasn't been built yet. Start from the SDK:

```ts
// server/api/vouchers.get.ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID, VOUCHER_SKUS } from 'recreatex-sdk/spacemagic';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const rx = new ReCreateXClient({
    baseUrl: config.recreatexBaseUrl,
    shopId: SHOP_ID,
    password: config.recreatexPassword,
    sessionId: () => crypto.randomUUID(),
  });
  // For static catalogue, prefer the local constant; for dynamic pricing, hit the API.
  const articles = await rx.articles.findArticles({ namePattern: 'Gutschein' });
  return { vouchers: articles };
});
```

See `examples/voucher-checkout.ts` for the full ReCalculate → Lock →
Checkout → PDF flow.

## Migration order (recommended)

1. **birthday-landing-page** (smallest footprint, JS Pages-Functions) — fastest validation that the SDK runs in Cloudflare Pages-Functions.
2. **kpi-dashboard** (TS Hono Worker, highest reuse) — biggest win, biggest test surface.
3. **voucher-shop** (greenfield Nuxt 3) — proves the SDK against fresh code.

## Roll-back plan

Each migration is one PR per project. Keep the old `recreatex.js` /
`recreatex.ts` file in place during the PR; the SDK calls live alongside
the inlined ones, then in a second commit you delete the inlined code
once snapshots match.
