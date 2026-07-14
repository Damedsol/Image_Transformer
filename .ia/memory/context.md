# Contexto y Aprendizajes: imageTransformer

## Stack y Configuración
- **Monorepo pnpm v11:** Root (frontend SPA) + backend (Express API). Resolution mode: lowest-direct, engineStrict, hoist.
- **Frontend:** TypeScript 6 + Vite 8 + Vitest 4 + jsDOM 29. Web Components nativos + Lucide icons + Neon-Code UI Kit.
- **Backend:** Express 5 + Sharp 0.34 + Multer + Zod + Helmet + Pino (sin cambios).
- **Calidad:** Biome v2 (formatter), Oxlint v1 (linter), ls-lint v2 (naming), Husky v9 + lint-staged + commitlint.
- **Docker:** Multi-stage Node 24 Alpine + Nginx Alpine. docker-compose.yml (dev) + docker-compose.prod.yml (prod).
- **Tests:** Vitest + jsDOM. 6 test files, 46 tests. TDD obligatorio.

## Migración Neon-Code UI Kit — COMPLETADA
- **Tokens CSS:** `:root` reescrito con base-tokens.css de neon-code (#0f1016, #b9f27c, #161b22). Dark mode default + light mode via prefers-color-scheme.
- **Fuentes:** Figtree (variable woff2) + IBM Plex Mono (static woff2). Locales en assets/fonts/. Sin Google Fonts.
- **Iconos:** Nuevo `<tn-icon>` Web Component con Lucide (tree-shaking, Shadow DOM, square stroke-linecap, miter stroke-linejoin).
- **Componentes migrados:** DropZone (SNA-03/SNA-35), ConversionOptions (SNA-02/SNA-20/SNA-27/SNA-18), ImagePreview (SNA-03/SNA-08), ImageConverter (SNA-01/SNA-15/SNA-07). Todos con lógica intacta, solo HTML/CSS reescrito.
- **A11y dialog:** Modal SNA-06 con backdrop 85%, borde brand-primary.
- **style.css:** Reducido de 1770 → ~820 líneas. Sin box-shadow, gradients, backdrop-filter ni border-radius > 4px.
- **Reglas inmutables:** Ley de Irradiación (max font-weight 500 en texto claro), ley de Fuentes Duales (Figtree UI, Mono datos), ley 7:1 contraste AAA.
- **Directorio .ia/:** AGENTS.md, project_manifest.yml, memory/context.md, docs/. Configuración agéntica local.

## Decisiones Estratégicas
- **Framework Zero:** Se mantuvo Vanilla Web Components + TypeScript. Sin React/Vue/Lit.
- **Lucide v1:** API con `createElement(IconNode)` donde IconNode es `[tag, attrs, children][]`. Tree-shaking con imports individuales.
- **JSDOM CE handling:** Custom Elements reactions envueltas por `invokeCEReactions`. Para evitar errores no capturados, `connectedCallback` debe ser no-op cuando faltan atributos.
- **Test imports necesarios:** Los tests deben importar los componentes explícitamente para triggerear `customElements.define()`. Sin import, `document.createElement` produce HTMLUnknownElement.

## Historial de Cambios
- **2026-07-14:** Migración completa a Neon-Code UI Kit
  - Detalle: Implementados tn-icon, style.css neon-code, y 4 componentes migrados. 46 tests TDD pasando. Type-check/lint/format limpios.
  - QA: `pnpm test` 46/46, `pnpm type-check` 0 errors, `pnpm lint` 0 errors, `pnpm format` sin fixes.
  - Commits pendientes: Revisar archivos staged y crear commit convencional.
