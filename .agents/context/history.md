# Context and Learnings History: imageTransformer

> Run-time log of technical decisions, errors, and the changelog. Read at
> session start; update after significant changes. Keep under 200 lines
> (keep last 3 records, consolidate the rest into the "Consolidated History").

## Change History

- **2026-08-28: Security session continuation (ses_fbb1 LOWs) — CSP hardening + bounded quota (build)**
  - Detail: (A) `securityMiddleware.ts` — extracted pure `buildCspDirectives()` (exact origins, no `'unsafe-inline'`, no `*.onrender.com` wildcard); `configureHelmet()` consumes it. (B) New `backend/src/utils/quota.ts` `QuotaStore` (bounded Map, expired-first→LRU eviction, `IP_QUOTA_MAX_ENTRIES` default 10_000); `imageController.ts` uses it with identical daily count/reset semantics. New suites `securityMiddleware.test.ts` (7) + `quota.test.ts` (6), TDD Red→Green.
  - QA: new suites **13/13 green**; full `pnpm test` **94/95** — 1 PRE-EXISTING failure unrelated to this change (`session-ses_fbb1.md` at root violates `.md` kebab-case, lint-filenames parity test). `type-check`/`build`/`qa` NOT auto-run per AGENTS.md no-auto-runs policy (commands proposed to user).
  - Test command: `pnpm vitest run backend/src/__tests__/quota.test.ts backend/src/__tests__/securityMiddleware.test.ts`
  - Plan: `.agents/docs/plan_2026-08-28_security-session-continuation.md`.
  - Cierre 2026-08-28 (a petición del usuario): `session-ses_fbb1.md` eliminado; `pnpm qa` verde (95/95); `pnpm build` verde; `pnpm audit --prod` reveló 2 moderate en `qs@6.15.2` (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) → override `"qs": ">=6.16.0"` + lockfile regenerado → **audit --prod = 0**. Verificación final: `pnpm qa && pnpm build` verdes.
  - Reviewer (Gate 8): ✅ APROBADO → /scribe. 13/13 tests KEEP, 0 REMOVE; 1 observación informativa (override `qs` justificado, sin peso de rechazo).

