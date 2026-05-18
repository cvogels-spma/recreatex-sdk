/**
 * Document service types — separate hostname/path from the JSON API.
 *
 * Endpoints live under `/WebShopDocumentService.svc/...` (note: capital
 * `WebShop`, with `.svc`). Output is binary PDF, not JSON, so the SDK
 * surfaces these via dedicated download helpers that return a `Blob`.
 */

export interface GiftCertificatePdfRequest {
  /** SalesLineId from `CheckoutBasket.Result.SalesItems[].Id`. */
  salesLineId: string;
  /** ISO language code; the Space Magic template only ships `de`. */
  language?: 'de' | 'en' | 'nl' | 'fr';
  /** Override the shop ID (else taken from the client config). */
  shopId?: string;
}

export interface OrganisedVisitPdfRequest {
  /** OrganisedVisit GUID from `FindOrganisedVisits`. */
  organisedVisitId: string;
  /** ISO language code; the Space Magic template only ships `de`. */
  language?: 'de' | 'en' | 'nl' | 'fr';
  /** Override the shop ID (else taken from the client config). */
  shopId?: string;
}
