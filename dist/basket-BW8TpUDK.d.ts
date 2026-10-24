/**
 * Common types shared across all Recreatex endpoints.
 *
 * The Recreatex JSON API uses PascalCase field names on the wire. The SDK
 * exposes camelCase TypeScript interfaces and translates at the boundary —
 * keep that asymmetry in mind when reading raw responses.
 */
/**
 * Authentication context attached to every request body.
 *
 * The SDK builds this for you via {@link buildContext}; you only need to
 * touch it directly when bypassing the high-level client.
 *
 * @remarks
 * - `SessionId` is a UUID. Most endpoints accept the same SessionId across
 *   calls, but the voucher checkout flow expects a fresh UUID per buyer
 *   session.
 * - `DivisionId`, `Origin`, `Encode`, `AccessToken` are optional and
 *   rarely required.
 */
interface RecreatexContext {
    Language: string;
    ShopId: string;
    SessionId: string;
    Password: string;
    DivisionId?: string;
    Origin?: number;
    Encode?: boolean;
    AccessToken?: string;
}
/** Inclusive paging window. PageIndex is zero-based. */
interface Paging {
    PageIndex: number;
    PageSize: number;
}
/** Generic envelope used by most "Find*"/"List*" responses.
 *
 * Note the typo: the API spells the success flag `succes` (not `success`).
 * Treat `succes === false` as an error condition and throw.
 */
interface RecreatexEnvelope {
    succes?: boolean;
    message?: string;
    result?: unknown;
}
/** ISO-like local datetime as accepted by Recreatex.
 *
 *  Two flavours:
 *  - "2026-04-12 00:00:00.000" — used by ManagerApp and General namespaces
 *  - "2026-04-12T14:00:00"     — used by Expositions namespace
 *
 *  Always pre-format with the SDK's date helpers so you don't drift between
 *  the two.
 */
type RecreatexDateTime = string;
/** YYYY-MM-DD calendar date. */
type Ymd = string;

/**
 * Expositions namespace types — covers room/slot lookup AND OrganisedVisit
 * (booking) management.
 *
 * Birthday parties at Space Magic live as OrganisedVisits. A single visit
 * can have:
 *  - one or more `periodReservations` (the actual room slots)
 *  - zero or more `articles` (food, upgrades, extras)
 *  - zero or more `salesInfos` (one per checkout — guest data lives here for
 *    Webshop bookings)
 */

interface Exposition {
    id: string;
    code: string;
    name: string;
    /** Capacity per slot (= per period). */
    maxVisitorsPerPeriod?: number;
    /** Soft cap per group (e.g. 12 for birthday rooms). */
    maxVisitorsPerGroup?: number;
    [extra: string]: unknown;
}
interface ExpositionPeriodDate {
    date: string;
    isAvailable: boolean;
}
interface ExpositionPeriodPrice {
    priceGroupId: string;
    name?: string;
    price: number;
}
interface ExpositionPeriod {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    occupancy?: {
        remaining: number;
        maximum: number;
        maxVisitorsPerGroup: number;
    };
    prices?: ExpositionPeriodPrice[];
    [extra: string]: unknown;
}
interface ExpositionDayOverview {
    expositionId?: string;
    periods?: ExpositionPeriod[];
    [extra: string]: unknown;
}
/**
 * A bookable Exposition slot with its addressable `id`. Use
 * {@link ExpositionsModule.listPeriods} to fetch — `findOverviewByDay`
 * does NOT expose the id, so it cannot be used as the source for the
 * `ExpositionPeriodId` required by `ExpositionPeriodReservation`.
 */
interface ExpositionPeriodRef {
    id: string;
    expositionId: string;
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    occupancy?: {
        current?: number;
        remaining: number;
        maximum: number;
        maxVisitorsPerGroup: number;
        controlType?: number;
    };
    /** Last day on which a webshop reservation can be made. */
    finalSubscriptionDate?: RecreatexDateTime;
    /** Last day on which a backoffice reservation can be made. */
    finalSubscriptionDateBo?: RecreatexDateTime;
    isExcluded?: boolean;
    blocked?: boolean;
    comment?: string;
    resellerCapacity?: number;
    articles?: unknown[];
    [extra: string]: unknown;
}
interface OrganisedVisitPeriodReservation {
    articleId: string;
    articleName?: string;
    articleCode?: string;
    expositionId?: string;
    expositionName?: string;
    expositionCode?: string;
    expositionPeriodFrom?: RecreatexDateTime;
    expositionPeriodUntil?: RecreatexDateTime;
    quantity: number;
    unitPrice: number;
    amount: number;
    lineAmount: number;
    vatAmount: number;
}
interface OrganisedVisitArticle {
    articleId: string;
    articleName?: string;
    articleCode?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}
