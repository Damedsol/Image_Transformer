# Plan de Arquitectura: Centralizar Scripts en el Package Principal

## GRILL: Alineación de Dominio

- **Términos clave del dominio:** `dev`, `build`, `qa`, `test`, `lint`, `format`, `type-check`. El proyecto ya usa `fe`/`be` (frontend/backend) en documentación interna. La convención `script:sub` (con `:`) es estándar de npm/pnpm y se usa ya en `test:watch`, `test:ui`, `format:check`.
- **ADRs/Decisiones previas relevantes:** Ninguna relevante a scripts de workspace. La estructura monorepo está definida en `project_manifest.yml` y `.ia/memory/context.md`.
- **Consistencia verificada:** [✓] Sin conflictos terminológicos. Los tres namespaces propuestos (`dev:`, `qa:`, `build:`) son universales en CI/CD y no colisionan con ningún término existente del dominio.

## PROPOSE: Intención, Alcance y Approach

- **Intención:** Eliminar la fragmentación actual donde el desarrollador necesita recordar comandos separados para frontend (`pnpm dev`) y backend (`pnpm --filter image-transformer-backend dev`), centralizando todo en 3 verbos principales accesibles desde la raíz.
- **Alcance (in-scope):**
  - Reestructurar `scripts` en el `package.json` raíz con namespaces `dev:`, `qa:`, `build:`.
  - `pnpm dev` → arranca frontend + backend concurrentemente.
  - `pnpm qa` → ejecuta TODOS los chequeos de calidad secuencialmente.
  - `pnpm build` → compila backend + frontend en orden.
  - Scripts granulares accesibles: `dev:frontend`, `dev:backend`, `build:frontend`, `build:backend`, `type-check`, `type-check:frontend`, `type-check:backend`, `lint:frontend`, `lint:backend`. Sin aliases redundantes: `qa` encadena directamente los scripts canónicos (`type-check && lint && format:check && test`).
  - Añadir `concurrently` como devDependency + entrada en el catálogo.
  - Actualizar `AGENTS.md` y `.ia/project_manifest.yml`.
- **Fuera de alcance (out-of-scope):**
  - No se modifican los scripts del `backend/package.json` (permanecen como entrypoints internos del workspace).
  - No se añaden suites de test al backend.
  - No se modifica la configuración de Biome, Oxlint, ls-lint, ni Vitest.
- **Approach:** Añadir `concurrently` para arranque paralelo de servidores dev. Usar `&&` para build secuencial (backend primero). Script `qa` encadena `type-check → lint → format:check → test` con `&&`.

## SPEC: Requisitos y Escenarios

- **Requisitos funcionales:**
  - **R1:** `pnpm dev` inicia el frontend (Vite, :5173) y el backend (tsx watch, :3001) en paralelo con output etiquetado.
  - **R2:** `pnpm dev:fe` inicia solo el frontend.
  - **R3:** `pnpm dev:be` inicia solo el backend.
  - **R4:** `pnpm build` compila el backend (tsc → dist/) y luego el frontend (tsc --noEmit + vite build → dist/).
  - **R5:** `pnpm qa` ejecuta, en orden y abortando al primer fallo: type-check → lint → format:check → test.
  - **R6:** `pnpm type-check` verifica tipos en ambos workspaces (frontend + backend).
  - **R7:** `pnpm lint` ejecuta oxlint en ambos workspaces + ls-lint.
  - **R8:** `pnpm format:check` verifica formato global (read-only).
- **Escenarios happy path:**
  - `pnpm dev` → terminal muestra `[frontend]` (cyan) y `[backend]` (green). Ctrl+C detiene ambos.
  - `pnpm qa` → 4 pasos ejecutados en orden. Si todos pasan, exit 0.
  - `pnpm build` → backend tsc OK, frontend tsc + vite build OK.
- **Edge cases:**
  - Puerto :5173 o :3001 ocupados → Vite/Express muestran su error estándar.
  - `pnpm dev` cuando ya hay instancias corriendo → conflicto de puertos (esperado, estándar).
  - `pnpm qa` cuando no hay node_modules → falla en type-check (esperado).
- **Side cases:**
  - Ctrl+C en `pnpm dev` → `concurrently` con `-k` (kill others) asegura que ambos procesos mueren.
  - Si backend falla al compilar en `pnpm build` → el frontend no se compila (comportamiento `&&` correcto).
- **Criterios de aceptación:**
  - `pnpm dev` muestra output de ambos servicios con prefijos `[frontend]` y `[backend]`.
  - `pnpm qa` falla en el primer paso rojo y no ejecuta los siguientes.
  - `pnpm build` produce `backend/dist/` (backend compilado) y `dist/` (frontend compilado).
  - Todos los scripts existentes (`test`, `test:watch`, `format`, `prepare`, `lint-staged`) siguen funcionando.
  - `AGENTS.md` refleja los nuevos comandos.
  - Los scripts del `backend/package.json` permanecen sin cambios.

## DESIGN: Arquitectura

### Verificación de Principios de Diseño

- `[✓] DRY / REUTILIZAR:` Los scripts reutilizan los comandos existentes del backend vía `pnpm --filter`. No se duplica lógica. `type-check` centralizado reutiliza `type-check:fe` y `type-check:be`.
- `[✓] YAGNI / KISS:` Cero sobreingeniería. `concurrently` es la dependencia mínima posible (~300KB, 0 sub-deps) para arranque paralelo. No se introduce un task runner pesado (turborepo, nx, etc.).
- `[✓] ÚLTIMO RECURSO:` N/A — no se crean archivos nuevos de código fuente. Solo se modifica `package.json` (scripts), `pnpm-workspace.yaml` (catálogo), y documentación.
- `[✓] TDD:` N/A — no se escribe código de producción. Los scripts de QA se validan ejecutándolos: el propio `pnpm qa` es la prueba de que los scripts funcionan.

