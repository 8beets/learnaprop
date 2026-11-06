# ADR 0001: Start with verified Miram extraction and D1

Status: accepted for the initial local milestone, 2026-11-05.

The project needs trustworthy course data before a larger interface. The official Barcelona aggregate dataset does not contain individual offerings, and an investigated WordPress host blocks general automated access. Sant Andreu's public Miram listings expose identifiable course facts and are linked from the institution's official website.

Build one reusable Miram adapter and one explicit institution configuration. Keep parsing independent of persistence. Write complete bounded snapshots atomically to normalized D1 tables and preserve provenance. Use explicit unknowns for language and availability. Keep inconsistent schedules as original text until verified normalization is possible.

Use Astro server-rendered pages with native GET forms, Spanish/Catalan dictionaries, strict TypeScript, Tailwind, and Wrangler, following the requested stable stack. Avoid client UI frameworks, sessions, additional Cloudflare storage, scheduling, and paid services in this milestone.

Node SQLite SQL contract checks remain separate from actual D1 runtime tests, with a Linux CI workflow and dev-container configuration supplied. Each test suite must be executed before its results are reported. Public release and source reuse review remain separate work.
