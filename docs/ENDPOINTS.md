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
| `expositions` | `findOverviewByDay(id, ymd)` | `/Json/Expositions/FindExpositionOverviewByDay/` | Slots + capacity |
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
