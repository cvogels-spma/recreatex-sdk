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
