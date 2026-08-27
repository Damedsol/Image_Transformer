# ADR-0002: Iconoir Icon Migration (replaces Lucide)

- **Status:** Accepted
- **Date:** 2026-08-27
- **Deciders:** User + pipeline (plan → build → reviewer ✅ → scribe)
- **Related plan:** 2026-08-27 Lucide→Iconoir migration (plan carried in-thread, not persisted to `.ia/docs/`)

## Context

The frontend used the `lucide` package (`lucide@1.24.0`) as its icon source,
rendered through the `<tn-icon>` Web Component (`src/components/TnIcon.ts`).
Lucide shipped no **brand icons** (Github/Linkedin/Twitter were removed from
the library), while the UI footer required GitHub + LinkedIn brand icons.
Additionally, `lucide` was the only remaining runtime dependency in the
frontend `package.json`.

## Decision

1. **Replace `lucide` with Iconoir** (MIT, larger set, includes brand icons
   `Github` and `Linkedin`).
2. **Vendor icon SVGs** into `assets/icons/` (`upload.svg`, `trash.svg`,
   `download.svg`, `media-image.svg`, `check-circle.svg`, `warning-circle.svg`,
   `settings.svg`, `github.svg`, `linkedin.svg` — kebab-case, verbatim from
   `iconoir/icons/regular/`).
3. **Import via Vite `?raw`** in `TnIcon.ts`; a `normalizeSvg()` helper strips
   the `<svg>` wrapper + presentational attributes, leaving only geometry
   (`<path>`/`<circle>`). The component re-renders uniform presentation
   (`viewBox 0 0 24 24`, `fill none`, `stroke-width 1.75`, `square`/`miter`
   stroke — cyberpunk-flat) via `createElementNS` + `setAttribute`.
4. **Drop 7 dead registry entries** (`x`, `chevronDown`, `info`, `help`,
   `fileImage`, `sun`, `moon`, `moveUp`) — never referenced in templates/tests.
5. **Add footer brand icons**: `index.html` GitHub/LinkedIn anchors carry
   `<tn-icon name="github|linkedin" size="16">`; `.footer-links a` gets
   `display:inline-flex; align-items:center; gap:0.375rem`.
6. **Remove `lucide`**: `pnpm remove lucide`, leaving zero runtime deps in the
   frontend root `package.json`.

## Consequences

- **Positive:** brand icons supported (footer GitHub/LinkedIn); MIT license
  with attribution header in `TnIcon.ts` + `THIRD_PARTY_NOTICES.md`; zero
  runtime deps (tree-shaking via bundled `?raw` SVGs); offline-safe (no
  runtime fetch).
- **Negative:** `normalizeSvg()` uses a regex over vendored SVG — fragile if a
  future icon's attribute shape differs (verified for current 9); JS bundle
  +~3.4 kB for the inlined SVG strings; commitlint/tsconfig unaffected
  (`?raw` types covered by existing `vite-env.d.ts`).
- **Trade-off accepted:** vendoring verbatim SVGs (faithful + removable) rather
  than adopting `iconoir-react` (which requires React — incompatible with the
  vanilla Web Component stack).

## Alternatives considered

- **`iconoir-react`:** rejected — peerDependency `react 18||19`; project is
  vanilla, adding React would be disproportionate.
- **Runtime fetch of `/assets/icons/*.svg`:** rejected — async rendering,
  extra network requests, breaks offline/TDD (jsdom).
- **Inline geometry constants without files:** rejected in favor of files per
  user decision ("guarda los svg en assets/icons y úsalos donde haga falta").
