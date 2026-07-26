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
| `general` | `findSales(criteria)` | `/Json/General/FindSales/` | Low-level transactions |
| `general` | `reCalculateBasket(basket)` | `/Json/General/ReCalculateBasket/` | Basket totals |
| `general` | `lockBasketItems(items)` | `/Json/General/LockBasketItems/` | Reserve items for payment |
| `general` | `checkoutBasket(basket)` | `/Json/General/CheckoutBasket/` | Finalise sale |
| `general` | `findPersonCards(criteria)` | `/Json/General/FindPersonCards/` | Cards / RFID wristbands (shape unverified, see below) |
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
- `Expositions/FindExpositions`
- `Expositions/FindOrganisedVisits`

The SDK exposes both `findXyz()` (auto-pages) and `findXyzPage()` (single
page). Default `PageSize`: 200 for visits, 50 for articles/expositions.

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

### Cards / wristbands — what does NOT exist

Probed 2026-07-26. `General/FindPersonCards` is the **only** card-level
endpoint. All of these 404:

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
of individual wristbands behind it.

One further endpoint exists but is not wrapped yet:
`Subscriptions/FindSubscriptions`.
