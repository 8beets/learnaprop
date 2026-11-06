import { expect, test } from '@playwright/test';
import { sources } from '../../src/lib/sources';
import { centreProfile } from '../../src/lib/institutions/profiles';

// Routine browser checks never depend on OSM or its tile servers being available.
test.setTimeout(120000);

test.beforeEach(async ({ page }) => {
  await page.route('https://www.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Offline map fixture</title>',
    }),
  );
});
for (const locale of ['es', 'ca'] as const) {
  const base = locale === 'es' ? '/centros' : '/ca/centres';
  test(`${locale}: directory links to all centres and exact embedded verified markers`, async ({
    page,
  }) => {
    await page.goto(locale === 'es' ? '/' : '/ca/');
    await page
      .getByRole('navigation', {
        name: locale === 'es' ? 'Navegación principal' : 'Navegació principal',
      })
      .getByRole('link', {
        name: locale === 'es' ? 'Centros' : 'Centres',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`${base}$`));
    const links = page.locator('.centre-directory h2 a');
    await expect(links).toHaveCount(12);
    for (const source of sources) {
      const profile = centreProfile(source.institution.id);
      const href = `${base}/${profile.slug}`;
      await expect(
        page.locator(`.centre-directory a[href="${href}"]`),
      ).toHaveText(source.institution.name);
    }
    for (const source of sources) {
      const profile = centreProfile(source.institution.id);
      await page.goto(`${base}/${profile.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        source.institution.name,
      );
      const frame = page.locator('.centre-map iframe');
      await expect(frame).toHaveCount(1);
      await expect(frame).toHaveAttribute(
        'title',
        new RegExp(
          source.institution.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      const embed = new URL((await frame.getAttribute('src'))!);
      expect(embed.searchParams.get('marker')).toBe(
        `${profile.location!.latitude},${profile.location!.longitude}`,
      );
      await expect(
        page
          .locator('.centre-map a')
          .filter({ hasText: 'OpenStreetMap contributors' }),
      ).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
      await expect(
        page.locator('.course .institution a').first(),
      ).toHaveAttribute('href', `${base}/${profile.slug}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });
  test(`${locale}: locale switching preserves centre, pagination is scoped, and unknown location has no fake marker`, async ({
    page,
  }) => {
    await page.goto(`${base}/sant-andreu`);
    await expect(page.locator('.course')).toHaveCount(12);
    await page.locator('a[rel="next"]').click();
    await expect(page).toHaveURL(`${base}/sant-andreu?page=2`);
    expect(await page.locator('.course').count()).toBeGreaterThan(0);
    await expect(
      page.locator('.course .institution a').first().first(),
    ).toHaveAttribute('href', `${base}/sant-andreu`);
    await page
      .getByRole('navigation', { name: locale === 'es' ? 'Idioma' : 'Idioma' })
      .getByRole('link', { name: locale === 'es' ? 'Català' : 'Español' })
      .click();
    await expect(page).toHaveURL(
      `${locale === 'es' ? '/ca/centres' : '/centros'}/sant-andreu?page=2`,
    );
    await page.goto(`${base}/test-no-location`);
    await expect(page.locator('.centre-map iframe')).toHaveCount(0);
    const fallback = page.locator('.centre-map a');
    expect(new URL((await fallback.getAttribute('href'))!).pathname).toBe(
      '/search',
    );
    await expect(page.locator('.course')).toHaveCount(0);
    await page.goto(`${base}/fab-casa-del-mig`);
    await expect(page.locator('.error')).toContainText(
      locale === 'es' ? 'cerrado temporalmente' : 'tancat temporalment',
    );
    expect((await page.goto(`${base}/unknown`))?.status()).toBe(404);
    expect((await page.goto(`${base}?page=-1`))?.status()).toBe(400);
  });
}
