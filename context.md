# 🧠 Project Context & Learnings: Root

This document dynamically records technical learnings, solved errors, architectural decisions, and the active changelog during development.

## 🚀 Stack & Configuration (Learnings)

- **Monorepo (pnpm workspace v11):**
  - Configured without `.npmrc` for monorepo options. Resolution mode, hoisting, and other workspace-wide configurations are declared in `pnpm-workspace.yaml` in camelCase.
  - The obsolete `pnpm` block in `package.json` was completely removed from both root and backend, as pnpm v11 ignores it.
  - Centralized all `overrides` and `allowBuilds` directives within `pnpm-workspace.yaml`.
- **Quality Control (Oxlint & Biome):**
  - **Oxlint:** Replaces ESLint. Configured via `.oxlintrc.json` in the root (for `browser` environment) and `backend/.oxlintrc.json` (for `node` environment). It automatically applies the closest configuration file relative to the execution directory.
  - **Biome (Unified):** Unified configuration in a single `biome.json` at the root to avoid nested root configuration errors banned by Biome CLI. Binds common JS, Node.js, Express, process, and console globals.
  - **Resilient Formatting:** Enabled `formatter.formatWithErrors: true` in `biome.json` so Biome formatting can proceed even with temporary syntax errors in files being actively edited or refactored.
- **File Structure Verification (ls-lint):**
  - Configured in `.ls-lint.yml` to apply strict, segmented, and fast naming rules instead of generic global regex:
    - **Directories:** Strictly `kebab-case` globally.
    - **Frontend Components (`src/components/`):** Strictly `PascalCase` (e.g., `ConversionOptions.ts`).
    - **Frontend Utils (`src/utils/`):** Strictly `camelCase` (e.g., `fileUtils.ts`).
    - **Backend Code (`backend/src/**`):** Controllers, middlewares, routes, and utils must be strictly `camelCase` (e.g., `imageController.ts`, `errorMiddleware.ts`, `imageRoutes.ts`).
    - **Documentation (`.md`):** Strictly `kebab-case | screamingsnakecase` to allow standard uppercase names like `README.md` or `LICENSE.md`.
    - **Exclusions:** `.husky`, `.git`, `node_modules`, and `backend/node_modules`.
- **Pre-commit Hooks (lint-staged):**
  - Configured in `.lintstagedrc` to execute `oxlint --fix` and `biome format --write --no-errors-on-unmatched` on staged files. The `--no-errors-on-unmatched` flag is critical to prevent CLI errors when lint-staged feeds it files that do not match configured glob patterns.
- **Docker Orchestration (Separated & Parameterized):**
  - **Local Development:** Simplified root `docker-compose.yml` strictly focused on `development` targets with direct volume mounts for instant hot-reloading. Removed complex `profiles`.
  - **Production/VPS Deployment:** Created `docker-compose.prod.yml` with secure container execution (`security_opt: ["no-new-privileges:true"]`, `init: true`), RAM memory limits (backend: `512M`, frontend: `256M`), strict JSON log rotation, and dynamic reverse-proxy external network configuration mapping via variables (like `DOCKER_PROXY_NETWORK` defaulting to `proxy-tier`).

## 🧠 Strategic Decisions

- **Complete Transition to Oxlint & Biome:** Completely removed legacy ESLint and Prettier setups to maximize execution speed, code consistency, and reduce dependency weight.
- **Strict File Naming Alignment:** Implemented `ls-lint` to automate file and directory naming standards across frontend and backend directories, catching invalid structures before commit.

## 📈 Relevant Changelog

- **2026-05-31: Bump Version to 1.3.0 & Align Workspace Documentation**
  - **Details:** Released stable version `1.3.0` across workspace scopes (root and backend package.json files). Conducted a full documentation audit to align all setup manuals and structural logs. Completely removed obsolete `--profile` flags from Docker Compose sections, transitioning configurations to clean, separate environment files (`docker-compose.yml` for development, `docker-compose.prod.yml` for production). Updated `docs/LOGGING.md` to match the actual production log rotation policies (`json-file` driver with strict sizes).
  - **QA Verification:** Inspected packages versions, checked markdown integrity across the `/docs` folder, and verified linter/formatter compliance.
  - **Associated Branch:** `release/1.3.0`

- **2026-05-31: Centralize Linters and pnpm Workspace Configuration**
  - **Details:** Centralized overrides, package config, Oxlint settings, unified Biome config, and ls-lint directory structure. Configured pre-commit hooks via Husky and lint-staged using fast tools (Oxlint, Biome).
  - **QA Verification:** Ran linting, formatting, and verified workspace build successfully.
  - **Associated Branch:** `feature/linter-and-dependencies` (now merging to `develop` / transitioned to `feature/agentic-system`).
- **2026-05-31: Reconstruct Repository Documentation using readme-generator Workflow**
  - **Details:** Completely updated the main README.md. Standardized formatting using Biome/Oxlint, removed legacy references to ESLint and Prettier, aligned scripts with the pnpm monorepo setup, and integrated UI Style Guides/Badges structure. Synchronized engine requirements (Node.js >=24.0.0 and pnpm >=11.0.0) in both root and backend workspace scopes.
  - **QA Verification:** Verified document links, markdown formatting, and engines compliance.
  - **Associated Branch:** `feature/docker-system` (current active feature).
- **2026-05-31: Documentation Folder Quality Audit & Global Updates**
  - **Details:** Fully audited and rewritten the `/docs` manual folders (`docs/README.md`, `docs/DOCKER.md`, `docs/LOGGING.md`, `docs/INDEX.md`). Removed all obsolete `npm run docker:*` scripts, migrated commands to modern `docker compose` syntax, documented Biome/Oxlint/ls-lint quality checks, and aligned internal versions with Node.js >=24.0.0 and pnpm >=11.0.0 engines.
  - **QA Verification:** Validated cross-references, paths, and markdown rendering inside `/docs`.
  - **Associated Branch:** `feature/docker-system` (current active feature).
- **2026-05-31: Refactor and Simplify Docker Container Infrastructure**
  - **Details:** Separated dev and prod setups into clean individual compose files (`docker-compose.yml` and `docker-compose.prod.yml`). Standardized security configurations, log-rotation caps, and process initializations. Integrated dynamic external network support for VPS proxy compatibility without exposing private environment assets.
  - **QA Verification:** Inspected schema definitions, local build configs, and documentation structure.
  - **Associated Branch:** `feature/docker-system` (current active feature).
