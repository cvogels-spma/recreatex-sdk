# AGENTS.md — cheat-sheet for AI / LLM agents

If you are an AI agent reading this for the first time, internalise this
file before writing code against `recreatex-sdk`. Most "Recreatex
returned a weird error" sessions end on one of the items below.

## Auth

Every JSON request body is `{ Context, ...payload }`. Context fields:

```json
{
  "Language": "de",
  "ShopId":   "<UUID>",
  "SessionId": "<UUID>",
  "Password": "<plaintext>"
}
```

The `ReCreateXClient` builds this for you. **Never hand-craft Context** —
you'll forget a field. Use `client.post()` if you must reach a custom
endpoint.

For Space Magic the canonical IDs are exported as
`recreatex-sdk/spacemagic` constants:
- `SHOP_ID`
- `DIVISION_IDS.spaceMagic | webshop | administration`
- `GUEST_CUSTOMER_ID` — use this for anonymous voucher orders
- `SPACE_MAGIC_ZONE_ID`
- `PAYMENT_METHOD_ID_KARTENZAHLUNG`

## Pitfalls (verified live)

| Pitfall | Fix |
|---|---|
| `data.succes === false` is silent | The client throws `RecreatexApiError`. Don't second-guess; it's already handled. |
| Passing `Article: null` on `ArticleSale` → "Object reference not set..." | Always `Article: { Id: "<guid>" }`. |
| `PayLater: true` for Gift Certificates → `InvalidPayLaterPayment` | Provide a real `Payments[]` array with a `BasketPayment`. |
| `CustomerId: "00000000-..."` → `MissingCustomer` | Use `GUEST_CUSTOMER_ID` from `recreatex-sdk/spacemagic`. |
| `BasketPayment.PaymentMethod: { ... }` (nested) → type-not-found | Flat: `PaymentMethodId: "<guid>"` directly on the `BasketPayment`. |
| `ListVisitingCustomersInformation.totalVisitors` for "guests today" | It counts SCANS (~2× real). Use `findAccessZones({ today: true }).visitorsToday` and persist it. |
| `FindAccessZones` with `OccupancyFrom/Until` for historic counts | The fields are accepted but ignored. The endpoint is LIVE-ONLY. |
| `ListSalesInformation.amount` ≠ cash flow | It's the gross booking value; pre-payments inflate it. |
| Apply-rebook endpoint missing | Not in the JSON docs. Use `cancelOrganisedVisit + rebuy` until Lukas Goetz confirms the `$type` for `OrganisedVisitRebooking` in `CheckoutBasket`. |
| `data.succes` typo | The Recreatex API spells it `succes` (single-s). Don't "fix" it. |
| Just-created GiftCertificate has `number: null` | Recreatex hasn't populated the PersonCard yet. The visible voucher code is in the DocumentService PDF; use `findGiftCertificates` only for `id` lookup or `salesSeriesID` matching. |
| `findOverviewByDay` is missing the period id | Verified: `FindExpositionOverviewByDay` only carries `from / until / occupancy / prices`. Use `expositions.listPeriods(id, fromIso, untilIso)` to obtain the addressable `ExpositionPeriodId`. |
| `ExpositionPeriodReservation.Quantity` rejected | Recreatex: "Quantity is not supported For ExpositionPeriodReservation. Use ExpositionPeriodReservationEntry instead." — set outer `Quantity: 0`, carry the seat count on `Entries[].ParticipantCount`. |
| Entry field names — `Quantity` / `Visitors` are wrong | The actual fields are `ParticipantCount` + `Participants` (NOT `Quantity` / `Visitors`). Verified via the validator's echo. Send `Participants: []` (empty array, not undefined) for webshop / `askNames: false` expositions. |
| `OrganisedVisitValidPriceGroupsRule` despite a valid-looking PriceGroupId | The "real" `PriceGroupId` is `prices[].group.id` from `Expositions/FindExpositions(Includes.Pricing=true)`. The field that `FindExpositionOverviewByDay` returns under the name `priceGroupId` is actually a **price id** (= `prices[].id`) and is rejected by the basket validator. |
| `ExpositionPeriodReservation` checkout fails with "Die Ausstellungsreservierung muss gesperrt sein" | Required pre-step: `General/LockBasketItems` returns the same items with a fresh `LockTicket` (~10 min expiry). Inject the locked items into the basket before `CheckoutBasket`. The `buildBirthdayBasket` helper does NOT lock — wrap the call yourself or use the higher-level wrapper in `space-magic-birthday-landing-page/functions/_shared/recreatex.js#createBirthdayOrganisedVisit`. |
| 50 % deposit not visible as "open balance" | Set `Basket.Payments[0].Amount = depositAmount`, `Basket.Balance = grossTotal - depositAmount`, leave `Basket.PayLater = false`. Recreatex echoes the deposit back as `advancementPrice` on the locked item and shows the rest as a remaining balance on the OrganisedVisit. |
| Need all concrete gastro articles | Start with `listGastroArticles(rx)` from `recreatex-sdk/spacemagic`; it expands the known gastro article groups into concrete articles with id/code/name/price. Use those ids/codes for article-level reports. |
| Article-level sales history | Use `articles.getArticleSalesReport()` / `FindArticleSalesOrders`. The public docs expose date/person/type filters, not a reliable ArticleId filter, so the SDK matches returned sales lines by article id/code when present and falls back to the line description. Prefer exact `code` or `articleId` when you have it. The live API rejects string enum values like `"Sales"` here; the SDK maps them to numeric enum values before sending. |

