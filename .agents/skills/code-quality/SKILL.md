# Code Quality Skill: Unified Formatting & Linting (Biome, Oxlint, ls-lint)

This skill provides comprehensive context, architectural patterns, and operational rules for maintaining code consistency, styling, linting, and directory structuring across Monorepos using modern toolchains.

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Critical Operational Rules](#critical-operational-rules)
3. [Ecosystem Overview](#ecosystem-overview)
4. [The "Do Not" List (Anti-Patterns)](#the-do-not-list-anti-patterns)
5. [Quick Start (Simple Projects)](#quick-start-simple-projects)
6. [Standard Pattern (Standard Workspace)](#standard-pattern-standard-workspace)
7. [Advanced & Edge Cases (Complex Monorepos)](#advanced--edge-cases-complex-monorepos)
8. [References & Deep Dives](#references--deep-dives)

---

## Core Philosophy

Traditional linters and formatters (like ESLint and Prettier) suffer from severe performance bottlenecks and configuration complexity in large-scale codebases. This skill establishes a high-performance, unified alternative leveraging Rust-based tooling:
- **Zero Configuration Conflict:** Separate formatting/import organization (Biome) from logical rule validation (Oxlint).
- **Structural Integrity:** Validate file-system layout rules (ls-lint) dynamically rather than through expensive custom linter rules.
- **Pre-commit Speed:** Perform all checks in milliseconds using pre-compiled binaries via `lint-staged`.

---

## Critical Operational Rules

1. **One Biome Config to Rule Them All:** Never allow nested `biome.json` files within monorepo subpackages. Biome CLI does not support nested configurations gracefully and will trigger lookup failures.
2. **Segmented Oxlint Rules:** Use discrete `.oxlintrc.json` configs inside target folders (e.g., `backend/`, `frontend/`) to explicitly map specific execution environments (Node.js vs. Browser).
3. **Resilient Formatting in Pre-commits:** Always use `formatter.formatWithErrors: true` in `biome.json` to allow hot-reloads and continuous formatting on active development branches.
4. **No-Errors-On-Unmatched Flag:** When invoking Biome on staged files, append the `--no-errors-on-unmatched` flag to prevent CLI pipeline failures when certain file types do not match standard configs.

---

## Ecosystem Overview

- **Biome:** A single, fast tool that formats code and organizes imports.
- **Oxlint:** An extremely fast linter designed to catch bugs and bad patterns without requiring Node.js startup overhead.
- **ls-lint:** A file-system and directory linter that checks naming rules (PascalCase, camelCase, kebab-case) in sub-milliseconds.

---

## The "Do Not" List (Anti-Patterns)

- **DO NOT** install Prettier or ESLint as devDependencies. They conflict with Biome and Oxlint and slow down development pipelines.
- **DO NOT** use complex regex patterns globally in `ls-lint`. Map explicit rules to target directories to avoid false negatives.
- **DO NOT** let lint-staged execute `git add` at the end of the script in modern Git versions. This is handled automatically.

---

## Quick Start (Simple Projects)

For a single-package project:
- Define `biome.json` in the root.
- Define `.oxlintrc.json` in the root.
- Define `.ls-lint.yml` in the root.
- Configure `.lintstagedrc` to process `.js`, `.ts`, `.tsx`, and `.json` files.

---

## Standard Pattern (Standard Workspace)

For a multi-package pnpm monorepo:
1. Place a single `biome.json` in the root.
2. Define `.oxlintrc.json` in subpackages where environment globals differ (e.g., `browser` for web frontend, `node` for API servers).
3. Centralize naming policies inside `.ls-lint.yml` using precise directory exclusions.

---

## Advanced & Edge Cases (Complex Monorepos)

For details on advanced monorepo rules, configuration syntax, pre-commit pipelines, performance debugging, and template structures, refer to the dedicated reference documents:
- **Biome Reference:** See [biome-rules.md](file:///projects/Github/imageTransformer/.agents/skills/code-quality/references/biome-rules.md) for custom rules and error handling.
- **Oxlint & ls-lint Reference:** See [oxlint-lslint.md](file:///projects/Github/imageTransformer/.agents/skills/code-quality/references/oxlint-lslint.md) for custom environment mappings and directory structures.

---

*Updated: May 31, 2026 - 16:49*
