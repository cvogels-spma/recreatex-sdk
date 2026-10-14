import { describe, it, expect } from 'vitest';
import { dedupSaleLines } from '../../src/core/index.js';
import {
  countWristbands,
  saleHour,
  isAnonymousCustomer,
  GUEST_CUSTOMER_ID,
  WALK_IN_CUSTOMER_ID,
} from '../../src/spacemagic/index.js';
import type { Sale } from '../../src/core/index.js';

let lineId = 0;
const line = (description: string, quantity: number, totalPrice = 0, id?: string) => ({
  id: id ?? `l${++lineId}`,
  description,
  quantity,
  unitPrice: quantity ? totalPrice / quantity : 0,
  totalPrice,
});

// Shapes taken from real check-in bons of 2026-10-04 (names shortened, amounts kept).
const familie: Sale = {
  id: 'b1',
  date: '2026-10-04T10:08:21',
  customerId: WALK_IN_CUSTOMER_ID,
  lines: [
    line('Socken', 3, 9),
    line('Anteil Park Besucher', 3, 24),
    line('Hauskredit Erwachsene', 3),
    line('Anteil Park 2h', 4, 72),
    line('Laser Tag', 4),
    line('Hauskredit Kinder', 4),
  ],
};
const geburtstag: Sale = {
  id: 'b2',
  date: '2026-10-04T09:57:12',
  customerId: GUEST_CUSTOMER_ID,
  lines: [
    line('Anteil Park 4h WE', 6, 246),
    line('Geburtstags Wallet', 6),
    line('Geburtstags Wallet', 1),
    line('Hauskredit Erwachsene', 1),
    line('Hauskredit Erwachsene', 1),
    line('Ausstellung Vorauszahlung', -1, -132, 'dup'),
    // Recreatex sends booking-bound lines several times with the same id.
    line('Ausstellung Vorauszahlung', -1, -132, 'dup'),
  ],
};
const gastroAmAusgang: Sale = {
  id: 'b3',
  date: '2026-10-04T18:49:39',
  customerId: WALK_IN_CUSTOMER_ID,
  lines: [line('Pizza Schinken', 1, 9), line('Milchkaffee', 2, 8)],
};

describe('dedupSaleLines', () => {
  it('drops repeated line ids and keeps lines without id', () => {
    const out = dedupSaleLines({
      lines: [line('a', 1, 1, 'x'), line('a', 1, 1, 'x'), { description: 'ohne id', quantity: 1, unitPrice: 1, totalPrice: 1 }],
    });
    expect(out.map((l) => l.description)).toEqual(['a', 'ohne id']);
  });
});

describe('countWristbands', () => {
  it('sums one wallet line per wristband and ignores ticket and gastro lines', () => {
    const c = countWristbands([familie, geburtstag, gastroAmAusgang]);
    expect(c.wristbands).toBe(16);
    expect(c.kids).toBe(4);
    expect(c.adults).toBe(5);
    expect(c.birthday).toBe(7);
    expect(c.checkinSales).toBe(2);
    expect(c.byHour[9]).toBe(9);
    expect(c.byHour[10]).toBe(7);
    expect(c.byHour[18]).toBe(0);
    expect(c.byHour.reduce((a, b) => a + b, 0)).toBe(c.wristbands);
  });

  it('counts a duplicated wallet line once (dedup by id)', () => {
    const s: Sale = { id: 'd', date: '2026-10-04T14:00:00', lines: [line('Hauskredit Kinder', 2, 0, 'w'), line('Hauskredit Kinder', 2, 0, 'w')] };
    expect(countWristbands([s]).wristbands).toBe(2);
  });

  it('rounds fractional quantities once per bucket, not per line', () => {
    const s: Sale = {
      id: 'f',
      date: '2026-10-04T11:00:00',
      lines: [line('Geburtstags Wallet', 0.4), line('Geburtstags Wallet', 0.4), line('Geburtstags Wallet', 0.4)],
    };
    // per line: 0+0+0 = 0; summed: 1.2 → 1
    expect(countWristbands([s]).birthday).toBe(1);
  });

  it('separates pass sales by anonymous and named customer', () => {
    const anon: Sale = { id: 'p1', date: '2025-12-04T15:00:00', customerId: WALK_IN_CUSTOMER_ID, lines: [line('2h- immer Jahreskarte Regula', 2, 178)] };
    const named: Sale = { id: 'p2', date: '2025-12-04T15:05:00', customerId: 'a52ffdbe-0000-0000-0000-000000000000', lines: [line('4h- immer Jahreskarte Regular', 1, 132)] };
    const nullPreis: Sale = { id: 'p3', date: '2025-12-05T15:00:00', customerId: WALK_IN_CUSTOMER_ID, lines: [line('Jahreskarte', 1, 0)] };
    const c = countWristbands([anon, named, nullPreis]);
    expect(c.passSalesAnonymous).toBe(2);
    expect(c.passSalesNamed).toBe(1);
    expect(c.wristbands).toBe(0);
  });

  it('does not mistake ordinary entry or birthday articles for passes', () => {
    const s: Sale = { id: 'x', date: 'x', customerId: WALK_IN_CUSTOMER_ID, lines: [line('Anteil Park 4h-Party Paket Space Regulär', 1, 35), line('Passierschein', 1, 1)] };
    expect(countWristbands([s]).passSalesAnonymous).toBe(0);
  });
});

describe('helpers', () => {
  it('saleHour reads the park-local hour and rejects junk', () => {
    expect(saleHour('2026-10-04T23:51:01')).toBe(23);
    expect(saleHour('2026-10-04 08:00:00.000')).toBeNull();
    expect(saleHour(undefined)).toBeNull();
  });
  it('isAnonymousCustomer covers both anonymous ids and a missing customer', () => {
    expect(isAnonymousCustomer(GUEST_CUSTOMER_ID)).toBe(true);
    expect(isAnonymousCustomer(WALK_IN_CUSTOMER_ID)).toBe(true);
    expect(isAnonymousCustomer(null)).toBe(true);
    expect(isAnonymousCustomer('a52ffdbe-0000-0000-0000-000000000000')).toBe(false);
  });
});
