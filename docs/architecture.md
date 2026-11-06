# Architecture

This is one Astro application, not a monorepo. Native Astro renders HTML; GET forms work without client JavaScript. Translation dictionaries contain interface text. Source titles stay in their original language. Original schedule text remains stored unchanged; the Spanish interface translates known Catalan weekday names and weekday-list conjunctions without changing times, translating arbitrary prose, or inferring sessions.

Requests flow from pages to discovery services to the centralized database repository. Components receive view data and do not query D1. External HTML is escaped by Astro; the importer does not publish source descriptions or execute scripts.

The ingestion adapter handles fetching and extraction, returning validated domain records without knowing about persistence. The runner registers the source and records an ingestion attempt, fetches the entire bounded snapshot, validates it, and commits courses, editions, provenance, and successful-run status in one D1 batch transaction. Failed attempts record an error while preserving existing course data.

D1 is the only canonical persistent store. Node SQLite validates SQL and transaction behavior in tests and was also used in memory to prepare the initial verified cloud-data seed. Runtime tests use actual local D1 separately.

Local Docker development uses a Linux Node 24 image with separate volumes for dependencies and the app's D1 state. The checks service has its own temporary state and includes Chromium, so runtime and browser checks do not depend on host macOS support. See [Docker setup](docker.md).

The initial UI provides title search, price filtering, and bounded pages of 12 editions. Search uses parameterized `LIKE`, escaping literal patterns and respecting D1's pattern byte limit. SQLite's default `LIKE` has limited Unicode case folding: accent-insensitive and comprehensive language-aware matching are deferred. Substring search can scan candidates and is suitable only for the initial small dataset. Reassess query plans and a supported indexed search strategy before expanding significantly.

No account is required for browsing. No analytics, trackers, cookies, sessions, Images binding, KV, R2, Queues, or Durable Objects are configured. Cron Triggers are deferred. The ingestion CLI runs outside a public Worker request; there is no public ingestion endpoint.

Centre and category navigation uses real database values, parameterized equality filters, and a category index. Navigation preserves other filters, resets pagination when a centre/category changes, and keeps selections when switching languages. Category interface labels are localized; source values remain unchanged in D1 and URLs. Source-specific categories remain distinct until a reviewed cross-source taxonomy is implemented. Category/centre choices include non-expired offerings independently of the current text and price filters, allowing users to change either dimension even when a combination has no results.

## Discovery categories

`src/lib/courses/categories.ts` is the authoritative, deterministic map from reviewed provider categories to public groups. Photography combines `FOTOGRAFIA`, `ESPAI FOTOGRÀFIC`, and `ESPAI FOTOGRÀFIC PATI LLIMONA`. Dance combines `BALL` and `DANSA`; arts combine `ART I CREATIVITAT` and `PLÀSTICA`; physical activity/wellbeing combines `ACTIVITAT FÍSICA I BENESTAR`, `SALUT I ESPORT`, and `COS`. Golferichs photography joins the photography group; its Cuina, Creativitat, Salut, and Recursos labels join the equivalent existing groups. Sciences/humanities and expression remain separate. Other categories remain separate until a deliberate mapping is added.

D1 keeps original category values and source payloads for provenance. Queries expand a selected group to its known source labels using bound `IN` parameters **before pagination**, and results expose the canonical group. Legacy alias URLs still select the whole group. Navigation deduplicates groups and, when a centre is selected, queries only that centre's non-expired courses. Category choices do not disappear merely because title/price filters have no matches. The existing 100-category query bound remains in place.

Spanish and Catalan dictionaries provide readable group labels. Unknown all-caps labels receive sentence casing without inventing a translation. Known brand/acronym spelling is retained explicitly. Source titles and descriptions are unaffected. Selecting a different centre retains other filters; an incompatible category can yield an empty result and can be removed using the all-categories link or clear-filters action.

Centres whose courses cannot yet be imported can be listed as direct official-programme links in `src/lib/institutions/linked-centres.ts`. This registry is separate from ingestion sources and course filters. The interface does not publish guessed editions or imply their programme has been imported. FAB Casa del Rellotge uses this path because its crawling policy disallows general crawlers.
