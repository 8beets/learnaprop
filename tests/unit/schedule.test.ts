import { describe, expect, it } from 'vitest';
import { formatSchedule } from '../../src/i18n/schedule';

describe('localized schedule display', () => {
  it.each([
    ['Dilluns', 'Lunes'],
    ['Dimarts', 'Martes'],
    ['Dimecres', 'Miércoles'],
    ['Dijous', 'Jueves'],
    ['Divendres', 'Viernes'],
    ['Dissabte', 'Sábado'],
    ['Diumenge', 'Domingo'],
    ['Dissabtes i diumenges', 'Sábados y domingos'],
    ['DILLUNS I DIMARTS', 'LUNES Y MARTES'],
    [
      'Dilluns, dimecres i divendres de 9.30 a 11 h',
      'Lunes, miércoles y viernes de 9.30 a 11 h',
    ],
    ['Dijous 18:00 h a 19:30 h', 'Jueves 18:00 h a 19:30 h'],
    ['A determinar', 'A determinar'],
    ['Martes 17.30 a 19 h', 'Martes 17.30 a 19 h'],
    ['dillunsada', 'dillunsada'],
  ])(
    'formats %s in Spanish without changing times or unknown text',
    (source, expected) => {
      expect(formatSchedule(source, 'es')).toBe(expected);
    },
  );

  it('keeps original Catalan schedules unchanged', () => {
    const source = 'Dilluns i dimecres de 9.30 a 11 h';
    expect(formatSchedule(source, 'ca')).toBe(source);
  });
});
