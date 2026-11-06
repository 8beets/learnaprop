import type { Locale } from '../../i18n/ui';

// Explicit spellings only: unknown names cannot be reconstructed from uppercase text.
const preservedWords = new Map(
  [
    'IA',
    'AI',
    'API',
    'HTML',
    'CSS',
    'SQL',
    'HTTP',
    'HTTPS',
    'REST',
    'JSON',
    'XML',
    'USB',
    'PDF',
    'PC',
    'TIC',
    'MIDI',
    'LEDs',
    'RAW',
    'JPEG',
    'ADN',
    'DNA',
    'ONG',
    'UE',
    'DIY',
    '2D',
    '3D',
    'C++',
    'C#',
    'IoT',
    'Arduino',
    'ESP32',
    'JavaScript',
    'TypeScript',
    'Python',
    'Linux',
    'Windows',
    'Excel',
    'Word',
    'PowerPoint',
    'Photoshop',
    'Lightroom',
    'Canva',
    'Scratch',
    'WordPress',
    'ChatGPT',
    'OpenAI',
    'TouchDesigner',
    'YouTube',
    'Barcelona',
    'Catalunya',
    'España',
    'Espanya',
  ].map((word) => [word.toLocaleUpperCase('es'), word]),
);

/** Presentation only: do not use this for source identity, persistence or search. */
export function formatCourseTitle(title: string, locale: Locale): string {
  if (
    title !== title.toLocaleUpperCase(locale) ||
    title === title.toLocaleLowerCase(locale)
  )
    return title;
  const sentence = title
    .toLocaleLowerCase(locale)
    .replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase(locale));
  return sentence.replace(/[\p{L}\p{M}\p{N}]+(?:\+\+|#)?/gu, (word) => {
    const upper = word.toLocaleUpperCase(locale);
    // Preserve explicit level/model codes such as B1, HTML5 and ESP32.
    return (
      preservedWords.get(upper) ??
      (/^[A-Z]+[0-9][A-Z0-9]*$/.test(upper) ? upper : word)
    );
  });
}
