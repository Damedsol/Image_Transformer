# Review (re-pass) — Dependency Refresh + Dependabot Enablement

- **Fecha:** 2026-09-17 · **Gate:** `/reviewer` (2ª pasada) · **Ciclo:** R1–R12 (plan 2026-09-17)
- **Revisión previa:** `.agents/docs/review_2026-09-17_dependency-refresh-dependabot.md` → **❌ RECHAZADO** por ID-01 (+ ID-02 cosmético, ID-03 sugerencia)
- **Alcance de esta pasada:** verificar **solo** ID-01/ID-02/ID-03 y confirmar que no hay regresión en lo ya aprobado (R1–R12).
- **HEAD:** `8a62fde` · working tree **no commiteado**
- **Candidato congelado antes de opinar:** `git diff --stat` → `5 files changed, 128 insertions(+), 85 deletions(-)`; nuevos sin trackear: `.github/` y `backend/src/__tests__/dependencyConfig.test.ts`
- **Hashes de artefactos congelados:** `dependabot.yml` `ff0e5cbf183b68c3a903e1c70bd542a1` · `dependencyConfig.test.ts` `b820fa9d82488d44a2dd48613f7387af` · `change_spec.yaml` `271d5de3170986e434271bf9ff6233e9`
- **`build_hash`:** `slices C1+C2a + dependabot.yml + review fixes ID-01/02/03 @ 8a62fde — …`
- **`reviewer_hash`:** `73ad2513d2f50ce9`

---

## 1. Verificación de los IDs

### ✅ ID-01 [VERIFY, bloqueante] — RESUELTO

| Comprobación independiente | Resultado |
|---|---|
| Entradas `ignore` vivas en el YAML | **0** (`hasIgnoreKey=false` en ambas entradas, parseado con un lector YAML real) |
| `grep -nE "^\s*-\s*dependency-name:"` | **NONE** — las 2 coincidencias de `dependency-name` son la clave legítima `group-by: "dependency-name"` |
| Premisa del hallazgo re-verificada | `undici`, `nanoid`, `picomatch`, `js-yaml` → **0** ocurrencias como dependencia directa en `package.json` + `backend/package.json` |
| Sustituto correcto | Comentario en el sitio del bloque explicando por qué **no** debe haber reglas `ignore` + checklist de revisión actualizado (punto 5) |
| **No vacuidad del guard** | Verificada por mí de forma **no invasiva**: copia del YAML mutada en `/tmp` re-introduciendo `ignore: - dependency-name: "undici"` → el parser ve `["undici"]` y el predicado lo marca `inert` (temporal borrado después; el fichero del repo **no** se tocó) |

### ✅ ID-02 [QA, cosmético] — RESUELTO

`checkpoint.yml` y `build_state.json` declaran ahora `dependabot.yml (new, 86 lines)` y `wc -l` devuelve **86**. Coincide.

### ✅ ID-03 [TESTS, sugerencia] — RESUELTO

Nueva suite `backend/src/__tests__/dependencyConfig.test.ts` — **11 tests**, con delta de suite verificable: **135 → 146 tests** y **18 → 19 ficheros** (exactamente +11 / +1).

- ✅ **Cero dependencias nuevas**: `git diff package.json` está **vacío** y no existe entrada `yaml` en ningún manifiesto; los dos ficheros YAML se leen con un parser propio línea a línea (respeta el espíritu zero-dep de `scripts/lint-filenames.mjs`).
- ✅ El checker de ID-03 incluye un **caso sintético pre-fix** (`zod >=4.4.0` vs pin `4.6.2`) que **falla si el checker no detecta la violación** → la capacidad de detección está probada en ejecución, no narrada.
- ✅ Cubre además: `floor >= pin` en todos los overrides espejo del repo, que los 3 pins espejo sean exactamente `['multer','sharp','zod']` (si aparece/desaparece un espejo, el test lo dice), ningún `ignore` para paquete no-manifiesto, y la estructura de `dependabot.yml` (`version: 2`, ecosystem/dirs/interval presentes, **sin directorios duplicados por ecosistema**, y majors fuera del grupo minor/patch).

