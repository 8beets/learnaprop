import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runIngestion } from '../../src/lib/ingestion/run';
import { parseMiramPage } from '../../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../../src/lib/sources/sant-andreu';
import { canBaste } from '../../src/lib/sources/can-baste';
import {
  listCourses,
  listCategories,
  listCentres,
} from '../../src/lib/db/courses';

const migrationDirectory = new URL('../../migrations/', import.meta.url);
const migration = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(new URL(name, migrationDirectory), 'utf8'))
  .join('\n');
const fixture = readFileSync(
  new URL('../fixtures/miram-sant-andreu-languages.html', import.meta.url),
  'utf8',
);
const records = parseMiramPage(
  fixture,
  `${santAndreu.listingUrl}&f=ID`,
).records;

// SQL contract harness: real SQLite transactions, NOT a claim of workerd/D1 compatibility.
function sqliteContract(sqlite: DatabaseSync): D1Database {
  class Statement {
    values: (string | number | null)[] = [];
    constructor(readonly sql: string) {}
    bind(...values: (string | number | null)[]) {
      const next = new Statement(this.sql);
      next.values = values;
      return next;
    }
    async run() {
      return sqlite.prepare(this.sql).run(...this.values);
    }
    async all() {
      return { results: sqlite.prepare(this.sql).all(...this.values) };
    }
  }
  const db = {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN');
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  // Only methods used by the repository are implemented; runtime D1 has a separate suite.
  return db as unknown as D1Database;
}

describe('SQLite migration and ingestion contract', () => {
  let sqlite: DatabaseSync;
  let db: D1Database;
  beforeEach(() => {
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec(migration);
    db = sqliteContract(sqlite);
  });
  afterEach(() => sqlite.close());
  it('lists real categories and centres, and composes both filters without identity collisions', async () => {
    await runIngestion(db, { fetchRecords: async () => records }, santAndreu);
    await runIngestion(
      db,
      { fetchRecords: async () => [{ ...records[0]!, category: 'DANSA' }] },
      canBaste,
    );
    expect(await listCategories(db, '2026-11-05')).toEqual(['BALL', 'IDIOMES']);
    expect(
      await listCategories(db, '2026-11-05', santAndreu.institution.id),
    ).toEqual(['IDIOMES']);
    expect(
      await listCategories(db, '2026-11-05', canBaste.institution.id),
    ).toEqual(['BALL']);
    expect(await listCategories(db, '2026-11-05', 'unknown-centre')).toEqual(
      [],
    );
    expect(await listCentres(db, '2026-11-05')).toEqual([
      { id: canBaste.institution.id, name: canBaste.institution.name },
      { id: santAndreu.institution.id, name: santAndreu.institution.name },
    ]);
    const filters = {
      q: '',
      page: 1,
      maxPriceCents: null,
      category: 'IDIOMES',
      centre: santAndreu.institution.id,
    };
    expect((await listCourses(db, filters, '2026-11-05')).courses).toHaveLength(
      4,
    );
    expect(
      (
        await listCourses(
          db,
          { ...filters, centre: canBaste.institution.id },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(
      (
        await listCourses(
          db,
          { ...filters, category: 'DANSA', centre: canBaste.institution.id },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(1);
    expect(
      (
        await listCourses(
          db,
          { ...filters, category: "' OR 1=1 --" },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(await listCategories(db, '2028-01-01')).toEqual([]);
    expect(await listCentres(db, '2028-01-01')).toEqual([]);
    expect(
      sqlite.prepare('SELECT count(*) AS n FROM course_editions').get()?.n,
    ).toBe(5);
  });
  it('groups photography aliases before pagination while preserving source labels', async () => {
    const aliases = [
      'FOTOGRAFIA',
      'ESPAI FOTOGRÀFIC',
      'ESPAI FOTOGRÀFIC PATI LLIMONA',
    ];
    const photos = Array.from({ length: 15 }, (_, index) => ({
      ...records[0]!,
      externalId: String(8000 + index),
      title: `TEST photo ${index}`,
      category: aliases[index % 3]!,
    }));
    await runIngestion(
      db,
      {
        fetchRecords: async () => [
          ...photos,
          {
            ...records[0]!,
            externalId: '9000',
            title: 'TEST other',
            category: 'CUINA',
          },
          {
            ...records[0]!,
            externalId: '9001',
            title: 'TEST expired',
            category: 'EXPIRED',
            endDate: '2020-01-01',
            startDate: '2019-01-01',
          },
        ],
      },
      santAndreu,
    );
    const filters = {
      q: 'TEST photo',
      page: 1,
      maxPriceCents: 6000,
      category: 'FOTOGRAFIA',
      centre: santAndreu.institution.id,
    };
    const firstPage = await listCourses(db, filters, '2026-11-05');
    expect(firstPage.courses).toHaveLength(12);
    expect(firstPage.hasNext).toBe(true);
    expect(
      firstPage.courses.every((course) => course.category === 'FOTOGRAFIA'),
    ).toBe(true);
    const secondPage = await listCourses(
      db,
      { ...filters, page: 2 },
      '2026-11-05',
    );
    expect(secondPage.courses).toHaveLength(3);
    expect(secondPage.hasNext).toBe(false);
    expect(
      await listCourses(
        db,
        { ...filters, category: aliases[2]!, page: 2 },
        '2026-11-05',
      ),
    ).toEqual(secondPage);
    expect(
      await listCategories(db, '2026-11-05', santAndreu.institution.id),
    ).toEqual(['CUINA', 'FOTOGRAFIA']);
    expect(
      sqlite
        .prepare(
          "SELECT DISTINCT category FROM courses WHERE category LIKE '%FOTOG%' ORDER BY category",
        )
        .all()
        .map((row) => row.category),
    ).toEqual([...aliases].sort());
  });
  it('imports twice without duplicates, preserves provenance and reviewed titles', async () => {
    const adapter = { fetchRecords: async () => records };
    await runIngestion(db, adapter, santAndreu);
    const before = sqlite
      .prepare(
        'SELECT first_seen_at, content_hash FROM source_records ORDER BY external_id',
      )
      .all();
    sqlite.exec(
      "UPDATE courses SET reviewed_title='Reviewed title' WHERE title='CONVERSA EN ANGLÈS'",
    );
    await runIngestion(db, adapter, santAndreu);
    expect(
      sqlite.prepare('SELECT count(*) AS n FROM course_editions').get()?.n,
    ).toBe(4);
    expect(sqlite.prepare('SELECT count(*) AS n FROM courses').get()?.n).toBe(
      4,
    );
    expect(
      sqlite
        .prepare(
          'SELECT first_seen_at, content_hash FROM source_records ORDER BY external_id',
        )
        .all(),
    ).toEqual(before);
    expect(
      sqlite
        .prepare(
          "SELECT count(*) AS n FROM courses WHERE reviewed_title='Reviewed title'",
        )
        .get()?.n,
    ).toBe(1);
    expect(
      sqlite
        .prepare(
          "SELECT count(*) AS n FROM ingestion_runs WHERE status='succeeded'",
        )
        .get()?.n,
    ).toBe(2);
    const updated = records.map((record, index) =>
      index === 0
        ? { ...record, title: 'CONVERSA EN ANGLÈS (actualitzat)' }
        : record,
    );
    await runIngestion(db, { fetchRecords: async () => updated }, santAndreu);
    expect(sqlite.prepare('SELECT count(*) AS n FROM courses').get()?.n).toBe(
      4,
    );
    expect(
      sqlite
        .prepare(
          "SELECT reviewed_title FROM courses WHERE title='CONVERSA EN ANGLÈS (actualitzat)'",
        )
        .get()?.reviewed_title,
    ).toBe('Reviewed title');
  });
  it('keeps all previously verified data on network failure and records the failed run', async () => {
    await runIngestion(db, { fetchRecords: async () => records }, santAndreu);
    const before = sqlite
      .prepare('SELECT * FROM source_records ORDER BY external_id')
      .all();
    await expect(
      runIngestion(
        db,
        {
          fetchRecords: async () => {
            throw new Error('Network failure');
          },
        },
        santAndreu,
      ),
    ).rejects.toThrow('Network failure');
    expect(
      sqlite.prepare('SELECT * FROM source_records ORDER BY external_id').all(),
    ).toEqual(before);
    expect(
      sqlite
        .prepare("SELECT error FROM ingestion_runs WHERE status='failed'")
        .get()?.error,
    ).toBe('Network failure');
    await runIngestion(db, { fetchRecords: async () => records }, santAndreu);
    expect(
      sqlite.prepare('SELECT count(*) AS n FROM course_editions').get()?.n,
    ).toBe(4);
  });
  it('rolls back the whole snapshot if a database write fails', async () => {
    sqlite.exec(
      "CREATE TRIGGER reject_record BEFORE INSERT ON source_records WHEN NEW.external_id='1723' BEGIN SELECT RAISE(ABORT, 'test write failure'); END;",
    );
    await expect(
      runIngestion(db, { fetchRecords: async () => records }, santAndreu),
    ).rejects.toThrow('test write failure');
    expect(
      sqlite.prepare('SELECT count(*) AS n FROM course_editions').get()?.n,
    ).toBe(0);
    expect(sqlite.prepare('SELECT count(*) AS n FROM courses').get()?.n).toBe(
      0,
    );
    expect(
      sqlite
        .prepare(
          "SELECT count(*) AS n FROM ingestion_runs WHERE status='failed'",
        )
        .get()?.n,
    ).toBe(1);
  });
  it('does not delete records absent from a later snapshot and rejects invalid input', async () => {
    await runIngestion(db, { fetchRecords: async () => records }, santAndreu);
    await runIngestion(
      db,
      { fetchRecords: async () => records.slice(0, 1) },
      santAndreu,
    );
    expect(
      sqlite.prepare('SELECT count(*) AS n FROM course_editions').get()?.n,
    ).toBe(4);
    await expect(
      runIngestion(db, { fetchRecords: async () => [] }, santAndreu),
    ).rejects.toThrow('bound');
    expect(() =>
      sqlite
        .prepare(
          'INSERT INTO courses (id, institution_id, title) VALUES (?, ?, ?)',
        )
        .run('x', 'missing', 'title'),
    ).toThrow('FOREIGN KEY');
  });
  it('composes search and price filters and treats SQL patterns literally', async () => {
    await runIngestion(db, { fetchRecords: async () => records }, santAndreu);
    expect(
      (
        await listCourses(
          db,
          {
            q: 'ANGLÈS',
            page: 1,
            maxPriceCents: 2000,
            category: '',
            centre: '',
          },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(1);
    expect(
      (
        await listCourses(
          db,
          { q: '%', page: 1, maxPriceCents: null, category: '', centre: '' },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(
      (
        await listCourses(
          db,
          {
            q: "' OR 1=1 --",
            page: 1,
            maxPriceCents: null,
            category: '',
            centre: '',
          },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(
      (
        await listCourses(
          db,
          { q: '', page: 1, maxPriceCents: null, category: '', centre: '' },
          '2028-01-01',
        )
      ).courses,
    ).toHaveLength(0);
  });
});
