import { describe, it, expect } from 'vitest';
import {
  extractKind,
  extractPaket,
  extractEssen,
  extractKontakt,
  categorizeVisit,
  mapBirthdayBooking,
  mapEscapeBooking,
  classifyVoucher,
  findVoucher,
  gastroGroupName,
  isGastroGroup,
  listGastroArticles,
  syncGastroSales,
  buildBookingInvoiceDraft,
  renderBookingInvoiceHtml,
} from '../../src/spacemagic/index.js';

describe('extractKind', () => {
  it('handles Geburtstag / Name', () => {
    expect(extractKind('Geburtstag / Milan')).toBe('Milan');
    expect(extractKind('Geburtstag, Falk')).toBe('Falk');
  });
  it('treats bare short string as the name', () => {
    expect(extractKind('Yusuf')).toBe('Yusuf');
    expect(extractKind('Tyler Küpker')).toBe('Tyler Küpker');
  });
  it('rejects non-Geburtstag prefixes', () => {
    expect(extractKind('Vereinsfeier / C-Jugend Leerhafe')).toBe('');
    expect(extractKind('Firmenfeier')).toBe('');
    expect(extractKind('JGA Tobi')).toBe('');
    expect(extractKind('')).toBe('');
  });
  it('rejects strings with /', () => {
    expect(extractKind('Yusuf/Lena Feier')).toBe('');
  });
  it('rejects very long strings', () => {
    expect(extractKind('a'.repeat(80))).toBe('');
  });
});

describe('extractPaket', () => {
  it('finds Space/Magic on periodReservations', () => {
    expect(extractPaket([{ articleId: 'x', articleName: 'Partypaket - Space', quantity: 1, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 }])).toBe('Space');
    expect(extractPaket([{ articleId: 'x', articleName: 'Partypaket Magic', quantity: 1, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 }])).toBe('Magic');
  });
  it('falls back to articles[]', () => {
    expect(extractPaket([], [{ articleId: 'x', articleName: 'Partypaket - Magic', quantity: 1, unitPrice: 0, amount: 0 }])).toBe('Magic');
  });
});

describe('extractEssen', () => {
  it('detects pizza/pasta/pommes', () => {
    expect(
      extractEssen([
        { articleId: 'x', articleName: 'Pizza Margherita', quantity: 1, unitPrice: 0, amount: 0 },
      ]).essen,
    ).toBe('Pizza');
  });
  it('flags upgrade', () => {
    const r = extractEssen([
      { articleId: 'x', articleName: 'Upgrade Raumschiff', quantity: 1, unitPrice: 0, amount: 0 },
    ]);
    expect(r.upgrade).toBe(1);
  });
});

describe('extractKontakt', () => {
  it('prefers person name', () => {
    expect(
      extractKontakt({
        id: '', no: 0, startDate: '', endDate: '', comment: '',
        cancelled: false, closed: false, posted: false,
        totalAmount: 0, postedAmount: 0, balance: 0,
        person: { firstName: 'Anna', lastName: 'Schmidt' },
      }),
    ).toBe('Anna Schmidt');
  });

  it('falls back to salesInfos guest', () => {
    expect(
      extractKontakt({
        id: '', no: 0, startDate: '', endDate: '', comment: '',
        cancelled: false, closed: false, posted: false,
        totalAmount: 0, postedAmount: 0, balance: 0,
        person: { email: 'web@omg.de' },
        salesInfos: [{ id: '', salesNo: 0, salesDate: '', guest: { firstName: 'Lisa', name: 'Müller' } }],
      }),
    ).toBe('Lisa Müller');
  });
});

describe('categorizeVisit', () => {
  const base = {
    id: '', no: 0, startDate: '', endDate: '', comment: '',
    cancelled: false, closed: false, posted: false,
    totalAmount: 0, postedAmount: 0, balance: 0,
  };

  it('detects birthday by exposition', () => {
    expect(
      categorizeVisit({
        ...base,
        periodReservations: [{ articleId: '', expositionName: 'Raumschiff 1', quantity: 1, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 }],
      }),
    ).toBe('birthday');
  });

  it('detects escape by keyword', () => {
    expect(
      categorizeVisit({
        ...base,
        periodReservations: [{ articleId: '', expositionName: 'Hexenmeister', quantity: 1, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 }],
      }),
    ).toBe('escape');
  });
});