interface OrganisedVisitPersonAddress {
    telephone?: string;
    street?: string;
    number?: string;
    zipCode?: string;
    town?: string;
    countryDescription?: string;
}
interface OrganisedVisitPerson {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    cellPhone?: string;
    language?: string;
    credential?: {
        username?: string;
    };
    address?: OrganisedVisitPersonAddress;
}
/**
 * Sale guest record — populated for Webshop guest checkouts.
 *
 * The visit's `person` record stays generic ("web@omg.de") for those
 * bookings, so the REAL booker name lives here. Field names follow the
 * Recreatex SOAP contract: `name` is the surname, `firstName` is the
 * given name.
 */
interface OrganisedVisitSaleGuest {
    name?: string;
    firstName?: string;
    email?: string;
    telephone?: string | null;
    street1?: string;
    street2?: string;
    zipCode?: string;
    home?: string;
}
interface OrganisedVisitSaleInfo {
    id: string;
    salesNo: number;
    salesDate: RecreatexDateTime;
    guest?: OrganisedVisitSaleGuest;
}
interface OrganisedVisit {
    id: string;
    no: number;
    startDate: RecreatexDateTime;
    endDate: RecreatexDateTime;
    comment: string;
    cancelled: boolean;
    closed: boolean;
    posted: boolean;
    totalAmount: number;
    postedAmount: number;
    balance: number;
    personId?: string;
    person?: OrganisedVisitPerson;
    orderNumber?: string;
    purchaseDate?: RecreatexDateTime;
    periodReservations?: OrganisedVisitPeriodReservation[];
    articles?: OrganisedVisitArticle[];
    salesInfos?: OrganisedVisitSaleInfo[];
}
interface FindOrganisedVisitsCriteria {
    /** Inclusive `YYYY-MM-DD` lower bound (filters on purchaseDate, NOT startDate). */
    fromYmd?: Ymd;
    /** Inclusive `YYYY-MM-DD` upper bound. */
    untilYmd?: Ymd;
    organisedVisitId?: string;
    personId?: string;
    orderNumber?: string;
    paging?: Paging;
    includes?: {
        periodReservations?: boolean;
        articles?: boolean;
        personDetails?: boolean;
    };
}
interface OrganisedVisitTicketAdjustment {
    priceGroupId: string;
    quantity: number;
}
interface OrganisedVisitSaleAdjustment {
    articleId: string;
    quantity: number;
    unitPrice?: number;
}
interface OrganisedVisitPeriodTransfer {
    /** Old ExpositionPeriodId. */
    oldPeriodId: string;
    /** New ExpositionPeriodId. */
    newPeriodId: string;
    quantity: number;
}

/**
 * General namespace — access zones, readers, divisions, persons, sales,
 * payment methods, point-of-sales, basket primitives.
 */

