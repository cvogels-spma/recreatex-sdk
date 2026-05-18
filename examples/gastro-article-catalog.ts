/**
 * Print the current Space Magic gastro article catalogue from Recreatex.
 *
 * Run:
 *   RECREATEX_PASSWORD=... npx tsx examples/gastro-article-catalog.ts
 */

import { ReCreateXClient } from 'recreatex-sdk/core';
import { DIVISION_IDS, SHOP_ID, listGastroArticles } from 'recreatex-sdk/spacemagic';

const rx = new ReCreateXClient({
  baseUrl: process.env.RECREATEX_BASE_URL ?? 'https://wsdlspacemagic.recreatex.be',
  shopId: SHOP_ID,
  password: process.env.RECREATEX_PASSWORD ?? (() => {
    throw new Error('RECREATEX_PASSWORD env var required');
  })(),
});

const catalog = await listGastroArticles(rx, {
  divisionId: DIVISION_IDS.spaceMagic,
});

const rows = catalog.flatMap((group) =>
  group.articles.map((article) => ({
    Gruppe: group.groupName,
    Code: article.code,
    Artikel: article.name,
    Preis: article.price,
    MwSt: article.vatPercentage ?? '',
    ArticleId: article.id,
    GroupId: group.groupId,
  })),
);

console.table(rows);
console.log(`${rows.length} Gastro-Artikel in ${catalog.length} Gruppen`);