describe('mapBirthdayBooking', () => {
  it('produces a stable BookingRow', () => {
    const row = mapBirthdayBooking({
      id: '', no: 1234,
      startDate: '2026-05-12T14:00:00',
      endDate: '2026-05-12T18:00:00',
      comment: 'Geburtstag / Milan',
      cancelled: false, closed: false, posted: false,
      totalAmount: 199.5, postedAmount: 100, balance: 99.5,
      periodReservations: [
        { articleId: 'a', articleName: 'Partypaket - Space', expositionName: 'Raumschiff 1', quantity: 12, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 },
      ],
      articles: [
        { articleId: 'b', articleName: 'Pizza Margherita', quantity: 12, unitPrice: 0, amount: 0 },
      ],
    });
    expect(row).toMatchObject({
      id: '1234',
      datum: '2026-05-12',
      zeit: '14:00',
      anzahl: 12,
      raum: 'Raumschiff 1',
      paket: 'Space',
      kind: 'Milan',
      essen: 'Pizza',
      upgrade: 0,
      gesamt: 199.5,
      cancelled: 0,
    });
  });
});

describe('mapEscapeBooking', () => {
  it('preserves expositionName as raum', () => {
    const row = mapEscapeBooking({
      id: '', no: 99,
      startDate: '2026-05-12T14:00:00',
      endDate: '2026-05-12T15:00:00',
      comment: '',
      cancelled: true, closed: false, posted: false,
      totalAmount: 0, postedAmount: 0, balance: 0,
      periodReservations: [
        { articleId: 'a', expositionName: 'Hexenmeister', quantity: 4, unitPrice: 0, amount: 0, lineAmount: 0, vatAmount: 0 },
      ],
    });
    expect(row.raum).toBe('Hexenmeister');
    expect(row.cancelled).toBe(1);
  });
});

describe('voucher helpers', () => {
  it('classifyVoucher by code prefix', () => {
    expect(classifyVoucher('10901-0001')).toBe('postal');
    expect(classifyVoucher('10902-0005')).toBe('digital');
    expect(classifyVoucher('10904-0001')).toBe('on-site');
    expect(classifyVoucher('99999-0001')).toBe('unknown');
  });

  it('findVoucher returns SKU by code', () => {
    expect(findVoucher('10902-0001')?.price).toBe(25);
    expect(findVoucher('nonexistent')).toBeUndefined();
  });
});

describe('gastroGroupName', () => {
  it('returns label or original UUID', () => {
    expect(gastroGroupName('cb3c73eb-22ab-ef11-9595-9a21964517de')).toBe('Fingerfood');
    expect(gastroGroupName('b2bbfab5-1019-f011-9596-b28721114d72')).toBe('Heißgetränke');
    expect(gastroGroupName('unknown-uuid')).toBe('unknown-uuid');
    expect(gastroGroupName(null)).toBe('Unbekannt');
  });
});

describe('isGastroGroup', () => {
  it('separates mapped UUIDs from unmapped', () => {
    expect(isGastroGroup('cb3c73eb-22ab-ef11-9595-9a21964517de')).toBe(true);
    expect(isGastroGroup('not-a-real-uuid')).toBe(false);
    expect(isGastroGroup(null)).toBe(false);
    expect(isGastroGroup(undefined)).toBe(false);
  });
});

