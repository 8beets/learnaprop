import { describe, expect, it } from 'vitest';
import {
  canonicalCategory,
  sourceCategories,
} from '../../src/lib/courses/categories';
import { categoryLabel } from '../../src/i18n/ui';
import { parseFilters } from '../../src/lib/courses/discovery';

describe('reviewed category grouping', () => {
  it.each([
    ['ESPAI FOTOGRÀFIC PATI LLIMONA', 'FOTOGRAFIA'],
    ['Espai de fotografia F. Català-Roca', 'FOTOGRAFIA'],
    ['Cuina', 'CUINA'],
    ['Creativitat', 'ART I CREATIVITAT'],
    ['Salut', 'ACTIVITAT FÍSICA I BENESTAR'],
    ['Recursos', 'RECURSOS I CREATIVITAT'],
    [' espai   fotogràfic ', 'FOTOGRAFIA'],
    ['DANSA', 'BALL'],
    ['PLÀSTICA', 'ART I CREATIVITAT'],
    ['COS', 'ACTIVITAT FÍSICA I BENESTAR'],
    ['SALUT I ESPORT', 'ACTIVITAT FÍSICA I BENESTAR'],
  ])('maps %s to %s', (source, canonical) => {
    expect(canonicalCategory(source)).toBe(canonical);
  });
  it('normalizes legacy URL aliases and expands to every reviewed source label', () => {
    expect(
      parseFilters(new URLSearchParams('category=ESPAI+FOTOGRÀFIC')).category,
    ).toBe('FOTOGRAFIA');
    expect(sourceCategories('FOTOGRAFIA')).toEqual([
      'FOTOGRAFIA',
      'ESPAI FOTOGRÀFIC',
      'ESPAI FOTOGRÀFIC PATI LLIMONA',
      'Espai de fotografia F. Català-Roca',
    ]);
    expect(categoryLabel('ESPAI FOTOGRÀFIC PATI LLIMONA', 'es')).toBe(
      'Fotografía',
    );
    expect(categoryLabel('ESPAI FOTOGRÀFIC PATI LLIMONA', 'ca')).toBe(
      'Fotografia',
    );
  });
  it('formats unfamiliar all-caps labels without inventing a translation or merging unrelated categories', () => {
    expect(categoryLabel('NOVA CATEGORIA', 'ca')).toBe('Nova categoria');
    expect(categoryLabel("ReGENERA'T", 'ca')).toBe('ReGENERA’T');
    expect(canonicalCategory('RECURSOS I CREATIVITAT')).toBe(
      'RECURSOS I CREATIVITAT',
    );
    expect(sourceCategories("' OR 1=1 --")).toEqual(["' OR 1=1 --"]);
    expect(sourceCategories('__proto__')).toEqual(['__proto__']);
    expect(sourceCategories('constructor')).toEqual(['constructor']);
  });
});
