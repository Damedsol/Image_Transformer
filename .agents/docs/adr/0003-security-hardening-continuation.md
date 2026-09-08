# ADR-0003: Security Hardening Continuation (ses_fbb1 leftovers)

- **Status:** Accepted
- **Date:** 2026-08-28
- **Deciders:** User + pipeline (plan → build → reviewer ✅ → scribe)
- **Related plan:** `.agents/docs/plan_2026-08-28_security-session-continuation.md`

## Context

The `ses_fbb1` security audit was mostly remediated in the 2026-08-27
Dependabot cycle, but two LOW config findings remained: the CSP still allowed
`'unsafe-inline'` + a `https://*.onrender.com` `connectSrc` wildcard
(explicitly deferred), and the daily per-IP quota used an unbounded in-memory
`Map`. During closure, `pnpm audit --prod` surfaced two new moderate
advisories on transitive `qs@6.15.2` (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g;
patched ≥6.16.0).

## Decision

1. **Pure `buildCspDirectives()`** extracted in `securityMiddleware.ts`
   (exact origins only, no `'unsafe-inline'`, no wildcards); `configureHelmet()`
   consumes it. Pure function chosen for unit-testability without an HTTP
   harness.
2. **New `backend/src/utils/quota.ts` `QuotaStore`** (bounded `Map`,
   expired-first → LRU eviction, `IP_QUOTA_MAX_ENTRIES` default 10_000);
   `imageController.ts` keeps identical daily count/reset semantics via a thin
   wrapper. No Redis/DB (YAGNI).
3. **Transitive floor `"qs": ">=6.16.0"`** in `pnpm-workspace.yaml`
   `overrides` (standing directive: always use overrides) + regenerated
   lockfile → `audit --prod` back to 0.

## Consequences

- Backend CSP is stricter with no frontend impact (SPA served by nginx/Vite).
- Quota memory is bounded; eviction prefers expired entries so active IPs
  survive (default cap far above realistic daily uniques).
- `qs` stays patched via the overrides floor on future installs.
