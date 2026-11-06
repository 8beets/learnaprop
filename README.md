# LearnAprop

A free, open-source directory of affordable, in-person courses and workshops from local community organizations. Starting in Barcelona, with Spanish and Catalan interfaces.

LearnAprop helps people discover courses and visit the organizer's official listing. It does not handle bookings, payments, or learning management.

**Public preview:** https://learnaprop.learnaprop.workers.dev/ — 777 source-verified course editions across 11 Barcelona centres. This is a preview; availability remains unconfirmed and automated refresh is not configured.

## Current milestone

- Astro + strict TypeScript, Tailwind CSS, Cloudflare Workers, and D1 configuration.
- Reusable Miram adapter with institution configuration separated from extraction.
- Versioned relational schema, atomic imports, stable identifiers, provenance, and failed-run tracking.
- Server-rendered Spanish (`/`) and Catalan (`/ca/`) discovery with title search, maximum price, and pagination.
- Browse by civic centre and normalized course category; category pills reflect the selected centre, and equivalent provider categories share one filter. Combine both with search and price using shareable URLs.
- Deterministic unit/SQLite contract tests, a separate D1 runtime suite, Playwright tests, and CI.

Sources verified on 2026-11-06:

| Centre                | Stored editions |
| --------------------- | --------------: |
| Sant Andreu           |              37 |
| Can Basté             |              99 |
| Pati Llimona          |              56 |
| Casa Golferichs       |             113 |
| La Casa Elizalde      |             195 |
| Albareda              |              27 |
| El Sortidor           |              50 |
| Vil·la Urània         |             133 |
| Urgell                |              42 |
| FAB Casa del Rellotge |              14 |
| FAB Casa del Mig      |              11 |

All use the reusable Miram adapter, with deterministic category grouping and separate institution/source configuration. Online-only workshops, reviewed shows/meetups, and unidentified advance previews are excluded. Stored totals include expired editions; availability remains unknown. Local D1 starts empty until a real import runs.

The interface includes locally served stock photographs, a generated logo, readable weekday labels, amber centre pills, green category pills, and an accessible GitHub footer link. Course titles and stored source text retain their original language. See [asset credits](docs/assets.md).

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

`npm test` uses saved source fixtures and real Node SQLite for SQL contract tests. It does **not** emulate or prove the Cloudflare runtime. `test:d1` exercises actual local D1 separately. Routine tests never contact source websites. [Linux CI passed](https://github.com/8beets/learnaprop/actions/runs/42078396499) for the initial foundation, including D1 and desktop/mobile browser checks.

The expanded suite is covered by 74 unit/SQLite tests, 1 D1 runtime test, and 18 desktop/mobile browser tests. The Docker suite also checks formatting, lint, TypeScript, migrations, and the build. Browser tests cover image delivery, localized captions and weekdays, stable search width after filtering, and navigation across all 11 imported centres. See [Docker verification](docs/docker.md#verified-locally).

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

Licensed under the [MIT License](LICENSE). Third-party photographs and icons retain their respective licenses; see [asset credits](docs/assets.md).
