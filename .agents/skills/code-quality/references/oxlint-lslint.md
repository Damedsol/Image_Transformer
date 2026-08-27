# Oxlint & lint-filenames Code Quality Integration

This reference document covers advanced configurations, environment specialization, and directory rules for using Oxlint (high-speed linting) and lint-filenames (file-system naming checks) inside monorepos.

## Quick Start (Oxlint configuration)

Oxlint uses simple JSON configuration files (`.oxlintrc.json`) that are automatically resolved based on the execution context.

A basic root configuration for a browser-based environment:

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "plugins": ["react", "unicorn"],
  "env": {
    "browser": true,
    "es2022": true
  },
  "rules": {
    "eqeqeq": "warn",
    "no-debugger": "error",
    "no-unused-vars": "warn"
  }
}
```

---

## Standard Pattern (Monorepo Segmentation)

In monorepos containing both frontend and backend modules, environment-specific rules must be strictly separated.

### Frontend Config (Root `.oxlintrc.json`):
```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "plugins": ["react", "jsx-a11y"],
  "env": {
    "browser": true
  },
  "rules": {
    "no-console": "warn"
  }
}
```

### Backend Config (`backend/.oxlintrc.json`):
```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "env": {
    "node": true
  },
  "rules": {
    "no-console": "off",
    "no-process-exit": "warn"
  }
}
```

---

## Directory Structuring with lint-filenames

`lint-filenames` (`scripts/lint-filenames.mjs`) ensures clean monorepo architecture without allowing chaotic file naming choices that can break server builds or module imports. It is a self-contained, zero-dependency Node replacement for the unmaintained `@ls-lint/ls-lint`; the config is `.ls-lint.json`.

### Standard `.ls-lint.json` Configuration:

```json
{
	"ls": {
		".dir": "kebab-case",
		".js": "camelCase",
		".ts": "camelCase",
		".tsx": "PascalCase",
		"src/components": { ".dir": "PascalCase", ".tsx": "PascalCase" },
		"backend/src": { ".dir": "kebab-case", ".ts": "camelCase" }
	},
	"ignore": [".git", ".husky", "node_modules", "backend/node_modules", "dist", "build"]
}
```

---

## Advanced & Edge Cases

### 1. Oxlint Integration with Lint-staged
Oxlint runs in microseconds, making it perfect for pre-commit hooks.
To execute oxlint on changed files automatically:

```json
{
  "*.{js,ts,tsx}": "oxlint --fix"
}
```

### 2. Overlapping File Extensions in lint-filenames
If some `.md` files should be uppercase (like `README.md` or `LICENSE.md`) but others should be kebab-case (like `release-notes.md`), use multiple rules in `.ls-lint.json`:

```json
{ "ls": { ".md": "kebab-case | screamingsnakecase" }, "ignore": [] }
```

This pattern allows both standard documentation standards to coexist flawlessly.

---

## Common Mistakes & Anti-Patterns ("The Do Not List")

- **DO NOT** use global regular expressions like `.*` in `lint-filenames` configurations. This slows down the scan and introduces false negatives on directories that should have been ignored.
- **DO NOT** run Oxlint using slow Node wrapper scripts if native pre-compiled binaries are available for your operating system.
- **DO NOT** add conflicting rules in `.oxlintrc.json` that overlap with Biome's formatting capabilities, such as indentation or quote style warnings. Keep Oxlint strictly focused on logical warnings.

---

*Updated: May 31, 2026 - 16:49*
