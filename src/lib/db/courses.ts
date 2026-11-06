import { canonicalCategory, sourceCategories } from '../courses/categories';

export interface DiscoveryFilters {
  q: string;
  page: number;
  maxPriceCents: number | null;
  category: string;
  centre: string;
}
export interface CourseListing {
  id: string;
  title: string;
  category: string | null;
  institution: string;
  institution_id: string;
  institution_slug: string;
  start_date: string | null;
  end_date: string | null;
  schedule_text: string | null;
  price_cents: number | null;
  currency: string | null;
  official_url: string;
  last_successfully_verified_at: string;
}
export const PAGE_SIZE = 12;

export async function listCourses(
  db: D1Database,
  filters: DiscoveryFilters,
  today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }),
): Promise<{ courses: CourseListing[]; hasNext: boolean }> {
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  if (filters.category) {
    const categories = sourceCategories(filters.category);
    conditions.push(`c.category IN (${categories.map(() => '?').join(', ')})`);
    values.push(...categories);
  }
  if (filters.centre) {
    conditions.push('c.institution_id = ?');
    values.push(filters.centre);
  }
  if (filters.q) {
    conditions.push("coalesce(c.reviewed_title, c.title) LIKE ? ESCAPE '\\'");
    values.push(`%${filters.q.replace(/[\\%_]/g, '\\$&')}%`);
  }
  if (filters.maxPriceCents !== null) {
    conditions.push('e.price_cents <= ?');
    values.push(filters.maxPriceCents);
  }
  // Expired editions remain stored for provenance, but leave the discovery listing.
  conditions.push('(e.end_date IS NULL OR e.end_date >= ?)');
  values.push(today);
  const result = await db
    .prepare(
      `SELECT e.id, coalesce(c.reviewed_title, c.title) AS title, c.category,
    i.name AS institution, i.id AS institution_id, coalesce(p.slug, i.id) AS institution_slug, e.start_date, e.end_date, e.schedule_text, e.price_cents, e.currency,
    sr.official_url, sr.last_successfully_verified_at FROM course_editions e
    JOIN courses c ON c.id=e.course_id JOIN institutions i ON i.id=c.institution_id
    LEFT JOIN institution_profiles p ON p.institution_id=i.id
    JOIN source_records sr ON sr.edition_id=e.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.start_date IS NULL, e.start_date, e.id LIMIT ? OFFSET ?`,
    )
    .bind(...values, PAGE_SIZE + 1, (filters.page - 1) * PAGE_SIZE)
    .all<CourseListing>();
  return {
    courses: result.results.slice(0, PAGE_SIZE).map((course) => ({
      ...course,
      category:
        course.category === null ? null : canonicalCategory(course.category),
    })),
    hasNext: result.results.length > PAGE_SIZE,
  };
}

export async function listCategories(
  db: D1Database,
  today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }),
  centre = '',
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT c.category FROM courses c
    WHERE c.category IS NOT NULL AND c.category <> '' ${centre ? 'AND c.institution_id = ?' : ''} AND EXISTS (
      SELECT 1 FROM course_editions e WHERE e.course_id=c.id
      AND (e.end_date IS NULL OR e.end_date >= ?)
    ) ORDER BY c.category LIMIT 100`,
    )
    .bind(...(centre ? [centre] : []), today)
    .all<{ category: string }>();
  return [
    ...new Set(result.results.map((row) => canonicalCategory(row.category))),
  ].sort();
}

export interface CentreListing {
  id: string;
  name: string;
}
export async function listCentres(
  db: D1Database,
  today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }),
): Promise<CentreListing[]> {
  const result = await db
    .prepare(
      `SELECT i.id, i.name FROM institutions i WHERE EXISTS (
    SELECT 1 FROM courses c JOIN course_editions e ON e.course_id=c.id WHERE c.institution_id=i.id
    AND (e.end_date IS NULL OR e.end_date >= ?)
  ) ORDER BY i.name LIMIT 100`,
    )
    .bind(today)
    .all<CentreListing>();
  return result.results;
}
