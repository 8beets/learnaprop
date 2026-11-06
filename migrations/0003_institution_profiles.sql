CREATE TABLE institution_profiles (
  institution_id TEXT PRIMARY KEY REFERENCES institutions(id),
  slug TEXT NOT NULL UNIQUE CHECK (slug <> '' AND slug NOT GLOB '*[^a-z0-9-]*'),
  description TEXT,
  description_language TEXT,
  phone TEXT,
  email TEXT,
  details_source_url TEXT,
  details_verified_at TEXT,
  notice TEXT CHECK (notice IS NULL OR notice = 'temporary_closure'),
  latitude REAL,
  longitude REAL,
  coordinates_source_url TEXT,
  coordinates_verified_at TEXT,
  CHECK (
    (latitude IS NULL AND longitude IS NULL AND coordinates_source_url IS NULL AND coordinates_verified_at IS NULL)
    OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND coordinates_source_url IS NOT NULL AND coordinates_verified_at IS NOT NULL
      AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

INSERT INTO institution_profiles (institution_id, slug)
SELECT id, CASE WHEN substr(id, 1, 3) = 'cc-' THEN substr(id, 4) ELSE id END FROM institutions;
CREATE INDEX institutions_directory_name ON institutions(name, id);
