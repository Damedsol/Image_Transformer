# Review — Release 2.1.0 (version bump + version-consistency guard)

- **Fecha:** 2026-09-17 · **Gate:** `/reviewer` · **Ciclo:** release 2.1.0 (`/build`) · **Rama:** `release/2.1.0`
- **Nota de alcance:** este ciclo **no tiene `plan_*.md` ni deltas de `change_spec.yaml`**. Es una tarea de release mecánica que `/scribe` no pudo ejecutar porque los portadores de la versión son código/config (`Gate /scribe solo escribe en .agents/`); `/build` la tomó con el precedente explícito del release 2.0.0 (`f128550`). **R1 está declarado en el docblock del test que lo guarda** y la verificación se hace contra esa declaración.
- **HEAD:** `e8b892f` (rama `release/2.1.0`) · **working tree sin commitear** (correcto: `/build` no commitea)
- **Candidato congelado antes de opinar:** `git diff --stat` → `8 files changed, 133 insertions(+), 161 deletions(-)` — código/config: `package.json`, `backend/package.json`, `README.md`, `docker-compose.prod.yml`; arnés: `.agents/project_manifest.yaml`, `.agents/context/history.md`, `.agents/checkpoint.yml`, `.agents/.state/build_state.json`; nuevo sin trackear: `backend/src/__tests__/versionConsistency.test.ts`
- **Hash de la superficie revisable (código/config, inmune a mis ediciones de arnés):** `41482c9542bcdb76463c7fc348ffd5522e7c3f4041aa516c7ce0eb5cac71e4d1`
- **Hash del árbol completo en el momento de la revisión:** `6d62dce2fbccb18e107d603d8394d0b4a690db164e7eae1063f4ec97e74bab71`
- **Congelación por `mtime`:** los 5 portadores y el test nuevo están en `19:55` (hora del build); los `git status`/QA de esta revisión (`20:03`) no tocaron nada — comprobado con `git status --porcelain` después de cada batería.
- **`build_hash`:** `release-2.1.0@e8b892f: 5 carriers synced 2.0.0 → 2.1.0 … + R1 guard`
- **`reviewer_hash`:** `12c389674c6881d1` = `sha256(build_hash + "\n" + diff_stat)[0:16]`, ambos leídos de `.agents/checkpoint.yml` tal como los dejó `/build` (misma convención que los dos ciclos anteriores)

---

## 1. VERIFY — R1

**R1:** la versión liberada es **2.1.0** en todos los portadores y ninguno puede derivar.

| Comprobación independiente | Resultado |
|---|---|
| Extracción con **mis propios** patrones (no los del test) sobre los 6 puntos de versión | `root package.json` → **2.1.0** · `backend/package.json` → **2.1.0** · badge README → **2.1.0** · tag backend de compose → **2.1.0** · tag frontend de compose → **2.1.0** · `.agents/project_manifest.yaml` → **2.1.0** ✅ |
| Barrido de residuos `2.0.0` en el árbol (json/yml/yaml/md/ts/html/conf, excluyendo `node_modules`, lockfile y `.agents/`) | solo 3 coincidencias, **todas dentro del propio test** (referencia histórica en el docblock + los dos fixtures sintéticos) ✅ |
| **Completitud de la lista de portadores** | `docker-compose.yml` (dev) **no** lleva tags versionados (los servicios hacen `build:`) → no hay un 6º portador · `docker/nginx.conf` solo menciona nombres de servicio · `.deepsec/package.json` (workspace local, gitignored, versión propia 0.1.0) no es portador · la lista `CARRIERS` del test coincide **exactamente** con los ficheros con versión del release 2.0.0 (`f128550`), menos `history.md`, que es el log y no un portador ✅ |
| El guard no puede pasar en silencio si un patrón deja de casar | `versionOf()` devuelve `null` y el test lo somete a `/^\d+\.\d+\.\d+$/` → falla ✅ |
| RED real (evidencia del build, reproducida en su informe) | bump a medias deliberado (4 portadores movidos, manifiesto sin tocar) → **exit 1** con exactamente un hallazgo: `harness manifest (.agents/project_manifest.yaml) carries 2.0.0, expected 2.1.0` ✅ |
| Fuente de verdad | el `package.json` raíz; el test deriva de él y compara el resto, así que un bump que solo toque la raíz **falla**, y un bump completo no exige tocar el test (cero mantenimiento) ✅ |