interface AccessZoneOccupancy {
    maxVisitors: number;
    maxVisitorsPerDay: number;
    /** Daily count — IGNORES OccupancyFrom/Until and always reflects "today". */
    visitorsToday: number;
    /** Currently inside the zone. */
    visitorsCurrent: number;
}
interface AccessZoneReader {
    id: string;
    code?: string;
    name?: string;
    /** 0 = entrance, 1 = exit. */
    type?: 0 | 1;
}
interface AccessZone {
    id: string;
    code: string;
    name: string;
    number: number;
    occupancy?: AccessZoneOccupancy;
    entranceReaders?: AccessZoneReader[];
    exitReaders?: AccessZoneReader[];
}
interface FindAccessZonesCriteria {
    id?: string | null;
    /** Recreatex datetime window. SDK's `today: true` shortcut sets this for today (Berlin). */
    occupancyFrom?: RecreatexDateTime;
    occupancyUntil?: RecreatexDateTime;
    includes?: {
        entranceReaders?: boolean;
        exitReaders?: boolean;
        occupancy?: boolean;
        inactiveZoneControl?: boolean;
    };
}
interface Reader {
    id: string;
    code?: string;
    name?: string;
    number?: number;
    type?: number;
    [extra: string]: unknown;
}
interface Division {
    id: string;
    code?: string;
    name?: string;
    address?: string;
    [extra: string]: unknown;
}
interface PointOfSale {
    id: string;
    code?: string;
    name?: string;
    [extra: string]: unknown;
}
interface PaymentMethod {
    id: string;
    code: string;
    name: string;
    /** Often a number: 0 = card, 1 = cash, etc. */
    type?: number;
    [extra: string]: unknown;
}
interface PersonCredential {
    username?: string;
    password?: string;
}
interface PersonAddress {
    street?: string;
    number?: string;
    zipCode?: string;
    town?: string;
    countryDescription?: string;
    telephone?: string;
}
/**
 * A person from `General/FindPerson`. Field list read on 2026-10-25: the record carries `name`
 * (no separate `firstName` / `lastName`), plus email, phones, address, credential, contacts,
 * relations, company data and more (see `[extra]`).
 */
interface Person {
    id: string;
    name?: string;
    /** @deprecated Not part of the FindPerson record (2026-10-25); read `name`. */
    firstName?: string;
    /** @deprecated Not part of the FindPerson record (2026-10-25); read `name`. */
    lastName?: string;
    email?: string;
    cellPhone?: string;
    phone?: string;
    language?: string;
    credential?: PersonCredential;
    address?: PersonAddress;
    birthDate?: string;
    externCustomerNumber?: string | null;
    [extra: string]: unknown;
}
/** Filters for `General/FindPerson`; at least one is required. */
interface FindPersonCriteria {
    id?: string;
    email?: string;
    firstName?: string;
    /** Surname / name (wire field `Name`). */
    name?: string;
    /** @deprecated Alias of `name`; the server has no `LastName` criterion. */
    lastName?: string;
    /** Login name (wire field `UserName`). */
    username?: string;
}
/**
 * A single line on a FindSales bon.
 *
 * ⚠ **Recreatex returns duplicate line objects.** The same line comes back
 * repeatedly with an identical `id`, `sequenceNumber` and amount — the
 * repetition factor appears to follow the number of joined records upstream,
 * and it mainly hits lines carrying a `mainOrganisedVisitId` (booking-bound
 * articles such as "Ausstellung Vorauszahlung"). Verified 2026-07-26: a bon
 * holding ONE real 806 € line came back 8× = 6.448 €.
 *
 * **Always deduplicate by `id` before summing.** Summing `lines` raw inflates
 * revenue massively — on one production month it turned a reconciled
 * 200.237,10 € into 284.934,70 €.
 */
interface SaleLine {
    /** Line GUID. Duplicates share it — dedupe on this. */
    id?: string;
    /** Stable within the bon; duplicates share it too. */
    sequenceNumber?: number;
    articleId?: string;
    description?: string;
    /** Set on booking-bound lines; correlates with the duplication. */
    mainOrganisedVisitId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    [extra: string]: unknown;
}
interface SalePaymentLine {
    paymentMethodId: string;
    amount: number;
    [extra: string]: unknown;
}
/**
 * A bon from `General/FindSales`.
 *
 * Field list verified against production on 2026-07-26: `$type`, `customerId`,
 * `date`, `divisonId`, `id`, `lines`, `number`, `paymentLines`,
 * `pointOfSaleId`, `salesSeriesId`.
 *
 * ⚠ Two traps:
 *  1. The timestamp is **`date`**, not `saleDate` — older versions of this
 *     type declared `saleDate` as required, which silently yielded `undefined`.
 *  2. There is **no card / wristband reference** on a bon. A bon cannot be
 *     traced back to the RFID band it was booked on through this API.
 *
 * See {@link SaleLine} for the line-duplication trap.
 */
