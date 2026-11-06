/** Reviewed equivalences between actual provider categories. Source values stay unchanged. */
export const categoryGroups: Readonly<Record<string, readonly string[]>> = {
  FOTOGRAFIA: [
    'FOTOGRAFIA',
    'ESPAI FOTOGRÀFIC',
    'ESPAI FOTOGRÀFIC PATI LLIMONA',
    'Espai de fotografia F. Català-Roca',
  ],
  BALL: ['BALL', 'DANSA'],
  'ART I CREATIVITAT': [
    'ART I CREATIVITAT',
    'PLÀSTICA',
    'Creativitat',
    'CREATIVITAT',
    'Art i creació',
  ],
  'ACTIVITAT FÍSICA I BENESTAR': [
    'ACTIVITAT FÍSICA I BENESTAR',
    'SALUT I ESPORT',
    'COS',
    'Salut',
    'Salut i activitat física',
    'Salut i creixement personal',
    'Cos i moviment',
  ],
  CUINA: [
    'CUINA',
    'Cuina',
    'Gastronomia',
    'GASTRONOMIA',
    'A taula! Tallers de cuina',
  ],
  'RECURSOS I CREATIVITAT': ['RECURSOS I CREATIVITAT', 'Recursos'],
  'CIÈNCIES I HUMANITATS': ['CIÈNCIES I HUMANITATS', 'Ciències i humanitats'],
  EXPRESSIÓ: ['EXPRESSIÓ', 'Expressió', 'Expressió i creativitat'],
  MÚSICA: ['MÚSICA', 'Música'],
  IDIOMES: ['IDIOMES', 'Idiomes'],
  HUMANITATS: ['HUMANITATS', 'Humanitats'],
  'HABILITATS I COMPETÈNCIES': [
    'HABILITATS I COMPETÈNCIES',
    'Habilitats i competències',
  ],
  'ESPECIAL GENT GRAN': ['ESPECIAL GENT GRAN', 'Persones Grans'],
  FAMILIARS: ['FAMILIARS', 'Familiars', 'ACTIVITATS FAMILIARS'],
  'NOVES TECNOLOGIES': [
    'NOVES TECNOLOGIES',
    '1_Tallers de creació multimèdia i maker',
  ],
  'INFORMÀTICA PER A GENT GRAN': [
    'INFORMÀTICA PER A GENT GRAN',
    "4_Tallers d'informàtica per a gent gran",
  ],
  'FABRICACIÓ DIGITAL I ROBÒTICA': [
    'FABRICACIÓ DIGITAL I ROBÒTICA',
    '3_Tallers de fabricació digital i robòtica per infants, adolescents i joves',
  ],
  'INFANTILS i JUVENILS': [
    'INFANTILS i JUVENILS',
    'Tallers per a Infants i Joves',
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