**TDD trazado (RED→GREEN real):** el test se escribió antes del arreglo; la primera ejecución falló con el mensaje exacto del hallazgo (`expected [ 'undici', 'nanoid', …(2) ] to deeply equal []`), y pasó a verde tras eliminar el bloque. Queda registrado en el build report y en `history.md`.

---

## 2. VERIFY — R1..R12 (sin regresión)

Re-verificado contra el árbol actual; ninguna fila cambia respecto a la pasada 1 salvo lo anotado.

| ID | Estado | Nota de esta pasada |
|---|---|---|
| R1 | ✅ / ⚠️ parcial-externo | `pnpm audit` **0** y `--prod` **0** re-ejecutados por mí. El export Dependabot sigue bloqueado (sin `gh`, repo privado) — externo al ciclo |
| R2 | ✅ | 11 refs clasificadas (sin cambios) |
| R3 | ✅ no-op | Sin advisory vivo (audit 0/0 + OSV 0/376 + 0/57) |
| R4 | ⬜ diferido (C2b) | Declarado |
| R5 | ✅ | 10/10 deps productivas `declared == resolved` (verificado en pasada 1, sin cambios en el árbol) |
| R6 | ✅ **(ahora protegido)** | Floors correctos **y** cubiertos por test (invariante pin↔floor) |
| R7 | ✅ | Suite + audit re-ejecutados; smoke 200/200 (pasada 1) |
| R8 | ⬜ diferido (C3) | Declarado |
| R9 | ✅ config / ⚠️ CI pendiente | `dependabot.yml` final, **sin `ignore` peligrosos**, ahora con guard de tests |
| R10 | ⬜ diferido (C3) | Declarado |
| R11 | ✅ | Cero ficheros de código de producción tocados; `package.json` raíz **sin cambios** (ninguna dependencia añadida) |
| R12 | ✅ | Majors como ciclo aparte |

**Escenarios:** happy ✅ · edge ✅ (`minimumReleaseAge`, `lowest-direct` vs pin, re-introducción de `ignore`) · side ✅ (dev tooling intacto y diferido).

## 3. QA — Code Hygiene

Aplicado al código **nuevo** (248 líneas de test) y a la config:

- Funciones ≤ 50 líneas ✔ · anidamiento ≤ 3 ✔ · sin `console.log` ✔ · sin `catch` silencioso ✔ · sin secretos ✔ · sin dependencias exóticas ✔.
- Nombres explícitos (`parseOverrides`, `findFloorViolations`, `exactPinsOf`, `overrideName`), comentarios que explican **el porqué** (IDs de regresión, no el qué) ✔.
- `Last Resort`: no se añadió tooling; se reutiliza el patrón existente de tests que leen manifiestos (`license-consistency.test.ts`) ✔.
- Observaciones menores (no bloqueantes, sin acción requerida):
  1. El guard de ID-01 evalúa solo la entrada `npm` — correcto por diseño (`dependency-name` en `docker` identifica **imágenes**, no paquetes npm), pero no está comentado.
  2. Los tests resuelven rutas vía `process.cwd()` → requieren ejecutar el runner desde la raíz del repo; es la convención ya establecida por el resto de la suite.

## 4. Tests — Clasificación (test-classification)

| Veredicto | Nº | Detalle |
|---|---|---|
| ✅ **KEEP** | **11** | 5 del invariante pin↔floor (protegen un invariante del sistema; 1 reproduce el bug histórico real), 2 del guard de `ignore` (1 es regresión contra re-introducción, 1 anti-vacuidad), 4 de estructura del contrato de `dependabot.yml` (API pública del fichero: si se rompe, la automatización se apaga en silencio) |
| ❌ **REMOVE** | **0** | Ninguno es andamiaje: no testean mocks, no verifican detalles internos, no son duplicados |
| ⚠️ SUGERENCIA | 0 | — |

## 5. Suite (evidencia obligatoria)

