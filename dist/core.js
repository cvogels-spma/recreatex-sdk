// src/core/context.ts
var STABLE_SESSION_ID = "00000000-0000-0000-0000-000000000001";
function buildContext(opts) {
  const session = typeof opts.sessionId === "function" ? opts.sessionId() : opts.sessionId ?? STABLE_SESSION_ID;
  const ctx = {
    Language: opts.language ?? "de",
    ShopId: opts.shopId,
    SessionId: session,
    Password: opts.password
  };
  if (opts.divisionId) ctx.DivisionId = opts.divisionId;
  return ctx;
}
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

// src/core/errors.ts
var RecreatexError = class extends Error {
  /** Endpoint path that triggered the error, if known. */
  endpoint;
  constructor(message, options) {
    super(message);
    this.name = "RecreatexError";
    this.endpoint = options?.endpoint;
    if (options?.cause !== void 0) {
      this.cause = options.cause;
    }
  }
};
var RecreatexHttpError = class extends RecreatexError {
  status;
  body;
  constructor(status, endpoint, body, options) {
    super(`Recreatex ${endpoint} HTTP ${status}`, { endpoint, cause: options?.cause });
    this.name = "RecreatexHttpError";
    this.status = status;
    this.body = body;
  }
};
var RecreatexApiError = class extends RecreatexError {
  raw;
  brokenRuleName;
  constructor(message, endpoint, raw, options) {
    super(`Recreatex ${endpoint}: ${message}`, { endpoint });
    this.name = "RecreatexApiError";
    this.raw = raw;
    this.brokenRuleName = options?.brokenRuleName;
  }
};
var RecreatexTimeoutError = class extends RecreatexError {
  timeoutMs;
  constructor(endpoint, timeoutMs) {
    super(`Recreatex ${endpoint} timed out after ${timeoutMs}ms`, { endpoint });
    this.name = "RecreatexTimeoutError";
    this.timeoutMs = timeoutMs;
  }
};

// src/core/helpers/retry.ts
function isRetryableError(err) {
  if (err instanceof RecreatexHttpError) {
    return err.status >= 500 && err.status < 600;
  }
  if (err instanceof RecreatexError) return false;
  return true;
}
async function withRetry(fn, opts = {}) {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseBackoff = Math.max(0, opts.backoffMs ?? 250);
  const maxBackoff = Math.max(baseBackoff, opts.maxBackoffMs ?? 4e3);
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (opts.signal?.aborted) {
      throw opts.signal.reason ?? new Error("Aborted");
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isRetryableError(err)) throw err;
      const delay = Math.min(maxBackoff, baseBackoff * 2 ** (attempt - 1));
      const jitter = Math.random() * delay * 0.25;
      await sleep(delay + jitter, opts.signal);
    }
  }
  throw lastErr;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason ?? new Error("Aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// src/core/helpers/pagination.ts
async function paginate(fetchPage, opts = {}) {
  const pageSize = opts.pageSize ?? 200;
  const maxPages = opts.maxPages ?? 50;
  const all = [];
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    if (opts.signal?.aborted) throw opts.signal.reason ?? new Error("Aborted");
    const page = await fetchPage({ pageIndex, pageSize });
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}
async function* paginateIter(fetchPage, opts = {}) {
  const pageSize = opts.pageSize ?? 200;
  const maxPages = opts.maxPages ?? 50;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    if (opts.signal?.aborted) throw opts.signal.reason ?? new Error("Aborted");
    const page = await fetchPage({ pageIndex, pageSize });
    for (const item of page) yield item;
    if (page.length < pageSize) return;
  }
}

