/**
 * Gastro article-group mapping.
 *
 * Use {@link gastroGroupName} to translate the
 * `ListSalesInformation.articleGroupID` UUIDs from
 * `groupByArticleGroup: true` queries into human-readable bucket names.
 *
 * Source of truth: live KPI dashboard `routes/gastro-analytics.ts` as of
 * 2026-04-28. Add new entries whenever a fresh article group is created
 * in the Recreatex backoffice.
 */

export const GASTRO_GROUP_MAP: ReadonlyMap<string, string> = new Map([
  ['d33c73eb-22ab-ef11-9595-9a21964517de', 'Alkohol'],
  ['cc3c73eb-22ab-ef11-9595-9a21964517de', 'Burger'],
  ['cb3c73eb-22ab-ef11-9595-9a21964517de', 'Fingerfood'],
  ['b2bbfab5-1019-f011-9596-b28721114d72', 'Heißgetränke'],
  ['01440a27-e67c-f011-9596-b28721114d72', 'Kuchen/Gebäck'],
  ['d03c73eb-22ab-ef11-9595-9a21964517de', 'Milchreis'],
  ['c83c73eb-22ab-ef11-9595-9a21964517de', 'Nudeln'],
  ['d13c73eb-22ab-ef11-9595-9a21964517de', 'Obst'],
  ['ce3c73eb-22ab-ef11-9595-9a21964517de', 'Pfannkuchen'],
  ['ca3c73eb-22ab-ef11-9595-9a21964517de', 'Pizza'],
  ['cf3c73eb-22ab-ef11-9595-9a21964517de', 'Salat'],
  ['ffa9dc4b-048f-f011-9596-b28721114d72', 'Soft Drinks Empf.'],
  ['d43c73eb-22ab-ef11-9595-9a21964517de', 'Softdrinks'],
  ['159d138d-f520-f011-9596-b28721114d72', 'Suppen'],
  ['d23c73eb-22ab-ef11-9595-9a21964517de', 'Süßigkeiten'],
  ['cf1ef454-5f8d-f011-9596-b28721114d72', 'Süßigkeiten Empf.'],
  ['cd3c73eb-22ab-ef11-9595-9a21964517de', 'Würstchen'],
]);

/** Look up the human label for an articleGroupID; returns the UUID itself if unknown. */
export function gastroGroupName(articleGroupId: string | null | undefined): string {
  if (!articleGroupId) return 'Unbekannt';
  return GASTRO_GROUP_MAP.get(articleGroupId) ?? articleGroupId;
}

/** True if the given articleGroupID is mapped as a gastro category. */
export function isGastroGroup(articleGroupId: string | null | undefined): boolean {
  return !!articleGroupId && GASTRO_GROUP_MAP.has(articleGroupId);
}
