# Endpoint reference

Every Recreatex JSON endpoint surfaced by `recreatex-sdk/core`. All are
**POST** with a JSON body that includes a `Context` block (the SDK injects
this for you).

Base URL: `https://wsdlspacemagic.recreatex.be`. The document service
sits at `${baseUrl}/WebShopDocumentService.svc/...` and uses **GET**.

All 34 wire paths below were checked against the server's endpoint list on 2026-10-25
(`/json/documentation`, name and namespace), and every read wrapper ran against the live
API (`npm run smoke`).

| Module | Method on `client.*` | Wire path | Use case |
|---|---|---|---|
| `articles` | `findArticles(criteria)` | `/Json/Articles/FindArticles/` | Catalogue (auto-pages). `code` is matched locally, the server has no code criterion |
| `articles` | `findArticlesPage(criteria)` | `/Json/Articles/FindArticles/` | Single page, unfiltered by `code` |
| `articles` | `findArticleById(id)` | `/Json/Articles/FindArticles/` | One article |
| `articles` | `listArticleGroups()` | `/Json/Articles/ListArticleGroups/` | Group taxonomy |
| `articles` | `getArticlePriceInformation({ articleId })` | `/Json/Articles/GetArticlePriceInformation/` | Detailed current price |
| `articles` | `findArticleSalesOrders(criteria)` | `/Json/Articles/FindArticleSalesOrders/` | Sold article lines with code, auto-pages, no duplicate lines |
| `articles` | `findArticleSalesOrdersPage(criteria)` | `/Json/Articles/FindArticleSalesOrders/` | Single page |
| `articles` | `getArticleSalesReport(criteria)` | composed | Article dossier: price, sold quantity, revenue, history |
| `expositions` | `findExpositions(criteria)` | `/Json/Expositions/FindExpositions/` | Rooms by name |
| `expositions` | `findPeriodDates(id, fromIso, untilIso)` | `/Json/Expositions/FindExpositionPeriodDates/` | Free days |
| `expositions` | `findOverviewByDay(id, ymd)` | `/Json/Expositions/FindExpositionOverviewByDay/` | Slots + capacity (no period id!). Takes `YYYY-MM-DD`; a timestamp gives HTTP 500 |
| `expositions` | `listPeriods(id, fromIso, untilIso)` | `/Json/Expositions/ListExpositionPeriods/` | Slots **with** period id (use for basket builds), auto-pages |
| `expositions` | `listPeriodsPage(id, fromIso, untilIso)` | `/Json/Expositions/ListExpositionPeriods/` | Single page |
| `expositions` | `findOrganisedVisits(criteria)` | `/Json/Expositions/FindOrganisedVisits/` | Bookings (auto-pages) |
| `expositions` | `findOrganisedVisitsPage(criteria)` | `/Json/Expositions/FindOrganisedVisits/` | Single page |
| `expositions` | `adjustOrganisedVisit(input)` | `/Json/Expositions/AdjustOrganisedVisit/` | Change quantities |
| `expositions` | `cancelOrganisedVisit(input)` | `/Json/Expositions/CancelOrganisedVisit/` | Cancel + refund prep |
| `expositions` | `getRebookingCosts(input)` | `/Json/Expositions/GetOrganisedVisitRebookingCosts/` | Slot-change cost preview |
| `general` | `findAccessZones({ today })` | `/Json/General/FindAccessZones/` | Live occupancy |
| `general` | `getReaders()` | `/Json/General/GetReaders/` | Readers (eCarts, Laser Tag, …) |
| `general` | `listDivisions()` | `/Json/General/ListDivisions/` | Divisions |
| `general` | `getPointOfSales()` | `/Json/General/GetPointOfSales/` | POS terminals |
| `general` | `listPaymentMethods()` | `/Json/General/ListPaymentMethods/` | 32 payment methods |
| `general` | `findPerson(criteria)` | `/Json/General/FindPerson/` | Person lookup by id, email, first name, name, login. At least one filter |
| `general` | `findSales(criteria, callOpts?, paginateOpts?)` | `/Json/General/FindSales/` | All bons of the window, paginated (500/page; throws at the page cap). See "What FindSales covers" below |
| `general` | `findSalesPage(criteria, paging, callOpts?)` | `/Json/General/FindSales/` | One page; `Paging` goes inside `Criteria` |
| `general` | `reCalculateBasket(basket)` | `/Json/General/ReCalculateBasket/` | Basket totals |
| `general` | `lockBasketItems(items)` | `/Json/General/LockBasketItems/` | Reserve items for payment |
| `general` | `checkoutBasket(basket)` | `/Json/General/CheckoutBasket/` | Finalise sale |
| `general` | `findPersonCards(criteria)` | `/Json/General/FindPersonCards/` | Cards / RFID wristbands (`card` is an object, see below) |
| `general` | `getDigitalWallets(criteria)` | `/Json/General/GetDigitalWallets/` | Wallet per wristband: balance + open postings (all wallets without `personId`) |
| `general` | `getDigitalWallet(cardNumber)` | `/Json/General/GetDigitalWallet/` | One wristband's wallet, `null` if unknown |
| `general` | `findGiftCertificates(criteria)` | `/Json/General/FindGiftCertificates/` | One page of a customer's gift certificates (filters: customer, barcode; `id`/`number` are ignored by the server) |
| `general` | `setGiftCertificatePrinted(id)` | `/Json/General/SetGiftCertificatePrinted/` | Mark a cert as delivered (sets `printDate`) |
| `manager` | `listSalesInformation(criteria)` | `/Json/ManagerApp/ListSalesInformation/` | Aggregated revenue; filters `divisionIds`, `articleGroupIds` |
| `manager` | `listVisitingCustomersInformation(criteria)` | `/Json/ManagerApp/ListVisitingCustomersInformation/` | Visitor scans; same filters |
| `documents` | `giftCertificatePdf({ salesLineId })` | `/WebShopDocumentService.svc/GiftCertificates/{ShopId}/{lang}/{SalesLineId}` | Voucher PDF |
| `documents` | `giftCertificateHelp(lang)` | `/WebShopDocumentService.svc/Help/GiftCertificates/{ShopId}/{lang}` | Template merge-fields |

