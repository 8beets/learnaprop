# Architecture

This is one Astro application, not a monorepo. Native Astro renders HTML; GET forms work without client JavaScript. Translation dictionaries contain interface text. Source titles and schedule text stay in their original language.

Requests flow from pages to discovery services to the centralized database repository. Components receive view data and do not query D1. External HTML is escaped by Astro; the importer does not publish source descriptions or execute scripts.

The ingestion adapter handles fetching and extraction, returning validated domain records without knowing about persistence. The runner registers the source and records an ingestion attempt, fetches the entire bounded snapshot, validates it, and commits courses, editions, provenance, and successful-run status in one D1 batch transaction. Failed attempts record an error while preserving existing course data.

D1 is the only canonical persistent store. Node SQLite is used exclusively in tests to validate SQL and transaction behavior. Runtime tests use actual local D1 separately.

Local Docker development uses a Linux Node 24 image with separate volumes for dependencies and the app's D1 state. The checks service has its own temporary state and includes Chromium, so runtime and browser checks do not depend on host macOS support. See [Docker setup](docker.md).

The initial UI provides title search, price filtering, and bounded pages of 12 editions. Search uses parameterized `LIKE`, escaping literal patterns and respecting D1's pattern byte limit. SQLite's default `LIKE` has limited Unicode case folding: accent-insensitive and comprehensive language-aware matching are deferred. Substring search can scan candidates and is suitable only for the initial small dataset. Reassess query plans and a supported indexed search strategy before expanding significantly.

No account is required for browsing. No analytics, trackers, cookies, sessions, Images binding, KV, R2, Queues, or Durable Objects are configured. Cron Triggers are deferred. The ingestion CLI runs outside a public Worker request; there is no public ingestion endpoint.
