# Data source research

Research dates: 2026-11-05–06. Live results can change.

## Approved local research source: Miram / Centre Cívic Sant Andreu

- Official institution: https://ajuntament.barcelona.cat/ccivics/santandreu
- Public registration listing: https://santandreu.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=22&t=AC
- Platform: Miram Modular, shared with other civic centres.
- Institution configuration: `src/lib/sources/sant-andreu.ts`.
- Access: public HTML; no authentication, browser automation, or access-control bypass.
- `https://santandreu.inscripcionscc.com/robots.txt` returned HTTP 404. The adapter rechecks this before every import; any newly present policy blocks ingestion pending review.
- The official institution website links directly to this registration host. The listing footer confirms the institution address.
- Live verification fetched the category index and six course categories, producing 22 distinct activity IDs with titles, dates, base prices, and schedule text. A four-record language-category excerpt is saved in `tests/fixtures/miram-sant-andreu-languages.html`.
- Category links are discovered, not hardcoded. The initial pagination selector missed plain numbered anchors; the corrected adapter supports those alongside `.pagination` and `rel=next`. The complete 2026-11-06 refresh returned 37 editions.
- No public structured API/feed was established for this host during research. HTML is the verified fallback; no private endpoints were probed.

No blanket redistribution license was established for registration-site content. This milestone limits extraction to course facts and attribution, excluding descriptions, images, instructor biographies, and contact details. Review reuse terms with the maintainer before public publication or expanding collection. An absent robots file does not establish a reuse license.

Availability and course language remain unknown. Prices refer to the explicitly labelled base price; concessions and materials supplements are not represented. Listings must not be advertised as confirmed available, free when unpriced, or translated. Some observed weekday summaries and individual session dates disagree. We preserve the summary verbatim and do not generate recurring sessions or resolve those contradictions by inference.

## Centre Cívic Can Basté

Verified on 2026-11-06:

- Official centre: https://www.canbaste.com/
- Registration: https://canbaste.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=30&t=AC
- Address: Pg. de Fabra i Puig, 274, 08031 Barcelona, confirmed on the official site.
- `robots.txt` returned 404; the existing adapter's per-run check applies.
- The shared Miram adapter fetched and persisted **29 course editions** across nine course categories.
- The `ALTRES` category (code `14`) includes concerts and is explicitly excluded in institution configuration.
- A two-record excerpt of the real language listing is saved in `tests/fixtures/miram-can-baste-languages.html` and tested with the shared parser.
- The metadata-only, attribution, unknown-field, and pre-publication reuse-review limitations documented above also apply here. Descriptions and images are not published.

The initial 29-edition Can Basté import missed plain pagination links. The corrected 2026-11-06 cloud refresh returned 99 editions. Its photography category alone has six numbered pages; the adapter allows at most 60 pages per source, with the existing 1,000-record bound and sequential rate limiting.

## Centre Cívic Pati Llimona

Verified on 2026-11-06:

- Official centre: https://patillimona.net/
- Official seasonal programme linking to registration: https://patillimona.net/tallers-de-tardor-2026/
- Registration: https://patillimona.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=1&t=AC
- Address: C/ del Regomir, 3, 08002 Barcelona, confirmed by the official centre and listing footer.
- `robots.txt` returned 404; the existing per-run policy check applies.
- The shared adapter fetched and persisted **56 course editions** across nine categories, including photography and cinema workshops.
- Reviewed external IDs `5036` and `5038` explicitly indicate cancellation; `5088` is a film screening. They are excluded in source configuration.
- Minimal real fixtures cover cinema course `5005` and the photography category's plain numbered pagination links. Whitespace around category headings is normalized.
- The same metadata-only collection and source reuse limitations above apply. Stock photography in the interface is separately licensed and is not scraped from course providers.

Cloud D1 now holds 192 editions and 192 source records across three centres. Discovery omits expired editions; stored totals can exceed visible totals.

## Investigated and deferred

### Can Verdaguer

https://canverdaguer.com/

Investigated on 2026-11-06. The official site links to `canverdaguer.inscripcionscc.com`, but its Miram course listing (`g=1&c=24&t=AC`) was empty. It was not added as a course source; cultural events were not substituted for courses.

### Barcelona Open Data: civic-centre training

https://opendata-ajuntament.barcelona.cat/data/dataset/centres-civics-formacio

The dataset metadata describes annual aggregate statistics (activities, attendance, available area), not bookable course editions. It is unsuitable as a course feed. Its robots policy also disallows API paths and query-string crawling; no automated importer was implemented.

### Casa Elizalde / WordPress REST API

https://www.casaelizalde.com/

The public REST type index exposes a `cursos_i_tallers` type. However, `robots.txt` disallows all paths for general user agents. Collection stopped; no course adapter was implemented. Use a permitted institutional feed or obtain an explicit source agreement before pursuing it.

## Adding an institution

Verify its official website, registration-platform ownership, public-access rules, reuse conditions, and field semantics first. Reuse Miram extraction only after testing a small saved fixture against that institution's actual markup. A configuration-only addition is the target, not an unverified compatibility claim.
