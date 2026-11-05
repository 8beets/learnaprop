# Ingestion

Run `npm run source:verify` for a live extraction smoke check without persistence, or `npm run ingest:live` after local migrations to write local D1. Neither runs in ordinary CI. Do not repeatedly poll the provider: one manually triggered run is sufficient for this milestone.

These commands now process both approved sources sequentially. To select a single source, use `npm run source:verify -- miram-can-baste` or `npm run ingest:live -- --source miram-can-baste` (also available: `miram-sant-andreu`). The CLI continues to the next source if one fails and exits unsuccessfully after recording all failures. Can Basté excludes category code `14` because it includes concerts; excluded codes are institution configuration, not hardcoded adapter behavior.

The typed adapter contract lives in `src/lib/ingestion/types.ts`. Miram-specific HTML extraction is isolated from source configuration and SQL. Zod validates every record at the boundary. A new provider should implement the same explicit interface, not a dynamically loaded plugin framework.

## Bounds and failures

- Sequential requests, at least one second apart.
- Fifteen-second request timeout, three attempts for connection errors, HTTP 429, and HTTP 5xx.
- Exponential backoff and bounded `Retry-After`; delays beyond 60 seconds abort for a later run.
- Maximum 2 MB per page, 30 pages, and 1,000 records per snapshot.
- HTTPS only, no redirects, approved origin/path/group/centre/activity type only.
- A newly present robots policy, malformed page, missing stable ID, conflicting duplicate, empty listing, or exceeded limit fails the run.

All pages must succeed before persistence. A single D1 transaction writes the snapshot and successful status. Source failures and database write failures leave previous courses and verification timestamps intact. Interrupted attempts may remain `running`; automatic run recovery and overlapping-run coordination are deferred. Run only one local importer at a time.

Missing records are retained. There is no deletion or automatic staleness inference. A future stale policy needs explicit, successful complete-snapshot semantics and tests. Unseen retained records keep their earlier verification timestamp.

## Identity and provenance

- Edition ID: SHA-256 of source ID + newline + external activity ID.
- Initial course ID: SHA-256 of institution ID + newline + NFC, whitespace-normalized, Catalan-lowercased exact title.
- Existing external records keep their course relationship when the source title changes, preserving reviewed title overrides.
- Similar titles, levels, and courses from different sources are not automatically merged.
- Source records retain their external ID, official URL, normalized extracted payload, content hash, first/last seen, and last successfully verified UTC timestamps.

The stored payload is the extracted record, not the full original HTML. A complete source-page archive is deliberately not implemented. Hashes cover the extracted payload; excluded source description changes do not affect them.

Local scheduled dates remain ISO dates, not UTC instants. Times are retained in original schedule text. Individual schedules have a separate schema but are not populated until source inconsistencies can be handled without guessing.

## Adapter acceptance

Verify real source behavior; save a minimal provenance-labelled fixture; test parsing, validation, pagination, retries, identity, atomic persistence, repeat imports, failure recovery, and manual correction preservation. Keep deterministic tests separate from live verification. Document unknowns and unsupported variants rather than silently guessing.