## Date formats

| Namespace | Format | Helper |
|---|---|---|
| Manager / General / Articles | `"YYYY-MM-DD HH:mm:ss.SSS"` | `dayRangeDotted()` |
| Expositions | `"YYYY-MM-DDTHH:mm:ss"` | `dayRangeIso()` |

## Request fields the server ignores (verified 2026-10-25)

Recreatex answers an unknown criterion with the UNFILTERED result, not with an error. These
were all sent by earlier SDK versions:

| Call | Ignored field | What came back | Since 0.4.0 |
|---|---|---|---|
| `FindPerson` | `LastName` | 50 arbitrary persons | sent as `Name` |
| `FindPerson` | (response) | `{ result: Person[] }`, the SDK read `persons` → always `[]` | fixed |
| `ListSalesInformation`, `ListVisitingCustomersInformation` | `DivisionId`, `ArticleGroupId` (singular) | whole-day totals (socks group: 16,465.51 € instead of 792.51 €) | sent as lists `DivisionIds`, `ArticleGroupIds` |
| `FindArticles` | `Code` | every article | matched locally in `findArticles` |
| `FindArticles` | `Includes.PriceInfo` | no price (0) | alias of `Includes.Price` |
| `FindArticles` | `DivisionId` (SearchCriteria) | no effect | documented only |
| `FindPersonCards` | `CustomerId` | unfiltered page | no longer sent; use `personId` |
| `FindGiftCertificates` | `Id`, `Number` | the customer's whole page | still sent, documented; match on the records yourself |

Field names are case-insensitive on the server (`ArticleID` and `ArticleId` both work), but
the SDK sends the documented spelling.

## What FindSales covers

On 2026-10-24 the day's `FindSales` lines (16,551.51 €) and `FindArticleSalesOrders`
(type `All`, 16,465.51 €) matched `ListSalesInformation` (16,465.51 €) within 0.5 %.

- Gastro booked onto a wristband is not a bon at the F&B till. It appears on the EXIT bon
  (Nachzahlautomat or check-in desk) when the guest settles. Open postings live in the
  wallet (`getDigitalWallets`).
- ⚠ Webshop payments (bons that carry only `Ausstellung Vorauszahlung`, paid by PayPal,
  Klarna, card) are posted on the POS **"Nachzahlautomat"**. Split bons by their content,
  not by POS: on 2026-10-24, 4,218.75 € of the day were webshop payments, 9,035.30 € check-in
  bons (those that issue a wristband), 3,297.46 € exit and desk.
