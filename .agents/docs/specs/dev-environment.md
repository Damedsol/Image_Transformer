# Spec: Local Development Environment Contracts

> Living spec for the **dev-time** contracts of imageTransformer: which origins the
> API trusts while developing, which port the dev server owns, and how HMR finds
> it. Mirrors the OpenSpec-equivalent flow documented in `.agents/specs/README.md`.

## A. 2026-09-17 dev port fallback — CORS allowlist + Vite binding

> Merged from an **ad-hoc Fast Path** cycle: it had no `change_spec.yaml` (no
> `/plan`; a user-reported dev bug fixed inline, AGENTS.md §4.1), so the cycle-local
> requirements `R1..R3` were declared in the test docblocks instead and map onto
> `D1..D3` below. Reviewer ✅ APROBADO
> (`.agents/docs/review_2026-09-17_dev-port-fallback.md`, 11 KEEP / 0 REMOVE).
> Diff: 5 code/config files, 385 lines (inside the 400 SLO). Policy: ADR-0006.

- [✓] **D1. Development CORS accepts any loopback port.** `getCorsOrigins()`
  (`backend/src/utils/corsOrigins.ts`) returns, when `NODE_ENV !== "production"`,
  three anchored patterns — `^http:\/\/localhost(:\d+)?$`, `127.0.0.1`, `[::1]`.
  Rationale: the dev server may occupy any free port (5174, 5175… when 5173 is
  busy) and the browser's `Origin` follows it, so a closed port list turns a port
  collision into a CORS outage (the reported symptom: `/api/convert` blocked with
  "No 'Access-Control-Allow-Origin' header is present" from
  `http://localhost:5174`).
- [✓] **D2. Production CORS stays an exact-match list and fails loud.** Only
  `CORS_ORIGIN` + comma-separated `CORS_ORIGINS` (normalised to `URL.origin`,
  invalid entries dropped) and the explicit `ALLOW_LOCALHOST === "true"` opt-in are
  allowed; with an empty list the process throws **before** binding the port.
  **No pattern may ever leak into production** — a regex there would defeat origin
  control — which the suite asserts explicitly.
- [✓] **D3. The dev server owns its port and HMR follows it.** `vite.config.ts`
  sets `server.strictPort: true` and does **not** pin `server.hmr.clientPort`:
  taking a port silently shifts the rest of the stack (HMR socket → another
  project's dev server, `Origin` → an origin no allowlist knows) so the failure
  must be immediate and explicit, and the HMR client must derive the socket port
  from the port the server actually serves.

Acceptance criteria (met 2026-09-17): `pnpm test` exit 0 — 21 files / 157 tests
(baseline 19 / 146) · `pnpm type-check` 0 · `oxlint` (check mode) 0 ·
`lint-filenames` 0 · runtime probes: dev echoes `Access-Control-Allow-Origin` for
`http://localhost:5174`, `http://127.0.0.1:5180` and `http://[::1]:5174` (plus a
successful preflight `OPTIONS /api/convert`), production serves only its exact
origin, production with an empty allowlist exits 1 without listening,
`pnpm dev:frontend` with `:5173` taken exits 1 with "Port 5173 is already in use",
and the served `@vite/client` ships `hmrPort = null` (page-port fallback).

Scenarios: happy (default port, and the 5174 fallback that triggered the bug) ·
edge (`127.0.0.1`, `[::1]`, portless `http://localhost`, trailing slash in
`CORS_ORIGIN`, invalid `CORS_ORIGINS` entries, `ALLOW_LOCALHOST`) · side
(preflight, look-alike origins such as `http://localhost.evil.com` and
`https://localhost:5174` refused, no `RegExp` in the production list).

Open (not acceptance-blocking): **OBS-01** `securityMiddleware.ts:29-47`
re-implements the same env-origin parsing (and does not filter non-http(s) schemes
for `connectSrc`) — refactor to consume `normalizeOrigin` in a future cycle ·
**OBS-02** `docker-compose.yml:55`'s `--host 0.0.0.0` never reaches Vite because
`concurrently` swallows trailing CLI args, so the container frontend likely binds
loopback and `5173:5173` cannot reach it (pre-existing, unverified in-container —
see memory `config/concurrently-arg-forwarding`) · the dev-time
`VITE_API_URL` fallback documented in `AGENTS.md` is unaffected by this section.
