# Local development and testing with Docker

Docker runs the current Cloudflare runtime on Linux, even when the Mac host cannot run workerd. The image uses Node 24 on Debian Bookworm and installs Chromium and its system libraries using the project's locked Playwright version. It is a development/test image, not a production deployment.

## Start

On this machine, Docker Desktop is installed but its CLI directory is not on `PATH`. For the current terminal:

```sh
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

Make sure Docker Desktop is running, then from the repository:

```sh
docker compose build
docker compose up -d app
```

Open http://127.0.0.1:4321. The app applies local migrations before starting and shows an honest empty state until data is imported. Source edits are bind-mounted for Astro's development reload.

Fetch the approved public source into the container's local D1:

```sh
docker compose exec app npm run ingest:live
```

Stop the app while retaining its database:

```sh
docker compose down
```

## Run checks

```sh
docker compose run --rm checks
```

This runs formatting, linting, binding generation, TypeScript checks, deterministic tests, actual local D1 tests, migrations, a production build, and desktop/mobile Playwright tests. Its temporary database is separate from the app's database, so the suite can run without importing test fixtures into browsing data. It does not fetch live course websites.

Browser tests additionally use `.wrangler/e2e-state` and port 4322, with synthetic fixture records for centre/category navigation and pagination. This test state is distinct from `.wrangler/state`, even when running tests natively alongside the browsing app.

You can also run a focused command:

```sh
docker compose run --rm checks npm run test:d1
```

The first build downloads a Linux image, dependencies, Chromium, and browser system libraries. Subsequent builds reuse layers. Docker stores `node_modules` in a named volume, separate from macOS modules, and the app's local D1 data in another named volume. Generated build/browser artifacts stay in temporary container volumes. No Docker socket or host Cloudflare configuration is mounted; the project configuration uses local D1 only.

After changing the lockfile, rebuild and refresh the Linux dependency volume before starting checks:

```sh
docker compose build
docker compose run --rm checks npm ci
```

Avoid `docker compose down --volumes` unless you deliberately want to delete the app's local course database and dependency cache.

## Verified locally

On 2026-11-05, using the existing Docker Desktop Linux daemon on this Mac:

- `docker compose build` succeeded.
- `docker compose run --rm checks` passed formatting, lint, binding generation, TypeScript, 19 unit/SQLite tests, 1 actual local D1 test, migrations, the production build, and 6 desktop/mobile browser tests.
- `docker compose up -d app` started the application and applied its local migration.
- `docker compose exec -T app npm run ingest:live` fetched and persisted 22 real Sant Andreu editions with 22 provenance records.
- The host's published port returned HTTP 200, and the Spanish homepage rendered 12 real course cards with a link to the next page.

The app's local state remains in the Docker volume. Nothing was deployed to Cloudflare.

On 2026-11-06, the expanded navigation suite passed 21 unit/SQLite tests, 1 D1 runtime test, and 10 browser tests. Can Basté imported 29 course editions; the combined centre/category URL returned HTTP 200 and three Can Basté language listings.

References: [Playwright Docker setup](https://playwright.dev/docs/docker), [Docker bind mounts](https://docs.docker.com/engine/storage/bind-mounts/).
