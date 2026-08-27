# Spec: License & Attribution Consistency

> Consolidated from plan 2026-08-17 (footer-license-consistency; plan file removed after archival).
> Status: all requirements implemented and verified on **2026-08-17** (reviewer ✅ APPROVED).

## Canon

| Term | Canon value | Source of truth |
|------|-------------|-----------------|
| Project license | **CC BY 4.0** (Creative Commons Attribution 4.0 International) | `LICENSE.md` |
| SPDX id | `CC-BY-4.0` | `package.json` (root + backend) |
| Author handle | `Damedsol` | GitHub/Gitea owner |
| GitHub repo | `Damedsol/Image_Transformer` | footer + README links |
| Fonts | Figtree + IBM Plex Mono — **SIL OFL 1.1** | `assets/fonts/*/OFL.txt` |

## Requirements

- [✓] **R1 — Footer attribution (2026-08-17):** `index.html` footer reads `Damedsol · Licensed under CC BY 4.0`. No `©` symbol, no `Created by` framing (user decision: "el simbolo de copyright no tiene sentido"). CC BY is a copyright license; the attribution states the grant without an all-rights-reserved implication.
- [✓] **R2 — Footer README link (2026-08-17):** `<nav class="footer-links">` includes `README` → `https://github.com/Damedsol/Image_Transformer#readme`.
- [✓] **R3 — CSS class (2026-08-17):** `.footer-copyright` → `.footer-attribution` in `index.html` + `src/style.css` (4 selectors). No residual references.
- [✓] **R4 — Manifest license (2026-08-17):** `.ia/project_manifest.yml` → `license: "CC BY 4.0"` (was the only file with `CC BY-NC-SA 4.0`).
- [✓] **R5 — README license link (2026-08-17):** `file:///projects/Github/...` → `./LICENSE.md` (relative, portable). No `file:///` references remain.
- [✓] **R6 — package.json SPDX (2026-08-17):** `"license": "CC-BY-4.0"` in root + `backend/package.json`.
- [✓] **R7 — Font licenses shipped (2026-08-17):** `assets/fonts/Figtree/OFL.txt` (Copyright 2022 The Figtree Project Authors) + `assets/fonts/IBM_Plex_Mono/OFL.txt` (Copyright © 2017 IBM Corp., Reserved Font Name "Plex"). Full OFL 1.1 text (PREAMBLE/DEFINITIONS/PERMISSION/TERMINATION/DISCLAIMER). OFL condition 2 requires the license to accompany redistribution.
- [✓] **R8 — Third-party notices (2026-08-17, path updated 2026-08-27):** `THIRD_PARTY_NOTICES.md` (project root) — runtime deps (express/multer/zod/pino/helmet/cors/archiver/express-rate-limit MIT; sharp Apache-2.0; dotenv BSD-2-Clause) + fonts (OFL-1.1) + bundled icons (Iconoir MIT). Moved from `docs/` to root on 2026-08-27; `lucide` removed (replaced by Iconoir in the 2026-08-27 icon migration).
- [✓] **R9 — Memory (2026-08-17):** change-history entry in `.ia/memory/context.md` incl. reviewer verdict.

## Regression Guard

- [✓] `backend/src/__tests__/license-consistency.test.ts` (6 cases, 2026-08-17): license string consistency (no `CC BY-NC-SA`), no `file:///`, footer attribution (no `©`/`Created by`), README link, OFL.txt presence, SPDX ids. Placed in the **backend suite** because the frontend tsconfig restricts `types: ["vitest/globals"]` (no node types for `fs`).

## Acceptance Criteria (verified)

- Zero `CC BY-NC-SA` references (except test negative assertions).
- Zero `file:///` references (except test negative assertion).
- Footer without `©`/`Created by`; README link present.
- Both `OFL.txt` files present with 6 OFL sections.
- `pnpm qa` green (71/71 tests) + `pnpm build` green.