interface Sale {
    id: string;
    /** Bon timestamp, e.g. `"2025-08-06T09:52:30"`. THIS is the real field. */
    date?: RecreatexDateTime;
    /** @deprecated Not emitted by Recreatex — use {@link Sale.date}. */
    saleDate?: RecreatexDateTime;
    /** Human-readable bon number, e.g. `1000008439`. */
    number?: number;
    pointOfSaleId?: string;
    /** Note the upstream typo — one `i`. */
    divisonId?: string;
    customerId?: string | null;
    salesSeriesId?: string;
    /** @deprecated Not emitted by Recreatex — sum the deduped {@link Sale.lines}. */
    totalAmount?: number;
    /** ⚠ Contains duplicates — dedupe by `id`. See {@link SaleLine}. */
    lines?: SaleLine[];
    paymentLines?: SalePaymentLine[];
    [extra: string]: unknown;
}
interface FindSalesCriteria {
    from: RecreatexDateTime;
    until: RecreatexDateTime;
    pointOfSaleId?: string;
    divisionId?: string;
}
/** One page of `General/FindSales` (zero-based index). */
interface FindSalesPaging {
    PageIndex: number;
    PageSize: number;
}
/**
 * A card record as returned by `General/FindPersonCards`.
 *
 * In a Gantner-driven park this is the entity behind a **physical RFID
 * wristband** as well as behind subscription and gift-certificate cards —
 * they all live in the same PersonCard table, distinguished by their type
 * and by whether a person is attached.
 *
 * Field list verified against production on 2026-07-27: `$type`, `id`,
 * `description`, `card`, `personId`, `person`. On 2026-10-24 the full list was
 * read (14,363 records): `card` is an OBJECT ({@link DivisionCard}), not a
 * string, and the description is the ticket loaded onto the card
 * (`4h Eintritt Kinder - 2026`, `Partypaket - Pilot`, `Mitarbeiterband`, …).
 *
 * ⚠ **This record has no balance field.** The balance of a wristband lives in
 * its wallet: {@link GeneralModule.getDigitalWallets} /
 * {@link GeneralModule.getDigitalWallet} (`docs/ENDPOINTS.md`). Until
 * 2026-10-24 this comment said the balance was unreachable; that was wrong.
 *
 * ⚠ This endpoint also has no "currently open / checked in" filter, so it
 * cannot enumerate the bands still inside the park. Neither can the wallets.
 */
interface PersonCard {
    id: string;
    /** The physical (or generated) card behind this record. */
    card?: DivisionCard | null;
    /** Plain-text label of the card. */
    description?: string | null;
    /** Attached person, when the card is not anonymous. */
    personId?: string | null;
    person?: unknown;
    /** Unmapped upstream fields. */
    [extra: string]: unknown;
}
interface FindPersonCardsCriteria {
    id?: string;
    /** Card number as printed/encoded on the wristband. */
    number?: string;
    /** Wire field `CardString`. */
    cardString?: string;
    personId?: string;
    /**
     * @deprecated Not a server criterion: it was ignored (2026-10-25) and the call returned the
     * unfiltered page. No longer sent; use `personId`.
     */
    customerId?: string;
    pageIndex?: number;
    pageSize?: number;
}
/**
 * A division card: the medium behind a {@link PersonCard} or a
 * {@link DigitalWallet}. Shape verified 2026-10-24 (`FindPersonCards`,
 * `GetCard`).
 */
interface DivisionCard {
    id: string;
    /** The encoded number, e.g. a Gantner 7-byte UID like `04787CC28C1E91`. */
    cardNumber?: string | null;
    number?: string | null;
    /**
     * How the number is read. `GANTNER 7 BYTE UID` = a physical RFID wristband,
     * `RANDOM` = a generated ticket number (Space Magic: 13,980 of 14,363).
     */
    peripheralString?: {
        id?: string;
        code?: string | null;
        description?: string | null;
    } | null;
    personCards?: PersonCard[];
    [extra: string]: unknown;
}
/**
 * One line of a wallet booking.
 *
 * ⚠ `id` is the BOOKING, not the line: all lines of one booking (a menu and its
 * components) share it.
 *
 * ⚠⚠ `amount` (the wallet effect) is NOT reliably per line. For a menu every
 * line repeats the booking total (Burger Menü 4.95 + surcharge 0.30 → −5.25 on
 * each of four lines); for two identical surcharge lines each carries its own
 * −5 and the balance is −10. Never sum it; use {@link DigitalWallet.balance}
 * for money and `salesLineAmount` to show what was bought.
 */
