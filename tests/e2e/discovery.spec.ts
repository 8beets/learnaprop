import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('Spanish homepage and Catalan language switching work without client JavaScript', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Aprende cerca de casa' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('link', { name: 'Català' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprèn a prop de casa' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
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
  const navigation = page.getByRole('navigation', {
    name: 'Explorar por categoría',
  });
  await navigation.getByRole('link', { name: 'Idiomas', exact: true }).click();
  await expect(page).toHaveURL(/category=IDIOMES$/);
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
    .getByRole('link', { name: 'Ball', exact: true })
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
});
