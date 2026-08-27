# AGENTS.md — imageTransformer

pnpm monorepo. Frontend: Vanilla Web Components + Vite + TypeScript. Backend: Express 5 + Sharp. Node >=24.0.0, pnpm >=11.0.0.

## Profile

- **Chat:** respond in ENGLISH, no greetings, no filler.
- **Artifacts (code, commits, docs, logs):** ENGLISH only.
- **Auto-self-review:** validate syntax, imports, and types before marking done.
- **No auto-runs:** do not run `tsc`, lint, or formatter unless asked. Propose the command instead.

## Workspace layout

```
.                         → package "imagetransformer" (frontend Vite app)
backend/                  → package "image-transformer-backend" (Express/Sharp API)
```

- All dependencies are resolved from the root; there is no per-package `node_modules`.
- `pnpm-workspace.yaml` holds the **catalog** (`catalog:`) — devDependencies reference it as `"catalog:"`. The catalog is the single source of truth for shared versions. Never add version numbers inline that are declared in the catalog.
- `pnpm-workspace.yaml` also enforces `preferFrozenLockfile: true`, `strictPeerDependencies: true`, `engineStrict: true`, and `blockExoticSubdeps: true`. Any install or add that violates these will fail.

## Dev commands (from root)

All commands are centralized in the root `package.json`. Frontend (Vite :5173) and backend (tsx watch :3001) run concurrently via `concurrently`.

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev (FE + BE) | `pnpm dev` |
| Dev frontend only | `pnpm dev:frontend` (Vite on :5173) |
| Dev backend only | `pnpm dev:backend` (tsx watch on :3001) |
| Build all | `pnpm build` (backend tsc → frontend tsc + vite build) |
| Build frontend | `pnpm build:frontend` |
| Build backend | `pnpm build:backend` |
| QA (type → lint → fmt → test) | `pnpm qa` |
| Type-check (FE + BE) | `pnpm type-check` |
| Type-check frontend | `pnpm type-check:frontend` |
| Type-check backend | `pnpm type-check:backend` |
| Lint (FE + BE + filenames) | `pnpm lint` |
| Lint frontend | `pnpm lint:frontend` |
| Lint backend | `pnpm lint:backend` |
| Format (write) | `pnpm format` (biome format --write) |
| Format check | `pnpm format:check` |
| Tests | `pnpm test` (vitest run) |
| Tests watch | `pnpm test:watch` |

**Backend start (compiled):** `pnpm --filter image-transformer-backend start`.

## File naming (enforced by lint-filenames in `pnpm lint`/`pnpm qa`)

| Location | Rule | Example |
|----------|------|---------|
| All directories | `kebab-case` | `src/components/` |
| `src/components/` | `PascalCase` | `ImagePreview.ts` |
| `src/utils/` | `camelCase` | `fileUtils.ts` |
| `backend/src/controllers/` | `camelCase` | `imageController.ts` |
| `backend/src/middlewares/` | `camelCase` | `errorMiddleware.ts` |
| `backend/src/routes/` | `camelCase` | `imageRoutes.ts` |
| `backend/src/utils/` | `camelCase` | `logger.ts` |
| `.md` files | `kebab-case` or `SCREAMING_SNAKE_CASE` | `README.md` |
| Test files | `*.test.ts` (in `src/__tests__/`) | `DropZone.test.ts` |

## Toolkit specifics

- **Biome** (`biome.json`): **formatter only** (linter is `"enabled": false`). Tabs, width 2, double quotes, trailing commas, LF. Organize imports on save.
- **Oxlint** (`.oxlintrc.json`): **correctness errors only** — no style rules. Two env-specific configs exist: root (browser) and `backend/` (node).
- **lint-filenames** (`.ls-lint.json`): validates file/dir names via `scripts/lint-filenames.mjs` (zero-dep Node replacement for the unmaintained `@ls-lint/ls-lint`). Ignores `.husky/`, `.git/`, `node_modules/`, `dist/`, `build/`, `.agents/`, `assets/`, `src/__tests__/`.
- **`eslint.config.js`** and **`.prettierrc`** are empty stubs — **do not add configuration to them**. They exist only to suppress tool warnings from IDE extensions. All lint and format config lives in `biome.json` + `.oxlintrc.json`.
- **commitlint** validates Conventional Commits via the `commit-msg` hook. No non-standard commit types.

