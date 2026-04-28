/**
 * Gastro article-group mapping.
 *
 * Use {@link gastroGroupName} to translate the
 * `ListSalesInformation.articleGroupID` UUIDs from
 * `groupByArticleGroup: true` queries into human-readable bucket names.
 *
 * Captured from the live KPI dashboard. Add new entries whenever a fresh
 * article group is created in the Recreatex backoffice.
 */

export const GASTRO_GROUP_MAP: ReadonlyMap<string, string> = new Map([
  ['d33c73eb-22ab-ef11-9595-9a21964517de', 'Alkohol'],
  ['cc3c73eb-22ab-ef11-9595-9a21964517de', 'Burger'],
  ['cb3c73eb-22ab-ef11-9595-9a21964517de', 'Fingerfood'],
  ['c93c73eb-22ab-ef11-9595-9a21964517de', 'Heißgetränke'],
  ['cf3c73eb-22ab-ef11-9595-9a21964517de', 'Kuchen / Gebäck'],
  ['ce3c73eb-22ab-ef11-9595-9a21964517de', 'Milchreis'],
  ['ca3c73eb-22ab-ef11-9595-9a21964517de', 'Nudeln'],
  ['d23c73eb-22ab-ef11-9595-9a21964517de', 'Obst'],
  ['cd3c73eb-22ab-ef11-9595-9a21964517de', 'Pfannkuchen'],
  ['c83c73eb-22ab-ef11-9595-9a21964517de', 'Pizza'],
  ['d13c73eb-22ab-ef11-9595-9a21964517de', 'Salat'],
  ['d03c73eb-22ab-ef11-9595-9a21964517de', 'Softdrinks'],
  ['d43c73eb-22ab-ef11-9595-9a21964517de', 'Suppen'],
  ['d53c73eb-22ab-ef11-9595-9a21964517de', 'Süßigkeiten'],
  ['c73c73eb-22ab-ef11-9595-9a21964517de', 'Würstchen'],
]);

/** Look up the human label for an articleGroupID; returns the UUID itself if unknown. */
export function gastroGroupName(articleGroupId: string | null | undefined): string {
  if (!articleGroupId) return 'Unbekannt';
  return GASTRO_GROUP_MAP.get(articleGroupId) ?? articleGroupId;
}
