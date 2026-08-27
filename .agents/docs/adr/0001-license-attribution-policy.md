# ADR-0001: License & Attribution Policy

- **Status:** Accepted
- **Date:** 2026-08-17
- **Deciders:** User + pipeline (plan → build → reviewer ✅ → scribe)
- **Related plan:** 2026-08-17 footer-license-consistency (plan file removed after archival; see `.agents/docs/specs/license-attribution.md`)

## Context

The repo presented legal/attribution incongruences: the footer used a bare
`© 2026 Created by Damedsol` (all-rights-reserved framing) next to a CC BY 4.0
grant; `.agents/project_manifest.yaml` declared `CC BY-NC-SA 4.0` while every other
file said `CC BY 4.0`; `README.md` linked the license via a machine-local
`file:///` path; bundled fonts (Figtree, IBM Plex Mono) shipped without their
OFL 1.1 license text (violating OFL condition 2); and no third-party notices
documented runtime dependency licenses.

## Decision

1. **Single license source of truth:** `CC BY 4.0` everywhere (LICENSE.md,
   README, docs, footer, manifest, package.json SPDX `CC-BY-4.0`).
2. **Footer attribution without `©`:** the footer states
   `Damedsol · Licensed under CC BY 4.0`. The `©` symbol and `Created by`
   framing are removed — CC BY is a copyright license, but the bare `©`
   reads as all-rights-reserved and contradicts the grant. User decision:
   "el simbolo de copyright no tiene sentido".
3. **OFL compliance:** bundled fonts must ship their OFL 1.1 text +
   exact upstream copyright line (`assets/fonts/<Font>/OFL.txt`).
4. **Third-party notices:** runtime dependency licenses documented in
   `THIRD_PARTY_NOTICES.md` (project root; MIT/Apache-2.0/BSD-2-Clause/OFL-1.1
   + Iconoir MIT for vendored icons). Moved from `docs/` to root on
   2026-08-27; `lucide` (ISC) removed after the 2026-08-27 Iconoir migration.
5. **Regression guard placement:** the fs-based license-consistency test
   lives in the **backend suite** (`backend/src/__tests__/`) because the
   frontend tsconfig restricts `types: ["vitest/globals"]` (no node types
   for `fs`/`path`/`process`). Backend tsconfig includes `src/**/*.ts` with
   `@types/node` available.

## Consequences

- **Positive:** consistent legal metadata; OFL redistribution obligations
  satisfied; portable docs (no `file:///`); automated guard prevents
  reintroduction of `CC BY-NC-SA`/`©`/`file:///`.
- **Negative:** the consistency test reads repo-root files via `process.cwd()`
  — it assumes vitest runs from the repo root (true for `pnpm test`/`pnpm qa`).
- **Trade-off accepted:** `©` removed from footer per user preference, even
  though CC's own recommended attribution format may include it.

## Alternatives considered

- **Keep `©` (CC-standard format):** rejected by user — "el simbolo de
  copyright no tiene sentido".
- **Frontend test placement:** rejected — would require adding `@types/node`
  to the frontend tsconfig (pollutes browser types) or a new dependency.
- **Full CC legal code in LICENSE.md:** deferred (out of scope); current
  human-readable summary + link retained.