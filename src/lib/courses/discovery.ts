import { listCourses, type DiscoveryFilters } from '../db/courses';

export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const page = params.get('page') ?? '1';
  const q = (params.get('q') ?? '').trim();
  if (!/^\d{1,4}$/.test(page) || Number(page) < 1 || Number(page) > 1000)
    throw new Error('Invalid page');
  // D1 LIKE patterns have a 50-byte limit, including wildcard delimiters.
  if (new TextEncoder().encode(q).length > 40)
    throw new Error('Search too long');
  const maxPrice = params.get('maxPrice') ?? '';
  if (maxPrice && !/^\d{1,4}(\.\d{1,2})?$/.test(maxPrice))
    throw new Error('Invalid price');
  return {
    q,
    page: Number(page),
    maxPriceCents: maxPrice ? Math.round(Number(maxPrice) * 100) : null,
  };
}

export async function discoverCourses(db: D1Database, params: URLSearchParams) {
  const filters = parseFilters(params);
  return { filters, ...(await listCourses(db, filters)) };
}
