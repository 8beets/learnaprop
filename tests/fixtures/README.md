# Fixture provenance

`miram-sant-andreu-languages.html` is an excerpt of the public language-category listing fetched on 2026-11-05:

https://santandreu.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=22&t=AC&f=ID

It preserves the actual course markup and four external IDs (1725, 1723, 1724, 1726). Contact/footer content and unrelated scripts were excluded. It is a historical source fixture, not a claim of current availability. Source prose appears only in this isolated test artifact and is not published by the application or imported as descriptions.

Tests mutate this saved fixture in memory to exercise missing IDs, malformed prices, and pagination. These mutations are synthetic test cases, not verified source variants.

`miram-can-baste-languages.html` contains two actual course cards (IDs 3825 and 3824) from the public Can Basté language listing, retrieved on 2026-11-06. The excerpt was serialized with Cheerio, preserving course values but normalizing HTML syntax:

https://canbaste.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=30&t=AC&f=07

Browser tests seed synthetic future dates and extra records in `.wrangler/e2e-state`, served only by the isolated test server on port 4322. They never seed `.wrangler/state`, which holds the app's real browsing data.

`miram-pati-llimona-cinema.html` contains actual course `5005` from Pati Llimona's public CINEMA listing, retrieved 2026-11-06:

https://patillimona.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=1&t=AC&f=2

`miram-pati-llimona-pagination.html` contains one actual photography course, its whitespace-padded heading, and the original unstyled anchors for pages 1–3, from the same host's `f=1` listing. Both excerpts were serialized with Cheerio; contact details, scripts, and unrelated content were removed. E2E dates are changed only in isolated test state.

`miram-golferichs-photography.html` and `miram-golferichs-cooking.html` are one-card excerpts from the public Golferichs listings, retrieved on 2026-11-06:

- https://golferichs.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=29&t=AC&f=XX — photography course `7350`.
- https://golferichs.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=29&t=AC&f=CU — cooking course `7284`.

They preserve the original category heading, category selector, and course markup, serialized with Cheerio. Scripts, contact details, and unrelated cards were removed; trailing whitespace was stripped. Browser fixtures change dates only in isolated E2E state.
