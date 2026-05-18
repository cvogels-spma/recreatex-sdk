// src/spacemagic/ids.ts
var SHOP_ID = "f2262f27-11c3-44fa-b790-cf4b900204b0";
var DIVISION_IDS = {
  /** Physical park (Fischteichweg 15-17, 26603 Aurich). */
  spaceMagic: "59850967-c29e-ec11-8bd7-000c298735fd",
  /** Web shop. */
  webshop: "dc6e9df0-d53b-414d-b561-41ef8de459f3",
  /** Backoffice / Administration. */
  administration: "88791f99-1148-4129-b2d7-592aa0cb6847"
};
var GUEST_CUSTOMER_ID = "119d9f06-66ad-ef11-9595-9a21964517de";
var SPACE_MAGIC_ZONE_ID = "f2bd4439-52ab-ef11-9595-9a21964517de";
var PAYMENT_METHOD_ID_KARTENZAHLUNG = "a0d0dc4c-1f18-ea11-a2d2-8fcb7a700801";

// src/spacemagic/vouchers.ts
var VOUCHER_SKUS = [
  { id: "976e83a9-bbbb-ef11-9595-9a21964517de", code: "10901-0006", name: "Gutschein Post - zu Null", price: 0, delivery: "postal", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "7eb005b1-56ab-ef11-9595-9a21964517de", code: "10902-0004", name: "Gutschein: 100\u20AC", price: 100, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "9ca0a47b-43ab-ef11-9595-9a21964517de", code: "10901-0004", name: "Gutschein: 100\u20AC - Post", price: 100, delivery: "postal", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "b5a39085-5cad-ef11-9595-9a21964517de", code: "10902-0007", name: "Gutschein: 18\u20AC", price: 18, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "7c92d44a-c1ad-ef11-9595-9a21964517de", code: "10902-0001", name: "Gutschein: 25\u20AC", price: 25, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "0d4b7d2a-d5ad-ef11-9595-9a21964517de", code: "10901-0001", name: "Gutschein: 25\u20AC - Post", price: 25, delivery: "postal", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "1d3e0a06-50ad-ef11-9595-9a21964517de", code: "10902-0006", name: "Gutschein: 28\u20AC", price: 28, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "2298a04a-c1ad-ef11-9595-9a21964517de", code: "10902-0002", name: "Gutschein: 50\u20AC", price: 50, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "fe9e6a25-d5ad-ef11-9595-9a21964517de", code: "10901-0002", name: "Gutschein: 50\u20AC - Post", price: 50, delivery: "postal", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "5c4ce64f-c1ad-ef11-9595-9a21964517de", code: "10902-0003", name: "Gutschein: 75\u20AC", price: 75, delivery: "digital", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "7d9d6a25-d5ad-ef11-9595-9a21964517de", code: "10901-0003", name: "Gutschein: 75\u20AC - Post", price: 75, delivery: "postal", variable: false, divisionId: DIVISION_IDS.spaceMagic },
  { id: "aaae62a4-c1ad-ef11-9595-9a21964517de", code: "10902-0005", name: "Gutschein: Variabel", price: 1, delivery: "digital", variable: true, divisionId: DIVISION_IDS.spaceMagic },
  { id: "bb89cd58-d5ad-ef11-9595-9a21964517de", code: "10904-0001", name: "Gutschein: Variabel - vor Ort", price: 25, delivery: "on-site", variable: true, divisionId: DIVISION_IDS.spaceMagic }
];
function findVoucher(code) {
  return VOUCHER_SKUS.find((v) => v.code === code);
}
function classifyVoucher(code) {
  if (code.startsWith("10901")) return "postal";
  if (code.startsWith("10902")) return "digital";
  if (code.startsWith("10904")) return "on-site";
  return "unknown";
}

