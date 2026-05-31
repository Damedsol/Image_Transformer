# Contexto del Proyecto: imageTransformer

## Estado Actual
- **Estructura del Proyecto:** Monorepo (pnpm workspace v11) compuesto por:
  - Frontend (ubicado en la raíz `.`).
  - Backend (ubicado en la subcarpeta `backend`).
- **Control de Calidad (Centralizado y Especializado):**
  - **Linter:** `oxlint` (sustituye por completo a ESLint).
    - Frontend (Raíz): Configurado en `.oxlintrc.json` enfocado únicamente al entorno `browser`.
    - Backend (`backend/`): Configurado en `backend/.oxlintrc.json` enfocado al entorno `node`.
  - **Formateador & Import Organizer (Biome Unificado):** Configurado de forma 100% centralizada en un único `biome.json` en la raíz (evitando errores de configuración anidada). Habilita formateo global, declara globales de JavaScript comunes y backend (`Express`, `NodeJS`, `process`, `console`) y cuenta con la propiedad `formatter.formatWithErrors: true` para formatear archivos de forma robusta aun con errores de sintaxis temporales.
  - **Estructura de Archivos (ls-lint Centralizado y Segmentado):** Configurado en `.ls-lint.yml` aplicando validaciones estrictas y no genéricas según la arquitectura del proyecto:
    - **Directorios:** Estrictamente `kebab-case` globales.
    - **Componentes Frontend (`src/components/`):** Estrictamente `PascalCase` (ej. `ConversionOptions.ts`).
    - **Utilidades Frontend (`src/utils/`):** Estrictamente `camelCase` (ej. `fileUtils.ts`).
    - **Backend controllers, middlewares, routes y utils (`backend/src/**`):** Estrictamente `camelCase` (ej. `imageController.ts`, `errorMiddleware.ts`, `imageRoutes.ts`).
    - **Documentación (`.md`):** `kebab-case | screamingsnakecase` (admite archivos en mayúsculas como `README.md` o `LICENSE.md` sin usar `regex`).
    - **Exclusiones:** `.husky`, `.git`, `node_modules` y `backend/node_modules`.
  - **Hooks de pre-commit (`lint-staged`):** Configurado en `.lintstagedrc` en la raíz para ejecutar `oxlint --fix` y `biome format --write --no-errors-on-unmatched` sobre archivos preparados (staged) en todo el monorepo.
- **Gestión de Dependencias:** pnpm v11 con catálogo de versiones compartido (`catalog:`) y directivas centralizadas en `pnpm-workspace.yaml`.

## Decisiones Técnicas
1. **Migración a pnpm v11 sin `.npmrc`:** Las opciones del monorepo (`resolutionMode`, `hoistPattern`, etc.) se declaran directamente en `pnpm-workspace.yaml` en formato camelCase. `.npmrc` se reserva para autenticación.
2. **Remoción del Bloque `pnpm` en `package.json`:** pnpm v11 ignora por completo el campo `"pnpm"` en los archivos `package.json`. Por ello, se eliminaron los bloques obsoletos tanto de la raíz como del backend.
3. **Centralización de Overrides y allowBuilds:** Todos los parches de dependencias (`overrides`) y la directiva de compilación (`allowBuilds`) se declararon en `pnpm-workspace.yaml`.
4. **Especialización de Entornos:** Configurada la segmentación de Oxlint y la unificación de Biome en la raíz para evitar el cruce de reglas entre el frontend (browser) y el backend (node).
5. **Modernización de Hooks de Pre-commit:** Se reescribió `.lintstagedrc` para remover ESLint y Prettier. Se integraron Oxlint y Biome con la bandera `--no-errors-on-unmatched`.
6. **Arquitectura y Segmentación de ls-lint:** Se descartó el uso de expresiones regulares y configuraciones genéricas globales para `.ts`/`.tsx`. En su lugar, se declararon reglas precisas mapeadas a los directorios de la aplicación.
7. **Consolidación Unica de Biome (Sin Anidamiento):** Dado que Biome CLI prohíbe las configuraciones de raíz anidadas ("nested root configurations"), se eliminó `backend/biome.json` y se centralizaron todas las globales del backend (`Express`, `NodeJS`, etc.) en el `biome.json` único de la raíz.
8. **Resiliencia en el Formateo (formatWithErrors):** Se habilitó la directiva `formatter.formatWithErrors: true` en `biome.json` para garantizar que Biome pueda formatear y continuar con el flujo pre-commit incluso ante la presencia de errores sintácticos temporales en código de desarrollo.

## Aprendizajes y Notas
- En pnpm v11, `pnpm-workspace.yaml` absorbe todas las directivas de configuración de dependencias (`overrides`, `allowBuilds`, etc.) mediante propiedades camelCase.
- Biome requiere de forma estricta un único `biome.json` en la raíz para monorepos y prohíbe archivos de configuración anizados. Las globales de subproyectos deben unificarse en el `biome.json` principal.
- Activar `formatWithErrors` es vital para flujos de pre-commit y automatizaciones de formateo continuo para evitar bloqueos y fallos forzados de la CLI de Biome en archivos en pleno refactor o desarrollo.
- Oxlint aplica de forma automática la configuración local `.oxlintrc.json` correspondiente al directorio de ejecución o subcarpetas.
- La bandera `--no-errors-on-unmatched` de Biome evita fallos de compilación y bloqueos en hooks pre-commit cuando `lint-staged` le pasa archivos que no coinciden exactamente con los patrones analizados.
- En ls-lint, es fundamental declarar de forma explícitamente segmentada los mapeos a los directorios de desarrollo para asegurar el cumplimiento del diseño arquitectónico sin comprometer la velocidad ni la claridad.
