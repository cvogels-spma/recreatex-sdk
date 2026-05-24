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
        Vat: criteria.includes?.vat ?? true,
        Translations: criteria.includes?.translations ?? false,
        ...criteria.includes?.priceInfo !== void 0 && { PriceInfo: criteria.includes.priceInfo }
      }
    };
    if (criteria.namePattern) SearchCriteria.NamePattern = criteria.namePattern;
    if (criteria.code) SearchCriteria.Code = criteria.code;
    if (criteria.divisionId) SearchCriteria.DivisionId = criteria.divisionId;
    const data = await this.client.post(
      "Json/Articles/FindArticles",
      { SearchCriteria },
      callOpts ?? {}
    );
    return data.articles ?? [];
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
  /** List all article groups (e.g. F&B categories, voucher types). */
  async listArticleGroups(callOpts) {
    const data = await this.client.post(
      "Json/Articles/ListArticleGroups",
      {},
      callOpts ?? {}
    );
    return data.groups ?? [];
  }
};

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