// src/core/modules/articles.ts
var ArticlesModule = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Fetch a single page of articles. Use {@link findArticles} for auto-pagination.
   */
  async findArticlesPage(criteria = {}, callOpts) {
    const SearchCriteria = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 50
      },
      Includes: {
        Price: criteria.includes?.price ?? true,
        ImageUrl: criteria.includes?.imageUrl ?? true,
        ...criteria.includes?.image !== void 0 && { Image: criteria.includes.image },
        ...criteria.includes?.group !== void 0 && { Group: criteria.includes.group },
        Vat: criteria.includes?.vat ?? true,
        ...criteria.includes?.stock !== void 0 && { Stock: criteria.includes.stock },
        ...criteria.includes?.barcodes !== void 0 && { Barcodes: criteria.includes.barcodes },
        ...criteria.includes?.activePeriods !== void 0 && { ActivePeriods: criteria.includes.activePeriods },
        ...criteria.includes?.articleCategories !== void 0 && { ArticleCategories: criteria.includes.articleCategories },
        ...criteria.includes?.soldOutArticles !== void 0 && { SoldOutArticles: criteria.includes.soldOutArticles },
        ...criteria.includes?.saleArticles !== void 0 && { SaleArticles: criteria.includes.saleArticles },
        ...criteria.includes?.rentArticles !== void 0 && { RentArticles: criteria.includes.rentArticles },
        ...criteria.includes?.freeArticles !== void 0 && { FreeArticles: criteria.includes.freeArticles },
        Translations: criteria.includes?.translations ?? false,
        ...criteria.includes?.priceInfo !== void 0 && { PriceInfo: criteria.includes.priceInfo }
      }
    };
    if (criteria.articleId) SearchCriteria.ArticleID = criteria.articleId;
    if (criteria.articleGroupId) SearchCriteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;
    if (criteria.code) SearchCriteria.Code = criteria.code;
    if (criteria.barcode) SearchCriteria.Barcode = criteria.barcode;
    if (criteria.divisionId) SearchCriteria.DivisionId = criteria.divisionId;
    if (criteria.includeDetail !== void 0) SearchCriteria.IncludeDetail = criteria.includeDetail;
    if (criteria.stockLocationId) SearchCriteria.StockLocationId = criteria.stockLocationId;
    if (criteria.articleCategoryId) SearchCriteria.ArticleCategoryId = criteria.articleCategoryId;
    if (criteria.forVouchers !== void 0) SearchCriteria.ForVouchers = criteria.forVouchers;
    if (criteria.ignoreActivePeriodsFilter !== void 0) {
      SearchCriteria.IgnoreActivePeriodsFilter = criteria.ignoreActivePeriodsFilter;
    }
    const data = await this.client.post(
      "Json/Articles/FindArticles",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.result?.articles ?? data.articles ?? [];
  }
  /**
   * Fetch all articles matching the criteria. Pages internally.
   *
   * @example
   *   const vouchers = await client.articles.findArticles({ namePattern: 'Gutschein' });
   */
  async findArticles(criteria = {}, paginateOpts = {}, callOpts) {
    const pageOptions = {
      pageSize: criteria.pageSize ?? 50,
      ...paginateOpts
    };
    return paginate(
      ({ pageIndex, pageSize }) => this.findArticlesPage({ ...criteria, pageIndex, pageSize }, callOpts),
      pageOptions
    );
  }
  /** Fetch a single article by GUID. */
  async findArticleById(articleId, callOpts) {
    const articles = await this.findArticlesPage(
      {
        articleId,
        pageSize: 1,
        includes: { price: true, imageUrl: true, vat: true, group: true }
      },
      callOpts
    );
    return articles[0];
  }
  /** List all article groups (e.g. F&B categories, voucher types). */
  async listArticleGroups(callOpts) {
    const data = await this.client.post(
      "Json/Articles/ListArticleGroups",
      {},
      callOpts ?? {}
    );
    return data.articleGroups ?? [];
  }
  /** Detailed price information for an article, optionally customer-specific. */
  async getArticlePriceInformation(criteria, callOpts) {
    const SearchCriteria = { ArticleId: criteria.articleId };
    if (criteria.customerId) SearchCriteria.CustomerId = criteria.customerId;
    const data = await this.client.post(
      "Json/Articles/GetArticlePriceInformation",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.articlePriceInformation ?? data.ArticlePriceInformation ?? data.result?.articlePriceInformation ?? data.result?.ArticlePriceInformation;
  }
  /** Fetch a single page of historical sold article lines. */
  async findArticleSalesOrdersPage(criteria = {}, callOpts) {
    const SearchCriteria = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 200
      }
    };
    if (criteria.id) SearchCriteria.Id = criteria.id;
    if (criteria.personId) SearchCriteria.PersonId = criteria.personId;
    if (criteria.from) SearchCriteria.From = criteria.from;
    if (criteria.until) SearchCriteria.Until = criteria.until;
    if (criteria.type !== void 0) SearchCriteria.Type = encodeArticleSalesOrderType(criteria.type);
    const data = await this.client.post(
      "Json/Articles/FindArticleSalesOrders",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.articleSalesOrders ?? data.ArticleSalesOrders ?? data.result?.articleSalesOrders ?? data.result?.ArticleSalesOrders ?? [];
  }
  /** Fetch all historical sold article lines matching the criteria. */
  async findArticleSalesOrders(criteria = {}, paginateOpts = {}, callOpts) {
    const pageOptions = {
      pageSize: criteria.pageSize ?? 200,
      ...paginateOpts
    };
    return paginate(
      ({ pageIndex, pageSize }) => this.findArticleSalesOrdersPage({ ...criteria, pageIndex, pageSize }, callOpts),
      pageOptions
    );
  }
  /**
   * Article dossier: current catalogue/price data plus sold quantity,
   * revenue and a day/month history for a single article.
   */
  async getArticleSalesReport(criteria, paginateOpts = {}, callOpts) {
    const article = await this.resolveReportArticle(criteria, callOpts);
    const articleId = criteria.articleId ?? article?.id;
    const matchMode = criteria.matchMode ?? "exact";
    const sales = await this.findArticleSalesOrders(
      {
        from: criteria.from,
        until: criteria.until,
        personId: criteria.personId,
        type: criteria.type ?? "Sales",
        pageSize: criteria.pageSize ?? 200
      },
      paginateOpts,
      callOpts
    );
    const lines = sales.filter((line) => matchesArticleSalesOrder(line, { article, articleId, criteria, matchMode })).map(toReportLine);
    const totals = summarizeLines(lines);
    const history = groupLines(lines, criteria.historyGroup ?? "day");
    const priceInfo = articleId ? await this.getArticlePriceInformation({ articleId }, callOpts) : void 0;
    const report = {
      ...article && { article },
      ...articleId && { articleId },
      currentPrice: article?.price ?? priceInfo?.totalPrice ?? null,
      ...priceInfo && { priceInfo },
      from: criteria.from,
      until: criteria.until,
      matchMode,
      totals,
      history
    };
    if (criteria.includeLines ?? true) report.lines = lines;
    return report;
  }
  async resolveReportArticle(criteria, callOpts) {
    if (criteria.articleId) {
      return this.findArticleById(criteria.articleId, callOpts);
    }
    if (!criteria.code && !criteria.namePattern) return void 0;
    const matches = await this.findArticles(
      {
        code: criteria.code,
        namePattern: criteria.namePattern,
        divisionId: criteria.divisionId,
        includes: { price: true, imageUrl: true, vat: true, group: true }
      },
      { pageSize: criteria.pageSize ?? 50, maxPages: 5 },
      callOpts
    );
    if (matches.length === 0) {
      throw new Error("Article sales report: no article matched the given criteria");
    }
    if (criteria.code) {
      const exactCode = matches.find((a) => same(a.code, criteria.code));
      if (exactCode) return exactCode;
    }
    if (criteria.namePattern) {
      const exactName = matches.filter((a) => same(a.name, criteria.namePattern));
      if (exactName.length === 1) return exactName[0];
    }
    if (matches.length === 1) return matches[0];
    const labels = matches.slice(0, 5).map((a) => `${a.code || "?"} \xB7 ${a.name}`).join(", ");
    throw new Error(
      `Article sales report: multiple articles matched; narrow by code or articleId (${labels})`
    );
  }
};
function same(a, b) {
  return normalize(a) === normalize(b);
}
function normalize(v) {
  return (v ?? "").trim().toLocaleLowerCase("de-DE");
}
var ARTICLE_SALES_ORDER_TYPE_VALUES = {
  All: 0,
  Sales: 1,
  Warranty: 2,
  WaitingList: 3,
  Service: 4,
  ChipKnip: 5,
  LessonGroup: 6,
  Purchase: 7,
  PriceGroup: 8,
  Credit: 9,
  Rental: 10,
  Subscription: 11,
  PurchaseCredit: 12,
  Family: 13,
  GiftCertificate: 14,
  ConsumptionCoupon: 15,
  FollowUp: 16,
  SpendingCredit: 17,
  ETicket: 18
};
function encodeArticleSalesOrderType(type) {
  return typeof type === "string" ? ARTICLE_SALES_ORDER_TYPE_VALUES[type] ?? type : type;
}
function matchesArticleSalesOrder(line, opts) {
  const lineArticleId = readString(line, "articleId", "ArticleId", "ArticleID") ?? readNestedId(line, "article", "Article");
  if (opts.articleId && lineArticleId && same(lineArticleId, opts.articleId)) return true;
  const lineCode = readString(line, "articleCode", "code", "Code") ?? readNestedString(line, ["article", "Article"], ["code", "Code"]);
  if (opts.article?.code && lineCode && same(lineCode, opts.article.code)) return true;
  if (opts.criteria.code && lineCode && same(lineCode, opts.criteria.code)) return true;
  const description = normalize(
    readString(line, "description", "Description", "articleName", "name", "Name") ?? readNestedString(line, ["article", "Article"], ["name", "Name"]) ?? ""
  );
  const articleName = normalize(opts.article?.name ?? opts.criteria.namePattern);
  if (!articleName || !description) return false;
  return opts.matchMode === "includes" ? description.includes(articleName) : description === articleName;
}
function toReportLine(line) {
  const quantity = readNumber(line, "quantity", "Quantity") ?? 0;
  const unitPrice = readNumber(line, "unitPrice", "UnitPrice") ?? 0;
  const totalPrice = readNumber(line, "totalPrice", "TotalPrice") ?? round2(quantity * unitPrice);
  const out = {
    saleLineId: readString(line, "id", "Id") ?? "",
    date: readString(line, "date", "Date") ?? "",
    description: readString(line, "description", "Description") ?? "",
    quantity,
    unitPrice,
    totalPrice
  };
  const personId = readString(line, "personId", "PersonId");
  if (personId !== void 0) out.personId = personId;
  const number = readNumber(line, "number", "Number");
  if (number !== void 0) out.number = number;
  const sequenceNumber = readNumber(line, "sequenceNumber", "SequenceNumber");
  if (sequenceNumber !== void 0) out.sequenceNumber = sequenceNumber;
  return out;
}
function summarizeLines(lines) {
  const quantity = round2(lines.reduce((sum, line) => sum + line.quantity, 0));
  const totalPrice = round2(lines.reduce((sum, line) => sum + line.totalPrice, 0));
  return {
    quantity,
    totalPrice,
    lineCount: lines.length,
    averageUnitPrice: quantity > 0 ? round2(totalPrice / quantity) : null
  };
}
function groupLines(lines, group) {
  const buckets = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const period = group === "month" ? line.date.slice(0, 7) : line.date.slice(0, 10);
    const existing = buckets.get(period) ?? [];
    existing.push(line);
    buckets.set(period, existing);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, bucket]) => ({ period, ...summarizeLines(bucket) }));
}
function readString(obj, ...keys) {
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
function readNestedId(obj, ...keys) {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === "object") {
      const id = readString(value, "id", "Id", "ID");
      if (id) return id;
    }
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
function round2(n) {
  return Math.round(n * 100) / 100;
}

// src/core/helpers/dates.ts
var DEFAULT_TZ = "Europe/Berlin";
function ymd(d = /* @__PURE__ */ new Date(), tz = DEFAULT_TZ) {
  return d.toLocaleDateString("sv-SE", { timeZone: tz });
}
function todayYmd(tz = DEFAULT_TZ) {
  return ymd(/* @__PURE__ */ new Date(), tz);
}
function dayRangeDotted(date = /* @__PURE__ */ new Date(), tz = DEFAULT_TZ) {
  const d = typeof date === "string" ? date : ymd(date, tz);
  return {
    from: `${d} 00:00:00.000`,
    until: `${d} 23:59:59.000`
  };
}
function dayRangeIso(date = /* @__PURE__ */ new Date(), tz = DEFAULT_TZ) {
  const d = typeof date === "string" ? date : ymd(date, tz);
  return {
    from: `${d}T00:00:00`,
    until: `${d}T23:59:59`
  };
}
function ymdWindow(before, after, today = /* @__PURE__ */ new Date(), tz = DEFAULT_TZ) {
  const from = new Date(today);
  from.setDate(from.getDate() - before);
  const until = new Date(today);
  until.setDate(until.getDate() + after);
  return { fromYmd: ymd(from, tz), untilYmd: ymd(until, tz) };
}

// src/core/modules/expositions.ts
var ExpositionsModule = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /** List expositions matching `namePattern`. */
  async findExpositions(criteria = {}, callOpts) {
    const SearchCriteria = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 50
      },
      Includes: { Pricing: criteria.includes?.pricing ?? false }
    };
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;
    const data = await this.client.post(
      "Json/Expositions/FindExpositions",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.result?.expositions ?? data.expositions ?? [];
  }
  /** List free/blocked days for an exposition in `[fromIso, untilIso]`. */
  async findPeriodDates(expositionId, fromIso, untilIso, callOpts) {
    const data = await this.client.post(
      "Json/Expositions/FindExpositionPeriodDates",
      {
        SearchCriteria: { ExpositionId: expositionId, From: fromIso, Until: untilIso }
      },
      callOpts ?? {}
    );
    return data.dates ?? [];
  }
  /** Slots + capacity for a single day. */
  async findOverviewByDay(expositionId, date, callOpts) {
    const { from, until } = dayRangeIso(date);
    const data = await this.client.post(
      "Json/Expositions/FindExpositionOverviewByDay",
      {
        Criteria: {
          ExpositionId: expositionId,
          StartTime: from,
          EndTime: until,
          Includes: { Pricing: true },
          ExpositionIdList: [expositionId]
        }
      },
      callOpts ?? {}
    );
    return data.validateExpositionSubscriptionItemResult ?? [];
  }
  /**
   * Addressable Period entries (carries the `id` you need for an
   * `ExpositionPeriodReservation` basket item).
   *
   *  ⚠ Use this and NOT {@link findOverviewByDay} when you need to
   *  build a checkout basket — `findOverviewByDay` does not include
   *  the period id.
   *
   * @param expositionId — the Exposition GUID.
   * @param fromIso — ISO datetime, e.g. `'2026-05-07T00:00:00'`.
   * @param untilIso — ISO datetime, e.g. `'2026-05-07T23:59:59'`.
   *
   * @example
   *   const periods = await client.expositions.listPeriods(
   *     'c9b017fe-fafc-ef11-9596-b28721114d72',
   *     '2026-05-07T00:00:00', '2026-05-07T23:59:59',
   *   );
   *   const slot = periods.find((p) => p.from === '2026-05-07T14:00:00');
   *   // → slot.id is the ExpositionPeriodId
   */
  async listPeriods(expositionId, fromIso, untilIso, callOpts) {
    const data = await this.client.post(
      "Json/Expositions/ListExpositionPeriods",
      {
        SearchCriteria: { ExpositionId: expositionId, From: fromIso, Until: untilIso }
      },
      callOpts ?? {}
    );
    return data.expositionPeriods ?? [];
  }
  /**
   * Fetch a single page of OrganisedVisits.
   *
   *  ⚠ The `From`/`Until` filter applies to `purchaseDate`, NOT `startDate`.
   *  For sync use cases pull a generous window and filter client-side by
   *  `startDate` (see {@link ymdWindow}).
   */
  async findOrganisedVisitsPage(criteria, callOpts) {
    const SearchCriteria = {
      Paging: criteria.paging ?? { PageIndex: 0, PageSize: 200 },
      Includes: {
        PeriodReservations: criteria.includes?.periodReservations ?? true,
        Articles: criteria.includes?.articles ?? true,
        PersonDetails: criteria.includes?.personDetails ?? true
      }
    };
    if (criteria.fromYmd) SearchCriteria.From = `${criteria.fromYmd} 00:00:00.000`;
    if (criteria.untilYmd) SearchCriteria.Until = `${criteria.untilYmd} 23:59:59.000`;
    if (criteria.organisedVisitId) SearchCriteria.OrganisedVisitId = criteria.organisedVisitId;
    if (criteria.personId) SearchCriteria.PersonId = criteria.personId;
    if (criteria.orderNumber) SearchCriteria.OrderNumber = criteria.orderNumber;
    const data = await this.client.post(
      "Json/Expositions/FindOrganisedVisits",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.organisedVisits ?? [];
  }
  /**
   * Auto-paginated list of OrganisedVisits.
   *
   * @example
   *   const visits = await client.expositions.findOrganisedVisits({
   *     fromYmd: '2026-04-01', untilYmd: '2026-04-30',
   *   });
   */
  async findOrganisedVisits(criteria, paginateOpts = {}, callOpts) {
    const pageOptions = {
      pageSize: criteria.paging?.PageSize ?? 200,
      ...paginateOpts
    };
    return paginate(
      ({ pageIndex, pageSize }) => this.findOrganisedVisitsPage(
        { ...criteria, paging: { PageIndex: pageIndex, PageSize: pageSize } },
        callOpts
      ),
      pageOptions
    );
  }
  /** Adjust quantities on an existing visit (more kids, extra food). */
  async adjustOrganisedVisit(input, callOpts) {
    const body = {
      OrganisedVisitId: input.organisedVisitId,
      OrganisedVisitTicketAdjustments: (input.ticketAdjustments ?? []).map((t) => ({
        PriceGroupId: t.priceGroupId,
        Quantity: t.quantity
      })),
      OrganisedVisitSaleAdjustments: (input.saleAdjustments ?? []).map((s) => ({
        ArticleId: s.articleId,
        Quantity: s.quantity,
        ...s.unitPrice !== void 0 && { UnitPrice: s.unitPrice }
      }))
    };
    const data = await this.client.post("Json/Expositions/AdjustOrganisedVisit", body, callOpts ?? {});
    const result = { isValid: data.isValid ?? true };
    if (data.message !== void 0) result.message = data.message;
    return result;
  }
  /** Cancel a visit. Returns the amount to refund. */
  async cancelOrganisedVisit(input, callOpts) {
    const body = {
      OrganisedVisitId: input.organisedVisitId,
      ReasonId: input.reasonId
    };
    if (input.paymentMethodId) body.PaymentMethodId = input.paymentMethodId;
    const data = await this.client.post("Json/Expositions/CancelOrganisedVisit", body, callOpts ?? {});
    const result = {
      returnAmount: data.ReturnAmount ?? 0,
      isValid: data.IsValid ?? true
    };
    if (data.SalesSerieId !== void 0) result.salesSerieId = data.SalesSerieId;
    if (data.Message !== void 0) result.message = data.Message;
    return result;
  }
  /** Preview the cost delta for a slot change (no apply). */
  async getRebookingCosts(input, callOpts) {
    const body = {
      OrganisedVisitId: input.organisedVisitId,
      OrganisedVisitPeriodTransfers: input.transfers.map((t) => ({
        OldPeriodId: t.oldPeriodId,
        NewPeriodId: t.newPeriodId,
        Quantity: t.quantity
      }))
    };
    const data = await this.client.post("Json/Expositions/GetOrganisedVisitRebookingCosts", body, callOpts ?? {});
    return { rebookingCosts: data.RebookingCosts ?? 0 };
  }
};

