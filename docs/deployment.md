# Deployment

This milestone is local-only. Production deployment and remote resource creation require explicit approval. There is intentionally no deployment script or automatic deployment workflow.

Before deployment, choose the production hostname, verify source reuse conditions, provision an approved D1 database, replace the local placeholder in the reviewed environment configuration, and apply migrations to that intended environment. Add canonical URLs, `hreflang`, sitemaps, and an expired-edition policy before removing `noindex`. Validate D1 and browser tests on Linux or another supported operating system.

The initial foundation passed [Linux CI](https://github.com/akira28/learnaprop/actions/runs/42078396499), including actual local D1 and desktop/mobile browser tests. This verifies the tested local behavior, not a deployed production environment.

The application uses Astro's current Cloudflare adapter, with sessions disabled and image passthrough. This avoids the adapter's automatic KV session and Images provisioning. `workers_dev` and preview URLs are disabled. Observability is configured, but nothing has been deployed.

## Free-plan constraints

Official limits reviewed 2026-11-05:

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free runtime request/CPU/subrequest constraints must be rechecked before scheduling ingestion.
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): Free database size 500 MB, 5 GB total account storage, and 50 queries per Worker invocation. A batch counts as one invocation query; statement limits still apply.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): Free includes 5 million rows read and 100,000 rows written daily. Index writes count toward usage.
- [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/): framework/runtime and provisioning behavior.

Only D1 and Workers are configured. Discovery returns at most 12 rows plus a next-page sentinel. Substring search and offset pagination suit the initial dataset; they do not guarantee cheap queries at larger scale. Monitor real query plans and row reads before expansion.

Ingestion currently runs as an explicit local CLI operation. A scheduled Worker or GitHub Actions importer needs separate workload measurements and approval for its remote resources and credentials. No claim is made that the entire ingestion workload fits Free-plan CPU limits.