- Lines come back duplicated (same `id`): use `dedupSaleLines()`.
- A bon carries no wristband reference.

## Article sales orders: type `All` vs `Sales`

`FindArticleSalesOrders` takes a numeric `Type`; the SDK maps names. On 2026-10-24:
`All` (0) 5,313 lines / 16,465.51 €, `Sales` (1) 2,495 lines / 13,534.12 €. `Sales` leaves
out package components (e.g. `Anteil Park 4h WE` from birthday packages, 2,408.39 €),
single entries, gift certificates and the 0-€ attraction entitlements. For gastro articles
both are the same. Use `All` when the total must match the till.

## Pagination

Endpoints that accept `Paging: { PageIndex, PageSize }`:
- `Articles/FindArticles`
- `Articles/FindArticleSalesOrders`
- `Expositions/FindExpositions`
- `Expositions/FindOrganisedVisits`
- `Expositions/ListExpositionPeriods`
- `General/FindSales` (inside `Criteria`)
- `General/FindPersonCards`, `General/FindGiftCertificates`, `General/FindPerson`

The SDK exposes both `findXyz()` (auto-pages) and `findXyzPage()` (single
page). Default `PageSize`: 500 for sales, 200 for visits/article sales orders, 50 for
articles/expositions.

## Article-level sales

Use `articles.getArticleSalesReport()` for the common “Hamburger dossier”
case:

```ts
const report = await rx.articles.getArticleSalesReport({
  namePattern: 'Hamburger',
  from: '2026-05-01 00:00:00.000',
  until: '2026-05-31 23:59:59.000',
});

console.log(report.currentPrice);          // catalogue / price-info price
console.log(report.totals.quantity);       // sold units
console.log(report.totals.totalPrice);     // gross line total
console.log(report.history);               // daily buckets by default
```

