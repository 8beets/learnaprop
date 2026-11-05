# Fixture provenance

`miram-sant-andreu-languages.html` is an excerpt of the public language-category listing fetched on 2026-11-05:

https://santandreu.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=22&t=AC&f=ID

It preserves the actual course markup and four external IDs (1725, 1723, 1724, 1726). Contact/footer content and unrelated scripts were excluded. It is a historical source fixture, not a claim of current availability. Source prose appears only in this isolated test artifact and is not published by the application or imported as descriptions.

Tests mutate this saved fixture in memory to exercise missing IDs, malformed prices, and pagination. These mutations are synthetic test cases, not verified source variants.

`miram-can-baste-languages.html` contains two actual course cards (IDs 3825 and 3824) from the public Can Basté language listing, retrieved on 2026-11-06. The excerpt was serialized with Cheerio, preserving course values but normalizing HTML syntax:

https://canbaste.inscripcionscc.com/MiramModular/buscador/buscador.jsp?g=1&c=30&t=AC&f=07

Browser tests seed synthetic future dates and extra records in `.wrangler/e2e-state`, served only by the isolated test server on port 4322. They never seed `.wrangler/state`, which holds the app's real browsing data.
