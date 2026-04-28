# AGENTS.md — cheat-sheet for AI / LLM agents

If you are an AI agent reading this for the first time, internalise this
file before writing code against `@recreatex-sdk/*`. Most "Recreatex
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
`@recreatex-sdk/spacemagic` constants:
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
| `CustomerId: "00000000-..."` → `MissingCustomer` | Use `GUEST_CUSTOMER_ID` from `@recreatex-sdk/spacemagic`. |
| `BasketPayment.PaymentMethod: { ... }` (nested) → type-not-found | Flat: `PaymentMethodId: "<guid>"` directly on the `BasketPayment`. |
| `ListVisitingCustomersInformation.totalVisitors` for "guests today" | It counts SCANS (~2× real). Use `findAccessZones({ today: true }).visitorsToday` and persist it. |
| `FindAccessZones` with `OccupancyFrom/Until` for historic counts | The fields are accepted but ignored. The endpoint is LIVE-ONLY. |
| `ListSalesInformation.amount` ≠ cash flow | It's the gross booking value; pre-payments inflate it. |
| Apply-rebook endpoint missing | Not in the JSON docs. Use `cancelOrganisedVisit + rebuy` until Lukas Goetz confirms the `$type` for `OrganisedVisitRebooking` in `CheckoutBasket`. |
| `data.succes` typo | The Recreatex API spells it `succes` (single-s). Don't "fix" it. |

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

// error path
import { RecreatexApiError, RecreatexHttpError } from '@recreatex-sdk/core';
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
appropriate module file (`packages/core/src/modules/<namespace>.ts`).
