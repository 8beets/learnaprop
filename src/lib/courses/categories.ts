/** Reviewed equivalences between actual provider categories. Source values stay unchanged. */
export const categoryGroups: Readonly<Record<string, readonly string[]>> = {
  FOTOGRAFIA: [
    'FOTOGRAFIA',
    'ESPAI FOTOGRÀFIC',
    'ESPAI FOTOGRÀFIC PATI LLIMONA',
  ],
  BALL: ['BALL', 'DANSA'],
  'ART I CREATIVITAT': ['ART I CREATIVITAT', 'PLÀSTICA'],
  'ACTIVITAT FÍSICA I BENESTAR': [
    'ACTIVITAT FÍSICA I BENESTAR',
    'SALUT I ESPORT',
    'COS',
  ],
};

function comparisonKey(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleUpperCase('ca');
}

const aliases = new Map(
  Object.entries(categoryGroups).flatMap(([canonical, members]) =>
    members.map((member) => [comparisonKey(member), canonical] as const),
  ),
);

export function canonicalCategory(value: string): string {
  return aliases.get(comparisonKey(value)) ?? value.trim();
}

export function sourceCategories(value: string): readonly string[] {
  const canonical = canonicalCategory(value);
  return Object.hasOwn(categoryGroups, canonical)
    ? categoryGroups[canonical]!
    : [canonical];
}
