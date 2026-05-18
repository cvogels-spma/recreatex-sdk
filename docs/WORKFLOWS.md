# Operational workflows

This document is the "what do I run for the business question?" layer above
the raw endpoint reference. It focuses on Space Magic's current recurring
needs: Gastro sales, shop revenue, visitor KPIs, discount codes and historical
booking invoice requests.

## Client setup

Create one `ReCreateXClient` per process/request scope and keep credentials in
environment variables:

```ts
import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID } from 'recreatex-sdk/spacemagic';

export function rxClient(env: { RECREATEX_PASSWORD: string; RECREATEX_BASE_URL?: string }) {
  return new ReCreateXClient({
    baseUrl: env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
    shopId: SHOP_ID,
    password: env.RECREATEX_PASSWORD,
  });
}
```

Use the SDK helpers for date formats:

| Namespace | Format | Typical helper |
|---|---|---|
| `general`, `manager`, `articles` | `YYYY-MM-DD HH:mm:ss.SSS` | `dayRangeDotted()` |
| `expositions` | `YYYY-MM-DDTHH:mm:ss` | `dayRangeIso()` |

## 1. Gastro article catalogue

Question: "Which Gastro articles exist, and what are their ids/codes/prices?"

Use `listGastroArticles()`:

```ts
import { DIVISION_IDS, listGastroArticles } from 'recreatex-sdk/spacemagic';

const catalog = await listGastroArticles(rx, {
  divisionId: DIVISION_IDS.spaceMagic,
});

const rows = catalog.flatMap((group) =>
  group.articles.map((article) => ({
    groupId: group.groupId,
    groupName: group.groupName,
    articleId: article.id,
    code: article.code,
    name: article.name,
    price: article.price,
    vatPercentage: article.vatPercentage,
  })),
);
```

Persist this as a slowly changing reference table in analytics systems. It is
the best key map for later sales syncs.

## 2. Sales for a single Gastro article

Question: "How many Hamburger/Cheeseburger did we sell, what did they cost,
and how did that develop over time?"

Use `articles.getArticleSalesReport()` when the answer is about one article:

```ts
const report = await rx.articles.getArticleSalesReport({
  code: '11004-0002',
  from: '2026-05-01 00:00:00.000',
  until: '2026-05-31 23:59:59.000',
  historyGroup: 'day',
});

console.log({
  articleId: report.articleId,
  name: report.article?.name,
  currentPrice: report.currentPrice,
  quantity: report.totals.quantity,
  revenue: report.totals.totalPrice,
  averageUnitPrice: report.totals.averageUnitPrice,
});
console.table(report.history);
```

Prefer `code` or `articleId`. `namePattern` is useful for exploration, but the
SDK throws when multiple articles match so a report cannot accidentally mix
several items.

## 3. Day-by-day Gastro sales sync

Question: "Give me all Gastro item-level sales for a dashboard or export."

Use `syncGastroSales()`. It calls `FindArticleSalesOrders` once per day and
maps sales lines onto the known Gastro catalogue:

```ts
import { DIVISION_IDS, syncGastroSales } from 'recreatex-sdk/spacemagic';

const result = await syncGastroSales(rx, {
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-31',
  divisionId: DIVISION_IDS.spaceMagic,
});

console.table(result.rows);
console.log(result.totals);
```

Each row is keyed by `date + articleId` and includes:

- article group id/name
- article id/code/name
- catalogue price
- sold quantity
- realised gross total
- line count
- average realised unit price

Filter to one article or a small set:

```ts
const result = await syncGastroSales(rx, {
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-31',
  articleCodes: ['11004-0002'],
});
```

Why day-by-day? Long `FindArticleSalesOrders` ranges can page in a way that
hides older lines if the caller stops too early. A daily sync keeps each query
small and makes missed days obvious.

## 4. Shop and revenue KPIs

Question: "What did we sell, grouped by day/division/article group?"

Use `manager.listSalesInformation()` for high-level revenue dashboards:

```ts
const sales = await rx.manager.listSalesInformation({
  from: '2026-05-18 00:00:00.000',
  until: '2026-05-18 23:59:59.000',
  groupByDate: true,
  groupByDivision: true,
  groupByArticleGroup: true,
});
```

Interpretation notes:

- `amount` is gross booking/sales value, not necessarily cash received that
  day.
