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
- **2026-08-10:** .ia/ harness updated — English only, no global skill names
  - Detail: Rewrote `.ia/AGENTS.md`, `project_manifest.yml` and `memory/context.md` in English. Unified agent directives to English-only (root AGENTS.md chat policy is English). Kept the no-global-skill-name rule: only the project-local skill `code-quality` (`.agents/skills/`) is named; global skills are referenced generically. Registered `.agents/skills/` in relevant_folders and updated the manifest date.
  - QA: YAML valid, line limits respected (root AGENTS.md 114, .ia/AGENTS.md 100, context.md <200).
- **2026-07-14:** Full Neon-Code UI Kit migration
  - Detail: Implemented tn-icon, neon-code style.css, and 4 migrated components. 46 TDD tests passing. Type-check/lint/format clean.
  - QA: `pnpm test` 46/46, `pnpm type-check` 0 errors, `pnpm lint` 0 errors, `pnpm format` no fixes.
  - Pending commits: Review staged files and create conventional commit.
