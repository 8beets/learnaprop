import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('Spanish homepage and Catalan language switching work without client JavaScript', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Aprende cerca de casa' }),
  ).toBeVisible();
  await expect(page.locator('.schedule').first()).toHaveText(
    /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\b/i,
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.hero-photos figure')).toHaveCount(4);
  await expect(page.locator('.hero-photos figcaption')).toHaveText([
    'Música',
    'Cerámica',
    'Electrónica',
    'Bricolaje',
  ]);
  await expect
    .poll(() =>
      page
        .locator('.hero-photos img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(page.locator('.brand img')).toHaveAttribute(
    'src',
    '/images/brand/learnaprop-logo.png',
  );
  const repository = page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Código en GitHub', exact: true });
  await expect(repository).toHaveAttribute(
    'href',
    'https://github.com/8beets/learnaprop',
  );
  await expect(repository.locator('img')).toHaveAttribute(
    'src',
    '/icons/github.svg',
  );
  await page.getByRole('link', { name: 'Català' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprèn a prop de casa' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('contentinfo')
      .getByRole('link', { name: 'Codi a GitHub', exact: true }),
  ).toHaveAttribute('href', 'https://github.com/8beets/learnaprop');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  await expect(page.locator('.hero-photos figcaption')).toHaveText([
    'Música',
    'Ceràmica',
    'Electrònica',
    'Bricolatge',
  ]);
  await expect(page.locator('.schedule').first()).toHaveText(
    /^(Dilluns|Dimarts|Dimecres|Dijous|Divendres|Dissabte|Diumenge)\b/i,
  );
});

test('search uses shareable URL filters and an honest empty state', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Buscar por título').fill('no-such-course-abc123');
  await page.getByLabel('Precio máximo (€)').fill('20');
  await page.getByRole('button', { name: 'Buscar cursos' }).click();
  await expect(page).toHaveURL(/q=no-such-course-abc123&maxPrice=20/);
  await expect(
    page.getByRole('heading', {
      name: 'Todavía no hay cursos que coincidan con tu búsqueda.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: /Programación oficial: Centre Cívic Sant Andreu/,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('invalid URL filters return an accessible error and HTTP 400', async ({
  page,
}) => {
  const response = await page.goto('/?page=-1');
  expect(response?.status()).toBe(400);
  await expect(page.getByRole('alert')).toContainText('Revisa los filtros');
});

test('categories compose with search, pagination, and locale switching without JavaScript', async ({
  page,
}) => {
  await page.goto('/?page=2');
  const searchWidth = (await page.locator('#q').boundingBox())!.width;
  const navigation = page.getByRole('navigation', {
    name: 'Explorar por categoría',
  });
  await navigation.getByRole('link', { name: 'Idiomas', exact: true }).click();
  await expect(page).toHaveURL(/category=IDIOMES$/);
  expect((await page.locator('#q').boundingBox())!.width).toBeCloseTo(
    searchWidth,
    1,
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Explorar por categoría' })
      .getByRole('link', { name: 'Idiomas', exact: true }),
  ).toHaveAttribute('aria-current', 'true');
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/category=IDIOMES&page=2/);
  await page.getByRole('link', { name: 'Català' }).click();
  await expect(page).toHaveURL(/\/ca\/\?category=IDIOMES&page=2/);
  await expect(
    page
      .getByRole('navigation', { name: 'Explora per categoria' })
      .getByRole('link', { name: 'Idiomes', exact: true }),
  ).toHaveAttribute('aria-current', 'true');
  await page.getByLabel('Cerca per títol').fill('ANGLÈS');
  await page.getByLabel('Preu màxim (€)').fill('20');
  await page.getByRole('button', { name: 'Cerca cursos' }).click();
  await expect(page).toHaveURL(/category=IDIOMES/);
  await expect(page.locator('article.course')).toHaveCount(1);
  await expect(page.locator('article.course h3')).toHaveText(
    'TERTÚLIA LITERÀRIA EN ANGLÈS',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('navigation', { name: 'Explora per categoria' })
    .getByRole('link', { name: 'Ball i dansa', exact: true })
    .click();
  await expect(page).toHaveURL(/category=BALL/);
  await expect(
    page.getByRole('heading', {
      name: 'Encara no hi ha cursos que coincideixin amb la teva cerca.',
    }),
  ).toBeVisible();
});

test('centre navigation combines with categories and survives search and language switching', async ({
  page,
}) => {
  await page.goto('/?category=IDIOMES&page=2');
  await page
    .getByRole('navigation', { name: 'Explorar por centro' })
    .getByRole('link', { name: 'Centre Cívic Can Basté', exact: true })
    .click();
  await expect(page).toHaveURL(/category=IDIOMES&centre=cc-can-baste$/);
  await expect(page.locator('article.course')).toHaveCount(1);
  await expect(page.locator('article.course .institution')).toHaveText(
    'Centre Cívic Can Basté',
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Explorar por centro' })
      .getByRole('link', { name: 'Centre Cívic Can Basté', exact: true }),
  ).toHaveAttribute('aria-current', 'true');
  await page.getByLabel('Buscar por título').fill('TEST');
  await page.getByRole('button', { name: 'Buscar cursos' }).click();
  await expect(page).toHaveURL(/centre=cc-can-baste/);
  await page.getByRole('link', { name: 'Català' }).click();
  await expect(page.locator('article.course')).toHaveCount(1);
  await page
    .getByRole('navigation', { name: 'Explora per centre' })
    .getByRole('link', { name: 'Tots els centres', exact: true })
    .click();
  expect(new URL(page.url()).searchParams.has('centre')).toBe(false);
  expect(new URL(page.url()).searchParams.get('category')).toBe('IDIOMES');
  await expect(page.locator('article.course')).toHaveCount(12);
  await page.getByRole('link', { name: 'Neteja els filtres' }).click();
  await page
    .getByRole('navigation', { name: 'Explora per centre' })
    .getByRole('link', { name: 'Centre Cívic Pati Llimona', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Explora per categoria' })
    .getByRole('link', { name: 'Cinema', exact: true })
    .click();
  await expect(page.locator('article.course')).toHaveCount(1);
  await expect(page.locator('article.course .institution')).toHaveText(
    'Centre Cívic Pati Llimona',
  );
});

test('photography aliases share one pill and category choices follow the selected centre', async ({
  page,
}) => {
  await page.goto('/?category=ESPAI+FOTOGR%C3%80FIC+PATI+LLIMONA');
  let categories = page.getByRole('navigation', {
    name: 'Explorar por categoría',
  });
  await expect(
    categories.getByRole('link', { name: 'Fotografía', exact: true }),
  ).toHaveCount(1);
  await expect(
    categories.getByRole('link', { name: 'Fotografía', exact: true }),
  ).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('article.course')).toHaveCount(4);
  await expect(page.locator('article.course .course-category')).toHaveText([
    'Fotografía',
    'Fotografía',
    'Fotografía',
    'Fotografía',
  ]);
  await page
    .getByRole('navigation', { name: 'Explorar por centro' })
    .getByRole('link', { name: 'Centre Cívic Pati Llimona', exact: true })
    .click();
  await expect(categories.getByRole('link')).toHaveText([
    'Todas las categorías',
    'Cine',
    'Fotografía',
  ]);
  await expect(page.locator('article.course')).toHaveCount(2);
  await page.getByRole('link', { name: 'Català', exact: true }).click();
  categories = page.getByRole('navigation', { name: 'Explora per categoria' });
  await expect(categories.getByRole('link')).toHaveText([
    'Totes les categories',
    'Cinema',
    'Fotografia',
  ]);
  await page
    .getByRole('navigation', { name: 'Explora per centre' })
    .getByRole('link', { name: 'Centre Cívic Can Basté', exact: true })
    .click();
  await expect(categories.getByRole('link')).toHaveText([
    'Totes les categories',
    'Fotografia',
    'Idiomes',
  ]);
  await expect(page.locator('article.course')).toHaveCount(1);
  await page
    .getByRole('navigation', { name: 'Explora per centre' })
    .getByRole('link', { name: 'Tots els centres', exact: true })
    .click();
  await expect(
    categories.getByRole('link', { name: 'Ball i dansa', exact: true }),
  ).toBeVisible();
  await expect(page.locator('article.course')).toHaveCount(4);
});

test('Golferichs exposes only its own normalized categories and course source links', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Explorar por centro' })
    .getByRole('link', { name: 'Centre Cívic Casa Golferichs', exact: true })
    .click();
  const categories = page.getByRole('navigation', {
    name: 'Explorar por categoría',
  });
  await expect(categories.getByRole('link')).toHaveText([
    'Todas las categorías',
    'Cocina',
    'Fotografía',
  ]);
  await expect(page.locator('article.course')).toHaveCount(2);
  await categories
    .getByRole('link', { name: 'Fotografía', exact: true })
    .click();
  await expect(page.locator('article.course')).toHaveCount(1);
  await expect(page.locator('article.course .institution')).toHaveText(
    'Centre Cívic Casa Golferichs',
  );
  await expect(
    page
      .locator('article.course')
      .getByRole('link', { name: /Consultar fuente oficial/ }),
  ).toHaveAttribute(
    'href',
    /https:\/\/golferichs\.inscripcionscc\.com\/.*#accordion7350$/,
  );
  await page.getByRole('link', { name: 'Català', exact: true }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Explora per categoria' })
      .getByRole('link'),
  ).toHaveText(['Totes les categories', 'Cuina', 'Fotografia']);
  await expect(page.locator('article.course h3')).toHaveText(
    'Tècniques bàsiques (1r nivell): coneixement de la càmera',
  );
});

test('new centres offer their own normalized categories in both locales', async ({
  page,
}) => {
  const centres = [
    [
      'Centre Cultural La Casa Elizalde',
      'Actualidad e historia',
      'Actualitat i història',
    ],
    ['Centre Cultural Albareda', 'Música', 'Música'],
    ['Centre Cívic El Sortidor', 'Talleres familiares', 'Tallers familiars'],
    ['Centre Cívic Vil·la Urània', 'Arte y creatividad', 'Art i creativitat'],
    ['Centre Cívic Urgell', 'Humanidades', 'Humanitats'],
    ['FAB Casa del Rellotge', 'Nuevas tecnologías', 'Noves tecnologies'],
    ['FAB Casa del Mig', 'Nuevas tecnologías', 'Noves tecnologies'],
  ];
  for (const [name, spanish, catalan] of centres) {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Explorar por centro' })
      .getByRole('link', { name, exact: true })
      .click();
    await expect(page.locator('article.course')).toHaveCount(1);
    await expect(page.locator('article.course .institution')).toHaveText(name!);
    await expect(
      page
        .getByRole('navigation', { name: 'Explorar por categoría' })
        .getByRole('link'),
    ).toHaveText(['Todas las categorías', spanish!]);
    await page.getByRole('link', { name: 'Català', exact: true }).click();
    await expect(
      page
        .getByRole('navigation', { name: 'Explora per categoria' })
        .getByRole('link'),
    ).toHaveText(['Totes les categories', catalan!]);
  }
});

test('the two FAB centres retain separate course filters and Miram activity types', async ({
  page,
}) => {
  for (const [name, activityType, id] of [
    ['FAB Casa del Rellotge', 'CR', '675'],
    ['FAB Casa del Mig', 'CM', '674'],
  ]) {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Explorar por centro' })
      .getByRole('link', { name, exact: true })
      .click();
    const link = page
      .locator('article.course')
      .getByRole('link', { name: /Consultar fuente oficial/ });
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.hostname).toBe('fabcasadelmig.miram.cloud');
    expect(url.searchParams.get('t')).toBe(activityType);
    expect(url.hash).toBe(`#accordion${id}`);
  }
});
