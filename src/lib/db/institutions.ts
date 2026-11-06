export interface Centre {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  country: string;
  official_url: string;
  description: string | null;
  description_language: string | null;
  phone: string | null;
  email: string | null;
  details_source_url: string | null;
  details_verified_at: string | null;
  notice: 'temporary_closure' | null;
  latitude: number | null;
  longitude: number | null;
  coordinates_source_url: string | null;
  coordinates_verified_at: string | null;
}

const columns = `i.id, p.slug, i.name, i.address, i.city, i.country, i.official_url,
 p.description, p.description_language, p.phone, p.email, p.details_source_url, p.details_verified_at, p.notice,
 p.latitude, p.longitude, p.coordinates_source_url, p.coordinates_verified_at`;
export const CENTRES_PAGE_SIZE = 24;

export async function listInstitutions(db: D1Database, page: number) {
  const result = await db
    .prepare(
      `SELECT ${columns} FROM institutions i
    JOIN institution_profiles p ON p.institution_id=i.id
    ORDER BY i.name, i.id LIMIT ? OFFSET ?`,
    )
    .bind(CENTRES_PAGE_SIZE + 1, (page - 1) * CENTRES_PAGE_SIZE)
    .all<Centre>();
  return {
    centres: result.results.slice(0, CENTRES_PAGE_SIZE),
    hasNext: result.results.length > CENTRES_PAGE_SIZE,
  };
}

export async function findInstitution(
  db: D1Database,
  slug: string,
): Promise<Centre | null> {
  const result = await db
    .prepare(
      `SELECT ${columns} FROM institution_profiles p
    JOIN institutions i ON i.id=p.institution_id WHERE p.slug=? LIMIT 1`,
    )
    .bind(slug)
    .all<Centre>();
  return result.results[0] ?? null;
}
