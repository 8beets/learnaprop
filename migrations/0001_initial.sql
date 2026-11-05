PRAGMA foreign_keys = ON;

CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  official_url TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  address TEXT NOT NULL,
  timezone TEXT NOT NULL
);
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  name TEXT NOT NULL,
  listing_url TEXT NOT NULL UNIQUE
);
CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  record_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  title TEXT NOT NULL,
  reviewed_title TEXT,
  category TEXT,
  course_language TEXT
);
CREATE TABLE course_editions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  start_date TEXT,
  end_date TEXT,
  schedule_text TEXT,
  timezone TEXT NOT NULL,
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  currency TEXT CHECK (currency IS NULL OR currency = 'EUR'),
  availability TEXT,
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  edition_id TEXT NOT NULL REFERENCES course_editions(id),
  local_date TEXT NOT NULL,
  local_start_time TEXT,
  local_end_time TEXT,
  timezone TEXT NOT NULL
);
CREATE TABLE source_records (
  source_id TEXT NOT NULL REFERENCES sources(id),
  external_id TEXT NOT NULL,
  edition_id TEXT NOT NULL REFERENCES course_editions(id),
  official_url TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_successfully_verified_at TEXT NOT NULL,
  PRIMARY KEY (source_id, external_id)
);
CREATE INDEX courses_institution ON courses(institution_id);
CREATE INDEX editions_course ON course_editions(course_id);
CREATE INDEX editions_start ON course_editions(start_date, id);
CREATE INDEX source_records_edition ON source_records(edition_id);
CREATE INDEX schedules_edition ON schedules(edition_id, local_date);
CREATE INDEX runs_source_started ON ingestion_runs(source_id, started_at);