## Two date formats

| Namespace | Format | Helper |
|---|---|---|
| Manager, General, Articles | `"YYYY-MM-DD 00:00:00.000"` | `dayRangeDotted()` |
| Expositions | `"YYYY-MM-DDT00:00:00"` | `dayRangeIso()` |

## Two payment systems

- Voucher shop / public webshop: **Mollie** (NOT Enviso Pay, despite older
  notes saying otherwise).
- The SDK is payment-agnostic. You pass `BasketPayment.ExtraInfo*`,
  `OrderId`, `TrxId`, `PayId` to thread Mollie/Enviso/whatever IDs through.

## Calling the client

```ts
// happy path
const visits = await rx.expositions.findOrganisedVisits({
  fromYmd: '2026-04-01',
  untilYmd: '2026-04-30',
});

const hamburger = await rx.articles.getArticleSalesReport({
  namePattern: 'Hamburger',
  from: '2026-05-01 00:00:00.000',
  until: '2026-05-31 23:59:59.000',
});
// hamburger.totals.quantity, hamburger.currentPrice, hamburger.history

// error path
import { RecreatexApiError, RecreatexHttpError } from 'recreatex-sdk/core';
try {
  ...
} catch (err) {
  if (err instanceof RecreatexApiError) {
    // err.brokenRuleName, err.raw — basket validation, business rule, etc.
  } else if (err instanceof RecreatexHttpError) {
    // err.status, err.body
  } else {
    // network / unknown
  }
}
```

## Common gotchas with the code itself

- The wire types are PascalCase (`SearchCriteria`, `Includes`,
  `OccupancyFrom`); the SDK API is camelCase (`fromYmd`, `today`,
  `includes.occupancy`). Don't mix them.
- All sub-modules accept `callOpts` as an optional last arg
  (`{ language, sessionId, timeoutMs, signal, noRetry }`). Use it for
  cancellation and per-request overrides — don't construct a fresh client
  per call.
- The voucher checkout flow is the only one that needs a fresh
  `SessionId` per buyer. Construct the client with
  `sessionId: () => uuidv4()` and the SDK regenerates it on every
  call.

## When you need an endpoint that's not yet wrapped

Use `client.post()` directly — it adds the Context, runs retry/timeout,
throws typed errors. Then propose adding a typed wrapper to the
appropriate module file (`src/core/modules/<namespace>.ts`).
