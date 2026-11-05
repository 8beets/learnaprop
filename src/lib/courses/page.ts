import { discoverCourses, parseFilters } from './discovery';
import type { CourseListing, DiscoveryFilters } from '../db/courses';

export interface DiscoveryPageData {
  courses: CourseListing[];
  filters: DiscoveryFilters;
  hasNext: boolean;
  error: 'invalid' | 'unavailable' | null;
  status: number;
}

export async function loadDiscoveryPage(
  db: D1Database,
  params: URLSearchParams,
): Promise<DiscoveryPageData> {
  let filters: DiscoveryFilters;
  try {
    filters = parseFilters(params);
  } catch {
    return {
      courses: [],
      filters: { q: '', page: 1, maxPriceCents: null },
      hasNext: false,
      error: 'invalid',
      status: 400,
    };
  }
  try {
    return { ...(await discoverCourses(db, params)), error: null, status: 200 };
  } catch {
    console.error(JSON.stringify({ event: 'discovery_unavailable' }));
    return {
      courses: [],
      filters,
      hasNext: false,
      error: 'unavailable',
      status: 503,
    };
  }
}