// src/spacemagic/gastro.ts
var GASTRO_GROUP_MAP = /* @__PURE__ */ new Map([
  ["d33c73eb-22ab-ef11-9595-9a21964517de", "Alkohol"],
  ["cc3c73eb-22ab-ef11-9595-9a21964517de", "Burger"],
  ["cb3c73eb-22ab-ef11-9595-9a21964517de", "Fingerfood"],
  ["b2bbfab5-1019-f011-9596-b28721114d72", "Hei\xDFgetr\xE4nke"],
  ["01440a27-e67c-f011-9596-b28721114d72", "Kuchen/Geb\xE4ck"],
  ["d03c73eb-22ab-ef11-9595-9a21964517de", "Milchreis"],
  ["c83c73eb-22ab-ef11-9595-9a21964517de", "Nudeln"],
  ["d13c73eb-22ab-ef11-9595-9a21964517de", "Obst"],
  ["ce3c73eb-22ab-ef11-9595-9a21964517de", "Pfannkuchen"],
  ["ca3c73eb-22ab-ef11-9595-9a21964517de", "Pizza"],
  ["cf3c73eb-22ab-ef11-9595-9a21964517de", "Salat"],
  ["ffa9dc4b-048f-f011-9596-b28721114d72", "Soft Drinks Empf."],
  ["d43c73eb-22ab-ef11-9595-9a21964517de", "Softdrinks"],
  ["159d138d-f520-f011-9596-b28721114d72", "Suppen"],
  ["d23c73eb-22ab-ef11-9595-9a21964517de", "S\xFC\xDFigkeiten"],
  ["cf1ef454-5f8d-f011-9596-b28721114d72", "S\xFC\xDFigkeiten Empf."],
  ["cd3c73eb-22ab-ef11-9595-9a21964517de", "W\xFCrstchen"]
]);
function gastroGroupName(articleGroupId) {
  if (!articleGroupId) return "Unbekannt";
  return GASTRO_GROUP_MAP.get(articleGroupId) ?? articleGroupId;
}
function isGastroGroup(articleGroupId) {
  return !!articleGroupId && GASTRO_GROUP_MAP.has(articleGroupId);
}
async function listGastroArticles(client, options = {}, callOpts) {
  const groups = await Promise.all(
    [...GASTRO_GROUP_MAP.entries()].map(async ([groupId, groupName]) => {
      const articles = await client.articles.findArticles(
        {
          articleGroupId: groupId,
          ...options.divisionId && { divisionId: options.divisionId },
          ...options.includeDetail !== void 0 && { includeDetail: options.includeDetail },
          ...options.ignoreActivePeriodsFilter !== void 0 && {
            ignoreActivePeriodsFilter: options.ignoreActivePeriodsFilter
          },
          pageSize: options.pageSize ?? 200,
          includes: {
            price: true,
            imageUrl: true,
            group: true,
            vat: true,
            ...options.includeDetail && { barcodes: true, stock: true }
          }
        },
        { pageSize: options.pageSize ?? 200 },
        callOpts
      );
      return {
        groupId,
        groupName,
        articles: articles.map((article) => toGastroCatalogItem(article, groupId, groupName))
      };
    })
  );
  return groups.map((group) => ({
    ...group,
    articles: group.articles.sort(compareGastroArticles)
  })).filter((group) => options.includeEmptyGroups || group.articles.length > 0);
}
async function syncGastroSales(client, options, callOpts) {
  const catalog = await listGastroArticles(client, options, callOpts);
  const articles = catalog.flatMap((group) => group.articles).filter((article) => !options.articleIds || options.articleIds.includes(article.id)).filter((article) => !options.articleCodes || options.articleCodes.includes(article.code));
  const byId = new Map(articles.map((article) => [normalize(article.id), article]));
  const byCode = new Map(articles.map((article) => [normalize(article.code), article]));
  const byName = /* @__PURE__ */ new Map();
  for (const article of articles) {
    const key = normalize(article.name);
    byName.set(key, [...byName.get(key) ?? [], article]);
  }
  const buckets = /* @__PURE__ */ new Map();
  const issues = [];
  for (const date of eachYmd(options.fromYmd, options.untilYmd)) {
    const sales = await client.articles.findArticleSalesOrders(
      {
        from: `${date} 00:00:00.000`,
        until: `${date} 23:59:59.000`,
        type: "Sales",
        pageSize: options.pageSize ?? 200
      },
      { pageSize: options.pageSize ?? 200, maxPages: options.maxPagesPerDay ?? 100 },
      callOpts
    );
    for (const line of sales) {
      const matches = matchGastroSalesLine(line, byId, byCode, byName);
      if (matches.length === 0) {
        if (options.includeUnmatchedIssues) issues.push(toSalesIssue(date, line, "unmatched"));
        continue;
      }
      if (matches.length > 1 && !options.includeAmbiguousDescriptionMatches) {
        issues.push(toSalesIssue(date, line, "ambiguous-description", matches));
        continue;
      }
      for (const article of matches) addSalesLineToBucket(buckets, date, article, line);
    }
  }
  const rows = [...buckets.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.groupName.localeCompare(b.groupName, "de-DE") || a.name.localeCompare(b.name, "de-DE")
  );
  return {
    fromYmd: options.fromYmd,
    untilYmd: options.untilYmd,
    articleCount: articles.length,
    rows,
    totals: summarizeRows(rows),
    issues
  };
}
function toGastroCatalogItem(article, groupId, groupName) {
  return {
    groupId,
    groupName,
    id: article.id,
    code: article.code,
    name: article.name,
    price: article.price,
    ...article.vat?.percentage !== void 0 && { vatPercentage: article.vat.percentage },
    ...article.imageUrl !== void 0 && { imageUrl: article.imageUrl },
    article
  };
}
function compareGastroArticles(a, b) {
  return a.name.localeCompare(b.name, "de-DE") || a.code.localeCompare(b.code, "de-DE");
}
function matchGastroSalesLine(line, byId, byCode, byName) {
  const raw = line;
  const articleId = readString(raw, "articleId", "ArticleId", "ArticleID") ?? readNestedString(raw, ["article", "Article"], ["id", "Id", "ID"]);
  if (articleId) {
    const match = byId.get(normalize(articleId));
    if (match) return [match];
  }
  const code = readString(raw, "articleCode", "code", "Code") ?? readNestedString(raw, ["article", "Article"], ["code", "Code"]);
  if (code) {
    const match = byCode.get(normalize(code));
    if (match) return [match];
  }
  const description = readString(raw, "description", "Description", "articleName", "name", "Name") ?? readNestedString(raw, ["article", "Article"], ["name", "Name"]);
  return byName.get(normalize(description)) ?? [];
}
function addSalesLineToBucket(buckets, date, article, line) {
  const key = `${date}|${article.id}`;
  const existing = buckets.get(key) ?? {
    date,
    groupId: article.groupId,
    groupName: article.groupName,
    articleId: article.id,
    code: article.code,
    name: article.name,
    cataloguePrice: article.price,
    quantity: 0,
    totalPrice: 0,
    lineCount: 0,
    averageUnitPrice: null
  };
  const quantity = readSalesNumber(line, "quantity", "Quantity") ?? 0;
  const totalPrice = readSalesNumber(line, "totalPrice", "TotalPrice") ?? round2(quantity * (readSalesNumber(line, "unitPrice", "UnitPrice") ?? 0));
  existing.quantity = round2(existing.quantity + quantity);
  existing.totalPrice = round2(existing.totalPrice + totalPrice);
  existing.lineCount += 1;
  existing.averageUnitPrice = existing.quantity > 0 ? round2(existing.totalPrice / existing.quantity) : null;
  buckets.set(key, existing);
}
function summarizeRows(rows) {
  const quantity = round2(rows.reduce((sum2, row) => sum2 + row.quantity, 0));
  const totalPrice = round2(rows.reduce((sum2, row) => sum2 + row.totalPrice, 0));
  const lineCount = rows.reduce((sum2, row) => sum2 + row.lineCount, 0);
  return {
    quantity,
    totalPrice,
    lineCount,
    averageUnitPrice: quantity > 0 ? round2(totalPrice / quantity) : null
  };
}
function toSalesIssue(date, line, reason, candidates = []) {
  const raw = line;
  return {
    date,
    description: readString(raw, "description", "Description") ?? "",
    quantity: readSalesNumber(line, "quantity", "Quantity") ?? 0,
    totalPrice: readSalesNumber(line, "totalPrice", "TotalPrice") ?? 0,
    reason,
    ...candidates.length > 0 && { candidateArticleIds: candidates.map((article) => article.id) }
  };
}
function eachYmd(fromYmd, untilYmd) {
  const out = [];
  const cursor = /* @__PURE__ */ new Date(`${fromYmd}T00:00:00.000Z`);
  const end = /* @__PURE__ */ new Date(`${untilYmd}T00:00:00.000Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
function normalize(v) {
  return (v ?? "").trim().toLocaleLowerCase("de-DE");
}
function readString(obj, ...keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return void 0;
}
function readNestedString(obj, objectKeys, valueKeys) {
  for (const objectKey of objectKeys) {
    const value = obj[objectKey];
    if (value && typeof value === "object") {
      const found = readString(value, ...valueKeys);
      if (found) return found;
    }
  }
  return void 0;
}
function readSalesNumber(line, ...keys) {
  const raw = line;
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number") return value;
  }
  return void 0;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// src/spacemagic/visits/categorize.ts
var ESCAPE_KEYWORDS = ["hexenmeister", "landekapsel", "escape"];
function categorizeVisit(visit) {
  const exposition = (visit.periodReservations?.[0]?.expositionName || "").toLowerCase();
  const articleName = (visit.periodReservations?.[0]?.articleName || "").toLowerCase();
  const comment = (visit.comment || "").toLowerCase();
  if (exposition.includes("raumschiff") || exposition.includes("geburtstagstisch")) return "birthday";
  if (comment.includes("geburtstag") || comment.includes("vereinsfeier")) return "birthday";
  if (ESCAPE_KEYWORDS.some((kw) => exposition.includes(kw) || articleName.includes(kw))) return "escape";
  if (exposition.includes("regular")) return "regular";
  return "other";
}

// src/spacemagic/visits/extract.ts
var NON_KIND_PREFIX_RE = /^(vereinsfeier|firmenfeier|jga|junggesell\w*|gruppenbuchung|gruppenfeier|kindergruppe|jubil(ae|ä)um|abschluss(feier)?|teamfeier|klassenfeier)\b/i;
function extractKind(comment) {
  const c = (comment || "").trim();
  if (!c) return "";
  const m = c.match(/Geburtstag\s*[/,]\s*(.+)/i);
  if (m && m[1]) return m[1].trim();
  if (c.includes("/")) return "";
  if (NON_KIND_PREFIX_RE.test(c)) return "";
  if (c.length <= 60) return c;
  return "";
}
function extractPaket(periodReservations, articles) {
  const probe = (s) => {
    const m = (s || "").match(/Partypaket\s*-?\s*(Space|Magic)/i);
    return m && m[1] ? m[1] : "";
  };
  for (const pr of periodReservations || []) {
    const hit = probe(pr.articleName);
    if (hit) return hit;
  }
  for (const a of articles || []) {
    const hit = probe(a.articleName);
    if (hit) return hit;
  }
  return "";
}
function extractEssen(articles) {
  if (!articles) return { essen: "", upgrade: 0 };
  let essen = "";
  let upgrade = 0;
  for (const a of articles) {
    const name = (a.articleName || "").toLowerCase();
    if (name.includes("upgrade raumschiff")) {
      upgrade = 1;
      if (!essen) essen = "Upgrade Raumschiff";
    } else if (name.includes("pizza")) {
      essen = "Pizza";
    } else if (name.includes("pasta")) {
      essen = "Pasta";
    } else if (name.includes("pommes") || name.includes("nuggets")) {
      essen = "Pommes & Nuggets";
    }
  }
  return { essen, upgrade };
}
function extractKontakt(visit) {
  const p = visit.person;
  if (p) {
    const name = `${(p.firstName || "").trim()} ${(p.lastName || "").trim()}`.trim();
    if (name) return name;
  }
  for (const si of visit.salesInfos || []) {
    const g = si.guest;
    if (!g) continue;
    const guestName = `${(g.firstName || "").trim()} ${(g.name || "").trim()}`.trim();
    if (guestName) return guestName;
  }
  return (p?.email || p?.credential?.username || "").trim();
}

// src/spacemagic/visits/mappers.ts
function mapBirthdayBooking(visit) {
  const pr = visit.periodReservations?.[0];
  const raum = pr?.expositionName || "";
  const anzahl = (visit.periodReservations || []).reduce(
    (sum2, r) => sum2 + (r.quantity || 0),
    0
  );
  const { essen, upgrade } = extractEssen(visit.articles);
  const kind = extractKind(visit.comment);
  const hinweis = kind ? "" : (visit.comment || "").trim();
  return {
    id: String(visit.no),
    kontakt: extractKontakt(visit),
    datum: visit.startDate.slice(0, 10),
    zeit: visit.startDate.slice(11, 16),
    anzahl,
    raum,
    paket: extractPaket(visit.periodReservations, visit.articles),
    kind,
    essen,
    upgrade,
    bezahlt: Number(visit.postedAmount || 0),
    offen: Number(visit.balance || 0),
    gesamt: Number(visit.totalAmount || 0),
    hinweis,
    cancelled: visit.cancelled ? 1 : 0
  };
}
function mapEscapeBooking(visit) {
  const pr = visit.periodReservations?.[0];
  const anzahl = (visit.periodReservations || []).reduce(
    (sum2, r) => sum2 + (r.quantity || 0),
    0
  );
  return {
    id: String(visit.no),
    kontakt: extractKontakt(visit),
    datum: visit.startDate.slice(0, 10),
    zeit: visit.startDate.slice(11, 16),
    anzahl,
    raum: pr?.expositionName || "",
    bezahlt: Number(visit.postedAmount || 0),
    offen: Number(visit.balance || 0),
    gesamt: Number(visit.totalAmount || 0),
    cancelled: visit.cancelled ? 1 : 0
  };
}

// src/core/types/basket.ts
var BCT = "ReCreateX.WebShop.WebServices.Contracts";
var SUFFIX = `, ${BCT}`;
var BasketTypeStrings = {
  // ---- Basket items (sales) ----
  ArticleSale: `${BCT}.ArticleSale${SUFFIX}`,
  ExpositionPeriodReservation: `${BCT}.ExpositionPeriodReservation${SUFFIX}`,
  // ---- Payments ----
  BasketPayment: `${BCT}.BasketPayment${SUFFIX}`};

// src/core/context.ts
function uuidv4() {
  const g = globalThis;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

// src/spacemagic/birthday.ts
var ZERO_GUID = "00000000-0000-0000-0000-000000000000";
function round22(n) {
  return Math.round(n * 100) / 100;
}
function buildBirthdayBasket(input) {
  const divisionId = input.divisionId ?? DIVISION_IDS.spaceMagic;
  const customerId = input.customerId ?? GUEST_CUSTOMER_ID;
  const paymentMethodId = input.paymentMethodId ?? PAYMENT_METHOD_ID_KARTENZAHLUNG;
  const extras = input.extras ?? [];
  const depositAmount = round22(input.depositAmount);
  const grossTotal = round22(input.grossTotal);
  const balance = round22(grossTotal - depositAmount);
  const ENTRY_TYPE = "ReCreateX.WebShop.WebServices.Contracts.ExpositionPeriodReservationEntry, ReCreateX.WebShop.WebServices.Contracts";
  const entries = [
    {
      $type: ENTRY_TYPE,
      PriceGroupId: input.priceTier.priceGroupId,
      ParticipantCount: input.paidGuests,
      Participants: [],
      Cards: [],
      CustomerCardUsages: [],
      PromotionRuleDiscountAmount: 0
    }
  ];
  const periodReservation = {
    $type: BasketTypeStrings.ExpositionPeriodReservation,
    Id: uuidv4(),
    DivisionId: divisionId,
    ExpositionId: input.expositionId,
    ExpositionPeriodId: input.expositionPeriodId,
    Quantity: 0,
    UnitPrice: input.priceTier.unitPrice,
    Entries: entries,
    Comments: input.comment ?? null,
    OrderWithoutPayment: false,
    AsReseller: false,
    PromotionRuleDiscountAmount: 0,
    CustomerContactId: ZERO_GUID
  };
  const items = [periodReservation];
  for (const extra of extras) {
    const qty = extra.quantity ?? 1;
    items.push({
      $type: BasketTypeStrings.ArticleSale,
      Id: uuidv4(),
      DivisionId: divisionId,
      Article: { Id: extra.articleId },
      Quantity: qty,
      UnitPrice: extra.unitPrice,
      CustomPrice: extra.unitPrice,
      ExtraDescription: extra.extraDescription ?? "",
      AsReseller: false,
      PromotionRuleDiscountAmount: 0,
      CustomerContactId: ZERO_GUID
    });
  }
  const payment = {
    $type: BasketTypeStrings.BasketPayment,
    Amount: depositAmount,
    Currency: "EUR",
    PaymentMethodId: paymentMethodId,
    ExtraInfo1: "Mollie",
    ExtraInfo2: input.molliePaymentId,
    OrderId: input.orderNumber,
    TrxId: input.molliePaymentId,
    PayId: ""
  };
  const anon = {
    Name: input.buyer.lastName,
    FirstName: input.buyer.firstName,
    Email: input.buyer.email,
    Telephone: input.buyer.phone ?? null,
    Street1: input.buyer.street ?? null,
    ZipCode: input.buyer.zipCode ?? null,
    Home: input.buyer.city ?? null,
    Country: input.buyer.country ?? null,
    Newsletter: false
  };
  return {
    CustomerId: customerId,
    Items: items,
    Payments: [payment],
    AnonymousPerson: anon,
    OrderId: input.orderNumber,
    TrxId: input.molliePaymentId,
    PayId: "",
    PayLater: false,
    Balance: balance,
    Comment: input.comment ?? "",
    CouponCodes: []
  };
}

// src/spacemagic/invoices.ts
async function getBookingInvoiceDraft(client, criteria, options = {}, callOpts) {
  const visit = await findBookingForInvoice(client, criteria, callOpts);
  return buildBookingInvoiceDraft(visit, options);
}
async function findBookingForInvoice(client, criteria, callOpts) {
  const baseCriteria = {
    includes: { periodReservations: true, articles: true, personDetails: true }
  };
  if (criteria.organisedVisitId) {
    const visits = await client.expositions.findOrganisedVisits(
      { ...baseCriteria, organisedVisitId: criteria.organisedVisitId },
      { maxPages: 1 },
      callOpts
    );
    return oneVisit(visits, "organisedVisitId");
  }
  if (criteria.orderNumber) {
    const visits = await client.expositions.findOrganisedVisits(
      { ...baseCriteria, orderNumber: criteria.orderNumber },
      { maxPages: 5 },
      callOpts
    );
    return oneVisit(visits, "orderNumber");
  }
  if (criteria.bookingNo !== void 0) {
    if (!criteria.fromYmd || !criteria.untilYmd) {
      throw new Error("bookingNo lookup requires fromYmd and untilYmd");
    }
    const visits = await client.expositions.findOrganisedVisits(
      {
        ...baseCriteria,
        fromYmd: criteria.fromYmd,
        untilYmd: criteria.untilYmd
      },
      { maxPages: 50 },
      callOpts
    );
    const bookingNo = String(criteria.bookingNo);
    return oneVisit(visits.filter((visit) => String(visit.no) === bookingNo), "bookingNo");
  }
  throw new Error("Provide organisedVisitId, orderNumber, or bookingNo");
}
function buildBookingInvoiceDraft(visit, options = {}) {
  const lines = [
    ...(visit.periodReservations ?? []).map(periodReservationLine),
    ...(visit.articles ?? []).map(articleLine)
  ].filter((line) => options.includeZeroAmountLines || line.amount !== 0 || line.lineAmount !== 0);
  const totals = {
    amount: round23(sum(lines, "amount") || numberValue(visit.totalAmount)),
    lineAmount: round23(sum(lines, "lineAmount")),
    vatAmount: round23(sum(lines, "vatAmount")),
    paidAmount: numberValue(visit.postedAmount),
    balance: numberValue(visit.balance),
    couponDiscount: numberValue(visit.couponDiscount)
  };
  return {
    bookingId: visit.id,
    bookingNo: visit.no,
    ...visit.orderNumber && { orderNumber: visit.orderNumber },
    startDate: visit.startDate,
    endDate: visit.endDate,
    ...visit.purchaseDate && { purchaseDate: visit.purchaseDate },
    ...visit.comment && { comment: visit.comment },
    customer: readInvoiceCustomer(visit),
    lines,
    totals,
    salesInfos: (visit.salesInfos ?? []).map((info) => ({
      salesSeriesId: info.id,
      salesNo: info.salesNo,
      salesDate: info.salesDate,
      ...info.invoiceNumber !== void 0 && { invoiceNumber: info.invoiceNumber },
      ...info.invoiceDate && { invoiceDate: info.invoiceDate }
    })),
    raw: visit
  };
}
function renderBookingInvoiceHtml(draft) {
  const lineRows = draft.lines.map((line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatEur(line.unitPrice)}</td>
        <td class="num">${formatEur(line.amount)}</td>
      </tr>`).join("");
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Rechnung Buchung ${draft.bookingNo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    .num { text-align: right; }
    .muted { color: #666; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; }
  </style>
</head>
<body>
  <h1>Rechnung / Buchungsbeleg</h1>
  <div class="muted">Buchung ${draft.bookingNo}${draft.orderNumber ? ` \xB7 Order ${escapeHtml(draft.orderNumber)}` : ""}</div>

  <p>
    <strong>${escapeHtml(draft.customer.name || "Gast")}</strong><br>
    ${escapeHtml([draft.customer.street, draft.customer.number].filter(Boolean).join(" "))}<br>
    ${escapeHtml([draft.customer.zipCode, draft.customer.town].filter(Boolean).join(" "))}
  </p>

  <p>
    Leistungszeitraum: ${escapeHtml(draft.startDate)} bis ${escapeHtml(draft.endDate)}
  </p>

  <table>
    <thead><tr><th>Position</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Betrag</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Netto</td><td class="num">${formatEur(draft.totals.lineAmount)}</td></tr>
    <tr><td>MwSt.</td><td class="num">${formatEur(draft.totals.vatAmount)}</td></tr>
    <tr><td><strong>Gesamt</strong></td><td class="num"><strong>${formatEur(draft.totals.amount)}</strong></td></tr>
    <tr><td>Bezahlt</td><td class="num">${formatEur(draft.totals.paidAmount)}</td></tr>
    <tr><td>Offen</td><td class="num">${formatEur(draft.totals.balance)}</td></tr>
  </table>
</body>
</html>`;
}
function periodReservationLine(item) {
  const raw = item;
  return {
    source: "periodReservation",
    id: readString2(raw, "id"),
    articleId: item.articleId,
    ...item.articleCode && { articleCode: item.articleCode },
    description: item.articleName || item.expositionName || "Buchung",
    quantity: numberValue(item.quantity),
    unitPrice: numberValue(item.unitPrice),
    amount: numberValue(item.amount),
    lineAmount: numberValue(item.lineAmount),
    vatAmount: numberValue(item.vatAmount),
    ...readNumber(raw, "vatPercentage") !== void 0 && { vatPercentage: readNumber(raw, "vatPercentage") },
    ...item.expositionName && { expositionName: item.expositionName },
    ...item.expositionPeriodFrom && { periodFrom: item.expositionPeriodFrom },
    ...item.expositionPeriodUntil && { periodUntil: item.expositionPeriodUntil }
  };
}
function articleLine(item) {
  const raw = item;
  const lineAmount = readNumber(raw, "lineAmount") ?? numberValue(item.amount);
  const vatAmount = readNumber(raw, "vatAmount") ?? 0;
  return {
    source: "article",
    id: readString2(raw, "id"),
    articleId: item.articleId,
    ...item.articleCode && { articleCode: item.articleCode },
    description: item.articleName || "Artikel",
    quantity: numberValue(item.quantity),
    unitPrice: numberValue(item.unitPrice),
    amount: numberValue(item.amount),
    lineAmount,
    vatAmount,
    ...readNumber(raw, "vatPercentage") !== void 0 && { vatPercentage: readNumber(raw, "vatPercentage") }
  };
}
function readInvoiceCustomer(visit) {
  const guest = (visit.salesInfos ?? []).map((info) => info.guest).find(Boolean);
  if (guest) {
    const firstName2 = guest.firstName?.trim();
    const lastName2 = guest.name?.trim();
    return {
      name: [firstName2, lastName2].filter(Boolean).join(" ") || guest.email || "",
      ...firstName2 && { firstName: firstName2 },
      ...lastName2 && { lastName: lastName2 },
      ...guest.email && { email: guest.email },
      ...guest.telephone !== void 0 && { telephone: guest.telephone },
      ...guest.street1 && { street: guest.street1 },
      ...guest.street2 && { number: guest.street2 },
      ...guest.zipCode && { zipCode: guest.zipCode },
      ...guest.home && { town: guest.home }
    };
  }
  const person = visit.person;
  const nestedName = person?.name;
  const firstName = person?.firstName ?? readString2(nestedName, "first");
  const lastName = person?.lastName ?? readString2(nestedName, "last");
  const address = person?.address;
  return {
    name: [firstName, lastName].filter(Boolean).join(" ") || person?.email || "",
    ...firstName && { firstName },
    ...lastName && { lastName },
    ...person?.email && { email: person.email },
    ...person?.cellPhone && { telephone: person.cellPhone },
    ...address?.street && { street: address.street },
    ...address?.number && { number: address.number },
    ...address?.zipCode && { zipCode: address.zipCode },
    ...address?.town && { town: address.town },
    ...address?.countryDescription && { country: address.countryDescription }
  };
}
function oneVisit(visits, label) {
  if (visits.length === 0) throw new Error(`No OrganisedVisit matched ${label}`);
  if (visits.length > 1) throw new Error(`Multiple OrganisedVisits matched ${label}`);
  return visits[0];
}
function sum(lines, key) {
  return lines.reduce((total, line) => total + numberValue(line[key]), 0);
}
function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function readString2(obj, ...keys) {
  if (!obj) return void 0;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return void 0;
}
function readNumber(obj, ...keys) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number") return value;
  }
  return void 0;
}
function round23(n) {
  return Math.round(n * 100) / 100;
}
function formatEur(n) {
  return `${n.toFixed(2).replace(".", ",")} EUR`;
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export { DIVISION_IDS, GASTRO_GROUP_MAP, GUEST_CUSTOMER_ID, PAYMENT_METHOD_ID_KARTENZAHLUNG, SHOP_ID, SPACE_MAGIC_ZONE_ID, VOUCHER_SKUS, buildBirthdayBasket, buildBookingInvoiceDraft, categorizeVisit, classifyVoucher, extractEssen, extractKind, extractKontakt, extractPaket, findBookingForInvoice, findVoucher, gastroGroupName, getBookingInvoiceDraft, isGastroGroup, listGastroArticles, mapBirthdayBooking, mapEscapeBooking, renderBookingInvoiceHtml, syncGastroSales };
//# sourceMappingURL=spacemagic.js.map
//# sourceMappingURL=spacemagic.js.map