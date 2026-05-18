# Endpoint reference

Every Recreatex JSON endpoint surfaced by `recreatex-sdk/core`. All are
**POST** with a JSON body that includes a `Context` block (the SDK injects
this for you).

Base URL: `https://wsdlspacemagic.recreatex.be`. The document service
sits at `${baseUrl}/WebShopDocumentService.svc/...` and uses **GET**.

| Module | Method on `client.*` | Wire path | Use case |
|---|---|---|---|
| `articles` | `findArticles(criteria)` | `/Json/Articles/FindArticles/` | Catalogue (auto-pages) |
| `articles` | `findArticlesPage(criteria)` | `/Json/Articles/FindArticles/` | Single page |
| `articles` | `listArticleGroups()` | `/Json/Articles/ListArticleGroups/` | Group taxonomy |
| `articles` | `getArticlePriceInformation({ articleId })` | `/Json/Articles/GetArticlePriceInformation/` | Detailed current price |
| `articles` | `findArticleSalesOrders(criteria)` | `/Json/Articles/FindArticleSalesOrders/` | Sold article line history |
| `articles` | `getArticleSalesReport(criteria)` | composed | Article dossier: price, sold quantity, revenue, history |
| `expositions` | `findExpositions(criteria)` | `/Json/Expositions/FindExpositions/` | Rooms by name |
| `expositions` | `findPeriodDates(id, fromIso, untilIso)` | `/Json/Expositions/FindExpositionPeriodDates/` | Free days |
| `expositions` | `findOverviewByDay(id, ymd)` | `/Json/Expositions/FindExpositionOverviewByDay/` | Slots + capacity (no period id!) |
| `expositions` | `listPeriods(id, fromIso, untilIso)` | `/Json/Expositions/ListExpositionPeriods/` | Slots **with** period id (use for basket builds) |
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
| `general` | `findPerson(criteria)` | `/Json/General/FindPerson/` | Person lookup |
| `general` | `findSales(criteria, callOpts?, paginateOpts?)` | `/Json/General/FindSales/` | All bons of the window, paginated (500/page; throws at the page cap). Check-in, Nachzahlautomat, Drehkreuz, Backoffice, Nachrutsche; NOT the F&B tills or the QR order app |
| `general` | `findSalesPage(criteria, paging, callOpts?)` | `/Json/General/FindSales/` | One page; `Paging` goes inside `Criteria` |
| `general` | `reCalculateBasket(basket)` | `/Json/General/ReCalculateBasket/` | Basket totals |
| `general` | `lockBasketItems(items)` | `/Json/General/LockBasketItems/` | Reserve items for payment |
| `general` | `checkoutBasket(basket)` | `/Json/General/CheckoutBasket/` | Finalise sale |
| `general` | `findPersonCards(criteria)` | `/Json/General/FindPersonCards/` | Cards / RFID wristbands (`card` is an object, see below) |
| `general` | `getDigitalWallets(criteria)` | `/Json/General/GetDigitalWallets/` | Wallet per wristband: balance + open postings (all wallets without `personId`) |
| `general` | `getDigitalWallet(cardNumber)` | `/Json/General/GetDigitalWallet/` | One wristband's wallet, `null` if unknown |
| `general` | `findGiftCertificates(criteria)` | `/Json/General/FindGiftCertificates/` | Look up gift certificates by customer / id / number |
| `general` | `setGiftCertificatePrinted(id)` | `/Json/General/SetGiftCertificatePrinted/` | Mark a cert as delivered (sets `printDate`) |
| `manager` | `listSalesInformation(criteria)` | `/Json/ManagerApp/ListSalesInformation/` | Aggregated revenue |
| `manager` | `listVisitingCustomersInformation(criteria)` | `/Json/ManagerApp/ListVisitingCustomersInformation/` | Visitor scans |
| `documents` | `giftCertificatePdf({ salesLineId })` | `/WebShopDocumentService.svc/GiftCertificates/{ShopId}/{lang}/{SalesLineId}` | Voucher PDF |
| `documents` | `giftCertificateHelp(lang)` | `/WebShopDocumentService.svc/Help/GiftCertificates/{ShopId}/{lang}` | Template merge-fields |

## Date formats

| Namespace | Format | Helper |
|---|---|---|
| Manager / General / Articles | `"YYYY-MM-DD HH:mm:ss.SSS"` | `dayRangeDotted()` |
| Expositions | `"YYYY-MM-DDTHH:mm:ss"` | `dayRangeIso()` |

## Pagination

Endpoints that accept `Paging: { PageIndex, PageSize }`:
- `Articles/FindArticles`
- `Articles/FindArticleSalesOrders`
- `Expositions/FindExpositions`
- `Expositions/FindOrganisedVisits`

The SDK exposes both `findXyz()` (auto-pages) and `findXyzPage()` (single
page). Default `PageSize`: 200 for visits/article sales orders, 50 for
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

`FindArticleSalesOrders` returns sold article lines with description/date/
quantity/unit price/total price. The public Recreatex PDF documents it as an
article history endpoint; if the JSON response includes article ids/codes the
SDK matches on those, otherwise it falls back to the sales-line description.

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
`null`.

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

One further endpoint exists but is not wrapped yet:
`Subscriptions/FindSubscriptions`.
