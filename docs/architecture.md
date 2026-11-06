# Architecture

This is one Astro application, not a monorepo. Native Astro renders HTML; GET forms work without client JavaScript. Translation dictionaries contain interface text. Source titles stay in their original language. Original schedule text remains stored unchanged; the Spanish interface translates known Catalan weekday names and weekday-list conjunctions without changing times, translating arbitrary prose, or inferring sessions.

Requests flow from pages to discovery services to the centralized database repository. Components receive view data and do not query D1. External HTML is escaped by Astro; the importer does not publish source descriptions or execute scripts.

The ingestion adapter handles fetching and extraction, returning validated domain records without knowing about persistence. The runner registers the source and records an ingestion attempt, fetches the entire bounded snapshot, validates it, and commits courses, editions, provenance, and successful-run status in one D1 batch transaction. Failed attempts record an error while preserving existing course data.

D1 is the only canonical persistent store. Node SQLite validates SQL and transaction behavior in tests and was also used in memory to prepare the initial verified cloud-data seed. Runtime tests use actual local D1 separately.

Local Docker development uses a Linux Node 24 image with separate volumes for dependencies and the app's D1 state. The checks service has its own temporary state and includes Chromium, so runtime and browser checks run in the same Linux environment across supported Docker hosts. See [Docker setup](docker.md).

The initial UI provides title search, price filtering, and bounded pages of 12 editions. Search uses parameterized `LIKE`, escaping literal patterns and respecting D1's pattern byte limit. SQLite's default `LIKE` has limited Unicode case folding: accent-insensitive and comprehensive language-aware matching are deferred. Substring search can scan candidates and is suitable only for the initial small dataset. Reassess query plans and a supported indexed search strategy before expanding significantly.

No account is required for browsing. No analytics, trackers, cookies, sessions, Images binding, KV, R2, Queues, or Durable Objects are configured. Cron Triggers are deferred. The ingestion CLI runs outside a public Worker request; there is no public ingestion endpoint.

Centre and category navigation uses real database values, parameterized equality filters, and a category index. Navigation preserves other filters, resets pagination when a centre/category changes, and keeps selections when switching languages. Category interface labels are localized; source values remain unchanged in D1 and URLs. Source-specific categories remain distinct until a reviewed cross-source taxonomy is implemented. Category/centre choices include non-expired offerings independently of the current text and price filters, allowing users to change either dimension even when a combination has no results.

## Discovery categories

`src/lib/courses/categories.ts` is the authoritative, deterministic map from reviewed provider categories to public groups. Photography combines `FOTOGRAFIA`, `ESPAI FOTOGRÀFIC`, and `ESPAI FOTOGRÀFIC PATI LLIMONA`. Dance combines `BALL` and `DANSA`; arts combine `ART I CREATIVITAT` and `PLÀSTICA`; physical activity/wellbeing combines `ACTIVITAT FÍSICA I BENESTAR`, `SALUT I ESPORT`, and `COS`. Golferichs photography joins the photography group; its Cuina, Creativitat, Salut, and Recursos labels join the equivalent existing groups. Sciences/humanities and expression remain separate. Other categories remain separate until a deliberate mapping is added.

D1 keeps original category values and source payloads for provenance. Queries expand a selected group to its known source labels using bound `IN` parameters **before pagination**, and results expose the canonical group. Legacy alias URLs still select the whole group. Navigation deduplicates groups and, when a centre is selected, queries only that centre's non-expired courses. Category choices do not disappear merely because title/price filters have no matches. The existing 100-category query bound remains in place.

Spanish and Catalan dictionaries provide readable group labels. Unknown all-caps labels receive sentence casing without inventing a translation. Known brand/acronym spelling is retained explicitly. Source titles and descriptions are unaffected. Selecting a different centre retains other filters; an incompatible category can yield an empty result and can be removed using the all-categories link or clear-filters action.

Search, centre, category, and price controls share one GET form in `CourseFilters.astro`. The form occupies a sidebar beside results from 800px upward and a native `<details>` panel above results on smaller screens. A small client script sets the initial/resized disclosure state; without JavaScript the panel starts open and remains keyboard-collapsible. Applied filters remain visible outside the panel, each with a removal link, alongside a clear-all action. The footer links to the GitHub repository with a locally served Octicons mark and a localized text label.

