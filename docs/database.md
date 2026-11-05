# Database

Canonical storage is Cloudflare D1. `migrations/0001_initial.sql` defines institutions, sources, reusable courses, course editions, individual schedules, source records, and ingestion runs with foreign keys and indexes.

`0002_course_categories.sql` adds an index for category navigation. The original applied migration remains unchanged. Centre filtering uses the existing institution index.

Use `npm run db:migrate` to apply migrations to **local** D1. The configured all-zero database ID is a deliberate local-only placeholder, not an existing remote resource. Local import and Astro development both use `.wrangler/state/v3`.

Use a new numbered migration for every subsequent schema change. Applied migrations are immutable. Queries use bound parameters. D1 `batch()` supplies atomic rollback; do not issue unsupported interactive SQL transactions through the D1 binding.

`courses.reviewed_title` is a maintainer override: imports update source titles without changing it. Public queries prefer the reviewed value. Other correction types and a review interface are not implemented.

`npm test` checks the migration and repository SQL against real Node SQLite with a small D1-method contract harness. It verifies constraints, idempotency, rollback, provenance, overrides, query behavior, and failed ingestion recovery. It does not prove the D1 runtime. Run `npm run test:d1` on a supported host for the separate actual D1 test.

No remote database has been created or migrated. No destructive production command is part of setup or CI.
