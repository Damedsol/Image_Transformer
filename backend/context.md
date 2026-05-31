# 🧠 Project Context & Learnings: Backend

This document records the localized technical context, errors, and specific architectural decisions for the backend subproject.

## 🚀 Stack & Configuration (Learnings)

- **Runtime & Framework:** Node.js backend using Express and TypeScript.
- **Dependency Management:** Managed as a workspace package under the main `pnpm` monorepo.
  - Legacy `pnpm` config block was removed from `backend/package.json` to comply with pnpm v11 workspace standards.
- **Quality Control (Local Specifics):**
  - **Oxlint:** Local configurations in `backend/.oxlintrc.json` specialize the linter rules for `node` environments.
  - **Biome:** There is no local `biome.json`. Formatting and imports are delegated entirely to the root `biome.json` to prevent nested configuration errors in Biome CLI. Global variables for backend (`Express`, `NodeJS`, `process`, `console`) are defined in the root config.
- **Naming Conventions (ls-lint):**
  - All source files inside `backend/src/**` (including controllers, middlewares, routes, and utils) must follow strict `camelCase` naming conventions.

## 🧠 Strategic Decisions

- **Strict Environment Separation:** Oxlint rules are tailored to prevent browser-specific global assumptions inside backend code, raising warnings if non-Node globals are referenced.
- **No Anidamiento de Biome:** By policy, all backend file formatting runs through the root CLI, utilizing shared workspace options.
