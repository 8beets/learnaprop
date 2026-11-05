import { load } from 'cheerio';
import {
  cleanText,
  parseDateRange,
  parseEuroPrice,
} from '../normalization/values';
import { courseRecordSchema } from '../validation/record';
import { createSourceFetcher, type FetchOptions } from '../http';
import type { CourseRecord, SourceAdapter, SourceConfig } from '../types';

export function parseMiramPage(
  html: string,
  pageUrl: string,
): { records: CourseRecord[]; links: string[] } {
  const $ = load(html);
  if (!$('#eFamilia').length)
    throw new Error('Miram listing structure changed or access page returned');
  const category =
    cleanText($('h4').first().text()).match(/\((.+)\)$/u)?.[1] ?? null;
  const records: CourseRecord[] = [];
  $('.card.overh').each((_, element) => {
    const card = $(element);
    const externalId = card
      .find('[id^="accordion"]')
      .attr('id')
      ?.replace('accordion', '');
    if (!externalId)
      throw new Error('Course card has no stable activity identifier');
    const paragraphs = card
      .find('.card-body')
      .first()
      .children('p.card-text')
      .map((_, p) => cleanText($(p).text()))
      .get();
    const range = paragraphs.find((p) => /^Del \d/u.test(p));
    const [startDate, endDate] = parseDateRange(range ?? '');
    const priceCents = parseEuroPrice(
      paragraphs.find((p) => /^Preu:/u.test(p)) ?? '',
    );
    records.push(
      courseRecordSchema.parse({
        externalId,
        title: cleanText(card.find('h5.card-header').first().text()),
        officialUrl: `${pageUrl}#accordion${externalId}`,
        category,
        startDate,
        endDate,
        scheduleText: paragraphs[0] || null,
        priceCents,
        currency: priceCents === null ? null : 'EUR',
        availability: null,
        courseLanguage: null,
      }),
    );
  });
  const links = $('a.card[href], .pagination a[href], a[rel="next"][href]')
    .map((_, a) => new URL($(a).attr('href')!, pageUrl).href)
    .get();
  if (!records.length && !links.length)
    throw new Error('Empty Miram listing; manual review required');
  return { records, links };
}

function approvedPage(url: string, root: URL): boolean {
  const candidate = new URL(url);
  return (
    candidate.origin === root.origin &&
    candidate.pathname === root.pathname &&
    ['g', 'c', 't'].every(
      (key) => candidate.searchParams.get(key) === root.searchParams.get(key),
    ) &&
    [...candidate.searchParams.keys()].every((key) =>
      ['g', 'c', 't', 'f', 'p'].includes(key),
    )
  );
}

export function createMiramAdapter(options: FetchOptions = {}): SourceAdapter {
  return {
    async fetchRecords(source: SourceConfig) {
      const root = new URL(source.listingUrl);
      const get = createSourceFetcher(root.origin, options);
      // The first approved host had no robots.txt. Any new policy requires a review.
      if ((await get(`${root.origin}/robots.txt`, true)) !== null)
        throw new Error(
          'robots.txt policy present or changed; review source configuration before ingestion',
        );
      const queue = [root.href];
      const visited = new Set<string>();
      const records = new Map<string, CourseRecord>();
      while (queue.length) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        if (!approvedPage(url, root)) throw new Error('Unapproved source page');
        if (visited.size >= 30)
          throw new Error('Miram pagination exceeded 30-page limit');
        visited.add(url);
        const page = parseMiramPage((await get(url))!, url);
        for (const record of page.records) {
          const existing = records.get(record.externalId);
          if (
            existing &&
            (existing.title !== record.title ||
              existing.startDate !== record.startDate ||
              existing.priceCents !== record.priceCents)
          )
            throw new Error(
              `Conflicting duplicate activity ${record.externalId}`,
            );
          records.set(record.externalId, existing ?? record);
        }
        for (const link of page.links) {
          if (
            source.excludedCategoryCodes?.includes(
              new URL(link).searchParams.get('f') ?? '',
            )
          )
            continue;
          if (!approvedPage(link, root))
            throw new Error('Listing links outside approved source scope');
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
        if (records.size > 1000) throw new Error('Miram record limit exceeded');
      }
      if (!records.size) throw new Error('No course records fetched');
      return [...records.values()];
    },
  };
}