// src/core/modules/general.ts
var GeneralModule = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Live occupancy + zone metadata.
   *
   *  ⚠ `visitorsToday` and `visitorsCurrent` ALWAYS reflect "right now".
   *  `OccupancyFrom`/`OccupancyUntil` is accepted but ignored for those
   *  fields — historic counts are not retrievable via this endpoint.
   *
   * @example
   *   const zones = await client.general.findAccessZones({ today: true });
   */
  async findAccessZones(criteria = {}, callOpts) {
    const Criteria = {
      Id: criteria.id ?? null,
      Includes: {
        EntranceReaders: criteria.includes?.entranceReaders ?? false,
        ExitReaders: criteria.includes?.exitReaders ?? false,
        Occupancy: criteria.includes?.occupancy ?? true,
        InactiveZoneControl: criteria.includes?.inactiveZoneControl ?? false
      }
    };
    if (criteria.today) {
      const range = dayRangeDotted();
      Criteria.OccupancyFrom = range.from;
      Criteria.OccupancyUntil = range.until;
    } else {
      if (criteria.occupancyFrom) Criteria.OccupancyFrom = criteria.occupancyFrom;
      if (criteria.occupancyUntil) Criteria.OccupancyUntil = criteria.occupancyUntil;
    }
    const data = await this.client.post(
      "Json/General/FindAccessZones",
      { Criteria },
      callOpts ?? {}
    );
    return data.accessZones ?? data.zones ?? data.result?.accessZones ?? data.result?.zones ?? [];
  }
  /** All readers (eCarts, Laser Tag, vending, etc.). */
  async getReaders(callOpts) {
    const data = await this.client.post(
      "Json/General/GetReaders",
      {},
      callOpts ?? {}
    );
    return data.readers ?? [];
  }
  /** All divisions (Space Magic, Webshop, Admin). */
  async listDivisions(callOpts) {
    const data = await this.client.post(
      "Json/General/ListDivisions",
      {},
      callOpts ?? {}
    );
    return data.divisions ?? [];
  }
  /** All POS terminals. */
  async getPointOfSales(callOpts) {
    const data = await this.client.post(
      "Json/General/GetPointOfSales",
      {},
      callOpts ?? {}
    );
    return data.pointOfSales ?? [];
  }
  /** All payment methods (~32 entries). */
  async listPaymentMethods(callOpts) {
    const data = await this.client.post(
      "Json/General/ListPaymentMethods",
      {},
      callOpts ?? {}
    );
    return data.paymentMethods ?? [];
  }
  /** Look up persons. Provide at least one filter. */
  async findPerson(criteria, callOpts) {
    const Criteria = {};
    if (criteria.id) Criteria.Id = criteria.id;
    if (criteria.email) Criteria.Email = criteria.email;
    if (criteria.firstName) Criteria.FirstName = criteria.firstName;
    if (criteria.lastName) Criteria.LastName = criteria.lastName;
    if (criteria.username) Criteria.Username = criteria.username;
    const data = await this.client.post(
      "Json/General/FindPerson",
      { Criteria },
      callOpts ?? {}
    );
    return data.persons ?? data.result?.persons ?? [];
  }
  /** Low-level sales (only Nachzahlautomat / Checkins, not all POS). */
  async findSales(criteria, callOpts) {
    const Criteria = {
      From: criteria.from,
      Until: criteria.until
    };
    if (criteria.pointOfSaleId) Criteria.PointOfSaleId = criteria.pointOfSaleId;
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;
    const data = await this.client.post(
      "Json/General/FindSales",
      { Criteria },
      callOpts ?? {}
    );
    return data.sales ?? [];
  }
  // ---- Basket flow -------------------------------------------------------
  /** Recalculate prices, discounts, VAT for a basket without committing. */
  async reCalculateBasket(basket, callOpts) {
    const data = await this.client.post(
      "Json/General/ReCalculateBasket",
      { Basket: basket },
      callOpts ?? {}
    );
    const out = data.basket ?? data.Basket;
    if (!out) {
      throw new Error("ReCalculateBasket: no Basket in response");
    }
    return out;
  }
  /** Lock basket items for the duration of payment. */
  async lockBasketItems(items, callOpts) {
    const data = await this.client.post(
      "Json/General/LockBasketItems",
      { BasketItems: items },
      callOpts ?? {}
    );
    const lower = data.lockBasketResult;
    const upper = data.LockBasketResult;
    const result = {
      isLocked: lower?.isLocked ?? upper?.IsLocked ?? false
    };
    const expiry = lower?.lockExpiry ?? upper?.LockExpiry;
    if (expiry !== void 0) result.lockExpiry = expiry;
    const msg = lower?.message ?? upper?.Message;
    if (msg !== void 0) result.message = msg;
    return result;
  }
  /**
   * Finalise the basket (creates the sale).
   *
   * @returns full `Result` object including `SalesOrderNumber` and
   *   `SalesItems[]` (use `SalesItems[].Id` as `SalesLineId` for the
   *   document service).
   */
  async checkoutBasket(basket, callOpts) {
    const data = await this.client.post(
      "Json/General/CheckoutBasket",
      { Basket: basket },
      callOpts ?? {}
    );
    const result = data.result ?? data.Result;
    if (!result) {
      throw new Error("CheckoutBasket: no result in response");
    }
    return result;
  }
  // ---- Gift certificates -----------------------------------------------
  /**
   * Find gift certificates, e.g. by customer or by id. Newest first.
   *
   * @example
   *   const certs = await client.general.findGiftCertificates({
   *     customerId: GUEST_CUSTOMER_ID, pageSize: 20,
   *   });
   *   const cert = certs.find((c) => c.salesSeriesID === checkoutResult.SalesSeriesId);
   */
  async findGiftCertificates(criteria, callOpts) {
    const Criteria = {
      Paging: {
        PageIndex: criteria.pageIndex ?? 0,
        PageSize: criteria.pageSize ?? 20
      }
    };
    if (criteria.customerId) Criteria.CustomerId = criteria.customerId;
    if (criteria.id) Criteria.Id = criteria.id;
    if (criteria.number) Criteria.Number = criteria.number;
    const data = await this.client.post(
      "Json/General/FindGiftCertificates",
      { Criteria },
      callOpts ?? {}
    );
    return data.findGiftCertificatesResult?.giftCertificates ?? data.giftCertificates ?? [];
  }
  /**
   * Mark a gift certificate as printed/delivered. Recreatex sets `printDate`
   * on the cert. Best-effort — if it fails, the voucher is still valid; the
   * back-office staff can reprint.
   */
  async setGiftCertificatePrinted(giftCertificateId, callOpts) {
    await this.client.post(
      "Json/General/SetGiftCertificatePrinted",
      { Criteria: { Id: giftCertificateId } },
      callOpts ?? {}
    );
  }
};

