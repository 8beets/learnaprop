# Contributing

Read [AGENTS.md](AGENTS.md) and follow the [local setup](README.md#local-setup). Use small, focused changes and strict TypeScript. Do not publish fictional courses, add paid services, or deploy without approval.

Run formatting, linting, type checking, applicable tests, and the production build before submitting a change. Include D1 runtime tests for persistence changes on a supported host. Report checks that could not run.

Keep saved source fixtures limited to the data needed for deterministic tests. Label synthetic fixtures explicitly and never import them into public discovery. Live network smoke tests belong outside routine CI.

Use new versioned migrations for schema changes; never edit a migration after it has been applied to a shared environment. Do not commit local databases, secrets, generated build output, or browser artifacts.

Record meaningful architecture decisions in `docs/adr/`. Source integrations must document access policies, provenance, limitations, and how their real behavior was verified.