- Pre-payments and balances can make revenue, payments and booking value
  diverge.
- Use `general.findSales()` only for lower-level sales/transaction views. It
  does not replace ManagerApp revenue aggregates for dashboard reporting.

For Gastro group labels, map `articleGroupID` through `gastroGroupName()`:

```ts
import { gastroGroupName } from 'recreatex-sdk/spacemagic';

const rows = sales.map((row) => ({
  ...row,
  articleGroupName: gastroGroupName(row.articleGroupID),
}));
```

## 5. Visitor counts

Question: "How many visitors are currently inside, and how many came today?"

Use live access-zone occupancy:

```ts
const zones = await rx.general.findAccessZones({
  today: true,
  includes: { occupancy: true },
});

const totalCurrent = zones.reduce(
  (sum, zone) => sum + (zone.occupancy?.visitorsCurrent ?? 0),
  0,
);
const totalToday = zones.reduce(
  (sum, zone) => sum + (zone.occupancy?.visitorsToday ?? 0),
  0,
);
```

For historical charts, persist snapshots yourself. The live endpoint accepts
`OccupancyFrom`/`OccupancyUntil`, but verified live behavior is that
`visitorsCurrent` and `visitorsToday` still reflect the current state/today.

For scan-based history, use `manager.listVisitingCustomersInformation()`, but
label the metric clearly as scans/visiting-customer information. It can differ
from true guest count.

## 6. Discount and voucher codes

Question: "Is this discount or voucher code valid?"

Known codes can be checked:

```ts
import { GUEST_CUSTOMER_ID } from 'recreatex-sdk/spacemagic';

const basket = {
  CustomerId: GUEST_CUSTOMER_ID,
  Items: [],
  CouponCodes: ['OPENING10'],
};

const coupon = await rx.general.couponCalculate(basket);
const voucher = await rx.general.voucherValidate(['OPENING10']);
```

For checkout:

```ts
const reserved = await rx.general.couponReserve(basket);
try {
  // ReCalculateBasket -> LockBasketItems -> CheckoutBasket
} finally {
  await rx.general.couponRelease();
}
```

Current public API limitation: `CouponCalculate`, `CouponReserve`,
`CouponRelease` and `VoucherValidate` work for known codes. No endpoint has
been found in the public JSON API that lists every historical or future coupon
definition.

## 7. Historical Gantner/Recreatex booking details

Question: "A customer asks for an invoice/receipt for a past booking. Can we
pull the booking details?"

Use `getBookingInvoiceDraft()`:

```ts
import {
  getBookingInvoiceDraft,
  renderBookingInvoiceHtml,
} from 'recreatex-sdk/spacemagic';

const draft = await getBookingInvoiceDraft(rx, {
  bookingNo: 222645,
  fromYmd: '2026-05-01',
  untilYmd: '2026-05-18',
});

const html = renderBookingInvoiceHtml(draft);
```

Lookup options:

| Criteria | Notes |
|---|---|
| `organisedVisitId` | Most precise and fastest |
| `orderNumber` | Useful when the customer has web order details |
| `bookingNo + fromYmd + untilYmd` | Good for back-office booking numbers |

The draft includes customer/contact data, booking number, order number, service
period, booking/article lines, gross/net/VAT amounts where available, paid
amount, open balance, coupon discount and raw OrganisedVisit data.

If Recreatex has an OrganisedVisit document template configured, download the
official booking PDF:

```ts
const pdf = await rx.documents.organisedVisitPdf({
  organisedVisitId: draft.bookingId,
});
```

Current public API limitation: the SDK can retrieve historical bookings and
produce an invoice-ready draft, but no public endpoint has been found that
creates a new official Recreatex invoice after the fact.

## 8. Suggested persistence model for dashboards

For robust reporting, persist raw-ish snapshots instead of only final totals:

| Table | Source |
|---|---|
| `recreatex_gastro_articles` | `listGastroArticles()` |
| `recreatex_gastro_sales_daily` | `syncGastroSales()` rows |
| `recreatex_manager_sales_daily` | `manager.listSalesInformation()` |
| `recreatex_occupancy_snapshots` | `general.findAccessZones({ today: true })` |
| `recreatex_organised_visits` | `expositions.findOrganisedVisits()` |

Store the sync window and run id with each import. That makes Recreatex
pagination quirks and later back-office corrections easier to audit.
