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
    (sum, r) => sum + (r.quantity || 0),
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
    (sum, r) => sum + (r.quantity || 0),
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

export { DIVISION_IDS, GASTRO_GROUP_MAP, GUEST_CUSTOMER_ID, PAYMENT_METHOD_ID_KARTENZAHLUNG, SHOP_ID, SPACE_MAGIC_ZONE_ID, VOUCHER_SKUS, categorizeVisit, classifyVoucher, extractEssen, extractKind, extractKontakt, extractPaket, findVoucher, gastroGroupName, isGastroGroup, mapBirthdayBooking, mapEscapeBooking };
//# sourceMappingURL=spacemagic.js.map
//# sourceMappingURL=spacemagic.js.map