// src/core/modules/manager.ts
var ManagerModule = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /** Aggregated revenue. Combine `groupBy*` flags as needed. */
  async listSalesInformation(criteria, callOpts) {
    const Criteria = {
      From: criteria.from,
      Until: criteria.until
    };
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;
    if (criteria.articleGroupId) Criteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.groupByDate) Criteria.GroupByDate = true;
    if (criteria.groupByDivision) Criteria.GroupByDivision = true;
    if (criteria.groupByArticleGroup) Criteria.GroupByArticleGroup = true;
    const data = await this.client.post(
      "Json/ManagerApp/ListSalesInformation",
      { Criteria },
      callOpts ?? {}
    );
    return data.salesInformation ?? [];
  }
  /**
   * Visitor scans (NOT distinct guests — see manager.ts caveats).
   *
   * For real guest counts use {@link GeneralModule.findAccessZones} with
   * `today: true` and persist `visitorsToday` yourself.
   */
  async listVisitingCustomersInformation(criteria, callOpts) {
    const Criteria = {
      From: criteria.from,
      Until: criteria.until
    };
    if (criteria.divisionId) Criteria.DivisionId = criteria.divisionId;
    if (criteria.articleGroupId) Criteria.ArticleGroupId = criteria.articleGroupId;
    if (criteria.groupByDate) Criteria.GroupByDate = true;
    if (criteria.groupByDivision) Criteria.GroupByDivision = true;
    if (criteria.groupByArticleGroup) Criteria.GroupByArticleGroup = true;
    const data = await this.client.post(
      "Json/ManagerApp/ListVisitingCustomersInformation",
      { Criteria },
      callOpts ?? {}
    );
    return data.visitingCustomersInformation ?? [];
  }
};

