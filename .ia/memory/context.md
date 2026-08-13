# Context and Learnings: imageTransformer

## Stack and Configuration
- **pnpm v11 monorepo:** Root (frontend SPA) + backend (Express API). Resolution mode: lowest-direct, engineStrict, hoist.
- **Frontend:** TypeScript 6 + Vite 8 + Vitest 4 + jsDOM 29. Vanilla Web Components + Lucide icons + Neon-Code UI Kit.
- **Backend:** Express 5 + Sharp 0.34 + Multer + Zod + Helmet + Pino (unchanged).
- **Quality:** Biome v2 (formatter), Oxlint v1 (linter), ls-lint v2 (naming), Husky v9 + lint-staged + commitlint.
- **Docker:** Multi-stage Node 24 Alpine + Nginx Alpine. docker-compose.yml (dev) + docker-compose.prod.yml (prod).
- **Tests:** Vitest + jsDOM. 6 test files, 46 tests. TDD mandatory.

## Neon-Code UI Kit Migration — COMPLETED
- **CSS Tokens:** `:root` rewritten with neon-code base-tokens.css (#0f1016, #b9f27c, #161b22). Dark mode default + light mode via prefers-color-scheme.
- **Fonts:** Figtree (variable woff2) + IBM Plex Mono (static woff2). Local in assets/fonts/. No Google Fonts.
- **Icons:** New `<tn-icon>` Web Component with Lucide (tree-shaking, Shadow DOM, square stroke-linecap, miter stroke-linejoin).
- **Migrated components:** DropZone (SNA-03/SNA-35), ConversionOptions (SNA-02/SNA-20/SNA-27/SNA-18), ImagePreview (SNA-03/SNA-08), ImageConverter (SNA-01/SNA-15/SNA-07). All with intact logic, only HTML/CSS rewritten.
- **A11y dialog:** SNA-06 modal with 85% backdrop, brand-primary border.
- **style.css:** Reduced from 1770 → ~820 lines. No box-shadow, gradients, backdrop-filter or border-radius > 4px.
- **Immutable rules:** Law of Irradiation (max font-weight 500 on light text), Law of Dual Fonts (Figtree UI, Mono data), 7:1 AAA contrast rule.
- **.ia/ directory:** AGENTS.md, project_manifest.yml, memory/context.md, docs/. Local agentic configuration.

## Strategic Decisions
- **Framework Zero:** Vanilla Web Components + TypeScript retained. No React/Vue/Lit.
- **Lucide v1:** API with `createElement(IconNode)` where IconNode is `[tag, attrs, children][]`. Tree-shaking with individual imports.
- **JSDOM CE handling:** Custom Elements reactions wrapped by `invokeCEReactions`. To avoid uncaught errors, `connectedCallback` must be a no-op when attributes are missing.
- **Required test imports:** Tests must import components explicitly to trigger `customElements.define()`. Without import, `document.createElement` produces HTMLUnknownElement.

## Change History
- **2026-08-12:** Fixed parallel-processing cleanup race (leak in temp/output)
  - Detail: User reported: upload 2 images, one fails dimension check (413), the valid one stays in temp/output. Root cause (debug logs): `Promise.all(req.files.map(processImage))` + error catch deletes the INPUT files while other images are still processing — the finished image's output is orphaned (never pushed to `allTempFiles`, push happens only after `await Promise.all`) or fails with sharp "Input file is missing". Fix in `imageController.ts`: sequential `for` loop, each `processImage` result pushed to `allTempFiles` immediately. No race, fails fast, 0 files on any error; consistent with `sharp.concurrency(1)`. Verified: grande+pequeña → 413 → output 0/uploads 0, no "Input file is missing" post-fix; 2 valid images → 200 + ZIP. Lucide 1.24.0 has NO Github/Linkedin brand icons (removed from the lib) — footer keeps text links for now; user parked the icon request.
  - QA: `pnpm qa` green (65/65 tests), `pnpm build` green.
  - Test command: `pnpm qa && pnpm build`
- **2026-08-12:** Validation cleanup guarantee + visible toast + footer
  - Detail: (1) `imageController.ts` now registers `req.files` into `allTempFiles` right after the files-exist check (before max-files/quota/schema validations), so ANY validation error triggers cleanup of every uploaded file. Verified via curl: 2 images + invalid format → 400 → 0 files in temp/uploads (was leaking 2); 5 images → 400 → 0; oversized → 413 → 0. (2) Toast `.message` repositioned to fixed top-center (`top:1rem; left:50%; translateX(-50%); z-index:1000; max-width:min(90vw,480px)`), full status-color border, surface bg — verified centered on desktop (1277/1280) and mobile (195/195). (3) Footer added in index.html: "© 2026 Created by Damedsol" → GitHub repo (https://github.com/Damedsol/Image_Transformer), "Licensed under CC BY 4.0" → license link, nav links GitHub + LinkedIn (https://www.linkedin.com/in/david-medina-soloza/); footer CSS with flex wrap + focus-visible. Note: user wrote "Damdedsol", repo/README use "Damedsol" — kept "Damedsol". `.ls-lint.yml` ignore for `backend/src/__tests__` re-added (had been lost).
  - QA: `pnpm qa` green (65/65 tests), `pnpm build` green.
  - Test command: `pnpm qa && pnpm build`
- **2026-08-12:** Review fixes (413 vs 500) + temp file lifecycle cleanup
  - Detail: Reviewer findings ID-01/02/03 fixed: (1) backend `imageProcessor.ts` reads metadata without `limitInputPixels` so the explicit dimension check can return a clean 413 `DIMENSION_LIMIT_ERROR` (was generic 500 "Input image exceeds pixel limit"); `processImage` now re-throws `AppError` instead of wrapping into 500; defense-in-depth maps sharp "pixel limit" errors to 413. Verified with 4000x6000 JPEG: **413** + clear message. (2) `api.ts` extracts `errorData.error?.message` (backend sends `{error:{message}}` object) — toast now shows the real message, never `[object Object]` (pre-existing bug exposed by the R4 error-propagation change). (3) New regression tests `src/__tests__/utils/api.test.ts` (3 cases, `vi.stubGlobal("fetch")`). User-reported temp leak: per-file TTL timers (cleanTempFiles, 5 min) are lost on crash/restart → orphaned files in backend/temp/output (3 found). New `backend/src/utils/tempCleanup.ts` (isFileExpired/isWithinTemp/cleanupDirectory/cleanupStartup/schedulePeriodicCleanup) wired in `index.ts`: startup sweep + periodic sweep (`TEMP_CLEANUP_INTERVAL_MS` default 5 min, `TEMP_FILE_MAX_AGE_MS` default 30 min, unref'd timer). Tests `backend/src/__tests__/tempCleanup.test.ts` (9 cases); `vite.config.ts` test include + `.ls-lint.yml` ignore `backend/src/__tests__`. Verified: orphans swept at boot; convert→kill→restart→swept; 413 E2E toast; happy path 200 ZIP.
  - QA: `pnpm qa` green (type-check FE+BE, lint, ls-lint, format, **65/65 tests** incl. backend), `pnpm build` green.
  - Test command: `pnpm qa && pnpm build`
- **2026-08-12:** UX/i18n/a11y/responsive/dotenv cleanup
  - Detail: Consolidated dotenv to a single quiet load (`backend/src/utils/loadEnv.ts`, imported first in index.ts; removed `dotenv.config()` from imageController.ts + imageProcessor.ts) — zero `injected env` boot noise. Replaced all `UPPER_SNAKE_CASE` placeholder labels and `[OK]`/`[!]` toast prefixes with real English strings. Slider now renders a visible track (webkit/moz track pseudo-elements, `--slider-track-bg` #3b4252/#c8ced9). Removed the a11y dialog subsystem (header button, modal, Ctrl+Alt shortcuts, localStorage prefs, dead CSS/helpers). Real error feedback: toasts propagate `error.message`, width/height inline validation with `aria-invalid` + `#width-error`/`#height-error`, toasts carry tn-icon (non-color cue). Removed `role="application"`, `aria-live` on `#app`, dead `@container main-container` (replaced by `@media (max-width: 640px)`), polyfill.io script (supply-chain risk, IntersectionObserver unused). Aligned formats: removed bmp/tiff from frontend (type, selector, validation) and added gif/avif to multer allowed list. Fixed `custom-elements.d.ts` (`typeof X` → `X`). Translated all backend user-facing messages + frontend utils to English. Contrast/target-size fixes (dropzone-formats, preview-meta, preview-remove 44px).
  - QA: `pnpm qa` green (type-check FE+BE, lint, ls-lint, format, 53/53 tests — added 7). `pnpm build` green. Backend boots with 0 `injected env` lines and serves /api/formats from real .env. Browser E2E: upload PNG → convert to WEBP → ZIP 200 download; slider rail visually confirmed via pixel scan; responsive 390px collapses dimensions/preview to 1 column.
  - Test command: `pnpm qa && pnpm build`
- **2026-08-10:** Centralized scripts in root package.json (dev:/qa:/build: namespaces)
  - Detail: `pnpm dev` now boots frontend (Vite :5173) + backend (tsx watch :3001) in parallel via `concurrently -k` (^10.0.4, added to catalog + root devDeps). `pnpm qa` chains canonical scripts directly: `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` (no redundant qa:* aliases — removed after reviewer feedback). `pnpm build` compiles backend → frontend. Granular scoped with full names: dev:frontend, dev:backend, build:frontend, build:backend, type-check:frontend/backend, lint:frontend/backend (no fe/be abbreviations). backend/package.json untouched (workspace-internal entrypoints preserved). AGENTS.md + project_manifest.yml + plan synced.
  - QA: `pnpm qa` green (type-check FE+BE, lint FE+BE+ls-lint, format, 46/46 tests), `pnpm build` OK (backend dist/ + frontend dist/), `pnpm dev` boots both with [frontend]/[backend] prefixed output, SIGTERM kills both via -k.
  - Test command: `pnpm qa && pnpm build`
- **2026-08-10:** .ia/ harness updated — English only, no global skill names
  - Detail: Rewrote `.ia/AGENTS.md`, `project_manifest.yml` and `memory/context.md` in English. Unified agent directives to English-only (root AGENTS.md chat policy is English). Kept the no-global-skill-name rule: only the project-local skill `code-quality` (`.agents/skills/`) is named; global skills are referenced generically. Registered `.agents/skills/` in relevant_folders and updated the manifest date.
  - QA: YAML valid, line limits respected (root AGENTS.md 114, .ia/AGENTS.md 100, context.md <200).
- **2026-07-14:** Full Neon-Code UI Kit migration
  - Detail: Implemented tn-icon, neon-code style.css, and 4 migrated components. 46 TDD tests passing. Type-check/lint/format clean.
  - QA: `pnpm test` 46/46, `pnpm type-check` 0 errors, `pnpm lint` 0 errors, `pnpm format` no fixes.
  - Pending commits: Review staged files and create conventional commit.