## Pre-commit hook (execution order matters)

1. `tsc --noEmit` (type-check from root `tsconfig.json` — covers `src/` only)
2. `lint-staged` → `oxlint --fix` + `biome format --write --no-errors-on-unmatched`

If type-check fails, the entire commit is blocked. Use `--no-verify` only when the user explicitly requests it.

## Testing

- **Framework:** Vitest with globals enabled (`describe`, `it`, `expect`, `vi` available without imports).
- **Environment:** `jsdom`.
- **Setup:** `src/__tests__/setup.ts` (polyfills `matchMedia`, `getComputedStyle`, cleans DOM between tests).
- **Test location:** `src/__tests__/**/*.test.ts`.
- **Helpers:** `src/__tests__/helpers/dom.ts` — `mount(tagName)`, `html`, `createMockFile`, `createFileList`.
- **Run single test file:** `pnpm vitest run src/__tests__/components/DropZone.test.ts`
- **No backend test suite exists.**

## Backend quirks

- **ESM:** backend uses `"type": "module"`. Local imports **must** include `.js` extension (e.g., `import { imageRoutes } from "./routes/imageRoutes.js"`). TSC does not rewrite extensions.
- **Dev server:** uses `tsx watch --clear-screen=false`, NOT `ts-node` or `ts-node-dev`. The `ts-node` and `nodemon` devDependencies are legacy.
- **Logger:** Pino (`backend/src/utils/logger.ts`). Always use the logger instance instead of `console.log`.
- **Zod 4:** for request validation. Zod v4 has different API surface than v3 — check imports.
- **Express 5:** async error handling is native (no `express-async-errors` needed).

## Frontend architecture

- Entry: `src/main.ts` → mounts `<image-converter>` into `#app` on `DOMContentLoaded`.
- Components: Vanilla Web Components (`customElements.define`), imported as side-effects.
- Styles: `src/style.css` + component-scoped CSS via Shadow DOM where used.
- API client: `src/utils/api.ts` — uses relative `/api` in production (nginx proxy), absolute `http://localhost:3001/api` in dev.
- Icons: Iconoir — 9 SVGs vendored in `assets/icons/` (upload, trash, download, media-image, check-circle, warning-circle, settings, github, linkedin), imported via Vite `?raw` into the `<tn-icon>` Web Component (`src/components/TnIcon.ts`). Rendered with `stroke-width` 1.75 and `square`/`miter` stroke (cyberpunk-flat). Not iconoir-react — this is vanilla.

## Docker

- Two compose files: `docker-compose.yml` (dev) and `docker-compose.prod.yml`.
- **Build context is root (`.`) for BOTH services** — because they need `pnpm-workspace.yaml` and catalogs. The Dockerfiles are at `Dockerfile` (frontend) and `backend/Dockerfile`.
- Dev uses `:delegated` volume mounts for hot-reload. Prod uses nginx-alpine for frontend and zero-exposed ports (internal Docker network only).
- All `pnpm install` in Dockerfiles use `--ignore-scripts` to skip husky `prepare` in the container.

## Agent governance & knowledge management

- `AGENTS.md` (this file): canonical governance — technical standards, dev commands, tooling, safety gates.
- `.agents/` (harness): `project_manifest.yaml` (workspace mapping), `checkpoint.yml` (pipeline state), `context/` (memory), `docs/` (ADR + specs), `skills/` (project-local).
- **Mandatory reading:** `.agents/context/project.md` + `.agents/context/history.md` at the start of every session.
- **Continuous update:** `.agents/context/history.md` after significant changes, critical error resolutions, or at end of session.
- **Compression:** keep `history.md` under 200 lines — keep the last 3 records, consolidate older ones into a "Consolidated History" paragraph. `project.md` is stable and never compressed.

## Safety gates

- Never run interactive prompts (`nano`, `vim`, etc.) or destructive commands (`rm -rf`) without confirmation.
- Never leave conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in files.
- Changing `.env`, adding dependencies (`pnpm add`), or running DB migrations requires explicit user confirmation.
- 3 consecutive failures on any automated task → abort, log to `.agents/context/error.log`, return control to user.
- No auto-commit or auto-push. Present `git add` + `git commit` as a copy-paste block.
