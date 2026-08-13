# Plan: UX Corrections, i18n, a11y, Responsive & dotenv Noise

Date: 2026-08-12
Gate: 1–6 Plan → 7 Build
Status: APPROVED (user confirmed 3 scope decisions)

## Decisions (user-confirmed)

1. **Accessibility panel → full removal** (header button, modal, Ctrl+Alt shortcuts, localStorage prefs, related CSS). Keep OS-native `prefers-color-scheme` / `prefers-reduced-motion` media queries.
2. **Backend → translate all user-facing messages to English.**
3. **Formats → align frontend to backend**: remove `bmp`/`tiff` from selector and input validation; fix multer to accept `gif`/`avif` as input (valid output formats).

## Root causes

- **dotenv messages** (`injected env (20/0/0) from .env // tip: …`): emitted by `dotenv` v17.4.2 (`_log()` in `backend/node_modules/dotenv/lib/main.js`). `dotenv.config()` is called 3×: `index.ts:22`, `imageController.ts:16`, `imageProcessor.ts:17`. Safe (no secrets printed), unnecessary noise. `.env` properly gitignored (`backend/.gitignore:11`).
- **Slider invisible track**: `input[type="range"]` has `height:4px` + `min-height:44px` (min-height wins) and `background: var(--slider-track-bg)` = `--bg-surface` identical to the card background. No `::-webkit-slider-runnable-track`/`::-moz-range-track` styling. Token `--slider-range-bg` unused.
- **`UPPER_SNAKE_CASE` texts**: unlocalized i18n placeholders never replaced (`MAINTAIN_ASPECT_RATIO`, `CONVERT_IMAGES`, `NO_IMAGE_SELECTED`, `[OK]`/`[!]`, etc.).
- **No error feedback**: `handleConvertClick` discards real `error.message`; no inline validation (`aria-invalid` CSS exists, never set).
- **a11y dialog**: redundant with OS-native media queries.
- **Dead container query**: `@container main-container (max-width: 640px)` has no element with `container-type`/`container-name` → dead code.

## Requirements

- R1: Single silent dotenv load (`import "dotenv/config"` first in `index.ts`, `quiet: true`; remove from `imageController.ts`/`imageProcessor.ts`).
- R2: Visible slider track (dark + light), target ≥44px, keyboard accessible.
- R3: Real English labels; zero `UPPER_SNAKE`/`[OK]`/`[!]` in `src/` + `index.html`.
- R3b: No `bmp`/`tiff` in selector/validation; multer accepts `jpg/jpeg/png/webp/gif/avif`.
- R4: Real error feedback (propagate `error.message`), inline width/height validation (`aria-invalid` + text), toasts with icons (not color-only).
- R5: a11y panel removed.
- R6: Neon-Code a11y: remove `role="application"`, fix `dropzone-formats opacity:0.6` and `.preview-meta` contrast, `.preview-remove` 44px, remove double announcement (`aria-live` on `#app`).
- R7: Real responsive via `@media` (replace dead `@container`).
- R8: Translate frontend utils + backend user-facing strings to English.

## Files

**Frontend (modify):** `src/style.css`, `src/components/{ConversionOptions,ImageConverter,DropZone,ImagePreview}.ts`, `src/main.ts`, `src/utils/{a11y,api,fileUtils,serviceWorkerRegistration}.ts`, `index.html`.

**Backend (modify):** `backend/src/index.ts`, `backend/src/controllers/imageController.ts`, `backend/src/utils/imageProcessor.ts`, `backend/src/middlewares/uploadMiddleware.ts`, `backend/src/middlewares/securityMiddleware.ts`, `backend/src/utils/apiError.ts`, `backend/src/routes/imageRoutes.ts`.

**Tests (modify):** `src/__tests__/components/{ImageConverter,DropZone,ConversionOptions}.test.ts`, optional `style-tokens.test.ts`.

**Principles:** DRY (reuse `showMessage`/`createAlert`), YAGNI (no i18n framework), Last Resort (no new files), TDD (Vitest + jsDOM). Zero new dependencies.

## Tasks (TDD checklist)

### RED
- [✓] T1 `ImageConverter.test.ts`: real texts + toasts without `[OK]`/`[!]`.
- [✓] T2 `DropZone.test.ts`: `NO_IMAGE_SELECTED` → real text.
- [✓] T3 `ConversionOptions.test.ts`: `aria-invalid` + inline msg on invalid width/height; slider `aria-valuemin/max/now`; `bmp`/`tiff` NOT in selector.
- [✓] T4 Propagation test: `handleConvertClick` error shows real `error.message` (mock `convertImagesAPI`).

### GREEN
- [✓] T5 Backend dotenv consolidation.
- [✓] T6 `ConversionOptions.ts`: real texts, remove bmp/tiff, inline validation.
- [✓] T7 `ImageConverter.ts`: real texts, propagate `error.message`, no `role="application"`, toasts with icon.
- [✓] T8 `DropZone.ts`/`ImagePreview.ts`: real texts.
- [✓] T9 `main.ts` + `index.html`: remove a11y subsystem, real texts, remove `aria-live` on `#app`.
- [✓] T10 `style.css`: visible slider track, remove a11y CSS, `@media` responsive, contrast/target-size fixes.
- [✓] T11 `a11y.ts`: prune dead helpers.
- [✓] T12 EN translation: `api.ts`, `fileUtils.ts`, `serviceWorkerRegistration.ts`, `uploadMiddleware.ts`, `securityMiddleware.ts`, `apiError.ts`, `imageRoutes.ts`, `index.ts`.
- [✓] T13 Multer accepts gif/avif.