// src/core/documents/gift-certificates.ts
var DocumentsModule = class {
  constructor(client) {
    this.client = client;
  }
  client;
  get base() {
    return this.client.options.documentServiceUrl ?? `${this.client.options.baseUrl}/WebShopDocumentService.svc`;
  }
  /**
   * Download a Gift Certificate PDF.
   *
   * @param req.salesLineId — `SalesItems[].Id` from the
   *   {@link GeneralModule.checkoutBasket} response.
   * @returns binary `Blob` (~377 KB for the Space Magic template).
   *
   * @example
   *   const result = await client.general.checkoutBasket(basket);
   *   const lineId = result.SalesItems?.[0]?.Id;
   *   if (lineId) {
   *     const pdf = await client.documents.giftCertificatePdf({ salesLineId: lineId });
   *   }
   */
  async giftCertificatePdf(req, callOpts) {
    const lang = req.language ?? this.client.options.language ?? "de";
    const shopId = req.shopId ?? this.client.options.shopId;
    const url = `${this.base}/GiftCertificates/${shopId}/${lang}/${req.salesLineId}`;
    return this.client.getBinary(url, callOpts ?? {});
  }
  /** Discover the merge-fields supported by the configured Word template. */
  async giftCertificateHelp(language, callOpts) {
    const lang = language ?? this.client.options.language ?? "de";
    const shopId = this.client.options.shopId;
    const url = `${this.base}/Help/GiftCertificates/${shopId}/${lang}`;
    return this.client.getBinary(url, callOpts ?? {});
  }
};

