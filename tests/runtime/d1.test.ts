import { readFileSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';
import { expect, it } from 'vitest';
import { runIngestion } from '../../src/lib/ingestion/run';
import { parseMiramPage } from '../../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../../src/lib/sources/sant-andreu';

it('applies the migration and imports idempotently in the actual local D1 runtime', async () => {
  const platform = await getPlatformProxy<Cloudflare.Env>({
    configPath: 'wrangler.jsonc',
    persist: false,
  });
  try {
    const db = platform.env.DB;
    const migration = readFileSync(
      new URL('../../migrations/0001_initial.sql', import.meta.url),
      'utf8',
    );
    await db.batch(
      migration
        .split(';')
        .map((sql) => sql.trim())
        .filter(Boolean)
        .map((sql) => db.prepare(sql)),
    );
    const fixture = readFileSync(
      new URL('../fixtures/miram-sant-andreu-languages.html', import.meta.url),
      'utf8',
    );
    const records = parseMiramPage(
      fixture,
      `${santAndreu.listingUrl}&f=ID`,
    ).records;
    const adapter = { fetchRecords: async () => records };
    await runIngestion(db, adapter, santAndreu);
    await runIngestion(db, adapter, santAndreu);
    expect(
      await db.prepare('SELECT count(*) AS n FROM source_records').first('n'),
    ).toBe(4);
    await expect(
      runIngestion(
        db,
        {
          fetchRecords: async () => {
            throw new Error('source unavailable');
          },
        },
        santAndreu,
      ),
    ).rejects.toThrow('source unavailable');
    expect(
      await db.prepare('SELECT count(*) AS n FROM source_records').first('n'),
    ).toBe(4);
  } finally {
    await platform.dispose();
  }
});
