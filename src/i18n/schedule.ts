import type { Locale } from './ui';

const spanishWeekdays: Record<string, string> = {
  dilluns: 'lunes',
  dimarts: 'martes',
  dimecres: 'miércoles',
  dijous: 'jueves',
  divendres: 'viernes',
  dissabte: 'sábado',
  dissabtes: 'sábados',
  diumenge: 'domingo',
  diumenges: 'domingos',
};

/** Format known calendar terms without translating source prose or inferring sessions. */
export function formatSchedule(value: string, locale: Locale): string {
  if (locale !== 'es') return value;
  return value
    .replace(
      /\b(dilluns|dimarts|dimecres|dijous|divendres|dissabtes?|diumenges?)\b/gi,
      (word) => {
        const translated = spanishWeekdays[word.toLowerCase()]!;
        if (word === word.toUpperCase())
          return translated.toLocaleUpperCase('es');
        if (word[0] === word[0]!.toUpperCase())
          return translated[0]!.toUpperCase() + translated.slice(1);
        return translated;
      },
    )
    .replace(
      /\bi\b(?=\s+(?:lunes|martes|miércoles|jueves|viernes|sábados?|domingos?)\b)/gi,
      (word) => (word === 'I' ? 'Y' : 'y'),
    );
}
