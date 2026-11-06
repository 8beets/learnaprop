import { readFileSync, readdirSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';
import { runIngestion } from '../../src/lib/ingestion/run';
import { parseMiramPage } from '../../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../../src/lib/sources/sant-andreu';
import { canBaste } from '../../src/lib/sources/can-baste';
import { patiLlimona } from '../../src/lib/sources/pati-llimona';

async function setup() {
  const platform = await getPlatformProxy<Cloudflare.Env>({
    configPath: 'wrangler.jsonc',
    persist: { path: '.wrangler/e2e-state/v3' },
    remoteBindings: false,
  });
  try {
    const db = platform.env.DB;
    const directory = new URL('../../migrations/', import.meta.url);
    // E2E has a dedicated state directory and server port; browsing data is never seeded.
    await db
      .prepare(
        'CREATE TABLE IF NOT EXISTS e2e_migrations (name TEXT PRIMARY KEY)',
      )
      .run();
    for (const file of readdirSync(directory)
      .filter((name) => name.endsWith('.sql'))
      .sort()) {
      const sql = readFileSync(new URL(file, directory), 'utf8');
      const applied = await db
        .prepare('SELECT name FROM e2e_migrations WHERE name=?')
        .bind(file)
        .first();
      if (!applied) {
        await db.batch([
          ...sql
            .split(';')
            .map((query) => query.trim())
            .filter(Boolean)
            .map((query) => db.prepare(query)),
          db.prepare('INSERT INTO e2e_migrations (name) VALUES (?)').bind(file),
        ]);
      }
    }
    const fixture = readFileSync(
      new URL('../fixtures/miram-sant-andreu-languages.html', import.meta.url),
      'utf8',
    );
    // Synthetic dates/extra records test navigation and pagination, exclusively in E2E state.
    const records = parseMiramPage(
      fixture,
      `${santAndreu.listingUrl}&f=ID`,
    ).records.map((record) => ({
      ...record,
      startDate: '2099-01-01',
      endDate: '2099-12-31',
    }));
    const first = records[0]!;
    const paginationRecords = Array.from({ length: 13 }, (_, index) => ({
      ...first,
      externalId: String(90000 + index),
      title: `TEST pagination workshop ${index}`,
      priceCents: 1000,
    }));
    const dance = {
      ...first,
      externalId: '99999',
      title: 'TEST dance workshop',
      category: 'BALL',
    };
    await runIngestion(
      db,
      { fetchRecords: async () => [...records, ...paginationRecords, dance] },
      santAndreu,
    );
    await runIngestion(
      db,
      {
        fetchRecords: async () => [
          {
            ...first,
            externalId: '99998',
            title: 'TEST second centre language workshop',
          },
        ],
      },
      canBaste,
    );
    const patiFixture = readFileSync(
      new URL('../fixtures/miram-pati-llimona-cinema.html', import.meta.url),
      'utf8',
    );
    const patiRecords = parseMiramPage(
      patiFixture,
      `${patiLlimona.listingUrl}&f=2`,
    ).records.map((record) => ({
      ...record,
      startDate: '2099-01-01',
      endDate: '2099-12-31',
    }));
    await runIngestion(
      db,
      { fetchRecords: async () => patiRecords },
      patiLlimona,
    );
  } finally {
    await platform.dispose();
  }
}

await setup();
