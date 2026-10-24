# Changelog

All notable changes. The repo has no release tags yet; pin a commit (see README).
Every change below was verified with read-only calls against the production API
unless marked otherwise.

## 0.4.0 (2026-10-25)

Brings together the open branches `feat/findsales-paging` (0.3.0, never on master),
`feat/digital-wallets` and the article-sales part of `codex/article-sales-report`, then
checks every wrapped endpoint against the server's own endpoint list
(`GET /json/documentation`, 562 endpoints).

### Added

- `general.getDigitalWallets(criteria)` / `general.getDigitalWallet(cardNumber)`: the wallet
  of every wristband with balance and open postings (`salesNo: 0` = booked onto the band, not
  paid yet). Types `DigitalWallet`, `DigitalWalletTransaction`, `DivisionCard`.
- `articles.findArticleSalesOrders(criteria)` / `findArticleSalesOrdersPage(criteria)`:
  sold article lines with article code, without the duplicate lines of `FindSales`.
  `type` accepts names (`'All'`, `'Sales'`, …) and sends the numeric enum.
- `articles.getArticleSalesReport(criteria)`: article dossier (current price, sold quantity,
  revenue, day/month history), `articles.getArticlePriceInformation({ articleId })`,
  `articles.findArticleById(id)`. (From `codex/article-sales-report`, commits 27349e1 and
  5f46b94.)
- Manager filters as lists: `divisionIds`, `articleGroupIds`.
- `findPersonCards({ cardString })`, `findGiftCertificates({ barcode })`,
  `findPerson({ name })`.
- `scripts/smoke.ts` (`npm run smoke`): read-only smoke test against the live API.

### Fixed (each returned wrong data without an error)

- `general.findPerson` always returned `[]`: the server answers `{ result: Person[] }`.
  `lastName` was sent as `LastName`, which the server ignores (it returned 50 arbitrary
  persons); it is now sent as `Name`, `username` as `UserName`. A call without any filter
  now throws.
- `manager.listSalesInformation` / `listVisitingCustomersInformation`: `divisionId` and
  `articleGroupId` were sent singular and ignored (the socks group returned the whole day,
  16,465.51 € instead of 792.51 €). They are now sent as `DivisionIds` / `ArticleGroupIds`.
  Entry types read `divisionID` (as sent by the server).
- `articles.findArticles({ code })` returned every article (the server has no code
  criterion); the code is now matched locally after paging. `includes.priceInfo` is an alias
  of `Price` (`PriceInfo` does not exist). `ArticleId` in the documented spelling.
- `ArticlePriceInformation.additionalSupplementPrice` (was misspelt).
- `findPersonCards` no longer sends `CustomerId` (ignored by the server).
- `PersonCard.card` is a `DivisionCard` object, not a string.

### Documented, deliberately not changed

- `findGiftCertificates`: the server ignores `id` and `number`. The method still returns the
  unfiltered page, because callers page through it themselves and stop at a short page
  (spma-relaunch-2026 does).
- `findArticles({ divisionId })`: not a documented criterion, no effect in a test.

### Tooling

- vitest 5 (with vite 8), tsup 9, TypeScript 6.0, @types/node 22.
- TypeScript 7 not yet: type checking passes, but tsup 9 needs the classic compiler API for
  the `.d.ts` build.

### Not merged, needs a decision

- `codex/article-sales-report`: gastro catalogue/sync mapper (`spacemagic/gastro.ts`),
  booking invoice drafts (`spacemagic/invoices.ts`), coupon and voucher calls
  (`CouponCalculate`, `CouponReserve`, `CouponRelease`, `GiftCertificateCalculate`,
  `VoucherValidate`) and `docs/WORKFLOWS.md`. Unverified against the live API;
  `CouponReserve` / `CouponRelease` change state.
- `codex/recreatex-sdk-fixes`: already on master as `20cdea3`; the branch can be deleted.

## 0.3.0 (2026-10-14, branch only)

- `general.findSales` paginates (500 per page, throws at the page cap). Before, it sent no
  `Paging` and returned only the latest ten bons of the window. `general.findSalesPage`.
- `dedupSaleLines()`: FindSales returns the same line several times.
- `recreatex-sdk/spacemagic`: `countWristbands()` (entries from the wallet lines of check-in
  bons), `WALK_IN_CUSTOMER_ID`, `isAnonymousCustomer()`.

## 0.2.x (2026-05-04 to 2026-08-11)

- Birthday `OrganisedVisit` support (0.2.0).
- Checkout fallbacks for PascalCase envelopes, retries for binary downloads (`20cdea3`).
- `listArticleGroups` reads `groups` (`dc0e7a4`).
- `findPersonCards` and the card/presence endpoint map (`a88fbb0`).
- `FindSales` raw type: duplicate lines, `date`, no card field (`9a2221d`).
- `expositions.listPeriods` paginates (it returned only ten periods) (`537a7ad`).

## 0.1.0 (2026-04-28)

- Single package with the subpaths `recreatex-sdk/core` and `recreatex-sdk/spacemagic`,
  pre-built `dist/` for installs from git, gift certificates and basket flow.
