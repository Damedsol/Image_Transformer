# Plan de Arquitectura: Dependency Security Remediation (Dependabot)

> **Fecha:** 2026-08-27 · **Gate:** 1-7 (plan → build) · **Estado:** ✅ COMPLETADO
> **Objetivo:** Cerrar las alertas de seguridad (Dependabot + SCA) priorizando la cadena de producción.

## Decisions
- **Transitive fixes via `pnpm-workspace.yaml` `overrides`** (user directive: "usa siempre los overrides").
- **Direct deps** bumped in `backend/package.json` (exact pins) + override espejos for determinism.
- **Deferred (documented):** `esbuild` (dev-only, Windows CVE, pinned by tsx ^0.27 → override would break backend dev) and CSP `'unsafe-inline'`/`connectSrc` wildcard (API serves no HTML, low-value, deployment risk). `error.message` leak already gated to `development`.

## Tasks (all ✓)
- [✓] T1 Baseline: `pnpm audit --prod` → 13 vulns (1 low/3 mod/9 high); full → 31 vulns.
- [✓] T2 Verify fix versions via `pnpm view` (all present).
- [✓] T3 `pnpm-workspace.yaml` overrides + `backend/package.json` bumps.
- [✓] T4 Code hardening (trust proxy, IP-only rate-limit key, multer limits+fieldNestingDepth, randomUUID ZIP, sharp failOn, vite host).
- [✓] T5 Regenerate lockfile (`pnpm install --no-frozen-lockfile`).
- [✓] T6 Verify: `pnpm audit --prod` → **0 vulns**; `pnpm build` green; `pnpm type-check` green; runtime smoke (sharp 0.35.3/libvips 8.18.3 + multer 2.2.0) PASS.
- [✓] T7 `pnpm qa` green (type ✓, lint ✓, fmt ✓, **82/82 tests**).
- [✓] T8 R8 reviewed: error-leak already mitigated; CSP change deferred (rationale above).
- [✓] T9 Final audit + history.md + this artifact.

## Resolved versions (post-change, lockfile)
`sharp 0.35.3` (libvips 8.18.3) · `multer 2.2.0` · `zod 4.4.3` · `body-parser 2.3.0` · `brace-expansion 2.1.4/5.0.9` · `ip-address 10.5.0` · `fast-uri 4.1.2` · `js-yaml 4.3.1` · `postcss 8.5.26` · `vite 8.2.2`.

## Residual (dev-only, documented)
`pnpm audit` full → 6 vulns: `undici` ×5 (via jsdom/vitest test tooling), `esbuild` ×1 (via tsx/vite/vitest). None reachable in production (prod audit = 0). Fixes require test/dev-tooling bumps (jsdom, tsx) and are out of the committed security scope.

## Verification commands
`pnpm audit --prod` · `pnpm audit` · `pnpm build` · `pnpm type-check` · `pnpm qa`

## Handoff
→ **@reviewer** for adversarial review of the dependency bump + config hardening.
