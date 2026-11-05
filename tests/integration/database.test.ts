import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runIngestion } from '../../src/lib/ingestion/run';
import { parseMiramPage } from '../../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../../src/lib/sources/sant-andreu';
import { listCourses } from '../../src/lib/db/courses';

const migration = readFileSync(
  new URL('../../migrations/0001_initial.sql', import.meta.url),
  'utf8',
);
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
          { q: 'ANGLÈS', page: 1, maxPriceCents: 2000 },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(1);
    expect(
      (
        await listCourses(
          db,
          { q: '%', page: 1, maxPriceCents: null },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(
      (
        await listCourses(
          db,
          { q: "' OR 1=1 --", page: 1, maxPriceCents: null },
          '2026-11-05',
        )
      ).courses,
    ).toHaveLength(0);
    expect(
      (
        await listCourses(
          db,
          { q: '', page: 1, maxPriceCents: null },
          '2028-01-01',
        )
      ).courses,
    ).toHaveLength(0);
  });
});
