import { describe, expect, it } from 'vitest';
import { buildBirthdayBasket, type BirthdayBookingInput } from '../../src/spacemagic/birthday.js';
import { BasketTypeStrings } from '../../src/core/types/basket.js';
import {
  GUEST_CUSTOMER_ID,
  DIVISION_IDS,
  PAYMENT_METHOD_ID_KARTENZAHLUNG,
} from '../../src/spacemagic/ids.js';

const baseInput = (): BirthdayBookingInput => ({
  expositionId: 'c9b017fe-fafc-ef11-9596-b28721114d72',
  expositionPeriodId: 'f80089a3-9ae9-f011-9596-b28721114d72',
  priceTier: {
    priceGroupId: 'd1b017fe-fafc-ef11-9596-b28721114d72',
    unitPrice: 29,
    name: 'Partypaket - Space',
  },
  paidGuests: 8,
  buyer: {
    firstName: 'Anna',
    lastName: 'Beispiel',
    email: 'anna@example.com',
    phone: '015112345678',
    street: 'Musterstrasse 1',
    zipCode: '26603',
    city: 'Aurich',
    country: 'DE',
  },
  depositAmount: 116, // 50 % of 232
  grossTotal: 232, // 8 * 29
  comment: 'Lukas wird 8',
  orderNumber: 'SM-BD-2026-12345',
  molliePaymentId: 'tr_test_xyz',
});

describe('buildBirthdayBasket', () => {
  it('produces a valid Basket with one ExpositionPeriodReservation', () => {
    const basket = buildBirthdayBasket(baseInput());

    expect(basket.CustomerId).toBe(GUEST_CUSTOMER_ID);
    expect(basket.PayLater).toBe(false);
    expect(basket.OrderId).toBe('SM-BD-2026-12345');
    expect(basket.TrxId).toBe('tr_test_xyz');
    expect(basket.Items).toHaveLength(1);

    const item = basket.Items[0] as Record<string, unknown>;
    expect(item.$type).toBe(BasketTypeStrings.ExpositionPeriodReservation);
    expect(item.ExpositionId).toBe('c9b017fe-fafc-ef11-9596-b28721114d72');
    expect(item.ExpositionPeriodId).toBe('f80089a3-9ae9-f011-9596-b28721114d72');
    expect(item.DivisionId).toBe(DIVISION_IDS.spaceMagic);
    // Outer Quantity must be 0 — Recreatex requires the seat count on Entries[].
    expect(item.Quantity).toBe(0);
    expect(item.UnitPrice).toBe(29);
    expect(item.OrderWithoutPayment).toBe(false);

    const entries = item.Entries as Array<Record<string, unknown>>;
    expect(entries).toHaveLength(1);
    expect(entries[0].PriceGroupId).toBe('d1b017fe-fafc-ef11-9596-b28721114d72');
    expect(entries[0].ParticipantCount).toBe(8);
    expect(entries[0].Participants).toEqual([]);
    expect(entries[0].$type).toMatch(/ExpositionPeriodReservationEntry/);
  });

  it('encodes the deposit-with-open-balance pattern', () => {
    const basket = buildBirthdayBasket(baseInput());

    expect(basket.Payments).toHaveLength(1);
    const payment = basket.Payments?.[0] as Record<string, unknown>;
    expect(payment.$type).toBe(BasketTypeStrings.BasketPayment);
    expect(payment.Amount).toBe(116);
    expect(payment.Currency).toBe('EUR');
    expect(payment.PaymentMethodId).toBe(PAYMENT_METHOD_ID_KARTENZAHLUNG);
    expect(payment.TrxId).toBe('tr_test_xyz');
    expect(payment.OrderId).toBe('SM-BD-2026-12345');
    expect(payment.ExtraInfo1).toBe('Mollie');

    expect(basket.Balance).toBe(116);
  });

  it('rounds amounts to 2 decimal places', () => {
    const input = baseInput();
    input.depositAmount = 87.554;
    input.grossTotal = 175.111;
    const basket = buildBirthdayBasket(input);
    // 87.554 → 87.55, 175.111 → 175.11, balance = 175.11 - 87.55 = 87.56
    const payment = basket.Payments?.[0] as Record<string, unknown>;
    expect(payment.Amount).toBe(87.55);
    expect(basket.Balance).toBe(87.56);
  });

  it('serialises buyer details as AnonymousPerson with Recreatex field names', () => {
    const basket = buildBirthdayBasket(baseInput());
    expect(basket.AnonymousPerson).toEqual({
      Name: 'Beispiel',
      FirstName: 'Anna',
      Email: 'anna@example.com',
      Telephone: '015112345678',
      Street1: 'Musterstrasse 1',
      ZipCode: '26603',
      Home: 'Aurich',
      Country: 'DE',
      Newsletter: false,
    });
  });

  it('appends extra ArticleSale items after the period reservation', () => {
    const input = baseInput();
    input.extras = [
      {
        articleId: '11111111-aaaa-bbbb-cccc-222222222222',
        unitPrice: 12,
        quantity: 2,
        extraDescription: 'Cosmoo Pluesch',
      },
    ];
    const basket = buildBirthdayBasket(input);
    expect(basket.Items).toHaveLength(2);
    const extra = basket.Items[1] as Record<string, unknown>;
    expect(extra.$type).toBe(BasketTypeStrings.ArticleSale);
    expect(extra.Quantity).toBe(2);
    expect(extra.UnitPrice).toBe(12);
    expect(extra.CustomPrice).toBe(12);
    expect(extra.ExtraDescription).toBe('Cosmoo Pluesch');
    expect((extra.Article as { Id: string }).Id).toBe(
      '11111111-aaaa-bbbb-cccc-222222222222',
    );
  });

  it('respects custom division/customer/paymentMethod overrides', () => {
    const input = baseInput();
    input.divisionId = '99999999-9999-9999-9999-999999999999';
    input.customerId = '88888888-8888-8888-8888-888888888888';
    input.paymentMethodId = '77777777-7777-7777-7777-777777777777';
    const basket = buildBirthdayBasket(input);
    expect(basket.CustomerId).toBe('88888888-8888-8888-8888-888888888888');
    const item = basket.Items[0] as Record<string, unknown>;
    expect(item.DivisionId).toBe('99999999-9999-9999-9999-999999999999');
    const payment = basket.Payments?.[0] as Record<string, unknown>;
    expect(payment.PaymentMethodId).toBe('77777777-7777-7777-7777-777777777777');
  });
});
