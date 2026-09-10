# ADR-0004: Non-Root Containers and Digest-Pinned Base Images

- **Status:** Accepted
- **Date:** 2026-09-10
- **Deciders:** User + pipeline (audit → build → reviewer ✅ → scribe)
- **Related:** `.agents/docs/specs/security-hardening.md` §C (R15)

## Context

The 2026-09-10 audit flagged three container findings: both production
stages run as root, base images use mutable tags, and the backend relied on
a root-owned named volume for ephemeral temp files.

## Decision

1. **Backend runs as `USER node`** (with `chown -R node:node /app`).
   The `backend-temp` named volume was **removed** from
   `docker-compose.prod.yml`: temp/ holds only ephemeral uploads/ZIPs (5-min
   TTL), and a root-owned volume cannot be written by the `node` user.
   Verified by building and booting the real prod image (`whoami=node`,
   temp dirs created, `/` + `/api/formats` OK).
2. **Frontend runs `nginxinc/nginx-unprivileged`** (USER nginx) on port
   **8080** (`listen` + `EXPOSE`/`expose` updated). Consequence: the outer
   reverse proxy on `proxy-tier` must target `<frontend>:8080`, not `:80`.
   `nginx -t` validated inside the real image.
3. **All `FROM` lines digest-pinned** (`node:24-alpine@sha256:50c8…`,
   `nginx…unprivileged@sha256:4427…`), tags kept for readability.
   Digests re-resolved against the registry before pinning.

## Consequences

- No root in either production runtime; reproducible base layers.
- Digest pins freeze patch flow: base-image updates (e.g. node security
  releases) now require a deliberate digest bump — Dependabot/docker updates
  should cover this.
- Outer proxy retarget to :8080 is an out-of-repo manual step, flagged in
  compose comments and history.