`FindArticleSalesOrders` returns sold article lines with `articleId`, `articleCode`,
`articleName`, bon `number`, date, quantity, unit and total price (verified 2026-10-24),
one line per sale line and without the duplicates of `FindSales`. The report matches on id
or code and falls back to the line description. The live endpoint expects numeric `Type`
enum values; the SDK accepts names like `'Sales'` and translates them (see "type `All` vs
`Sales`" below; for till totals pass `type: 'All'`).

## Response shape conventions

- **Most read endpoints**: `{ <resourceCamelCase>: T[], succes?: boolean, message?: string }`.
  The typo `succes` is intentional — Recreatex spells it that way.
- **Basket endpoints**: `{ Result: { ... } }` or `{ Basket: ... }` (note the
  PascalCase here, matching the wire format).
- The SDK's client throws on `succes === false` AND on
  `Result.BasketValidationResult.IsValid === false`.

## Aggregation flags

`ListSalesInformation` and `ListVisitingCustomersInformation` accept any
combination of:
- `groupByDate: true`
- `groupByDivision: true`
- `groupByArticleGroup: true`

Returned entries get the relevant fields populated; absent fields are
`null`. The id fields are spelt `divisionID` / `articleGroupID` as the server sends them.

Filters are the lists `DivisionIds` / `ArticleGroupIds` (`divisionIds`, `articleGroupIds`;
the singular SDK options are sent as one-element lists).

## Discovering whether an endpoint exists

The service tells you, without credentials, whether a path is real:

```bash
curl -s -X POST https://wsdlspacemagic.recreatex.be/Json/<Namespace>/<Method>/ \
     -H 'Content-Type: application/json' -d '{}'
```

- **Exists** → HTTP 200 + `{"succes":false,"message":"The Web.Config does not
  contain a definition of 'ShopId'"}` (it got far enough to want a Context).
- **Does not exist** → HTTP 404 + a `Nancy.ErrorHandling.DefaultStatusCodeHandler`
  body.

Sending a real `Context` with a wrong password yields `"Invalid WSDL password"`,
so the password cannot be side-stepped — only endpoint *existence* is
discoverable this way.

### ⚠ Read the server's own endpoint list first

`GET https://wsdlspacemagic.recreatex.be/json/documentation` lists every JSON
endpoint the service has (562 on 2026-10-24), and
`/json/documentation/<Method>` shows path, request and response shape. The
404 list below was built by GUESSING names, and it missed the wallets: for
three months this file said a wristband's balance was unreachable. Grep that
list before concluding an endpoint does not exist.

### Cards / wristbands: what DOES exist (verified 2026-10-24)

| Endpoint | What it gives | Notes |
|---|---|---|
| `General/GetDigitalWallets` | One wallet per physical wristband (3,090 at Space Magic): `cardNumber` (Gantner UID), `balance`, `creditLimit`, `articleDescription` (`Hauskredit Erwachsene`, `Geburtstags Wallet`, `Mitarbeiter`, …), `transactions` | **Omit `PersonId`** for all wallets (with it: only that customer's, e.g. the walk-in collective customer had 1,529); `PersonId: null` → HTTP 500. ~3.5 MB / 3–5 s with transactions. |
| `General/GetDigitalWallet` | The same for one `CardNumber` | `digitalWallet: null` for an unknown number |
| `General/GetCard` | The division card for a `CardString`, with its person cards | |
| `Counter/GetCreditSalesByDivisionCard` | "SalesItems put on the customer's card" for a `PersonCardId` | Answers `result: true`, but was empty for all 2,533 band cards tried on 2026-10-24 (park closed, no open postings). Not wrapped. |
| `Counter/GetTableSalesWithoutTable` | Open orders of a POS (`PointOfSaleId`, `SalesZoneId`) | Empty for F&B01 on 2026-10-24. Not wrapped. |

**How the money on a band works** (read from the wallets, 2026-10-24):

- Gastro and add-ons booked onto a band at a till appear as wallet
  transactions with **`salesNo: 0`** (no bon yet). When the guest settles at
  the exit (Nachzahlautomat / check-in desk), they disappear from the wallet
  and the bon appears in `FindSales`.
- What is never settled **stays**: `balance < 0`. On 2026-10-24: 96 bands,
  1,857.20 €; 60 of them staff bands (unbilled staff meals), the 36 guest
  bands all idle for 160+ days (lost / stolen / not returned).
- ⚠ `balance` is the money figure. A transaction's `amount` repeats the booking
  total on every line of a menu, but carries its own amount on duplicate
  surcharge lines; summing `amount` is wrong either way.
- ⚠ Transaction `date` is park-local time **without a zone**.
- ⚠ A check-in on a REUSED band writes **no** wallet transaction (only issuing
  a band the first time does). The wallets therefore cannot tell who is inside
  the park either.

### Cards / wristbands — what does NOT exist

Probed 2026-07-26. All of these 404 (guessed names; see above for what does
exist):

`General/FindCards`, `FindCard`, `GetCards`, `GetPersonCard`,
`FindCustomerCards`, `FindCardTransactions`, `GetCardBalance`,
`FindCardBalance`, `FindPersonCardTransactions`, `GetPersonCardBalance`,
`FindPersonCardMovements`, `FindPersonCardHistory`, `FindWristbands`,
`FindChips`, `FindLoyaltyCards`, `FindCredits`, `FindWallet`,
`FindMoneyAccounts`, `ManagerApp/ListPersonCards`, `ManagerApp/ListCards`,
and the entire `Access/` and `Cards/` namespaces.

Also 404, when looking for "who is currently inside": `FindPresences`,
`FindPassages`, `FindAccessLogs`, `FindScans`, `FindCheckIns`,
`FindZoneOccupants`, `FindAccessZoneVisitors`, `GetActiveVisitors`,
`FindPresentVisitors`, `FindOpenSales`.

**Consequence:** live occupancy (`FindAccessZones().occupancy.visitorsCurrent`)
is a bare counter. The JSON service offers no way to resolve it into the list
of individual wristbands behind it (the wallets don't either). After closing,
a remainder of 1–15 is normal: bands that left without an exit scan. Whether
money hangs on them is answered by the wallets: open postings dated today.

## Existing endpoints that are not wrapped (yet)

All listed in `/json/documentation`; use `client.post()` until there is a wrapper.

- `Subscriptions/FindSubscriptions`
- `General/GetCard`, `Counter/GetCreditSalesByDivisionCard`, `Counter/GetTableSalesWithoutTable`
  (see the wristband section)
- `General/CouponCalculate`, `General/CouponReserve`, `General/CouponRelease`,
  `General/GiftCertificateCalculate`, `General/VoucherValidate`: wrapped on the unmerged
  branch `codex/article-sales-report`, not verified live. ⚠ `CouponReserve` /
  `CouponRelease` change state.
