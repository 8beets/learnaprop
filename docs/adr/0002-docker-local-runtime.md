# ADR 0002: Use Docker for local Cloudflare and browser tests

Status: accepted, 2026-11-05.

Local Cloudflare runtime support and browser system dependencies vary across host
environments. Use Docker Compose to run Node 24, local D1, Astro, and Playwright in
a consistent Linux environment without changing the host operating system or
downgrading project dependencies.

Use one Debian Bookworm development image with Chromium installed by the project's locked Playwright package. Bind-mount source code but keep Linux dependencies in a named volume. Persist app D1 state separately; checks use temporary state so fixtures never enter the browsing database. Bind the development port to host loopback only. No Docker daemon socket or cloud credentials are exposed to the containers.

Contributors need a running Docker engine, Compose support, and the Docker CLI on
their shell's `PATH`. Initial image downloads are expected. The development image
and local database do not require Cloudflare credentials or paid services.
