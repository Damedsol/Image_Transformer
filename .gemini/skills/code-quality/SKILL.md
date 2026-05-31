# Gemini CLI Code Quality Skill: Unified Formatting & Linting (Biome, Oxlint, ls-lint)

This skill provides comprehensive instructions and rules for Gemini CLI to analyze, format, and lint codebases using high-performance Rust-based toolchains inside Monorepos.

## Table of Contents

1. [CLI Operational Commands](#cli-operational-commands)
2. [Critical Execution Rules](#critical-execution-rules)
3. [The "Do Not" List for CLI Agents](#the-do-not-list-for-cli-agents)
4. [Monorepo Setup Guidelines](#monorepo-setup-guidelines)
5. [References](#references)

---

## CLI Operational Commands

When performing formatting or quality checks via CLI commands, use the following exact commands to prevent pipeline errors:

- **Format Staged Files (resilient):**
  `biome format --write --no-errors-on-unmatched <files>`
- **Run Oxlint (ultra-fast):**
  `oxlint --fix`
- **Verify File Naming:**
  `ls-lint`

---

## Critical Execution Rules

1. **Leverage Single Configurations:** Never suggest creating subfolder `biome.json` files. Always operate using the unified root `biome.json`.
2. **Apply Local Oxlint Contexts:** When working in a specific package folder (like `backend/`), execute `oxlint` from that directory or let it resolve `.oxlintrc.json` locally.
3. **Prevent Pre-commit Failures:** Always append `--no-errors-on-unmatched` when running biome commands on file lists inside hooks.

---

## The "Do Not" List for CLI Agents

- **DO NOT** execute commands that trigger interactive prompts (e.g. `npm init`, `eslint --init`) in automated CLI environments.
- **DO NOT** install obsolete linters (ESLint/Prettier) unless explicitly asked by the user.
- **DO NOT** use `git add .` after formatting; stage only the modified files explicitly.

---

## Monorepo Setup Guidelines

For standard monorepos managed with `pnpm` workspaces, enforce:
- Root-level configuration of Biome.
- Directory-level configurations of Oxlint.
- Precise `ls-lint` configurations to structure components and controllers.

---

## References

For deeper configuration details, refer to the following:
- **Biome Configuration:** See [biome-rules.md](file:///projects/Github/imageTransformer/.gemini/skills/code-quality/references/biome-rules.md) for custom formatting options.
- **Oxlint & ls-lint Structure:** See [oxlint-lslint.md](file:///projects/Github/imageTransformer/.gemini/skills/code-quality/references/oxlint-lslint.md) for environment setup and folder rules.

---

*Updated: May 31, 2026 - 16:49*
