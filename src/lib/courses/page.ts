import { listLatestCourses } from '../db/courses';
import { discoverCourses, parseFilters } from './discovery';
import type {
  CourseListing,
  DiscoveryFilters,
  CentreListing,
} from '../db/courses';

export interface DiscoveryPageData {
  courses: CourseListing[];
  categories: string[];
  centres: CentreListing[];
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
      categories: [],
      centres: [],
      filters: {
        q: '',
        page: 1,
        maxPriceCents: null,
        category: '',
        centre: '',
      },
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
      categories: [],
      centres: [],
      filters,
      hasNext: false,
      error: 'unavailable',
      status: 503,
    };
  }
}

export interface HomepagePageData {
  courses: CourseListing[];
  error: 'unavailable' | null;
  status: number;
}

export async function loadHomepage(db: D1Database): Promise<HomepagePageData> {
  try {
    return { courses: await listLatestCourses(db), error: null, status: 200 };
  } catch {
    console.error(JSON.stringify({ event: 'latest_courses_unavailable' }));
    return { courses: [], error: 'unavailable', status: 503 };
  }
}