### REFACTOR
- [✓] T14 `pnpm qa` green.
- [✓] T15 Backend boots without `injected env` lines.
- [✓] T16 Grep close: 0 residual placeholders/`bmp`/`tiff`.

## Risks

- ESM env load order: mitigated by `import "dotenv/config"` first.
- Tests coupled to old texts: updated in RED phase.
- Removing Ctrl+Alt shortcuts: intentional (Tab/Enter native alternatives).
- Multer gif/avif: low risk, still validates mimetype + extension.

## Follow-up round (reviewer feedback + temp cleanup) — DONE

### Reviewer findings (ID-01/02/03) — DONE
- [✓] ID-01 backend: `imageProcessor.ts` reads metadata without `limitInputPixels` (sharp would throw a generic error before the explicit dimension check); `processImage` preserves `AppError` status codes instead of wrapping into 500; defense-in-depth maps sharp "pixel limit" errors to 413. Verified: 4000x6000 image → **413** `DIMENSION_LIMIT_ERROR` with clear message (was 500).
- [✓] ID-02 frontend: `api.ts` extracts `errorData.error?.message` (backend sends `{success:false, error:{message}}` object). Verified: toast shows "Image dimensions exceed allowed limit (3840x2160)", never `[object Object]`.
- [✓] ID-03 regression: `src/__tests__/utils/api.test.ts` (3 tests) with `vi.stubGlobal("fetch")` asserting real message extraction + fallback.
- [✓] E2E browser: big image → clear 413 toast; small image → success + ZIP 200 download.

### Temp file lifecycle (user report: server files never cleaned) — DONE
- Root cause: per-file TTL `setTimeout` (cleanTempFiles, 5 min) is lost on crash/restart → orphaned ZIPs in `backend/temp/output` (3 found).
- [✓] `backend/src/utils/tempCleanup.ts`: `isFileExpired` (pure), `isWithinTemp`, `cleanupDirectory` (expired regular files only, no subdirs/symlinks), `cleanupStartup` (sweep all at boot), `schedulePeriodicCleanup` (interval, unref'd, files older than `TEMP_FILE_MAX_AGE_MS`).
- [✓] `backend/src/index.ts`: `cleanupStartup()` + `schedulePeriodicCleanup(TEMP_CLEANUP_INTERVAL_MS, TEMP_FILE_MAX_AGE_MS)` (defaults 5 min / 30 min).
- [✓] Tests: `backend/src/__tests__/tempCleanup.test.ts` (9 cases). `vite.config.ts` include + `.ls-lint.yml` ignore `backend/src/__tests__`.
- Verified: 3 orphaned ZIPs removed at boot; convert → ZIP → kill → restart → orphan swept; server healthy.
- QA: `pnpm qa` green (65/65 tests), `pnpm build` green.

## Third round (validation cleanup + visible toast + footer) — DONE
- [✓] Guaranteed temp cleanup on ANY validation failure: `imageController.ts` registers `req.files` into `allTempFiles` immediately after confirming `req.files` exists (before max-files/quota/schema checks), so the error catch removes every uploaded file. Verified via curl: 2 images + invalid format → 400 → 0 files left in `temp/uploads` (was 2); 5 images → 400 → 0; oversized image 413 → 0.
- [✓] Visible toast: `.message` is now `position: fixed; top: 1rem; left: 50%; translateX(-50%); z-index: 1000; max-width: min(90vw, 480px)` with full status-color border + surface bg. Verified in browser: centered top (1277/1280 desktop, 195/195 mobile), error border color, auto-dismiss kept.
- [✓] Footer: `index.html` — "© 2026 Created by Damedsol" (link to https://github.com/Damedsol/Image_Transformer) + "Licensed under CC BY 4.0" (link to license) + nav with GitHub repo link and LinkedIn (https://www.linkedin.com/in/david-medina-soloza/). CSS: `.footer-content`, `.footer-copyright`, `.footer-links` (flex wrap, focus-visible). Verified in browser desktop + mobile.
- Note: user wrote "Damdedsol"; repo/README use "Damedsol" — kept "Damedsol" for consistency.
- QA: `pnpm qa` green (65/65), `pnpm build` green. (`.ls-lint.yml` ignore for `backend/src/__tests__` re-added after being lost.)

## Fourth round (parallel-processing cleanup race) — DONE
- [✓] Fixed residual leak: 2 images, one fails dimensions (413), the valid one's output was left in temp/output. Root cause: `Promise.all` + error catch deleted the INPUTS while other images were still processing — either orphaning the finished output in temp/output (never registered in `allTempFiles`) or failing with sharp "Input file is missing". Fix: sequential per-image processing in `imageController.ts`, registering each produced file in `allTempFiles` immediately — no race, fails fast, guaranteed cleanup (consistent with `sharp.concurrency(1)`).
- Verified via curl + debug logs: grande+pequeña → 413 → output 0 / uploads 0, zero "Input file is missing" (the only occurrence is from the pre-fix pid log); two valid images → 200 + ZIP + "Immediate cleanup completed".
- QA: `pnpm qa` green (65/65), `pnpm build` green.
