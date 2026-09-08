# Project Context — imageTransformer

> Stable project context (stack, strategic decisions). This file is NOT
> compressed. For the changing log, see `.agents/context/history.md`.

## Stack and Configuration

- **pnpm v11 monorepo:** Root `imagetransformer` (frontend SPA) + backend `image-transformer-backend` (Express API). Resolution mode lowest-direct, engineStrict, hoist. `pnpm-workspace.yaml` catalog (`catalog:`) is the single source of truth for shared versions (never pin inline versions declared in the catalog).
- **Frontend:** TypeScript 6 + Vite 8 + Vitest 4 + jsDOM 29. Vanilla Web Components + Iconoir icons + Neon-Code UI Kit.
- **Backend:** Express 5 + Sharp 0.34 + Multer + Zod 4 + Helmet + Pino. ESM (`"type": "module"`) — local imports must include `.js` extension. Dev via `tsx watch` (NOT ts-node). Use the Pino logger, never `console.log`.
- **Quality:** Biome v2 (single root formatter config), Oxlint v1 (linter, correctness-only, per-env `.oxlintrc.json`), lint-filenames (script: naming), Husky v9 + lint-staged + commitlint.
- **Docker:** Multi-stage Node 24 Alpine + Nginx Alpine. `docker-compose.yml` (dev) + `docker-compose.prod.yml` (prod, zero-exposed ports, internal network). Build context is root for BOTH services (needs catalog); all `pnpm install` use `--ignore-scripts`.
- **Tests:** Vitest + jsDOM, globals enabled, setup `src/__tests__/setup.ts`. 9 test files / 72 tests, TDD mandatory. Backend suite covers license-consistency + tempCleanup.
- **File naming (lint-filenames, `.ls-lint.json`):** dirs kebab-case; `src/components/` PascalCase; `src/utils/` camelCase; `backend/src/{controllers,middlewares,routes,utils}/` camelCase; `.md` kebab-case | SCREAMING_SNAKE_CASE; tests `*.test.ts` in `src/__tests__/`.

## Strategic Decisions

- **Framework Zero:** Vanilla Web Components + TypeScript retained. No React/Vue/Lit.
- **Iconoir v7:** Icons vendored verbatim as SVGs in `assets/icons/`, imported via Vite `?raw`, normalized (`normalizeSvg`) into a geometry registry, rendered via `createElementNS` + `setAttribute` (viewBox 0 0 24 24, fill none, stroke-width 1.75, square/miter — cyberpunk-flat). Replaced Lucide on 2026-08-27. Footer brand icons (github/linkedin) included.
- **Neon-Code UI Kit:** `:root` tokens (#0f1016, #b9f27c, #161b22), dark default + light via `prefers-color-scheme`. Figtree + IBM Plex Mono local in `assets/fonts/`. Law of Irradiation (max font-weight 500 on light text), Law of Dual Fonts (Figtree UI, Mono data), 7:1 AAA contrast. No box-shadow / gradients / backdrop-filter / border-radius > 4px.
- **JSDOM Custom Elements:** reactions wrapped by `invokeCEReactions`; `connectedCallback` must be a no-op when attributes are missing. Tests must import components explicitly to trigger `customElements.define()`.
- **Oxlint/Biome transition:** ESLint/Prettier fully removed. `.prettierrc` + `eslint.config.js` are empty stubs to suppress IDE-extension warnings — do not add config to them.
- **License/Attribution:** Single source `CC BY 4.0`; SPDX `CC-BY-4.0` (root + backend `package.json`); footer `Damedsol · Licensed under CC BY 4.0` (no ©); OFL 1.1 shipped for fonts; `THIRD_PARTY_NOTICES.md` at repo root.

## Agent Harness

- Harness lives in `.agents/` (manifest, checkpoint, context, docs, skills). Root `AGENTS.md` is the canonical governance file. Entrypoints to other tools point to `AGENTS.md`.