// src/core/client.ts
var ReCreateXClient = class {
  options;
  _fetch;
  articles;
  expositions;
  general;
  manager;
  documents;
  constructor(opts) {
    if (!opts.baseUrl) throw new Error("ReCreateXClient: baseUrl is required");
    if (!opts.shopId) throw new Error("ReCreateXClient: shopId is required");
    if (!opts.password) throw new Error("ReCreateXClient: password is required");
    const baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.options = {
      ...opts,
      baseUrl,
      language: opts.language ?? "de",
      timeoutMs: opts.timeoutMs ?? 15e3
    };
    const f = opts.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error(
        "ReCreateXClient: no fetch implementation available. Pass `fetch:` explicitly on Node <18."
      );
    }
    this._fetch = f.bind(globalThis);
    this.articles = new ArticlesModule(this);
    this.expositions = new ExpositionsModule(this);
    this.general = new GeneralModule(this);
    this.manager = new ManagerModule(this);
    this.documents = new DocumentsModule(this);
  }
  /** Build a fresh Context for a call, honouring per-call overrides. */
  buildContext(overrides) {
    return buildContext({
      shopId: this.options.shopId,
      password: this.options.password,
      language: overrides?.language ?? this.options.language,
      sessionId: overrides?.sessionId ?? this.options.sessionId ?? STABLE_SESSION_ID,
      ...this.options.divisionId !== void 0 && { divisionId: this.options.divisionId }
    });
  }
  /**
   * Low-level POST. Builds the URL as `${baseUrl}/${path}/`, injects Context,
   * applies timeout + retry, and parses JSON. Throws {@link RecreatexHttpError},
   * {@link RecreatexApiError}, or {@link RecreatexTimeoutError}.
   *
   * @internal Used by the module classes; exposed for advanced callers.
   */
  async post(path, body, callOpts = {}) {
    const endpoint = path.replace(/^\/+/, "").replace(/\/+$/, "");
    const url = `${this.options.baseUrl}/${endpoint}/`;
    const ctx = this.buildContext({
      ...callOpts.language !== void 0 && { language: callOpts.language },
      ...callOpts.sessionId !== void 0 && { sessionId: callOpts.sessionId }
    });
    const payload = JSON.stringify({ Context: ctx, ...body });
    const timeoutMs = callOpts.timeoutMs ?? this.options.timeoutMs;
    const retryOpts = callOpts.noRetry ? { attempts: 1, ...callOpts.signal && { signal: callOpts.signal } } : { ...this.options.retry ?? {}, ...callOpts.signal && { signal: callOpts.signal } };
    return withRetry(async () => {
      const ac = new AbortController();
      const onParentAbort = () => ac.abort(callOpts.signal?.reason);
      callOpts.signal?.addEventListener("abort", onParentAbort, { once: true });
      const timer = setTimeout(() => ac.abort(new RecreatexTimeoutError(endpoint, timeoutMs)), timeoutMs);
      let res;
      try {
        res = await this._fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          body: payload,
          signal: ac.signal
        });
      } catch (err) {
        if (ac.signal.reason instanceof RecreatexTimeoutError) throw ac.signal.reason;
        throw err;
      } finally {
        clearTimeout(timer);
        callOpts.signal?.removeEventListener("abort", onParentAbort);
      }
      if (!res.ok) {
        const text = await safeReadText(res);
        throw new RecreatexHttpError(res.status, endpoint, text);
      }
      const data = await res.json();
      assertOk(data, endpoint);
      return data;
    }, retryOpts);
  }
  /** Low-level GET — only used by the document service for binary downloads. */
  async getBinary(url, callOpts = {}) {
    const timeoutMs = callOpts.timeoutMs ?? this.options.timeoutMs;
    const retryOpts = callOpts.noRetry ? { attempts: 1, ...callOpts.signal && { signal: callOpts.signal } } : { ...this.options.retry ?? {}, ...callOpts.signal && { signal: callOpts.signal } };
    return withRetry(async () => {
      const ac = new AbortController();
      const onParentAbort = () => ac.abort(callOpts.signal?.reason);
      callOpts.signal?.addEventListener("abort", onParentAbort, { once: true });
      const timer = setTimeout(() => ac.abort(new RecreatexTimeoutError(url, timeoutMs)), timeoutMs);
      try {
        const res = await this._fetch(url, { method: "GET", signal: ac.signal });
        if (!res.ok) {
          const text = await safeReadText(res);
          throw new RecreatexHttpError(res.status, url, text);
        }
        return await res.blob();
      } catch (err) {
        if (ac.signal.reason instanceof RecreatexTimeoutError) throw ac.signal.reason;
        throw err;
      } finally {
        clearTimeout(timer);
        callOpts.signal?.removeEventListener("abort", onParentAbort);
      }
    }, retryOpts);
  }
};
function assertOk(data, endpoint) {
  if (data && typeof data === "object") {
    if (data.succes === false) {
      const message = data.message ?? "unknown error";
      throw new RecreatexApiError(message, endpoint, data);
    }
    const lowerResult = data.result;
    const upperResult = data.Result;
    const lowerVal = lowerResult?.basketValidationResult;
    const upperVal = upperResult?.BasketValidationResult;
    const isValid = lowerVal?.isValid ?? upperVal?.IsValid;
    if (isValid === false) {
      const brokenRuleName = lowerVal?.brokenRuleName ?? upperVal?.brokenRuleName;
      const message = lowerVal?.message ?? upperVal?.Message ?? brokenRuleName ?? "basket validation failed";
      const opts = brokenRuleName !== void 0 && brokenRuleName !== null ? { brokenRuleName } : void 0;
      throw new RecreatexApiError(message, endpoint, data, opts);
    }
  }
}
async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return void 0;
  }
}