interface DigitalWalletTransaction {
    id: string;
    creationDate?: string | null;
    /** Park-local time WITHOUT zone (`2026-10-22T16:31:50`). Do not parse as UTC. */
    date?: string | null;
    /**
     * Bon number. `0` = booked onto the band at a till (gastro, add-ons) and not
     * paid yet. Paid postings disappear from the wallet when the guest settles at
     * the exit; what stays was never paid.
     */
    salesNo?: number | null;
    amount?: number | null;
    itemDescription?: string | null;
    salesLineQuantity?: number | null;
    salesLineUnitPriceInc?: number | null;
    /** Line amount incl. VAT. */
    salesLineAmount?: number | null;
    /** `Hauskredit`, `BARZAHLUNG`, `VISA`, …; empty for open postings. */
    paymentMethod?: string | null;
    salesLineId?: string | null;
    [extra: string]: unknown;
}
/**
 * The wallet of one wristband, from `General/GetDigitalWallets` /
 * `General/GetDigitalWallet`. Verified 2026-10-24 against 3,090 production
 * wallets (one per physical band).
 *
 * ⚠ It does NOT tell whether the band is inside the park: a check-in on a
 * reused band writes no transaction. Only issuing a band for the first time
 * and bookings onto it do.
 */
interface DigitalWallet {
    id: string;
    /** Negative = owed by the band (unpaid postings). The authoritative money figure. */
    balance: number;
    creditLimit?: number | null;
    isCreditLimitActivated?: boolean;
    /** Only filled with `includes.transactions`. */
    transactions?: DigitalWalletTransaction[];
    /** The band's number (Gantner UID). */
    cardNumber?: string | null;
    cardId?: string | null;
    /** The customer the band was issued under (often a walk-in/webshop collective customer). */
    personId?: string | null;
    transactionBalance?: number | null;
    linkedCards?: Array<{
        id: string;
        cardNumber?: string | null;
        number?: string | null;
    }> | null;
    /** Wallet article: `Hauskredit Erwachsene`, `Geburtstags Wallet`, `Mitarbeiter`, `Digital Wallet`, … */
    articleDescription?: string | null;
    overstayCharges?: unknown[] | null;
    cardBlocked?: boolean;
    lockedForPayout?: boolean;
    salesRegistrationMode?: number;
    [extra: string]: unknown;
}
interface DigitalWalletIncludes {
    /** Wallet transactions (open postings, issue line). Default false: ~2× the payload. */
    transactions?: boolean;
    linkedCards?: boolean;
    /** ⚠ Not a reliable "today" filter in practice; leave it off. */
    onlyTransactionsToday?: boolean;
    /** 0 € lines (menu components, the issue line). */
    zeroAmountLines?: boolean;
    cancelledRecords?: boolean;
}
interface GetDigitalWalletsCriteria {
    /**
     * Only this person's wallets. ⚠ Leave it out to get ALL wallets (Space
     * Magic 2026-10-24: 3,090 over 157 persons, the two collective customers alone
     * 2,533). `null` is rejected by the server (HTTP 500, "cast to System.Guid").
     */
    personId?: string;
    includes?: DigitalWalletIncludes;
}
/**
 * A single gift-certificate record as returned by `FindGiftCertificates`.
 *
 * Heads-up: `number` is typically null for a freshly-created certificate
 * (the PersonCard isn't populated yet). The visible voucher code lives in
 * the DocumentService PDF — use this record only to discover the
 * GiftCertificate `id` (for `SetGiftCertificatePrinted`) or to match a
 * cert via `salesSeriesID` to a CheckoutBasket result.
 */
