import {
  listCourses,
  listCategories,
  listCentres,
  type DiscoveryFilters,
} from '../db/courses';

export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const page = params.get('page') ?? '1';
  const q = (params.get('q') ?? '').trim();
  const category = (params.get('category') ?? '').trim();
  const centre = params.get('centre') ?? '';
  if (centre && !/^[a-z0-9-]{1,100}$/.test(centre))
    throw new Error('Invalid centre');
  if (
    category.length > 200 ||
    [...category].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    throw new Error('Invalid category');
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
    category,
    centre,
    page: Number(page),
    maxPriceCents: maxPrice ? Math.round(Number(maxPrice) * 100) : null,
  };
}

export async function discoverCourses(db: D1Database, params: URLSearchParams) {
  const filters = parseFilters(params);
  const [listing, categories, centres] = await Promise.all([
    listCourses(db, filters),
    listCategories(db),
    listCentres(db),
  ]);
  return { filters, ...listing, categories, centres };
}
