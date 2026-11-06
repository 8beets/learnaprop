# ADR 0002: Use Docker for local Cloudflare and browser tests

Status: accepted, 2026-11-05.

The developer's Mac runs macOS 12, below the minimum supported by the current workerd runtime. Docker Desktop is already installed and its Linux daemon is operational. Use Docker Compose to run Node 24, local D1, Astro, and Playwright without changing the host operating system or downgrading project dependencies.

Use one Debian Bookworm development image with Chromium installed by the project's locked Playwright package. Bind-mount source code but keep Linux dependencies in a named volume. Persist app D1 state separately; checks use temporary state so fixtures never enter the browsing database. Bind the development port to host loopback only. No Docker daemon socket or cloud credentials are exposed to the containers.

The Docker CLI is now configured on the user's shell PATH. Invoke `docker` directly; existing editor/agent processes may need a new shell or restart to inherit a changed PATH. Initial image downloads are expected; ongoing cloud infrastructure and paid services are not introduced.
