# Spec: Security Hardening Continuation (ses_fbb1 leftovers)

> Consolidates the SPEC deltas from
> `.agents/docs/plan_2026-08-28_security-session-continuation.md`.
> All requirements completed [✓] 2026-08-28 · Reviewer ✅ APROBADO.

## A. Hardened CSP (`backend/src/middlewares/securityMiddleware.ts`)

- [✓] **R1.** `configureHelmet()` produces a CSP without `'unsafe-inline'` in
  `scriptSrc` or `styleSrc`.
- [✓] **R2.** `connectSrc` holds ONLY exact origins (`'self'`, `backendOrigin`,
  `allowedOrigins`) — no `https://*.onrender.com` wildcard.
- [✓] **R3.** `defaultSrc` stays `['self']`; `imgSrc`/`fontSrc`/`frameSrc`
  unchanged (API serves JSON + `/temp` statics only).
- [✓] **R4.** No `'unsafe-inline'` on `script-src-attr`/`style-src-attr`
  (by construction — helmet emits only the listed directives).

Scenarios: happy (200 + hardened header) · edge (no env → exact fallback
origin, no wildcard) · side (frontend SPA served by nginx/Vite, unaffected).

## B. Bounded quota (`backend/src/utils/quota.ts`, `imageController.ts`)

- [✓] **R5.** `QuotaStore` caps tracked IPs via `maxEntries`
  (`IP_QUOTA_MAX_ENTRIES`, default 10_000).
- [✓] **R6.** On overflow: evict expired (previous-day) entries first, then LRU.
- [✓] **R7.** `DAILY_QUOTA_PER_IP` / `MAX_FILES_PER_REQUEST` semantics intact.
- [✓] **R8.** No persistence across restarts (documented, as before).

Scenarios: happy (daily quota unchanged) · edge (`maxEntries` 1–2, no throw) ·
side (cap configurable via env).

## Acceptance criteria (met 2026-08-28)

- `pnpm test` 95/95 · `pnpm type-check` green · `pnpm build` green ·
  `pnpm audit --prod` = 0 (after `qs >= 6.16.0` override floor).
