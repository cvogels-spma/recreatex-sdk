/**
 * WebShopDocumentService.svc — binary downloads (PDFs).
 *
 * The host AND path differ from the JSON API:
 *
 *   `${baseUrl}/WebShopDocumentService.svc/GiftCertificates/{ShopId}/{lang}/{SalesLineId}`
 *
 * Note the capital `WebShop` and the `.svc` suffix. These are GET requests,
 * unlike everything else in the SDK.
 */

import type { ReCreateXClient, CallOptions } from '../client.js';
import type { GiftCertificatePdfRequest } from '../types/documents.js';

export class DocumentsModule {
  constructor(private readonly client: ReCreateXClient) {}

  private get base(): string {
    return (
      this.client.options.documentServiceUrl ??
      `${this.client.options.baseUrl}/WebShopDocumentService.svc`
    );
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
  async giftCertificatePdf(
    req: GiftCertificatePdfRequest,
    callOpts?: CallOptions,
  ): Promise<Blob> {
    const lang = req.language ?? this.client.options.language ?? 'de';
    const shopId = req.shopId ?? this.client.options.shopId;
    const url = `${this.base}/GiftCertificates/${shopId}/${lang}/${req.salesLineId}`;
    return this.client.getBinary(url, callOpts ?? {});
  }

  /** Discover the merge-fields supported by the configured Word template. */
  async giftCertificateHelp(language?: 'de' | 'en' | 'nl' | 'fr', callOpts?: CallOptions): Promise<Blob> {
    const lang = language ?? this.client.options.language ?? 'de';
    const shopId = this.client.options.shopId;
    const url = `${this.base}/Help/GiftCertificates/${shopId}/${lang}`;
    return this.client.getBinary(url, callOpts ?? {});
  }
}