| Comando | Resultado | Exit |
|---|---|---|
| `pnpm qa` (type-check FE+BE + oxlint + lint-filenames + `biome format .` + `vitest run`) | **19 ficheros / 146 tests passed** | **0** |
| `pnpm audit` / `pnpm audit --prod` | *No known vulnerabilities found* (ambos) | 0 |
| `pnpm build` (pasada anterior del build, tras los fixes) | OK | 0 |

No requiere `/debug`.

## 6. Workload — ⚠️ WARNING ACEPTADO (documentado)

| Métrica | Valor | SLO | Estado |
|---|---|---|---|
| Ficheros de código/config | 5 | ≤5 | ✅ en el límite |
| Líneas de código/config | **481** (148 de diff + 86 + 247 nuevos) | ≤400 | ⚠️ **+81 sobre el SLO** |

**Causa:** el exceso es **exclusivamente el test solicitado por esta misma revisión (ID-03, 247 líneas)**, más la config de 86 líneas. El churn del lockfile (128 líneas) es mecánico y el resto de ficheros están dentro de umbral.

**Por qué se aprueba igualmente:** rechazar por workload obligaría a `/build` a **eliminar o sacar del ciclo el test que protege el defecto que acabamos de pagar**, para volver a añadirlo idéntico en el siguiente ciclo — coste doble sin reducir el esfuerzo real de revisión (el fichero es ~40% documentación/parsers, no lógica opaca). El SLO busca unidades revisables, y eso se resuelve de forma efectiva en la granularidad de commit.

**Acción exigida a `/scribe` (condición de esta aprobación):** particionar el árbol en **3 commits atómicos** — (1) `chore(deps)` refresh de pins y override floors + lockfile; (2) `ci(dependabot)` config + guard suite; (3) `docs(agents)` harness (análisis, plan, triage, spec, estado). Así ninguna unidad revisable supera el SLO aunque el árbol completo lo haga.

## 7. Ítems abiertos (no bloquean la aprobación)

- **T0.2** — export de alertas Dependabot: bloqueado por entorno (sin `gh`, repo privado, sin auth) → acción del usuario.
- **R9 (parte CI)** — `.github/workflows/security.yml`: pendiente de decisión del usuario (introduce GitHub Actions que el repo nunca ha tenido).
- **C2b / C3** — dev tooling y `check:security` + `scripts/scan-advisories.mjs` + ADR-0005.
- **T1.1** — ejecución por el usuario del close-list de 11 PRs/ramas Dependabot.
- **Watch-list primer run de Dependabot** — que ningún PR convierta `catalog:` en versión inline ni un pin exacto en caret; confirmar que las deps runtime del backend reciben PRs.
- Observación pre-existente (ajena a este ciclo): `backend/tsconfig.json` no excluye `__tests__`, por lo que los tests se compilan en `dist/`.

---

## 8. Veredicto

### Reporte — ✅ APROBADO

**VERIFY** [✓] ID-01/ID-02/ID-03 resueltos con evidencia independiente · R1–R12 sin regresión (R1 parcial-externo, R4/R8/R10 diferidos declarados, R9 con CI pendiente por decisión del usuario) · escenarios happy/edge/side ✓ · design y tasks coherentes
**QA** [✓] sin hallazgos bloqueantes; 2 observaciones menores informativas
**Tests** KEEP **11** / REMOVE **0**
**Suite** [✓] `pnpm qa` exit 0 — 19 ficheros / 146 tests · audit 0/0
**Workload** ⚠️ 481 líneas > SLO, aceptado con la contrapartida de **3 commits atómicos en `/scribe`**

Tests a eliminar por `/build`: **ninguno**.

```
🔄 HANDOFF → /scribe | Gate: reviewer | Artefactos: [.agents/docs/review_2026-09-17_dependency-refresh-dependabot-repass.md, .agents/docs/review_2026-09-17_dependency-refresh-dependabot.md, .agents/docs/plan_2026-09-17_dependency-refresh-and-advisory-closure.md, .agents/specs/change_spec.yaml] | Pendiente: archivar en 3 commits atómicos (deps / dependabot+guard suite / harness docs); al cerrar, reindexar index-mcp (mem_* no disponible este ciclo) y resolver T0.2 (export Dependabot) + decisión sobre el workflow CI
```
