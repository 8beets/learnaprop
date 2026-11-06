import {
  listInstitutions,
  findInstitution,
  type Centre,
} from '../db/institutions';
import { listCourses, type CourseListing } from '../db/courses';
import { parsePage } from '../pagination';

export type CentrePageError = 'invalid' | 'unavailable' | 'notFound' | null;
export interface DirectoryPageData {
  centres: Centre[];
  page: number;
  hasNext: boolean;
  error: CentrePageError;
  status: number;
}
export interface CentrePageData {
  centre: Centre | null;
  courses: CourseListing[];
  page: number;
  hasNext: boolean;
  error: CentrePageError;
  status: number;
}

export async function loadDirectoryPage(
  db: D1Database,
  params: URLSearchParams,
): Promise<DirectoryPageData> {
  let page: number;
  try {
    page = parsePage(params);
  } catch {
    return {
      centres: [],
      page: 1,
      hasNext: false,
      error: 'invalid',
      status: 400,
    };
  }
  try {
    return {
      ...(await listInstitutions(db, page)),
      page,
      error: null,
      status: 200,
    };
  } catch {
    console.error(JSON.stringify({ event: 'centre_directory_unavailable' }));
    return {
      centres: [],
      page,
      hasNext: false,
      error: 'unavailable',
      status: 503,
    };
  }
}

export async function loadCentrePage(
  db: D1Database,
  slug: string,
  params: URLSearchParams,
): Promise<CentrePageData> {
  const empty = { centre: null, courses: [], page: 1, hasNext: false };
  if (!/^[a-z0-9-]{1,100}$/.test(slug))
    return { ...empty, error: 'notFound', status: 404 };
  let page: number;
  try {
    page = parsePage(params);
  } catch {
    return { ...empty, error: 'invalid', status: 400 };
  }
  try {
    const centre = await findInstitution(db, slug);
    if (!centre) return { ...empty, error: 'notFound', status: 404 };
    const listing = await listCourses(db, {
      q: '',
      category: '',
      maxPriceCents: null,
      centre: centre.id,
      page,
    });
    return { ...listing, centre, page, error: null, status: 200 };
  } catch {
    console.error(JSON.stringify({ event: 'centre_page_unavailable' }));
    return { ...empty, error: 'unavailable', status: 503 };
  }
}