**Escenarios:** happy (los 5 portadores y 2 tags en 2.1.0) ✅ · edge (portador borrado/renombrado → patrón sin match → falla; bump parcial → detectado; bump total con la raíz sin tocar → detectado) ✅ · side (lockfile: no es portador y **no se tocó**; tags de compose siguen siendo *defaults* sobreescribibles por `BACKEND_IMAGE`/`FRONTEND_IMAGE`; sin dependencias añadidas ni bumpeadas) ✅.

**Hueco declarado, no bloqueante:** la lista de portadores está **hardcodeada** en el test — un portador nuevo (p. ej. una versión en `index.html` o un compose adicional) no se cubre hasta que se añada a `CARRIERS`. Mitigación actual: el docblock enumera los portadores, así que un revisor futuro los ve. Ver **OBS-01**.

## 2. QA — Code Hygiene

| Check | Resultado |
|---|---|
| Fichero > 300 líneas | ✅ 114 líneas el test nuevo; los 5 portadores son cambios de una línea |
| Función > 50 líneas | ✅ `findVersionMismatches` 10 · `mismatchMessage` 6 · `versionOf` 2 |
| Anidamiento ≤ 3 | ✅ profundidad de control = 1 (`for` dentro del callback del `it`); el resto son cadenas `filter`/`map` |
| Efectos secundarios | ✅ el test **solo lee** (`readFileSync`, sin escrituras ni red); no muta el repo |
| `console.log` / TODO / `.only` / `.skip` / secretos / `catch` vacío | ✅ ninguno |
| Nomenclatura y estilo | ✅ nombres explícitos (`findVersionMismatches`, `mismatchMessage`, `versionOf`), sin genéricos; cero dependencias nuevas |
| Columna 80 | ✅ verificado: **ninguna línea de código** excede 80 columnas (solo comentarios, que biome no reflowea) — `biome format` sale limpio (ver §4) |
| Ubicación | ✅ en la suite de backend porque el tsconfig del frontend no tiene tipos de node; mismo criterio que `license-consistency.test.ts` y `dependencyConfig.test.ts` |

**Observaciones (no bloqueantes):**

- **OBS-01 [cobertura incompleta por diseño]:** la lista `CARRIERS` es manual. Un portador nuevo pasa desapercibido. Es el precio de no tener una fuente única en `package.json`; aceptable hoy.
- **OBS-02 [acoplamiento al arnés]:** el guard requiere `.agents/project_manifest.yaml`. En un checkout solo-código (sin `.agents/`) el test lanzaría `ENOENT`. El directorio está versionado y las imágenes de producción no ejecutan la suite, así que no afecta al build; queda anotado.

## 3. Tests — Clasificación (`test-classification`)

| Veredicto | Nº | Detalle |
|---|---|---|
| ✅ **KEEP** | **4** | (1) semver válido en la fuente de verdad — contrato barato que atrapa `2.1` o `v2.1.0`; (2) **la invariante central**: todos los portadores iguales a la raíz (reproduce la clase de defecto real, el bump a medias); (3) detector no vacuoso con `lookup` constante — prueba que la capacidad de detección existe en ejecución, mismo patrón que el fixture sintético del ciclo anterior; (4) detector preciso con `lookup` selectivo |
| ❌ **REMOVE** | **0** | ninguno testea mocks, detalles internos ni duplica a otro |
| ⚠️ SUGERENCIA | 0 | — |

*Borderline declarado:* el test (4) solapa parcialmente con el (3) (ambos ejercitan el detector), pero cubre un modo de fallo distinto — **atribución y cardinalidad** (una implementación que reportase todos los portadores cuando solo uno deriva pasaría el (3) y fallaría el (4)). En duda → KEEP.

