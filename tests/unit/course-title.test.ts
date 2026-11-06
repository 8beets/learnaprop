import { describe, expect, it } from 'vitest';
import { formatCourseTitle } from '../../src/lib/courses/title';

describe('display-only course title casing', () => {
  it.each([
    ['es', 'INTRODUCCIÓN A LA IA Y LAS API', 'Introducción a la IA y las API'],
    [
      'ca',
      "INICIACIÓ A L'ARDUINO I L'ESP32",
      "Iniciació a l'Arduino i l'ESP32",
    ],
    ['es', 'HTML, CSS Y JAVASCRIPT', 'HTML, CSS y JavaScript'],
    [
      'ca',
      'CONTROL DE LEDS AMB TOUCHDESIGNER',
      'Control de LEDs amb TouchDesigner',
    ],
    ['ca', 'CONVERSA EN ANGLÈS', 'Conversa en anglès'],
    ['ca', 'APRÈN A REPARAR JOGUINES', 'Aprèn a reparar joguines'],
    ['es', 'ESP32 Y ARDUINO', 'ESP32 y Arduino'],
    ['ca', 'ANGLÈS B1 I HTML5', 'Anglès B1 i HTML5'],
    ['ca', 'ANGLÈS I CONVERSA', 'Anglès i conversa'],
    ['ca', 'FOTOGRAFIA 3R NIVELL', 'Fotografia 3r nivell'],
    ['ca', 'IOGA: COS I MENT', 'Ioga: cos i ment'],
    ['ca', '2026: ELECTRÒNICA I ROBÒTICA', '2026: Electrònica i robòtica'],
    ['es', 'C++ Y C# PARA PRINCIPIANTES', 'C++ y C# para principiantes'],
    ['es', 'API', 'API'],
    ['ca', 'IA, API I HTML', 'IA, API i HTML'],
    [
      'ca',
      'HISTÒRIA DE BARCELONA I CATALUNYA',
      'Història de Barcelona i Catalunya',
    ],
    ['ca', 'PEL·LÍCULES I IL·LUSTRACIÓ', 'Pel·lícules i il·lustració'],
    [
      'ca',
      'Què hi pintem, les dones? Una nova mirada',
      'Què hi pintem, les dones? Una nova mirada',
    ],
    ['es', 'Taller de Arduino y ESP32', 'Taller de Arduino y ESP32'],
    [
      'ca',
      "Aquarel·la d'hivern (Dimecres 18 h)",
      "Aquarel·la d'hivern (Dimecres 18 h)",
    ],
    ['es', 'curso de API y HTML', 'curso de API y HTML'],
    ['es', '', ''],
    ['ca', '2026 — 123', '2026 — 123'],
    ['es', '陶芸', '陶芸'],
  ] as const)('%s: %s → %s', (locale, source, display) => {
    expect(formatCourseTitle(source, locale)).toBe(display);
    expect(formatCourseTitle(display, locale)).toBe(display);
  });
});