- **2026-08-27: Dependabot security remediation — deps/overrides/config (SCA)**
  - Detail: Prod audit 13 vulns (1 low/3 mod/9 high) → **0**. `pnpm-workspace.yaml` overrides: brace-expansion@^2.0.0→2.1.4, @^5.0.0→5.0.9, js-yaml→`>=4.3.1 <5` (kept in cosmiconfig ^4 range), body-parser→`>=2.3.0`; added ip-address `>=10.3.1`, fast-uri `>=3.1.5`, postcss `>=8.5.23`, vite `>=8.0.16` + sharp/multer/zod espejos. Backend bumps: sharp 0.34.5→0.35.3 (libvips 8.18.3), multer 2.1.1→2.2.0, zod 4.3.6→4.4.3, @types/multer→2.2.0. Removed legacy dev deps (ts-node, ts-node-dev, nodemon). Code: `app.set('trust proxy', 1)` (real client IP behind Render/nginx) + rate-limit key IP-only (was IP+UA; UA attacker-rotatable); multer limits + `fieldNestingDepth:5` (cast — @types/multer 2.2.0 hasn't shipped it) mitigates CVE-2026-5079 + aborted-upload cleanup; ZIP name `Math.random`→`crypto.randomBytes`; sharp `failOnError`→`failOn:"error"` (0.35 API, resolved type-check); vite `host:true`→`localhost` (Docker overrides via `--host 0.0.0.0`).
  - QA: `pnpm audit --prod` 0 vulns; full audit 6 dev-only residuals (undici×5 via jsdom/vitest, esbuild×1 via tsx/vite/vitest — deferred: needs jsdom/tsx bumps, not prod-reachable); `pnpm build` green; `pnpm type-check` green; runtime smoke sharp 0.35.3 (libvips 8.18.3) + multer 2.2.0 `fieldNestingDepth` PASS; `pnpm qa` green (82/82).
  - Test command: `pnpm qa && pnpm build && pnpm audit --prod`
  - Plan: `.agents/docs/plan_2026-08-27_dependency-security-remediation.md`.
- **2026-08-27: Replace @ls-lint/ls-lint with local `lint-filenames` script**
  - Detail: Removed the unmaintained `@ls-lint/ls-lint@2.3.1` (Go binary; project archived). Added a zero-dependency Node script `scripts/lint-filenames.mjs` replicating ls-lint's naming validation exactly (per-rune kebab/camel/pascal/screaming-snake rules, extension extraction with `*` combos so `.d.ts`/`.test.ts`/`commitlint.config.js`/dotfiles are exempt, longest-prefix rule resolution without inheritance, ancestor-prefix ignore, text `"{path} failed for \`{ext}\` rules: ..."` output + exit codes, `--config/--workdir/--warn/--error-output-format/--debug/--version`). Config migrated `.ls-lint.yml` → `.ls-lint.json` (JSON, parse nativo). Wired `pnpm lint` → `node scripts/lint-filenames.mjs`; dropped dep from `package.json` + `pnpm-workspace.yaml` catalog; regenerated lockfile. New black-box parity suite `backend/src/__tests__/lint-filenames.test.ts` (10 cases, spawns the CLI against fixtures).
  - Parity: run against a violating fixture → stdout + stderr identical to the real binary, exit 1 in both; running against the repo root → exit 0. Docs/skill/manifest updated (AGENTS.md, project_manifest.yaml, context/project.md, code-quality SKILL + references + template → `.ls-lint.json`).
  - QA: `pnpm qa` green (incl. 10 new tests), `pnpm build` green.
  - Committed atomically: harness [de70831] + this migration [6c3b5bb].
  - Test command: `pnpm qa && pnpm build`
- **2026-08-27: Harness consolidation — `.ia/` + `.gemini/` removed**
  - Detail: Closed the leftover dual-layer harness. Migrated all legacy `.ia/` content into `.agents/` (project_manifest.yaml, checkpoint.yml, docs/adr/*, docs/specs/*, memory → context/). Consolidated `context.md` + `backend/context.md` into `.agents/context/project.md` + `history.md`. Removed the duplicate `.gemini/skills/code-quality` copy (the canonical `code-quality` skill lives in `.agents/skills/`). Removed the legacy root `context.md` + `backend/context.md`. Pointed all internal `.ia/` references (.agents/docs/*, README, docs/README, AGENTS.md) to `.agents/`. `opencode.jsonc` still instructs `./AGENTS.md`.
  - QA: `git mv` used to preserve history; internal reference scan clean; no residual `.ia/`/`.gemini/` references outside `.git`.
- **2026-08-27: Lucide → Iconoir migration (icons + footer brand icons)**
  - Detail: Replaced `lucide@1.24.0` with Iconoir. 9 SVGs vendored verbatim in `assets/icons/` (upload, trash, download, media-image, check-circle, warning-circle, settings, github, linkedin — kebab-case from `iconoir/icons/regular/`). `TnIcon.ts` imports them via Vite `?raw`, strips `<svg>` wrapper + presentational attrs (`normalizeSvg`), renders with `createElementNS` + `setAttribute` (viewBox 0 0 24 24, fill none, stroke-width 1.75, square/miter); `@license MIT — Iconoir`. Dropped 7 dead registry entries. Footer brand icons added. `pnpm remove lucide` (user-confirmed). ADR-0002 + spec R8 updated (notices at root, Iconoir MIT). `THIRD_PARTY_NOTICES.md` moved to repo root.
  - QA: `pnpm qa` green (72/72), `pnpm build:frontend` green.
  - Reviewer: ✅ APPROVED after 2 rejected passes ([ID-01] notices listed lucide; [ID-02] AGENTS.md/README still said Lucide).
- **2026-08-17: Footer & license consistency fixes**
  - Detail: Footer now `Damedsol · Licensed under CC BY 4.0` (no ©); `.footer-copyright` → `.footer-attribution`; README link in nav. Manifest license `CC BY-NC-SA 4.0` → `CC BY 4.0`. README `file:///...` link → `./LICENSE.md`. SPDX `CC-BY-4.0` in root + backend package.json. Shipped OFL 1.1 for Figtree + IBM Plex Mono. New `THIRD_PARTY_NOTICES.md` (moved to root 2026-08-27). New `backend/src/__tests__/license-consistency.test.ts` (6 cases) in backend suite (frontend tsconfig has no node types). ADR-0001 + spec license-attribution created.
  - QA: `pnpm qa` green (71/71), `pnpm build` green. Reviewer: ✅ APPROVED.
- **2026-08-12: Fixed parallel-processing cleanup race + validation cleanup guarantee + visible toast + footer**
  - Detail: (1) `imageController.ts` — sequential `for` loop (was `Promise.all`); each result pushed to `allTempFiles` immediately; no orphaned outputs on 413; `req.files` registered before validations so any error triggers cleanup (0 leaked files). (2) Toast repositioned to fixed top-center; full status-color border. (3) Footer added with GitHub/LinkedIn + CC BY 4.0 attribution. (4) Added temp-cleanup lifecycle (`backend/src/utils/tempCleanup.ts`): startup + periodic sweep (`TEMP_CLEANUP_INTERVAL_MS`, `TEMP_FILE_MAX_AGE_MS`), TTL timers survive crash/restart. (5) `api.ts` extracts `errorData.error?.message` (real message, never `[object Object]`); backend maps sharp "pixel limit" to clean 413 `DIMENSION_LIMIT_ERROR`. New tests: `api.test.ts` (3) + `tempCleanup.test.ts` (9) + `imageController` dimension checks.
  - QA: `pnpm qa` green (65/65), `pnpm build` green.
- **2026-08-12: UX/i18n/a11y/responsive/dotenv cleanup**
  - Detail: Consolidated dotenv to a single quiet load (`backend/src/utils/loadEnv.ts`). Replaced placeholder labels + `[OK]`/`[!]` prefixes with real English strings. Visible slider track. Removed the a11y dialog subsystem. Real error feedback via toasts + `aria-invalid`. Removed `role="application"`, `aria-live`, dead `@container`, polyfill.io script (supply-chain risk). Aligned formats (removed bmp/tiff FE; added gif/avif to multer). Fixed `custom-elements.d.ts`. Translated backend + frontend messages to English. Contrast/target-size fixes.
  - QA: `pnpm qa` green (53/53), `pnpm build` green.
- **2026-08-10: Centralized scripts in root package.json**
  - Detail: `pnpm dev` boots FE+BE via `concurrently -k`. `pnpm qa` chains `type-check && lint && format:check && test`. `pnpm build` compiles backend → frontend. Granular scoped scripts (dev:frontend, build:backend, ...); removed redundant `qa:*` aliases.
  - QA: `pnpm qa` green (46/46), `pnpm build` OK.
- **2026-07-14: Full Neon-Code UI Kit migration**
  - Detail: Implemented `tn-icon`, neon-code `style.css` (1770 → ~820 lines), and 4 migrated components (DropZone, ConversionOptions, ImagePreview, ImageConverter). Migrated in TDD.
  - QA: `pnpm test` 46/46, type-check/lint/format clean.

## Consolidated History (older, aggregated)

- **2026-06-01 → 2026-05-31:** Docker & workspace hardening — release `1.3.0` → `1.3.2`; centralized overrides/workspace config in `pnpm-workspace.yaml` (catalog, engineStrict, preferFrozenLockfile, strictPeerDependencies, blockExoticSubdeps); removed obsolete `pnpm` blocks from package.json; replaced ESLint/Prettier with Oxlint + Biome; migrated `npm run docker:*` scripts to `docker compose`; separated dev/prod compose files; aligned Docker build context to root + `--ignore-scripts`; upgraded base images to `node:24-alpine`; nginx hardening (`server_tokens off`, `client_max_body_size 50M`, sparse `/api/` `/temp/` `^~` blocks, SPA 404 rule, drop scanner routes); zero-exposed-port production compose; dynamic `VITE_API_URL` falling back to relative `/api`.
- **2026-05-31:** Full README/docs reconstruction via readme-generator; removed legacy ESLint/Prettier references; sync engines across scopes.