describe('listGastroArticles', () => {
  it('fetches and groups known gastro article groups', async () => {
    const calls: unknown[] = [];
    const client = {
      articles: {
        findArticles: async (criteria: { articleGroupId?: string }) => {
          calls.push(criteria);
          if (criteria.articleGroupId !== 'cc3c73eb-22ab-ef11-9595-9a21964517de') return [];
          return [
            {
              id: 'burger-2',
              code: 'B02',
              name: 'Hamburger',
              price: 6,
              divisionId: '',
              allowPriceChangeWebshop: false,
              vat: { percentage: 19 },
            },
            {
              id: 'burger-1',
              code: 'B01',
              name: 'Cheeseburger',
              price: 6.5,
              divisionId: '',
              allowPriceChangeWebshop: false,
            },
          ];
        },
      },
    };

    const catalog = await listGastroArticles(client, { divisionId: 'space-magic' });

    expect(calls).toHaveLength(17);
    expect(catalog).toHaveLength(1);
    expect(catalog[0]?.groupName).toBe('Burger');
    expect(catalog[0]?.articles.map((article) => article.name)).toEqual([
      'Cheeseburger',
      'Hamburger',
    ]);
    expect(catalog[0]?.articles[1]).toMatchObject({
      groupName: 'Burger',
      code: 'B02',
      price: 6,
      vatPercentage: 19,
    });
  });
});

describe('syncGastroSales', () => {
  it('maps day-scoped sales lines to unique gastro articles', async () => {
    const client = {
      articles: {
        findArticles: async (criteria: { articleGroupId?: string }) => {
          if (criteria.articleGroupId !== 'cc3c73eb-22ab-ef11-9595-9a21964517de') return [];
          return [
            {
              id: 'cheese-id',
              code: '11004-0002',
              name: 'Cheeseburger normal',
              price: 6.5,
              divisionId: '',
              allowPriceChangeWebshop: false,
            },
          ];
        },
        findArticleSalesOrders: async () => [
          {
            id: 'line-1',
            description: 'Cheeseburger normal',
            date: '2026-05-01T12:00:00',
            quantity: 2,
            unitPrice: 6.5,
            totalPrice: 13,
          },
          {
            id: 'line-2',
            description: 'Not gastro',
            date: '2026-05-01T12:05:00',
            quantity: 1,
            unitPrice: 9,
            totalPrice: 9,
          },
        ],
      },
    };

    const result = await syncGastroSales(client, {
      fromYmd: '2026-05-01',
      untilYmd: '2026-05-01',
      includeUnmatchedIssues: true,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      date: '2026-05-01',
      groupName: 'Burger',
      code: '11004-0002',
      quantity: 2,
      totalPrice: 13,
    });
    expect(result.totals.quantity).toBe(2);
    expect(result.issues).toEqual([
      {
        date: '2026-05-01',
        description: 'Not gastro',
        quantity: 1,
        totalPrice: 9,
        reason: 'unmatched',
      },
    ]);
  });
});

describe('booking invoice helpers', () => {
  it('builds an invoice draft from an organised visit', () => {
    const draft = buildBookingInvoiceDraft({
      id: 'visit-1',
      no: 123,
      startDate: '2026-05-17T15:00:00',
      endDate: '2026-05-17T19:00:00',
      comment: 'Geburtstag / Test',
      cancelled: false,
      closed: true,
      posted: true,
      totalAmount: 312,
      postedAmount: 100,
      balance: 212,
      orderNumber: 'ORDER-1',
      periodReservations: [
        {
          articleId: 'pkg-1',
          articleCode: '10501-0002',
          articleName: 'Partypaket - Space',
          expositionName: 'Geburtstagstisch',
          quantity: 8,
          unitPrice: 39,
          amount: 312,
          lineAmount: 312,
          vatAmount: 0,
        },
      ],
      articles: [
        {
          articleId: 'food-1',
          articleName: 'Partypaket Pommes & Nuggets',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
      salesInfos: [
        {
          id: 'series-1',
          salesNo: 1001,
          salesDate: '2026-01-02T08:55:26',
          guest: {
            firstName: 'Anna',
            name: 'Schmidt',
            email: 'anna@example.test',
            street1: 'Testweg',
            street2: '1',
            zipCode: '26603',
            home: 'Aurich',
          },
        },
      ],
    });

    expect(draft.customer.name).toBe('Anna Schmidt');
    expect(draft.lines).toHaveLength(1);
    expect(draft.totals).toMatchObject({ amount: 312, paidAmount: 100, balance: 212 });
    expect(renderBookingInvoiceHtml(draft)).toContain('Rechnung / Buchungsbeleg');
  });
});
