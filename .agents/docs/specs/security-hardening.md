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

## C. 2026-09-10 audit remediation (direct session, reviewer ✅ APROBADO)

All requirements completed [✓] 2026-09-10 · Suite 135/135 · `pnpm audit` full+prod 0.

- [✓] **R9.** DOM-XSS closed: filenames/badges escaped via shared
  `src/utils/html.ts escapeHtml()` in `ImageConverter` + `ImagePreview`;
  SPA served with CSP (`docker/nginx.conf`, no inline scripts/styles).
- [✓] **R10.** Quota consumed per image (atomic) and keyed by IPv6 /56
  subnet (`normalizeQuotaKey`); `/convert` limiter IP-only
  (`convertRateLimitKey`, no User-Agent).
- [✓] **R11.** No internal details reach clients in production
  (`toPublicErrorBody`, dev-only details); `errorHandler` survives
  non-Error throws; Multer messages masked in prod.
- [✓] **R12.** Prototype-pollution guard runs after JSON parsing
  (`registerBodyMiddleware` order contract tested); `trust proxy` hops
  configurable via `TRUST_PROXY_HOPS` (default 1, 0 = directly exposed).
- [✓] **R13.** Uploads verified by magic number vs extension
  (`imageValidation.ts`) before quota/processing; `z.coerce.boolean`
  `"false"` bug fixed; processed filenames unique per request (CSPRNG);
  processing timer cancelled; ZIP streams closed on failure; boundary
  checks separator-aware.
- [✓] **R14.** Supply chain at zero: sharp 0.35.4, esbuild ≥0.28.1,
  undici =7.29.0, vitest ^4.1.11, fast-uri ≥4.1.3, js-yaml ≥4.3.2 <5,
  multer ≥2.3.0 (overrides + lockfile); libvips LGPL-3.0-or-later
  documented in `THIRD_PARTY_NOTICES.md`; `.env*` gitignored.
- [✓] **R15.** Containers: backend `USER node`, frontend
  `nginx-unprivileged:8080`, all base images digest-pinned, ephemeral
  `backend-temp` volume removed (see ADR-0004).

Scenarios: happy (convert flow unchanged) · edge (evil filenames,
non-Error throws, stale timers, colliding names, invalid hops) · side
(dev-only CVE graph at zero without touching prod runtime).
