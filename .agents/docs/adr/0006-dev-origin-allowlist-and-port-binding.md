# ADR-0006: Dev-Only Origin Allowlist and Strict Dev-Server Port Binding

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** User + pipeline (build → reviewer ✅ → scribe)
- **Related:** `.agents/docs/specs/dev-environment.md` §A (D1–D3) ·
  `.agents/docs/review_2026-09-17_dev-port-fallback.md` ·
  `backend/src/utils/corsOrigins.ts` · `backend/src/index.ts` · `vite.config.ts` ·
  memory `architecture/dev-origin-allowlist`, `config/concurrently-arg-forwarding`

## Context

The user reported that a conversion failed under `pnpm dev`:

```
Access to fetch at 'http://localhost:3001/api/convert' from origin 'http://localhost:5174'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present…
[vite] failed to connect to websocket (ws://localhost:5173)
```

Triage showed **not** a dependency regression: `:5173` was held by an unrelated,
stale dev server from another project (`ss -ltnp` → `*:5173`, pid alive since the
same day), so this app's Vite fell back to `:5174`. Two independent hardcoded
assumptions about port 5173 then broke:

- the **dev CORS allowlist was a closed list of exact ports** (`:3000`, `:5173`,
  portless `localhost`), so the browser's real `Origin: http://localhost:5174`
  received no `Access-Control-Allow-Origin` header;
- `vite.config.ts` **pinned `server.hmr.clientPort: 5173`**, so the HMR socket
  targeted the *other* project's Vite instance — while Vite's automatic port
  increment (no `strictPort`) kept the mistake invisible.

The affected allowlist is a security control, so any fix had to widen development
**without** relaxing production.

## Decision

1. **Development origins are loopback patterns, production origins are an exact
   list.** `getCorsOrigins()` returns, in dev, three anchored patterns
   (`^http:\/\/localhost(:\d+)?$`, `127.0.0.1`, `[::1]`); in production it returns
   only `CORS_ORIGIN` / comma-separated `CORS_ORIGINS` (normalised, invalid
   entries dropped) plus the explicit `ALLOW_LOCALHOST` opt-in, and **throws**
   when the list is empty.
2. **The dev server owns its port.** `server.strictPort: true`, and
   `server.hmr.clientPort` is never pinned: a taken port must fail immediately
   instead of shifting the whole stack, and HMR must derive its socket port from
   the port the server serves.
3. **The resolution lives on its own.** It was extracted to
   `backend/src/utils/corsOrigins.ts` so it is testable without booting the HTTP
   server, and `index.ts` only consumes it.
4. **The leakage direction is tested.** Assertions run through the real `cors`
   middleware (so swapping strings for patterns cannot pass silently), one test
   asserts no `RegExp` reaches the production list, and the fail-loud behaviour is
   covered by a test *and* an E2E probe (empty allowlist in production → exits 1
   before listening).

## Consequences

- **Positive:** a port collision no longer causes an outage; the failure mode is
  immediate and named ("Port 5173 is already in use"); dev/prod divergence is
  explicit, documented and guarded in both directions.
- **Negative / accepted:** a dev server that cannot get 5173 now **refuses to
  start** — the operator must free the port or pass `--port` explicitly. The dev
  pattern is only acceptable because `NODE_ENV` selects the branch and the
  production branch has its own tests; the divergence must be re-verified on any
  future allowlist change.
- **Untouched:** production CORS semantics are byte-identical to the previous
  implementation (verified by diffing the extracted block against `HEAD`).
- **Known, pre-existing (OBS-02):** the Docker dev path is a separate concern —
  `docker-compose.yml:55`'s `--host 0.0.0.0` never reaches Vite because
  `concurrently` swallows trailing CLI arguments, so the container frontend likely
  binds loopback and the published `5173:5173` cannot reach it. Not introduced
  here; still to be verified in-container (own cycle).

## Alternatives considered

- **Append 5174 to the exact dev list.** Whack-a-mole: the next collision is
  5175, and the coupling that caused the outage remains.
- **`origin: true` (reflect any origin) in dev.** Removes the origin control
  entirely, and a dev-only wildcard that later mistakes its way into production is
  exactly the failure this ADR guards against.
- **Kill the foreign process and keep the old config.** Restores service for a
  moment without removing the coupling; the same outage returns on the next
  collision.
- **Keep `clientPort: 5173` and let Vite auto-increment.** This *is* the reported
  bug: the HMR socket points at a foreign server ("WebSocket closed without
  opened") while the page is served from a port the backend allowlist does not
  know.
