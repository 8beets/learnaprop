import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  renderStatement,
  parseCommandResults,
} from '../../src/lib/db/wrangler-ingestion';

describe('Wrangler SQL transport', () => {
  it('accepts validated JSON after file-import progress, preserving JSON inside data', () => {
    const results = [
      { success: true, results: [{ title: 'a [title] and ?' }] },
    ];
    expect(parseCommandResults(JSON.stringify(results, null, 2))).toEqual(
      results,
    );
    expect(
      parseCommandResults(
        '├ Checking upload\n[progress]\n' + JSON.stringify(results, null, 2),
      ),
    ).toEqual(results);
  });
  it('rejects failed, missing, and malformed command results', () => {
    for (const output of [
      '',
      '[]',
      '[{"success":false,"results":[]}]',
      '├ Done\n[broken]',
    ]) {
      expect(() => parseCommandResults(output)).toThrow('successful D1');
    }
  });
  it('preserves apostrophes, question marks, Unicode, and injection-like text as literal data', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE records (title TEXT, price INTEGER, unknown TEXT)');
      const title = "L'art?'); DROP TABLE records; -- fotografía";
      db.exec(
        renderStatement('INSERT INTO records VALUES (?, ?, ?)', [
          title,
          1234,
          null,
        ]),
      );
      expect(db.prepare('SELECT * FROM records').get()).toMatchObject({
        title,
        price: 1234,
        unknown: null,
      });
    } finally {
      db.close();
    }
  });
  it('rejects mismatched placeholders and non-finite numeric values', () => {
    expect(() => renderStatement('SELECT ?', [])).toThrow('count');
    expect(() => renderStatement('SELECT ?', [NaN])).toThrow('numeric');
    expect(() => renderStatement('SELECT ?', [Infinity])).toThrow('numeric');
  });
});
