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
    page.getByRole('link', { name: /Programación del Centre Cívic/ }),
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
