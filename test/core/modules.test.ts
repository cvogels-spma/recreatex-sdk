import { describe, it, expect, vi } from 'vitest';
import { ReCreateXClient } from '../../src/core/index.js';

function fetchSpy(payload: unknown) {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const body = init?.body ? JSON.parse(init.body as string) : null;
    calls.push({ url: u, body });
    return new Response(JSON.stringify(payload), { status: 200 });
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const baseConfig = {
  baseUrl: 'https://test.recreatex.example',
  shopId: 'shop-id',
  password: 'secret',
};

describe('ArticlesModule', () => {
  it('findArticles auto-paginates', async () => {
    const pages = [
      Array.from({ length: 50 }, (_, i) => ({ id: String(i), code: `c${i}`, name: '', price: 0, divisionId: '', allowPriceChangeWebshop: false })),
      Array.from({ length: 12 }, (_, i) => ({ id: String(i + 50), code: `c${i + 50}`, name: '', price: 0, divisionId: '', allowPriceChangeWebshop: false })),
    ];
    let n = 0;
    const fetch = vi.fn(async () => {
      const page = pages[n++] ?? [];
      return new Response(JSON.stringify({ articles: page }), { status: 200 });
    }) as unknown as typeof fetch;
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const all = await rx.articles.findArticles({ namePattern: 'Gutschein' });
    expect(all).toHaveLength(62);
    expect(n).toBe(2);
  });
});

describe('ExpositionsModule', () => {
  it('findOrganisedVisits stops on a partial page', async () => {
    const pages = [
      Array.from({ length: 200 }, (_, i) => mkVisit(i)),
      Array.from({ length: 30 }, (_, i) => mkVisit(200 + i)),
    ];
    let n = 0;
    const fetch = vi.fn(async () => {
      const page = pages[n++] ?? [];
      return new Response(JSON.stringify({ organisedVisits: page }), { status: 200 });
    }) as unknown as typeof fetch;
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const all = await rx.expositions.findOrganisedVisits({
      fromYmd: '2026-04-01',
      untilYmd: '2026-04-30',
    });
    expect(all).toHaveLength(230);
    expect(n).toBe(2);
  });

  it('findOrganisedVisits sends correct date format (dotted)', async () => {
    const { fetch, calls } = fetchSpy({ organisedVisits: [] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.expositions.findOrganisedVisitsPage({ fromYmd: '2026-04-01', untilYmd: '2026-04-30' });
    const body = calls[0]?.body as { SearchCriteria?: { From?: string; Until?: string } } | null;
    expect(body?.SearchCriteria?.From).toBe('2026-04-01 00:00:00.000');
    expect(body?.SearchCriteria?.Until).toBe('2026-04-30 23:59:59.000');
  });
});

describe('GeneralModule', () => {
  it('findAccessZones reads `accessZones` (live API field name)', async () => {
    const { fetch } = fetchSpy({ accessZones: [{ id: 'z1', code: 'X', name: 'X', number: 1 }] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const zones = await rx.general.findAccessZones({ today: true });
    expect(zones).toHaveLength(1);
    expect(zones[0]?.id).toBe('z1');
  });

  it('findAccessZones falls back to `zones` if API ever shifts', async () => {
    const { fetch } = fetchSpy({ zones: [{ id: 'z2', code: 'Y', name: 'Y', number: 2 }] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const zones = await rx.general.findAccessZones({ today: true });
    expect(zones[0]?.id).toBe('z2');
  });

  it('findAccessZones with today:true sets dotted occupancy range', async () => {
    const { fetch, calls } = fetchSpy({ accessZones: [] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.general.findAccessZones({ today: true });
    const body = calls[0]?.body as { Criteria?: { OccupancyFrom?: string; OccupancyUntil?: string } } | null;
    expect(body?.Criteria?.OccupancyFrom).toMatch(/^\d{4}-\d{2}-\d{2} 00:00:00\.000$/);
    expect(body?.Criteria?.OccupancyUntil).toMatch(/^\d{4}-\d{2}-\d{2} 23:59:59\.000$/);
  });

  it('checkoutBasket throws RecreatexApiError on isValid:false (camelCase)', async () => {
    const { fetch } = fetchSpy({
      result: {
        basketValidationResult: { isValid: false, message: 'MissingCustomer' },
      },
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await expect(
      rx.general.checkoutBasket({ CustomerId: '0', Items: [] }),
    ).rejects.toThrowError(/MissingCustomer/);
  });

  it('checkoutBasket returns the camelCase result envelope', async () => {
    const { fetch } = fetchSpy({
      result: {
        resultState: 0,
        salesOrderNumber: 'SO-123',
        salesSeriesId: 'series-1',
        basketValidationResult: { isValid: true },
        salesItems: [{ id: 'line-1', salesNumber: 5 }],
      },
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const r = await rx.general.checkoutBasket({ CustomerId: 'cust', Items: [] });
    expect(r.salesOrderNumber).toBe('SO-123');
    expect(r.salesItems?.[0]?.id).toBe('line-1');
  });

  it('checkoutBasket falls back to a PascalCase Result envelope', async () => {
    const { fetch } = fetchSpy({
      Result: {
        resultState: 0,
        salesOrderNumber: 'SO-456',
        salesSeriesId: 'series-2',
        basketValidationResult: { isValid: true },
        salesItems: [{ id: 'line-2', salesNumber: 8 }],
      },
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const r = await rx.general.checkoutBasket({ CustomerId: 'cust', Items: [] });
    expect(r.salesOrderNumber).toBe('SO-456');
    expect(r.salesItems?.[0]?.id).toBe('line-2');
  });

  it('findGiftCertificates reads `findGiftCertificatesResult.giftCertificates`', async () => {
    const cert = {
      id: 'gc-1',
      number: null,
      amount: 25,
      purchaseDate: '2026-04-20',
      salesSeriesID: 'ss-1',
      shortName: 'GIFT25',
      description: 'Gutschein 25 €',
      ticketDescription: 'Gutschein 25 €',
      extraDescription: 'für Lisa',
      validFrom: '2026-04-20',
      validTill: '2029-04-20',
      printDate: null,
    };
    const { fetch, calls } = fetchSpy({
      findGiftCertificatesResult: { giftCertificates: [cert] },
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const certs = await rx.general.findGiftCertificates({
      customerId: 'cust-1',
      pageSize: 50,
    });
    expect(certs).toHaveLength(1);
    expect(certs[0]?.id).toBe('gc-1');
    const body = calls[0]?.body as { Criteria?: Record<string, unknown> } | null;
    expect(body?.Criteria?.CustomerId).toBe('cust-1');
    expect(body?.Criteria?.Paging).toMatchObject({ PageIndex: 0, PageSize: 50 });
  });

  it('findGiftCertificates falls back to a flat `giftCertificates` field', async () => {
    const { fetch } = fetchSpy({
      giftCertificates: [{ id: 'gc-2', number: '12345', amount: 50, purchaseDate: null, salesSeriesID: null, shortName: null, description: null, ticketDescription: null, extraDescription: null, validFrom: null, validTill: null, printDate: null }],
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const certs = await rx.general.findGiftCertificates({ id: 'gc-2' });
    expect(certs[0]?.id).toBe('gc-2');
  });

  it('setGiftCertificatePrinted sends Criteria.Id and resolves', async () => {
    const { fetch, calls } = fetchSpy({});
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.general.setGiftCertificatePrinted('gc-1');
    const body = calls[0]?.body as { Criteria?: Record<string, unknown> } | null;
    expect(body?.Criteria?.Id).toBe('gc-1');
    expect(calls[0]?.url).toMatch(/Json\/General\/SetGiftCertificatePrinted\/$/);
  });
});

describe('ManagerModule', () => {
  it('listSalesInformation passes group flags through', async () => {
    const { fetch, calls } = fetchSpy({ salesInformation: [] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.manager.listSalesInformation({
      from: '2026-04-01 00:00:00.000',
      until: '2026-04-01 23:59:59.000',
      groupByArticleGroup: true,
      groupByDate: true,
    });
    const body = calls[0]?.body as { Criteria?: Record<string, unknown> } | null;
    expect(body?.Criteria?.GroupByArticleGroup).toBe(true);
    expect(body?.Criteria?.GroupByDate).toBe(true);
  });
});

function mkVisit(i: number) {
  return {
    id: `id-${i}`,
    no: i,
    startDate: '2026-04-12T14:00:00',
    endDate: '2026-04-12T18:00:00',
    comment: '',
    cancelled: false,
    closed: false,
    posted: false,
    totalAmount: 0,
    postedAmount: 0,
    balance: 0,
  };
}
