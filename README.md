# LearnAprop

A free, open-source directory of affordable, in-person courses and workshops from local community organizations. Starting in Barcelona, with Spanish and Catalan interfaces.

LearnAprop helps people discover courses and visit the organizer's official listing. It does not handle bookings, payments, or learning management.

**Public preview:** https://learnaprop.learnaprop.workers.dev/ — deployed on 2026-11-06 with 192 source-verified course editions from Sant Andreu, Can Basté, and Pati Llimona. This is a preview; availability remains unconfirmed and automated refresh is not configured.

## Current milestone

- Astro + strict TypeScript, Tailwind CSS, Cloudflare Workers, and D1 configuration.
- Reusable Miram adapter with institution configuration separated from extraction.
- Versioned relational schema, atomic imports, stable identifiers, provenance, and failed-run tracking.
- Server-rendered Spanish (`/`) and Catalan (`/ca/`) discovery with title search, maximum price, and pagination.
- Browse by civic centre and normalized course category; category pills reflect the selected centre, and equivalent provider categories share one filter. Combine both with search and price using shareable URLs.
- Deterministic unit/SQLite contract tests, a separate D1 runtime suite, Playwright tests, and CI.

The sources were live-verified and refreshed on 2026-11-06: **37 Sant Andreu**, **99 Can Basté**, and **56 Pati Llimona** course editions. All use the reusable Miram adapter. The pagination fix discovers numbered links that the initial importer missed. Explicitly reviewed concerts, film screenings, and cancelled activities are excluded. Stored totals include expired editions; availability remains unknown. Local D1 starts empty until a live import runs.

The interface includes locally served stock photographs, a generated logo, and localized weekday labels. Course titles and stored source text retain their original language. See [asset credits and logo prompt](docs/assets.md).

## Local setup

For this Mac, use the [Docker setup](docs/docker.md) to run the app and all checks inside Linux:

```sh
docker compose build
docker compose up -d app
docker compose run --rm checks
```

The commands below are for running directly on a supported host.

Use Node 24 and npm. Cloudflare's current local runtime requires a supported operating system: macOS 13.5+ or a supported Linux environment. Docker Compose is verified for this Mac. An alternative [editor dev-container configuration](.devcontainer/devcontainer.json) is supplied but has not been tested here.

```sh
npm ci
npm run db:types
npm run db:migrate
npm run ingest:live
npm run dev
```

Open http://127.0.0.1:4321. On a supported host these commands use **local** D1 at `.wrangler/state/v3`, without Cloudflare credentials. `npm run ingest` only prints instructions; `npm run ingest:live` explicitly opts into fetching the approved public source and writing local D1. `npm run source:verify` fetches and validates without database writes.

On this project's initial machine (macOS 12), native D1 migrations, imports, and the browser test server are blocked by workerd's operating-system requirement. Docker provides the Linux runtime for those commands.

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

`npm test` uses saved source fixtures and real Node SQLite for SQL contract tests. It does **not** emulate or prove the Cloudflare runtime. `test:d1` exercises actual local D1 separately. Routine tests never contact source websites. [Linux CI passed](https://github.com/akira28/learnaprop/actions/runs/42078396499) for the initial foundation, including D1 and desktop/mobile browser checks.

The expanded suite is covered by 53 unit/SQLite tests, 1 D1 runtime test, and 12 desktop/mobile browser tests. The Docker suite also checks formatting, lint, TypeScript, migrations, and the build. Browser tests cover image delivery, localized captions and weekdays, stable search width after filtering, and navigation across all three centres. See [Docker verification](docs/docker.md#verified-locally).

## Documentation

- [Asset credits and logo](docs/assets.md)
- [Source research](docs/data-sources.md)
- [Architecture](docs/architecture.md)
- [Adapter development](docs/ingestion.md)
- [Database and migrations](docs/database.md)
- [Deployment boundaries](docs/deployment.md)
- [Docker development and testing](docs/docker.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)

## Not implemented yet

Course detail and institution pages, normalized individual sessions, scheduled ingestion, stale-record policies, administration, submissions, full-text/accent-insensitive search, and public SEO configuration. The public preview deliberately retains `noindex` while canonical URLs, sitemaps, source reuse conditions, and complete expired-edition behavior remain under review. Cloudflare Workers and D1 are deployed with Free-plan-compatible configuration; no paid services or plan upgrades were enabled. See [deployment instructions](docs/deployment.md).

An open-source license has not yet been selected by the maintainer; no license grant should be assumed.