interface GiftCertificate {
    id: string;
    number: string | null;
    amount: number | null;
    purchaseDate: string | null;
    salesSeriesID: string | null;
    shortName: string | null;
    description: string | null;
    ticketDescription: string | null;
    extraDescription: string | null;
    validFrom: string | null;
    validTill: string | null;
    /** ISO timestamp once SetGiftCertificatePrinted has fired; otherwise null. */
    printDate: string | null;
}
interface FindGiftCertificatesCriteria {
    /** Recreatex Person GUID, typically the customer who placed the order. Filters server-side. */
    customerId?: string;
    /** Filters server-side (wire field `Barcode`). */
    barcode?: string;
    /** ⚠ IGNORED by the server (2026-10-25); match `id` on the results yourself. */
    id?: string;
    /** ⚠ IGNORED by the server (2026-10-25); match `number` on the results yourself. */
    number?: string;
    pageIndex?: number;
    pageSize?: number;
}

/**
 * Basket types — used by `ReCalculateBasket`, `LockBasketItems`,
 * `CheckoutBasket`.
 *
 * All basket items are a discriminated union over the `$type` field. The
 * SDK exports {@link BasketTypeStrings} as a const map of every known
 * subtype string so you don't have to hand-type the
 * `ReCreateX.WebShop.WebServices.Contracts.…, ReCreateX.WebShop.WebServices.Contracts`
 * incantation.
 *
 * Pitfalls verified against the live API:
 *  - `Article: null` on an `ArticleSale` item → API throws
 *    "Object reference not set to an instance of an object".
 *    Always pass `Article: { Id: "<guid>" }`.
 *  - `PayLater: true` on a Gift Certificate basket → `InvalidPayLaterPayment`.
 *    Provide a `Payments[]` array with a real `BasketPayment`.
 *  - `CustomerId: "00000000-..."` → `MissingCustomer`. Use the
 *    Webshop-Guest-Person GUID
 *    (Space Magic: `119d9f06-66ad-ef11-9595-9a21964517de`) instead.
 *  - `BasketPayment.PaymentMethod: { ... }` (nested) → type-not-found error.
 *    The structure is FLAT: `PaymentMethodId: "<guid>"` directly on the
 *    `BasketPayment`.
 */
/** Discriminator strings for `$type` on basket items / payments / costs. */
declare const BasketTypeStrings: {
    readonly ArticleSale: "ReCreateX.WebShop.WebServices.Contracts.ArticleSale, ReCreateX.WebShop.WebServices.Contracts";
    /** Webshop-flavoured ArticleSale used by the OMG voucher shop. */
    readonly SalesArticleSale: "ReCreateX.WebShop.WebServices.Contracts.SalesArticleSale, ReCreateX.WebShop.WebServices.Contracts";
    readonly ExpositionPeriodReservation: "ReCreateX.WebShop.WebServices.Contracts.ExpositionPeriodReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly CombiExpositionReservation: "ReCreateX.WebShop.WebServices.Contracts.CombiExpositionReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly OrganisedVisitRebooking: "ReCreateX.WebShop.WebServices.Contracts.OrganisedVisitRebooking, ReCreateX.WebShop.WebServices.Contracts";
    readonly CombiOrganisedVisitRebooking: "ReCreateX.WebShop.WebServices.Contracts.CombiOrganisedVisitRebooking, ReCreateX.WebShop.WebServices.Contracts";
    readonly CultureEventReservation: "ReCreateX.WebShop.WebServices.Contracts.CultureEventReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly RentalReservation: "ReCreateX.WebShop.WebServices.Contracts.RentalReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly ActivityReservation: "ReCreateX.WebShop.WebServices.Contracts.ActivityReservation, ReCreateX.WebShop.WebServices.Contracts";
    readonly TableSale: "ReCreateX.WebShop.WebServices.Contracts.TableSale, ReCreateX.WebShop.WebServices.Contracts";
    readonly BasketPayment: "ReCreateX.WebShop.WebServices.Contracts.BasketPayment, ReCreateX.WebShop.WebServices.Contracts";
    readonly GiftCertificateDiscount: "ReCreateX.WebShop.WebServices.Contracts.GiftCertificateDiscount, ReCreateX.WebShop.WebServices.Contracts";
    readonly CouponCodeDiscount: "ReCreateX.WebShop.WebServices.Contracts.CouponCodeDiscount, ReCreateX.WebShop.WebServices.Contracts";
};
type BasketTypeString = (typeof BasketTypeStrings)[keyof typeof BasketTypeStrings];
interface BasketItemBase {
    $type: BasketTypeString;
    Id: string;
    DivisionId: string;
    Quantity: number;
    UnitPrice: number;
    CustomerContactId?: string;
    RuleNamesToIgnore?: string[] | null;
    AdvancementPrice?: number | null;
    AsReseller?: boolean;
    PromotionRuleDiscountAmount?: number;
    LockTicket?: unknown;
}
/** Article line — F&B, voucher, ticket. `Article` MUST be `{ Id }`, never null. */
interface ArticleSaleItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.ArticleSale | typeof BasketTypeStrings.SalesArticleSale;
    Article: {
        Id: string;
    };
    CustomPrice?: number;
    ExtraDescription?: string | null;
}
/**
 * A "ticket" within an `ExpositionPeriodReservation`. Pins a count of
 * participants to a specific `PriceGroupId` (e.g. "Partypaket - Space"
 * 29 € vs. "Partypaket - Magic" 34 € on the Geburtstagstisch
 * exposition).
 *
 * ⚠ Verified live 2026-05-04: the field names are
 *   `ParticipantCount` + `Participants[]` (NOT `Quantity` / `Visitors`).
 *
 * ⚠ `PriceGroupId` must be `prices[].group.id` from
 *   `Expositions/FindExpositions(Includes.Pricing=true)`, NOT
 *   `prices[].id` (the latter is what `FindExpositionOverviewByDay`
 *   confusingly labels as `priceGroupId` — that's actually a price id).
 */