// src/core/types/basket.ts
var BCT = "ReCreateX.WebShop.WebServices.Contracts";
var SUFFIX = `, ${BCT}`;
var BasketTypeStrings = {
  // ---- Basket items (sales) ----
  ArticleSale: `${BCT}.ArticleSale${SUFFIX}`,
  /** Webshop-flavoured ArticleSale used by the OMG voucher shop. */
  SalesArticleSale: `${BCT}.SalesArticleSale${SUFFIX}`,
  ExpositionPeriodReservation: `${BCT}.ExpositionPeriodReservation${SUFFIX}`,
  CombiExpositionReservation: `${BCT}.CombiExpositionReservation${SUFFIX}`,
  OrganisedVisitRebooking: `${BCT}.OrganisedVisitRebooking${SUFFIX}`,
  CombiOrganisedVisitRebooking: `${BCT}.CombiOrganisedVisitRebooking${SUFFIX}`,
  CultureEventReservation: `${BCT}.CultureEventReservation${SUFFIX}`,
  RentalReservation: `${BCT}.RentalReservation${SUFFIX}`,
  ActivityReservation: `${BCT}.ActivityReservation${SUFFIX}`,
  TableSale: `${BCT}.TableSale${SUFFIX}`,
  // ---- Payments ----
  BasketPayment: `${BCT}.BasketPayment${SUFFIX}`,
  // ---- Discounts ----
  GiftCertificateDiscount: `${BCT}.GiftCertificateDiscount${SUFFIX}`,
  CouponCodeDiscount: `${BCT}.CouponCodeDiscount${SUFFIX}`
};

export { ArticlesModule, BasketTypeStrings, DocumentsModule, ExpositionsModule, GeneralModule, ManagerModule, ReCreateXClient, RecreatexApiError, RecreatexError, RecreatexHttpError, RecreatexTimeoutError, STABLE_SESSION_ID, buildContext, dayRangeDotted, dayRangeIso, isRetryableError, paginate, paginateIter, todayYmd, uuidv4, withRetry, ymd, ymdWindow };
//# sourceMappingURL=core.js.map
//# sourceMappingURL=core.js.map