`EXPRESSIÓ`, `Expressió`, and `Expressió i creativitat` share the canonical expression group. Its public label is “Expresión y creatividad” / “Expressió i creativitat”, and both canonical and legacy alias filters include every member before pagination. Source labels remain unchanged in D1.

## Responsive filtering (issue #3)

Centre/category selects retain combined filter values, including a visible current-selection fallback when a category is unavailable at the selected centre. Submitting the GET form omits `page`, resetting pagination. Removing one applied filter also resets the page and retains other parameters. Language links and result pagination retain the query string. Extra query parameters survive form submissions so issue #2 can place region/city controls in this same component without introducing a second form. Geographic filtering itself remains pending issue #2; unknown parameters do not currently filter the database.

Future location/date/time fields belong in the existing sidebar form and must be added to its `formFields` set, validated by the service, and reflected in the applied-filter summary. Do not add placeholder controls for unimplemented filters. Mobile validation errors leave the panel open, labels use native associations, and keyboard disclosure/focus works with and without JavaScript. Browser coverage exercises both layouts, combined filters, centre-specific options, legacy category URLs, incompatible selections, pagination, clear/remove actions, locale switching, and responsive disclosure.

Centre navigation uses `/es/centros` and `/es/centros/[slug]` in Spanish, and `/ca/centres`
and `/ca/centres/[slug]` in Catalan. A shared native Astro layout provides primary
navigation and switches locale while retaining the centre and pagination. Directory
queries include institutions without courses, with 24-item pagination. Detail pages
reuse bounded course queries scoped to the selected institution (12 per page), and
show verified contact information and an embedded OpenStreetMap map. Unknown slugs
return 404; invalid pagination returns 400; database outages return 503. Profile
metadata and provenance are separate from external course parsing.

All page navigation includes a locale prefix: Spanish discovery is `/es/` and
Catalan discovery is `/ca/`. Filters, pagination, centre links and language
switching retain that prefix. Legacy `/`, `/centros` and `/centros/[slug]` routes
return HTTP 308 redirects to their Spanish equivalents, preserving query strings.
Static assets and third-party source/map URLs retain their own paths.

Directory and individual centre maps use `InteractiveCentreMap.astro` and the shared
`src/lib/institutions/centre-map.ts` browser initializer. Stable Leaflet 1.9 is the
small map dependency; no UI framework is introduced. Its code and styles are bundled
locally and imported when a map approaches the viewport. Keyboard markers open
localized centre links using DOM text nodes, rather than source HTML. Zoom/pan
animations and scroll-wheel zoom are disabled; native lists remain usable without
JavaScript. Tile failures retain the markers, directory and external map links.

A separate bounded D1 query supplies map points across directory pages, including
centres with no courses. It selects only verified HTTPS-sourced coordinates and
caps the browser payload at 500 points plus a sentinel. If that cap is exceeded,
the map explicitly indicates it is partial; the 24-item paginated directory remains
complete. Add geographic selection before expanding the map beyond that bound.
Single-centre pages reuse the same component with one verified point and retain
municipal provenance. This change needs no schema migration or additional cloud
resource. Tile requests use the browser cache and Referer; there is no tile proxy,
bulk download or offline prefetch.

Course title casing is presentation-only. `src/lib/courses/title.ts` formats titles
only when all their cased letters are uppercase. It uses Spanish/Catalan-aware
sentence casing and an explicit spelling table for known acronyms and names such
as IA, API, HTML, Arduino, ESP32 and TouchDesigner. Correctly cased, mixed-case and
lowercase titles remain unchanged. Unknown proper names cannot be recovered from
uppercase text; extend the reviewed spelling table or use a manual title correction
when needed. Do not use this formatter for ingestion, identity or persistence.

The shared `CourseCard.astro` applies formatting consistently in discovery and
centre listings, exposing the original title as a native title attribute when its
casing changes. Database queries expose whether a title was manually reviewed;
reviewed titles bypass formatting. Original titles and source-record payloads stay
unchanged. Future course detail pages should reuse the formatter and preserve
manual review intent in the same way.

The shared page shell uses the viewport width with 20px side gutters, rather than a
fixed desktop maximum. Header, main content and footer align at every viewport size.
Course/directory grids add columns as space permits; text paragraphs and decorative
hero images retain readable bounds. The filter sidebar keeps its existing desktop
width and mobile disclosure behaviour.