interface ExpositionPeriodReservationEntry {
    /** Discriminator. */
    $type?: string;
    /** GUID — `prices[].group.id`, NOT `prices[].id`. */
    PriceGroupId: string;
    /** Number of seats / kids in this price tier. */
    ParticipantCount: number;
    /** Visitor records (empty array for webshop / `askNames: false`). */
    Participants?: unknown[];
    Cards?: unknown[];
    CustomerCardUsages?: unknown[];
    /** Server-computed; passing it as a hint is harmless. */
    Amount?: number;
    PromotionRuleDiscountAmount?: number;
    ExtraInfo?: string | null;
    ExternalSaleIntegration?: boolean;
    [extra: string]: unknown;
}
interface ExpositionPeriodReservationItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.ExpositionPeriodReservation;
    ExpositionId: string;
    ExpositionPeriodId: string;
    CustomerId?: string | null;
    Comments?: string | null;
    /** Tickets per PriceGroup — required for OrganisedVisits with priced tiers. */
    Entries?: ExpositionPeriodReservationEntry[] | null;
    /** Add-on ArticleSale lines (extras: Cosmoo plush, snacks). */
    ArticleSales?: Array<Record<string, unknown>> | null;
    ArticleOptionalSales?: Array<Record<string, unknown>> | null;
    AutomaticArticleSales?: Array<Record<string, unknown>> | null;
    /** `true` only for back-office collect-later flows; stays `false` for Webshop. */
    OrderWithoutPayment?: boolean;
    PersonalizedMessage?: string | null;
    LanguageId?: string | null;
    TargetAudienceId?: string | null;
    TargetSkillSubCategoryIds?: string[] | null;
    CombiExpositionExpositionId?: string | null;
    Donation?: unknown;
    GiftAid?: unknown;
}
interface OrganisedVisitRebookingItem extends BasketItemBase {
    $type: typeof BasketTypeStrings.OrganisedVisitRebooking;
    OrganisedVisitId: string;
    OrganisedVisitPeriodTransfers?: Array<{
        OldPeriodId: string;
        NewPeriodId: string;
        Quantity: number;
    }> | null;
}
type BasketItem = ArticleSaleItem | ExpositionPeriodReservationItem | OrganisedVisitRebookingItem | (BasketItemBase & {
    [extra: string]: unknown;
});
/**
 * Payment block. Note the FLAT structure — `PaymentMethodId` is a sibling,
 * not nested inside a `PaymentMethod` object.
 *
 * `TrxId` / `OrderId` / `PayId` are v8.3.0+ fields meant for Enviso-Split
 * payments; we re-use them for Mollie reference data.
 */
