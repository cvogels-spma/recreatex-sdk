/**
 * Cancel a birthday visit and surface the refund amount.
 *
 * Apply-rebook isn't documented as a JSON endpoint yet, so the safe
 * production pattern is Cancel → Mollie refund → fresh checkout.
 */

import { ReCreateXClient } from 'recreatex-sdk/core';
import { SHOP_ID } from 'recreatex-sdk/spacemagic';

const [, , visitId, reasonId] = process.argv;
if (!visitId || !reasonId) {
  console.error('Usage: tsx examples/geburtstag-cancel.ts <visitId> <reasonId>');
  process.exit(1);
}

const rx = new ReCreateXClient({
  baseUrl: 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD!,
});

const result = await rx.expositions.cancelOrganisedVisit({
  organisedVisitId: visitId,
  reasonId,
});

console.log(`Cancelled. Refund: ${result.returnAmount.toFixed(2)} €`);
if (!result.isValid) console.error('NOT VALID:', result.message);