### Archivos Implicados

| Archivo | Acción | Justificación |
|---------|--------|---------------|
| `package.json` | **Modificar** sección `scripts` | Centralizar namespaces `dev:`, `qa:`, `build:` y unificar type-check/lint |
| `pnpm-workspace.yaml` | **Modificar** sección `catalog` | Añadir `concurrently` al catálogo de versiones compartidas |
| `AGENTS.md` | **Modificar** tabla de comandos | Reflejar nuevos entrypoints centralizados |
| `.ia/project_manifest.yml` | **Modificar** sección `commands` | Actualizar lista de comandos del manifiesto |
| `backend/package.json` | **Sin cambios** | Los scripts internos del workspace se preservan |

### Nueva estructura de scripts en root `package.json`

```
dev              → concurrently -k -n frontend,backend -c cyan,green "pnpm dev:frontend" "pnpm dev:backend"
dev:frontend     → vite
dev:backend      → pnpm --filter image-transformer-backend dev

build            → pnpm build:backend && pnpm build:frontend
build:frontend   → tsc && vite build
build:backend    → pnpm --filter image-transformer-backend build

qa               → pnpm type-check && pnpm lint && pnpm format:check && pnpm test

type-check       → pnpm type-check:frontend && pnpm type-check:backend
type-check:frontend → tsc --noEmit
type-check:backend  → pnpm --filter image-transformer-backend type-check

lint             → pnpm lint:frontend && pnpm lint:backend && ls-lint
lint:frontend    → oxlint . --fix
lint:backend     → pnpm --filter image-transformer-backend lint

format        → biome format --write .
format:check  → biome format .

test          → vitest run
test:watch    → vitest
test:ui       → vitest --ui

prepare       → husky
lint-staged   → lint-staged
```

### Nueva entrada en catálogo (`pnpm-workspace.yaml`)

```yaml
"concurrently": "^9.0.0"
```

### Dependencias & Configuración

- **Nuevo paquete:** `concurrently` (^9.0.0) añadido a `devDependencies` de raíz + catálogo en `pnpm-workspace.yaml`.
- **Sin cambios en:** variables de entorno, esquemas de BD, Dockerfiles, nginx config.

### Seguridad

- `concurrently` es un paquete maduro (>10M descargas semanales), mantenido activamente. Sin CVEs conocidos.
- No se introducen nuevas superficies de ataque (sin servidores nuevos, sin puertos adicionales).

### Rendimiento

- `concurrently` es un wrapper ligero sin overhead medible.
- `pnpm build` secuencial (be → fe) es correcto porque el frontend no depende del backend compilado; el orden es arbitrario pero sensato (backend falla primero si hay error de tipos).

## TASKS: Checklist de Implementación

### Fase Green: Implementación

- [✓] **Tarea 1:** Añadir `"concurrently": "^9.0.0"` al `catalog` en `pnpm-workspace.yaml`.
- [✓] **Tarea 2:** Añadir `"concurrently": "catalog:"` a `devDependencies` en `package.json` raíz.
- [✓] **Tarea 3:** Reemplazar la sección `scripts` del `package.json` raíz con la nueva estructura centralizada.
- [✓] **Tarea 4:** Ejecutar `pnpm install` para instalar `concurrently`.
- [✓] **Tarea 5:** Actualizar la tabla de comandos en `AGENTS.md` con los nuevos entrypoints.
- [✓] **Tarea 6:** Actualizar la sección `commands` en `.ia/project_manifest.yml`.

### Fase Refactor: Validación

- [✓] **Tarea 7:** Ejecutar `pnpm type-check` — debe verificar ambos workspaces.
- [✓] **Tarea 8:** Ejecutar `pnpm lint` — debe ejecutar oxlint en ambos workspaces + ls-lint.
- [✓] **Tarea 9:** Ejecutar `pnpm format:check` — debe verificar formato global.
- [✓] **Tarea 10:** Ejecutar `pnpm test` — debe pasar 46/46 tests.
- [✓] **Tarea 11:** Ejecutar `pnpm qa` — debe ejecutar los 4 pasos secuencialmente.
- [✓] **Tarea 12:** Ejecutar `pnpm build` — debe compilar backend + frontend.
- [✓] **Tarea 13:** Verificar que `pnpm dev` arranca ambos servidores (inspección manual: ver output con prefijos `[frontend]` y `[backend]`, luego Ctrl+C para detener).

## Riesgos

- **Riesgo:** `concurrently` podría tener problemas de compatibilidad con Node 24.
  - **Impacto:** Medio — `pnpm dev` no funcionaría.
  - **Mitigación:** `concurrently@9.x` soporta Node >=18. Node 24 es LTS; compatible. Si falla, fallback: usar `&` + `wait` en shell (menos ergonómico pero sin dependencia externa).
- **Riesgo:** `pnpm install` con `preferFrozenLockfile: true` puede fallar al añadir `concurrently`.
  - **Impacto:** Bajo — `pnpm add` actualiza el lockfile automáticamente.
  - **Mitigación:** Usar `pnpm add -D concurrently` en lugar de editar manualmente.