## 4. Suite — evidencia

| Comando | Resultado | Exit |
|---|---|---|
| `pnpm test` (runner del manifiesto) | **22 ficheros / 161 tests passed** (baseline 21 / 157 → +1 fichero, +4 tests) | **0** |
| `pnpm type-check` (FE + BE) | sin errores (cubre el test nuevo) | **0** |
| `pnpm exec oxlint .` (check mode, **sin `--fix`**: mi sandbox no escribe código) | sin hallazgos | **0** |
| `oxlint` sobre `backend/` (config propia del backend, check mode) | sin hallazgos | **0** |
| `node scripts/lint-filenames.mjs` | `versionConsistency.test.ts` cumple la convención | **0** |
| `pnpm exec biome format .` (**check-only**, sin `--write`) | `Checked 71 files … No fixes applied` — **sin hallazgos** | **0** |

**Nota:** el `ID-01` del ciclo anterior (formato de `.agents/.state/build_state.json`) **está resuelto**: el fichero reescrito por `/build` es biome-limpio, así que este ciclo no arrastra hallazgos de formato.

Ninguna de las baterías modificó el árbol (`git status --porcelain` idéntico antes y después). No requiere `/debug`.

## 5. Workload

| Métrica | Valor | SLO | Estado |
|---|---|---|---|
| Ficheros de **código/config** | **5** (`package.json`, `backend/package.json`, `README.md`, `docker-compose.prod.yml`, test nuevo) | ≤5 | ✅ en el límite |
| Líneas de código/config | **119** (5 líneas de portador + 114 del test) | ≤400 | ✅ |
| Ficheros `.agents/` | 3 modificados + `build_state.json` reescrito | — | ⚠️ divulgado, excluido del SLO con la misma convención que los dos ciclos anteriores |

Sin motivo de split.

## 6. Ítems abiertos (no bloquean)

- **Release:** no existe ningún tag en el repo; `push` + tag de `2.1.0` es decisión humana posterior al commit.
- **OBS-01 / OBS-02** (arriba): lista de portadores manual y acoplamiento al arnés.
- Arrastrados de los ciclos cerrados: matar el dev server ajeno que ocupa `:5173`; **OBS-02** del ciclo de dev (`concurrently` se traga `--host 0.0.0.0` en docker-compose → verificar `docker compose up`); **OBS-01** (`securityMiddleware` duplica el parseo de orígenes y no filtra esquemas); export de alertas Dependabot; decisión sobre `.github/workflows/security.yml`; slices C2b/C3; close-list de 11 refs; watch del primer run de Dependabot.

## 7. Veredicto

### Reporte — ✅ APROBADO

**VERIFY** [✓] R1 verificado de forma independiente (6 puntos de versión extraídos con patrones propios, 0 residuos, lista de portadores contrastada contra el release `f128550`, RED real documentado) · escenarios happy/edge/side ✓ · design/tasks: N/A (release sin `plan_*.md`, declarado y trazado en el docblock del test)
**QA** [✓] sin hallazgos bloqueantes; 2 observaciones informativas (OBS-01/OBS-02)
**Tests** KEEP **4** / REMOVE **0**
**Suite** [✓] `pnpm test` exit 0 — 22 ficheros / 161 tests · type-check 0 · oxlint 0 · lint-filenames 0 · biome format check 0
**Workload** ✅ 5 ficheros / 119 líneas de código+config, dentro del SLO

Tests a eliminar por `/build`: **ninguno**.

```
🔄 HANDOFF → /scribe | Gate: reviewer | Artefactos: [.agents/docs/review_2026-09-17_release-2.1.0.md, .agents/checkpoint.yml] | Pendiente: archivar y commitear `chore: bump version 2.1.0` en release/2.1.0 (sin cambios en el lockfile; el sandbox de /scribe puede requerir que el usuario ejecute los comandos, que entregaré sin heredoc)
```
