/**
 * Korrekturen aus dem Abgleich mit der Server-Doku (`/json/documentation`) und lesenden
 * Live-Proben vom 25.10.2026. Jeder Fall war still falsch: kein Fehler, nur falsche Daten.
 */
import { describe, it, expect, vi } from 'vitest';
import { ReCreateXClient } from '../../src/core/index.js';

function fetchSpy(payload: unknown | ((n: number) => unknown)) {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    calls.push({ url: u, body: init?.body ? JSON.parse(init.body as string) : {} });
    const p = typeof payload === 'function' ? (payload as (n: number) => unknown)(calls.length - 1) : payload;
    return new Response(JSON.stringify(p), { status: 200 });
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const baseConfig = { baseUrl: 'https://test.recreatex.example', shopId: 'shop-id', password: 'secret' };
const criteria = (c: { body: Record<string, unknown> }) =>
  (c.body.Criteria ?? c.body.SearchCriteria) as Record<string, unknown>;

describe('ManagerApp: Filter als Listen', () => {
  it('listSalesInformation schickt DivisionIds/ArticleGroupIds, keine Einzahl-Felder', async () => {
    const { fetch, calls } = fetchSpy({ salesInformation: [] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.manager.listSalesInformation({
      from: '2026-10-24 00:00:00.000', until: '2026-10-24 23:59:59.000',
      articleGroupId: 'socken', divisionIds: ['park'],
    });
    const c = criteria(calls[0]!);
    expect(c.ArticleGroupIds).toEqual(['socken']);
    expect(c.DivisionIds).toEqual(['park']);
    // ⚠ Die Einzahl-Felder ignoriert der Server: 16.465,51 € statt 792,51 € für Socken.
    expect('ArticleGroupId' in c).toBe(false);
    expect('DivisionId' in c).toBe(false);
  });

  it('listVisitingCustomersInformation nutzt denselben Filter', async () => {
    const { fetch, calls } = fetchSpy({ visitingCustomersInformation: [{ totalVisitors: 1, subscriptionVisitors: 1, saleVisitors: 0, divisionID: 'park' }] });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const r = await rx.manager.listVisitingCustomersInformation({ from: 'a', until: 'b', divisionId: 'park' });
    expect(criteria(calls[0]!).DivisionIds).toEqual(['park']);
    expect(r[0]?.divisionID).toBe('park');
  });

  it('ohne Filter keine leeren Listen', async () => {
    const { fetch, calls } = fetchSpy({ salesInformation: [] });
    await new ReCreateXClient({ ...baseConfig, fetch }).manager.listSalesInformation({ from: 'a', until: 'b' });
    expect(Object.keys(criteria(calls[0]!)).sort()).toEqual(['From', 'Until']);
  });
});

describe('Articles: code lokal, Price statt PriceInfo', () => {
  const artikel = (i: number) => ({ id: `a${i}`, code: `11003-${String(i).padStart(4, '0')}`, name: `A${i}`, price: 1, divisionId: '', allowPriceChangeWebshop: false });

  it('findArticles filtert code nach dem Blättern; findArticlesPage schickt kein Code', async () => {
    // Der Server ignoriert Code und liefert alles: zwei volle Seiten und eine kurze.
    const seiten = [Array.from({ length: 50 }, (_, i) => artikel(i)), Array.from({ length: 50 }, (_, i) => artikel(50 + i)), [artikel(100)]];
    const { fetch, calls } = fetchSpy((n) => ({ articles: seiten[n] ?? [] }));
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    const treffer = await rx.articles.findArticles({ code: '11003-0096' });
    expect(treffer.map((a) => a.id)).toEqual(['a96']);
    expect(calls).toHaveLength(3);
    expect('Code' in criteria(calls[0]!)).toBe(false);
  });

  it('findArticlesPage filtert NICHT lokal (sonst bricht eigenes Blättern an der kurzen Seite ab)', async () => {
    const { fetch } = fetchSpy({ articles: Array.from({ length: 50 }, (_, i) => artikel(i)) });
    const seite = await new ReCreateXClient({ ...baseConfig, fetch }).articles.findArticlesPage({ code: '11003-0003' });
    expect(seite).toHaveLength(50);
  });

  it('includes.priceInfo ist ein Alias für Price', async () => {
    const { fetch, calls } = fetchSpy({ articles: [] });
    await new ReCreateXClient({ ...baseConfig, fetch }).articles.findArticlesPage({ includes: { priceInfo: false } });
    const inc = criteria(calls[0]!).Includes as Record<string, unknown>;
    expect(inc.Price).toBe(false);
    expect('PriceInfo' in inc).toBe(false);
  });
});

describe('General: FindPerson, FindPersonCards, FindGiftCertificates', () => {
  it('findPerson liest result als Liste (bisher immer [])', async () => {
    const { fetch } = fetchSpy({ result: [{ id: 'p-1', name: 'Muster' }] });
    const r = await new ReCreateXClient({ ...baseConfig, fetch }).general.findPerson({ id: 'p-1' });
    expect(r.map((p) => p.id)).toEqual(['p-1']);
  });

  it('findPerson schickt den Nachnamen als Name, den Login als UserName', async () => {
    const { fetch, calls } = fetchSpy({ result: [] });
    await new ReCreateXClient({ ...baseConfig, fetch }).general.findPerson({ lastName: 'Muster', username: 'u@x.de' });
    const c = criteria(calls[0]!);
    expect(c.Name).toBe('Muster');
    expect(c.UserName).toBe('u@x.de');
    // ⚠ LastName ignoriert der Server und liefert 50 beliebige Personen.
    expect('LastName' in c).toBe(false);
  });

  it('findPerson ohne Filter wirft, statt beliebige Personen zu liefern', async () => {
    const { fetch, calls } = fetchSpy({ result: [{ id: 'irgendwer' }] });
    await expect(new ReCreateXClient({ ...baseConfig, fetch }).general.findPerson({})).rejects.toThrow(/at least one filter/);
    expect(calls).toHaveLength(0);
  });

  it('findPersonCards schickt customerId nicht mehr, dafür cardString', async () => {
    const { fetch, calls } = fetchSpy({ personCards: [] });
    await new ReCreateXClient({ ...baseConfig, fetch }).general.findPersonCards({ customerId: 'c-1', cardString: '04787CC28C1E91' });
    const c = criteria(calls[0]!);
    expect('CustomerId' in c).toBe(false);
    expect(c.CardString).toBe('04787CC28C1E91');
  });

  it('findGiftCertificates schickt barcode und filtert id NICHT lokal (eigenes Blättern bleibt intakt)', async () => {
    const seite = Array.from({ length: 20 }, (_, i) => ({ id: `gc-${i}`, number: null }));
    const { fetch, calls } = fetchSpy({ findGiftCertificatesResult: { giftCertificates: seite } });
    const r = await new ReCreateXClient({ ...baseConfig, fetch }).general.findGiftCertificates({ customerId: 'k', id: 'gc-3', barcode: 'B1' });
    expect(criteria(calls[0]!).Barcode).toBe('B1');
    expect(r).toHaveLength(20);
  });
});