interface BasketPayment {
    $type: typeof BasketTypeStrings.BasketPayment;
    Amount: number;
    Currency: string;
    PaymentMethodId: string;
    ExtraInfo1?: string;
    ExtraInfo2?: string;
    OrderId?: string;
    TrxId?: string;
    PayId?: string;
}
/** Anonymous-buyer block used when no person record exists yet. */
interface AnonymousPerson {
    Name?: string | null;
    FirstName?: string | null;
    Street1?: string | null;
    Street2?: string | null;
    Number?: string | null;
    Box?: string | null;
    Home?: string | null;
    Country?: string | null;
    Email?: string | null;
    Newsletter?: boolean;
    ZipCode?: string | null;
    Telephone?: string | null;
}
interface Basket {
    /** ALWAYS the Webshop-Guest-Person GUID for anonymous orders, never zero. */
    CustomerId: string;
    Items: BasketItem[];
    Payments?: BasketPayment[] | null;
    CouponCodes?: string[] | null;
    Info1?: string;
    Info2?: string;
    Info3?: string;
    AnonymousPerson?: AnonymousPerson;
    Comment?: string;
    OrderId?: string;
    PayLater?: boolean;
    TrxId?: string;
    PayId?: string;
    /** Catch-all for less-common fields. */
    [extra: string]: unknown;
}
/**
 * Basket validation result.
 *
 * The wire payload is camelCase on the way back from Recreatex
 * (`isValid`, `message`, `brokenRuleName`) — the request side is
 * PascalCase, but the response is serialised lower-first.
 */
interface BasketValidationResult {
    isValid: boolean;
    message?: string | null;
    brokenRuleName?: string | null;
    basketItemValidationResults?: unknown;
}
interface CheckoutResult {
    resultState: number;
    salesOrderNumber: string;
    salesSeriesId?: string | null;
    invoiceId?: string | null;
    hasCollectLaterLines?: boolean;
    tokenNumber?: string | null;
    basketValidationResult: BasketValidationResult;
    salesItems?: Array<{
        id: string;
        salesNumber?: number | null;
        [extra: string]: unknown;
    }> | null;
}
interface CheckoutResponse {
    result: CheckoutResult;
}

export { BasketTypeStrings as K };
export type { OrganisedVisitPersonAddress as $, AccessZone as A, Basket as B, CheckoutResponse as C, Division as D, Exposition as E, FindOrganisedVisitsCriteria as F, GiftCertificate as G, ArticleSaleItem as H, BasketPayment as I, BasketTypeString as J, BasketValidationResult as L, CheckoutResult as M, DigitalWalletTransaction as N, OrganisedVisitTicketAdjustment as O, PointOfSale as P, DivisionCard as Q, Reader as R, Sale as S, ExpositionPeriod as T, ExpositionPeriodPrice as U, ExpositionPeriodReservationEntry as V, ExpositionPeriodReservationItem as W, OrganisedVisitArticle as X, Ymd as Y, OrganisedVisitPeriodReservation as Z, OrganisedVisitPerson as _, OrganisedVisitSaleAdjustment as a, OrganisedVisitRebookingItem as a0, OrganisedVisitSaleGuest as a1, OrganisedVisitSaleInfo as a2, Paging as a3, PersonAddress as a4, PersonCredential as a5, SalePaymentLine as a6, ExpositionPeriodDate as b, ExpositionDayOverview as c, ExpositionPeriodRef as d, OrganisedVisit as e, OrganisedVisitPeriodTransfer as f, FindAccessZonesCriteria as g, PaymentMethod as h, FindPersonCriteria as i, Person as j, FindSalesCriteria as k, FindSalesPaging as l, BasketItem as m, FindGiftCertificatesCriteria as n, FindPersonCardsCriteria as o, PersonCard as p, GetDigitalWalletsCriteria as q, DigitalWallet as r, DigitalWalletIncludes as s, RecreatexDateTime as t, RecreatexContext as u, RecreatexEnvelope as v, SaleLine as w, AccessZoneOccupancy as x, AccessZoneReader as y, AnonymousPerson as z };
