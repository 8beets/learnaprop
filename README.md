# LearnAprop

A free, open-source directory of affordable, in-person courses and workshops from local community organizations. Starting in Barcelona, with Spanish and Catalan interfaces.

LearnAprop helps people discover courses and visit the organizer's official listing. It does not handle bookings, payments, or learning management.

## Current milestone

- Astro + strict TypeScript, Tailwind CSS, Cloudflare Workers, and D1 configuration.
- Reusable Miram adapter with institution configuration separated from extraction.
- Versioned relational schema, atomic imports, stable identifiers, provenance, and failed-run tracking.
- Server-rendered Spanish (`/`) and Catalan (`/ca/`) discovery with title search, maximum price, and pagination.
- Deterministic unit/SQLite contract tests, a separate D1 runtime suite, Playwright tests, and CI.

The Sant Andreu source was live-verified on 2026-11-05: **22 course editions** parsed successfully. This verifies extraction, not production availability or enrollment status. No courses are bundled into the public application. The database starts empty until a live import runs.

## Local setup

Use Node 24 and npm. Cloudflare's current local runtime requires a supported operating system: macOS 13.5+ or a supported Linux environment. On older macOS, reopen the repository in the supplied [dev container](.devcontainer/devcontainer.json), using a container runtime available on your machine. The container configuration has not been executed here.

```sh
npm ci
npm run db:types
npm run db:migrate
npm run ingest:live
npm run dev
```

Open http://127.0.0.1:4321. On a supported host these commands use **local** D1 at `.wrangler/state/v3`, without Cloudflare credentials. `npm run ingest` only prints instructions; `npm run ingest:live` explicitly opts into fetching the approved public source and writing local D1. `npm run source:verify` fetches and validates without database writes.

On this project's initial machine (macOS 12), type checking, the production build, and Node-based tests can run, but D1 migrations, imports, and the browser test server are blocked by workerd's operating-system requirement.

## Checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:d1
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` uses saved source fixtures and real Node SQLite for SQL contract tests. It does **not** emulate or prove the Cloudflare runtime. `test:d1` exercises actual local D1 separately. Routine tests never contact source websites. CI is configured for Linux but has not been run remotely.

## Documentation

- [Source research](docs/data-sources.md)
- [Architecture](docs/architecture.md)
- [Adapter development](docs/ingestion.md)
- [Database and migrations](docs/database.md)
- [Deployment boundaries](docs/deployment.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)

## Not implemented yet

Course detail and institution pages, normalized individual sessions, scheduled ingestion, stale-record policies, administration, submissions, full-text/accent-insensitive search, and public SEO configuration. The site deliberately emits `noindex` until publication, source reuse conditions, a real canonical origin, and expired-edition behavior have been reviewed. No production resources have been created or modified.

An open-source license has not yet been selected by the maintainer; no license grant should be assumed.
