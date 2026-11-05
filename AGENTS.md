# AGENTS.md — LearnAprop

## Project overview

LearnAprop is a free, open-source, nonprofit-oriented platform for discovering affordable, in-person courses and workshops offered by local community organizations.

The project starts in Barcelona, Spain, with an architecture designed to support additional cities and countries.

**Product name:** LearnAprop  
**Repository/package name:** `learnaprop`  
**Default locale:** Spanish (`es`)  
**Secondary locale:** Catalan (`ca`)

**Mission:** Make local learning opportunities easier to discover, regardless of category, institution, or technical ability.

LearnAprop is a discovery platform, not a learning management system, booking platform, or commercial marketplace.

## 1. Agent operating principles

When working in this repository:

1. Prefer working software over speculative architecture.
2. Prioritize correctness, maintainability, and simplicity.
3. Make small, focused, verifiable changes.
4. Follow existing conventions before introducing new patterns.
5. Avoid unnecessary abstractions, dependencies, and infrastructure.
6. Use current official documentation when implementing framework-specific functionality.
7. Never fabricate external data or claim an integration works without testing it.
8. Keep the project compatible with Cloudflare's Free plan.
9. Do not introduce paid services without explicit approval.
10. Do not deploy to production or modify production resources without explicit approval.

Work autonomously on ordinary implementation decisions.

Ask for clarification only when a decision materially affects product scope, security, costs, or external resources.

## 2. Development priorities

The project follows an **ingestion-first development strategy**.

Priority order:

1. Research real course data sources.
2. Implement and validate reusable source adapters.
3. Persist normalized data in D1.
4. Implement public course discovery.
5. Add scheduled ingestion and monitoring.
6. Implement administration and community contributions.
7. Improve SEO, accessibility, performance, and documentation.

Do not prioritize visual polish over reliable data ingestion.

Do not build functionality around fictional courses when real data can be obtained.

Mock data is allowed in isolated tests and development fixtures, but must never be presented as verified real data.

## 3. Technology stack

Preferred technologies:

- Astro
- TypeScript with strict mode
- Cloudflare Workers
- Cloudflare D1 / SQLite
- Tailwind CSS
- Wrangler
- Vitest
- Playwright
- GitHub Actions

Use the latest stable compatible versions, not necessarily the newest prerelease versions.

Prefer native Astro components.

Use client-side JavaScript only when necessary.

Do not introduce React, Vue, Svelte, or another UI framework without a concrete technical justification.

Evaluate additional dependencies based on maintenance burden, bundle size, runtime compatibility, and actual requirements.

Do not introduce external databases, hosted search engines, or commercial AI services.

## 4. Architecture boundaries

Keep the system organized around clear responsibilities.

Suggested structure:

```text
src/
  components/
  layouts/
  pages/
  i18n/
  lib/
    db/
    courses/
    search/
    ingestion/
      adapters/
      normalization/
      validation/
    sources/
    institutions/
  styles/

migrations/
scripts/
tests/
  fixtures/
  unit/
  integration/
  e2e/
docs/
  adr/
```

Adapt this structure to actual project needs.

Avoid creating unnecessary packages or a monorepo.

### Dependency direction

- UI components must not directly implement database queries.
- Route handlers should delegate business logic to services.
- Ingestion adapters must not depend on UI code.
- Domain logic should remain independent of Cloudflare-specific APIs where practical.
- Database access should be centralized.
- External source parsing should remain isolated from persistence.
- Shared types and schemas should have a single authoritative definition.

Avoid circular dependencies.

## 5. Data ingestion rules

Data ingestion is the most important technical subsystem.

### Source selection

Prefer sources in this order:

1. Official public APIs.
2. Official structured datasets.
3. Public JSON/XML/CSV feeds.
4. JSON-LD and other structured HTML data.
5. Public HTML pages.

Avoid browser automation unless necessary.

Do not bypass authentication, CAPTCHAs, access controls, or rate limits.

Respect source terms, robots.txt, and reasonable request frequencies.

### Reusable adapters

Build adapters for shared registration platforms, not individual institutions.

Institution-specific configuration should be separate from platform-specific extraction logic.

A new institution using an already supported platform should ideally require only configuration.

Adapters must support:

- Fetching records.
- Pagination.
- Parsing.
- Validation.
- Normalization.
- Error reporting.

Use explicit, typed interfaces.

Do not introduce a plugin framework or dynamic loading system unless clearly necessary.

### Deterministic extraction

Production ingestion must not depend on LLMs.

Use:

- APIs.
- Structured parsing.
- Schema validation.
- Explicit mapping tables.
- Deterministic classification rules.

Never infer unknown dates, prices, locations, or availability.

Store unknown values as `null` or another explicit unknown representation.

### Idempotency

Running an importer multiple times with unchanged source data must not create duplicate records.

Use stable external identifiers when available.

Otherwise, use documented deterministic identity rules