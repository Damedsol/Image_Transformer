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

## D. 2026-09-17 advisory triage + supply-chain automation

> Merged from `.agents/specs/change_spec.yaml` (now `status: archived`).
> Cycle-local requirement IDs `R1..R12` of
> `.agents/docs/plan_2026-09-17_dependency-refresh-and-advisory-closure.md`
> map onto `R16..R21` below. Reviewer ✅ APROBADO
> (`review_2026-09-17_dependency-refresh-dependabot-repass.md`, tras 1 rechazo
> por ID-01). Diff: 5 files + 2 new · 481 code/config lines (WARNING declarado).

- [✓] **R16. Triage before remediation.** The authoritative inventory is
  captured as evidence: `pnpm audit --json` (full + `--prod`) and an OSV
  `querybatch` over every locked `name@version`; every alert is bucketed
  FIXED-IN-TREE / OPEN / NOT-APPLICABLE. Result on 2026-09-17: **0 advisories by
  both sources** (481 packages audited, 376 OSV-queried, 0 hits) → remediation
  recorded as an explicit **no-op** and the 11 stale `dependabot/*` refs
  reconciled with a close-list (none to merge). Dependabot alert export remains
  an external dependency (no `gh`, private repo).
- [✓] **R17. Dependency refresh within major.** Backend runtime pins:
  `helmet` 8.3.0, `express-rate-limit` 8.7.0, `zod` 4.6.2, `tsx` 4.23.13 (exact
  pins preserved); override floors: `minimatch@^10` 10.2.6, `flatted` 3.4.4,
  `path-to-regexp` 8.4.2, `ip-address` ≥10.7.0, `postcss` ≥8.5.28, `zod` ≥4.6.2.
  Deliberately unchanged: `undici` 7.29.0, `picomatch` 2.3.2, `js-yaml` <5,
  `brace-expansion` 5.0.9, `fast-uri` 4.1.4, `multer` 2.3.0 (newest allowed).
- [✓] **R18. `minimumReleaseAge` is respected.** The newest *allowed* patch is
  derived from registry publish dates; 8 of 19 candidate targets were rejected
  by the 5-day window and replaced by the previous patch.
- [✓] **R19. Pin↔override-floor invariant.** With `lowest-direct`, an override
  floor below an exact pin silently wins (real bug: `zod` 4.6.2 declared → 4.4.3
  resolved). Guarded by `backend/src/__tests__/dependencyConfig.test.ts`
  (11 tests, zero new dependencies), which also reproduces the historical bug as
  a fixture.
- [✓] **R20. Dependabot version updates enabled** —
  `.github/dependabot.yml` (npm `directories: ["/", "/backend"]`,
  `groups.minor-and-patch` + `group-by: dependency-name`; docker for both
  digest-pinned Dockerfiles; `chore(deps)`/`chore(deps-dev)` prefixes). **No
  `ignore` rules**: `ignore` also suppresses *security* updates, and version
  updates only touch manifest-declared dependencies, so ignoring a transitive
  package has no upside. Guarded by the same test suite (structure + no inert
  ignore).
- [✓] **R21. Majors stay out of scope.** TypeScript 7, Vitest 5, jsdom 30,
  lint-staged 17 and archiver 8 are recorded as a follow-up cycle (R12 of the
  plan); each needs its own migration against the 19-suite bed.

Acceptance criteria (met 2026-09-17): `pnpm audit` full + `--prod` = 0 (JSON
archived) · `pnpm audit` 0 and `pnpm build` green · `pnpm qa` **exit 0, 19 files
/ 146 tests** · OSV re-check of the changed packages 0/57 · runtime smoke
`GET /api/formats` 200 + `POST /api/convert` 200 · no production source file
touched · no new dependency added.

Scenarios: happy (install/lockfile consistent, suite green, backend converts) ·
edge (`minimumReleaseAge` rejections, `lowest-direct` vs exact pin,
re-introduced `ignore`) · side (dev tooling untouched — biome/oxlint/commitlint/
vite deferred to slice C2b).

Open (not acceptance-blocking): CI workflow `.github/workflows/security.yml`
(pending user decision), `pnpm check:security`, `scripts/scan-advisories.mjs`,
Dependabot alert export, execution of the 11-PR close-list. Policy codified in
ADR-0005.
