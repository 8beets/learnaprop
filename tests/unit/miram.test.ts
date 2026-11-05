import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createMiramAdapter,
  parseMiramPage,
} from '../../src/lib/ingestion/adapters/miram';
import {
  parseDateRange,
  parseEuroPrice,
} from '../../src/lib/ingestion/normalization/values';
import { createSourceFetcher } from '../../src/lib/ingestion/http';
import { santAndreu } from '../../src/lib/sources/sant-andreu';
import { parseFilters } from '../../src/lib/courses/discovery';

const fixture = readFileSync(
  new URL('../fixtures/miram-sant-andreu-languages.html', import.meta.url),
  'utf8',
);
const url = `${santAndreu.listingUrl}&f=ID`;

describe('Miram source fixture', () => {
  it('reuses the adapter for actual Can Basté markup', () => {
    const html = readFileSync(
      new URL('../fixtures/miram-can-baste-languages.html', import.meta.url),
      'utf8',
    );
    const { records } = parseMiramPage(
      html,
      'https://canbaste.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=30&t=AC&f=07',
    );
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      externalId: '3825',
      title: 'ANGLÈS CONTINUACIÓ',
      category: 'IDIOMES',
      startDate: '2026-09-15',
      endDate: '2026-11-10',
    });
  });
  it('extracts real IDs, base prices, dates, and original titles', () => {
    const { records } = parseMiramPage(fixture, url);
    expect(records).toHaveLength(4);
    expect(records[0]).toMatchObject({
      title: 'CONVERSA EN ANGLÈS',
      externalId: '1725',
      priceCents: 5648,
      currency: 'EUR',
      startDate: '2027-01-14',
      endDate: '2027-03-04',
      availability: null,
      courseLanguage: null,
    });
    expect(records[3]).toMatchObject({ externalId: '1726', priceCents: 1883 });
    expect(records.every((record) => !('description' in record))).toBe(true);
  });
  it('rejects layout changes, empty listings, and missing identity', () => {
    expect(() => parseMiramPage('<html>Login</html>', url)).toThrow(
      'structure changed',
    );
    expect(() =>
      parseMiramPage('<select id="eFamilia"></select>', url),
    ).toThrow('Empty');
    expect(() =>
      parseMiramPage(fixture.replaceAll('accordion', 'changed'), url),
    ).toThrow('identifier');
  });
  it('does not turn an unknown price or date into zero or today', () => {
    const { records } = parseMiramPage(
      fixture
        .replaceAll('Preu:', 'Cost:')
        .replaceAll('de gener', 'mes desconegut'),
      url,
    );
    expect(records[0]?.priceCents).toBeNull();
    expect(records[0]?.startDate).toBeNull();
  });
});

describe('normalization', () => {
  it.each([
    ['Preu: 56,48 € (IVA inclòs)', 5648],
    ['Preu: 0,00 €', 0],
    ['Preu: 1.234,50 €', 123450],
    ['Preu Descompte 50%: 28,24 €', null],
    ['', null],
  ])('parses explicit euro base price %s', (value, expected) => {
    expect(parseEuroPrice(value)).toBe(expected);
  });
  it('validates calendar dates and leaves local dates independent of DST', () => {
    expect(
      parseDateRange('Del 28 de març de 2027 al 31 de març de 2027'),
    ).toEqual(['2027-03-28', '2027-03-31']);
    expect(
      parseDateRange('Del 29 de febrer de 2027 al 3 de març de 2027'),
    ).toEqual([null, null]);
    expect(
      parseDateRange('Del 4 de març de 2027 al 1 de març de 2027'),
    ).toEqual([null, null]);
  });
  it('bounds and validates search filters', () => {
    expect(
      parseFilters(new URLSearchParams('q=anglès&maxPrice=56.48&page=2')),
    ).toEqual({
      q: 'anglès',
      maxPriceCents: 5648,
      page: 2,
      category: '',
      centre: '',
    });
    for (const query of [
      'page=0',
      'category=%00',
      'centre=%27SQL',
      `category=${'x'.repeat(201)}`,
      'page=1001',
      'page=1.5',
      'maxPrice=-1',
      'maxPrice=NaN',
      `q=${'é'.repeat(21)}`,
    ])
      expect(() => parseFilters(new URLSearchParams(query))).toThrow();
  });
});

describe('bounded fetching', () => {
  it('retries a rate limit and respects Retry-After', async () => {
    const delays: number[] = [];
    let requests = 0;
    const get = createSourceFetcher('https://example.org', {
      intervalMs: 0,
      sleep: async (ms) => {
        delays.push(ms);
      },
      fetch: async () =>
        ++requests === 1
          ? new Response('', { status: 429, headers: { 'retry-after': '2' } })
          : new Response('ok'),
    });
    expect(await get('https://example.org/list')).toBe('ok');
    expect(delays).toContain(2000);
    await expect(get('https://other.example.org/')).rejects.toThrow(
      'approved origin',
    );
  });
  it('bounds retries and refuses oversized responses', async () => {
    let calls = 0;
    const options = { intervalMs: 0, sleep: async () => {} };
    const get = createSourceFetcher('https://example.org', {
      ...options,
      fetch: async () => {
        calls++;
        return new Response('', { status: 503 });
      },
    });
    await expect(get('https://example.org/list')).rejects.toThrow('503');
    expect(calls).toBe(3);
    const huge = createSourceFetcher('https://example.org', {
      ...options,
      fetch: async () => new Response('x'.repeat(2_000_001)),
    });
    await expect(huge('https://example.org/list')).rejects.toThrow('2 MB');
  });
  it('follows categories and pagination once, retaining stable identity', async () => {
    const requests: string[] = [];
    const rootHtml = `<select id="eFamilia"></select><a class="card" href="${url}">IDIOMES</a>`;
    const adapter = createMiramAdapter({
      intervalMs: 0,
      sleep: async () => {},
      fetch: async (input) => {
        const requested = String(input);
        requests.push(requested);
        if (requested.endsWith('/robots.txt'))
          return new Response('', { status: 404 });
        if (requested === santAndreu.listingUrl) return new Response(rootHtml);
        if (requested === url)
          return new Response(
            `${fixture}<a rel="next" href="${url}&p=2">2</a>`,
          );
        return new Response(fixture);
      },
    });
    expect(await adapter.fetchRecords(santAndreu)).toHaveLength(4);
    expect(requests).toHaveLength(4);
  });
  it('fails closed on robots policy changes and external pagination', async () => {
    const adapter = createMiramAdapter({
      intervalMs: 0,
      sleep: async () => {},
      fetch: async () => new Response('User-agent: *\nDisallow: /'),
    });
    await expect(adapter.fetchRecords(santAndreu)).rejects.toThrow(
      'robots.txt',
    );
    const external = createMiramAdapter({
      intervalMs: 0,
      sleep: async () => {},
      fetch: async (input) =>
        String(input).endsWith('/robots.txt')
          ? new Response('', { status: 404 })
          : new Response(
              `${fixture}<a rel="next" href="https://evil.example/">next</a>`,
            ),
    });
    await expect(external.fetchRecords(santAndreu)).rejects.toThrow(
      'approved source',
    );
  });
});
