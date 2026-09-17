# Review — Dev Port-Fallback Fix (CORS loopback patterns + Vite strictPort)

- **Fecha real del sistema:** 2026-09-17 · **Gate:** `/reviewer` · **Ciclo:** ad-hoc **Fast Path** (declarado por `/build` como `2026-09-18` → ver **OBS-03**)
- **Nota de alcance:** este ciclo **no tiene `plan_*.md` ni `change_spec.yaml`** (`status: archived` = ciclo cerrado anterior, intacto). Es un bug de desarrollo reportado por el usuario, resuelto inline (AGENTS.md §4.1). Los requisitos **R1..R3 están declarados en los docblocks de los tests** que los guardan y en `build_state.json`; la verificación se hace contra esa declaración, no contra una spec.
- **HEAD:** `7d340af5796f9a6822aeb8f8c8ac3c80d013c684`
- **Candidato congelado antes de opinar:** `git diff --stat` → `5 files changed, 132 insertions(+), 210 deletions(-)` (3 de ellos `.agents/`); sin trackear: `backend/src/utils/corsOrigins.ts`, `backend/src/__tests__/corsOrigins.test.ts`, `src/__tests__/devServerConfig.test.ts`
- **Hash del candidato (diff tracked + ficheros nuevos):** `9b6dfb199cefd92d61e3e6262522cb2341cf20167d4dee9fd50f72dc7a6e5073`
- **`build_hash`:** `ad-hoc@7d340af: R1 dev CORS accepts any loopback port + R2 production exact-match list unchanged + R3 vite strictPort/no hmr.clientPort`
- **`reviewer_hash`:** `5c53fd73e39b130a` = `sha256(build_hash + "\n" + diff_stat)[0:16]` (misma convención legible que el ciclo anterior; el sandbox solo expone `sha256sum`). *Verificado por recomputación* — la primera anotación no cuadraba y se corrigió; aprovechando la comprobación se detectó que el `checkpoint.yml` tenía **claves duplicadas** (`reviewer_hash`/`reviewed_at` del ciclo cerrado en la raíz) que **enmascaraban silenciosamente** el hash nuevo: las del ciclo cerrado se movieron a `closed_cycle_2026-09-17` (dejando `scribe_hash` en su ruta original por idempotencia).

---

## 1. VERIFY — R1..R3

| Req | ¿Implementado? | Verificación independiente (no narrada) |
|---|---|---|
| **R1** dev acepta cualquier puerto de loopback | ✅ | `corsOrigins.ts:30-34` (`DEV_ORIGINS` = 3 regex ancladas) + `return [...DEV_ORIGINS]`. **E2E propio** sobre un backend arrancado con el código del candidato en `:3099`: `Origin: http://localhost:5174` → **`Access-Control-Allow-Origin: http://localhost:5174`**; `http://127.0.0.1:5180` → eco; `http://[::1]:5174` → eco; `https://evil.example.com` → **sin ACAO**; preflight `OPTIONS /api/convert` desde `:5174` → **ACAO presente** (el POST del navegador deja de bloquearse) |
| **R2** producción sigue siendo lista exacta | ✅ | Diff literal del bloque extraído contra `git show HEAD:backend/src/index.ts` → **cuerpo byte-idéntico** (único cambio: firma `string[]` → `CorsOrigin[]` y el `return` de dev que ahora apunta a `DEV_ORIGINS`). **E2E** en `:3098` con `CORS_ORIGIN=https://app.example.com/`: ese origen → ACAO exacto **normalizado sin barra final**; `http://localhost:5174` → **sin ACAO** (ningún patrón se filtra a prod) |
| **R2** fail-loud sin allowlist | ✅ | **E2E**: `NODE_ENV=production PORT=3097 CORS_ORIGIN= CORS_ORIGINS= ALLOW_LOCALHOST=false` → **`exit_code=1`**, nunca llegó a escuchar |
| **R3** el dev server no deriva de puerto | ✅ | `vite.config.ts:14-16` `strictPort: true`. **E2E**: con `:5173` ocupado por un proceso ajeno, `pnpm dev:frontend` → **`exit_code=1` + `Error: Port 5173 is already in use`** (antes: deriva silenciosa a 5174 y proceso vivo → `exit 124` tras timeout) |
| **R3** HMR sigue al puerto propio | ✅ | `hmr.clientPort` eliminado. **E2E**: `vite --port 5199` sirve `/@vite/client` con **`const hmrPort = null`** y la construcción `hmrPort \|\| importMetaUrl.port` → el socket usa el puerto de la página. Fuente de Vite 8 en `node_modules/vite/dist/node/chunks/node.js:25476` (`wsConfig?.clientPort \|\| wsConfig?.port \|\| null`) confirma que el pin era el único origen del 5173 fantasma |

**Escenarios:** happy ✅ (puerto por defecto y fallback) · edge ✅ (`5173`/`5180`/sin puerto, `127.0.0.1`, `[::1]`, barra final, `CORS_ORIGINS` con entradas inválidas, `ALLOW_LOCALHOST`) · side ✅ (preflight `OPTIONS`, límites de seguridad: remotos y look-alikes rechazados, prod sin leak, arranque sin allowlist).

**Reproducción del síntoma original (control negativo):** el backend que el usuario **ya tenía corriendo** en `:3001` (proceso anterior al cambio) respondió a `Origin: http://localhost:5174` **sin** `Access-Control-Allow-Origin` → confirma que el fallo reportado era exactamente el visto y que el candidato lo corrige.

## 2. QA — Code Hygiene

| Check | Resultado |
|---|---|
| Fichero > 300 líneas | ✅ `corsOrigins.ts` 104 · `index.ts` baja de ~190 a **120** (la extracción reduce el fichero en lugar de engordarlo) |
| Función > 50 líneas | ✅ `getCorsOrigins` = **48 líneas** (justo bajo el umbral; `normalizeOrigin` = 18) |
| Anidamiento ≤ 3 | ✅ profundidad de control ≤ 3 (la indentación máxima de 5 tabs es formato de argumentos de `logger.warn`, no lógica) |
| `console.log` / TODO / `.only` / `.skip` | ✅ ninguno en los 5 ficheros tocados |
| Secretos | ✅ ninguno |
| `catch` silencioso | ✅ el único `catch { return null }` (`corsOrigins.ts:49`) es un guard de parseo documentado y pre-existente (extraído verbatim) |
| Código muerto / exports innecesarios | ✅ `/build` des-exportó `normalizeOrigin` (era API pública sin consumidor); `getCorsOrigins` tiene un único caller real (`index.ts:48`), `CorsOrigin` solo lo usa el test |
| Acoplamiento / ciclos | ✅ `utils/corsOrigins` → `utils/logger` únicamente; `index.ts` → `utils/corsOrigins`; sin ciclos |
| Testabilidad | ✅ el objetivo de la extracción: la resolución de CORS se prueba sin levantar el servidor HTTP |

**Observaciones (no bloqueantes, ninguna exige repaso):**

- **OBS-01 [DRY] — `securityMiddleware.ts:29-47` reimplementa el parseo de `CORS_ORIGIN`/`CORS_ORIGINS`** que ahora encapsula `normalizeOrigin` (`new URL(...).origin` + `try/catch` + "ignorar si es inválida"). Divergencia real, pequeña: el CSP **no filtra esquemas no-http(s)**, así que un `CORS_ORIGIN=ftp://x` acabaría en `connectSrc` mientras CORS lo rechaza. Pre-existente (el middleware es de un ciclo anterior cerrado) y fuera del alcance de R1..R3. Sugerencia para un ciclo futuro: exportar `normalizeOrigin` y consumirlo desde el middleware (única fuente de verdad). No bloquea.
- **OBS-02 [entorno/Docker, pre-existente, NO verificado en contenedor] — el `--host 0.0.0.0` de `docker-compose.yml:55` nunca llega a Vite.** `dev` = `concurrently …`, y está comprobado empíricamente en las 3 formas posibles (`concurrently <cmds> --host …`, `… -- --host …`, y con dos hijos como el script real) que **el argv de los hijos queda vacío** (`FE=[] BE=[]`): concurrently se traga el flag. Pnpm sí reenvía lo que va tras `--` al script (verificado con `pnpm run lint-staged -- --help`), luego la cadena muere en concurrently. Combinado con `host: "localhost"` (`vite.config.ts:11`), dentro del contenedor Vite escucha en loopback y el mapeo `'5173:5173'` (`docker-compose.yml:39`) no debería alcanzarlo → **el frontend del `docker compose` de desarrollo probablemente sea inalcanzable**, y el comentario `vite.config.ts:12` ("Docker dev overrides this via `--host 0.0.0.0`") es inexacto. **No lo introduce este ciclo** (viene del hardening `host: true → "localhost"` de un ciclo cerrado) y **no lo he podido verificar dentro de un contenedor** (`docker compose up` no ejecutado). `pnpm dev` en el host no se ve afectado. Recomendación: confirmar con `docker compose up` y, si se reproduce, arreglar la vía de paso del flag (o aceptar `VITE_HOST` en el script). No bloquea.

## 3. Tests — Clasificación (`test-classification`)

| Veredicto | Nº | Detalle |
|---|---|---|
| ✅ **KEEP** | **11** | ver desglose |
| ❌ **REMOVE** | **0** | ninguno es andamiaje: no testean mocks, no verifican "X llama a Y", no hay duplicados |
| ⚠️ SUGERENCIA (ajenos al ciclo) | 0 | — |

- `backend/src/__tests__/corsOrigins.test.ts` — **8 KEEP**: (1) el puerto de fallback `5174` y vecinos → **reproduce el bug reportado**, criterio máximo; (2) variantes de loopback `127.0.0.1`/`[::1]` → edge con impacto real (el bind puede resolver a IPv6); (3) remotos y look-alikes rechazados → **invariante de seguridad**; (4) normalización de `CORS_ORIGIN` → contrato de producción; (5) `CORS_ORIGINS` con entradas inválidas → edge del contrato; (6) sin fallback local implícito + `app.example.com.evil.com` → invariante anti-leak; (7) `ALLOW_LOCALHOST` opt-in → contrato. *Borderline declarado:* la aserción "ningún `RegExp` en prod" toca la forma del dato más que el comportamiento, pero protege el invariante de que los patrones son **solo-dev**; en duda → KEEP; (8) throw sin allowlist → invariante fail-loud, corroborado además E2E.
- `src/__tests__/devServerConfig.test.ts` — **3 KEEP**: (9) `strictPort` y (10) ausencia de `clientPort` → **regresiones exactas de este ciclo**, ambas corroboradas en runtime; (11) `host: localhost` + `usePolling` → contrato del dev (hardening CVE + Docker/WSL), *borderline* por ser aserción de config, pero es el guard más barato para una clase de regresión que la suite no vería de otro modo; en duda → KEEP.

**Valor probatorio de la suite:** las aserciones pasan por el **middleware real de `cors`** (helper `corsHeadersFor` que ejecuta `cors(...)` y lee las cabeceras), no por un mock ni por la forma interna de la lista → un cambio de string a `RegExp` (o al revés) no puede pasar en silencio.

## 4. Suite — evidencia

| Comando | Resultado | Exit |
|---|---|---|
| `pnpm test` (runner del manifiesto) | **21 ficheros / 157 tests passed** (baseline `7d340af`: 19 / 146 → **+2 ficheros, +11 tests**) | **0** |
| `pnpm type-check` (FE + BE) | sin errores (cubre `vite.config.ts`, arrastrado por el import del test nuevo) | **0** |
| `pnpm exec oxlint .` (**modo check, sin `--fix`**: mi sandbox no puede escribir código) | sin hallazgos | **0** |
| `node scripts/lint-filenames.mjs` | 3 ficheros nuevos con nombres válidos (`corsOrigins.ts` camelCase en `utils/`; tests en `src/__tests__/`, ignorados por diseño) | **0** |
| `pnpm format:check` (`biome format .`) | **1 fichero**: `.agents/.state/build_state.json:45` → **ID-01** | **1** |
| E2E manual (backend `:3099` dev / `:3098` prod / `:3097` sin allowlist, `vite:5199`, `dev:frontend` con `:5173` ocupado) | ver §1 | 0 / 0 / 1 / 0 / 1 (los esperados) |

No requiere `/debug`.

### ID-01 [QA, cosmético — NO bloqueante, remediado por la propia vía de commit]

`biome` quiere expandir el array de una sola línea de `.agents/.state/build_state.json` (línea 45, 105 columnas):

```diff
-    "modified": ["backend/src/index.ts (inline CORS block extracted, −74 lines)", "vite.config.ts"]
+    "modified": [
+      "backend/src/index.ts (inline CORS block extracted, −74 lines)",
+      "vite.config.ts"
+    ]
```

- **Impacto real:** el árbol entregado hace fallar `pnpm format:check` (y por tanto `pnpm qa`). Es un **fichero de estado del arnés**, no código revisable, y **cero** impacto funcional en R1..R3 (el resto del repo está limpio: `biome` solo reporta ese fichero).
- **Por qué no bloquea:** `.lintstagedrc` aplica `biome format --write` a `*.{css,json,html}` → el `pre-commit` de `/scribe` **lo formatea y re-escenariza** al commitear, de modo que el árbol **post-commit** vuelve a verde sin tocar lógica (`oxlint --fix` sobre los `.ts` nuevos está verificado como no-op: `oxlint .` ya sale 0 sin fix). **Condición de esta aprobación (para `/scribe`):** si el hook se omite (`--no-verify`) o el fichero no entra en el commit, ejecutar `pnpm exec biome format --write .agents/.state/build_state.json` antes de cerrar, y confirmar `pnpm format:check` verde.
- **No lo arreglo yo:** mi sandbox solo puede escribir `review_*.md` y `checkpoint.yml`.

## 5. OBS-03 [QA, cosmético] — fecha del ciclo

`date -I` y el `mtime` de los ficheros creados devuelven **2026-09-17** (el ciclo anterior cerró el mismo día a las 16:29). `/build` etiquetó este ciclo como **2026-09-18** en `checkpoint.yml`, `build_state.json` y `history.md`. **Acción para `/scribe`** (dueño de esos ficheros): normalizar la fecha del ciclo a **2026-09-17** al archivar, para no dejar una entrada con fecha futura en el historial. Este informe usa la fecha real.

## 6. Workload

| Métrica | Valor | SLO | Estado |
|---|---|---|---|
| Ficheros de **código/config** | **5** | ≤5 | ✅ en el límite |
| Líneas de código/config | **385** (`10+/74−` tracked + 301 nuevos: 104 util del que ~60 es código movido, 197 test) | ≤400 | ✅ **dentro** |
| Ficheros `.agents/` (arnés, excluidos del SLO como en el ciclo anterior) | 3 (`132+/210−`) | — | ⚠️ divulgado: la mayor parte es **contenido movido** (`checkpoint.yml` anida el ciclo cerrado verbatim) y `build_state.json` se reescribe |

**Lógica nueva neta ≈ 52 líneas** (74 líneas son borrado por la extracción). Sin motivo de split.

*Nota de exactitud:* el `build_state.json` entregado declara "~455 líneas" sumando el arnés; la medición real del delta `.agents/` es `132+/210−` (342, mayoritariamente **contenido movido**, que se cuenta dos veces como borrado+inserción). Cifra a corregir en el mismo pase que ID-01.

## 7. Ítems abiertos (no bloquean)

- **ID-01** → condición de `/scribe` (formato de `.agents/.state/build_state.json`), descrita arriba.
- **OBS-03** → normalizar la fecha del ciclo a 2026-09-17 en el archivado.
- **OBS-02** → verificar `docker compose up` (frontend inalcanzable por `--host` no reenviado); candidato a ciclo corto propio.
- **OBS-01** → reutilizar `normalizeOrigin` en el CSP (DRY + filtro de esquema).
- **Deuda de entorno del usuario:** `:5173` sigue ocupado por un dev server ajeno y **obsoleto** (proceso de otro proyecto): con `strictPort` el fallo ahora es explícito, pero conviene matarlo.
- **`index-mcp` desactualizado:** `index_status` = 118 ficheros / 282 símbolos (el índice es del 2026-09-17 y no contiene los 3 ficheros nuevos) → las métricas MCP no cubren `corsOrigins.ts` ni los tests nuevos; se midieron localmente (`wc -l` + análisis de indentación). **Reindexar es trabajo de `/scribe`.**
- Arrastrados del ciclo cerrado (sin cambios): export de alertas Dependabot, decisión sobre `.github/workflows/security.yml`, slices C2b/C3, close-list de 11 refs, watch del primer run de Dependabot, y la observación pre-existente de que `backend/tsconfig.json` compila `__tests__` en `dist/`.

## 8. Veredicto

### Reporte — ✅ APROBADO

**VERIFY** [✓] R1 · R2 · R3 implementados y **verificados de forma independiente sobre HTTP y sobre Vite en ejecución**, no solo por los tests (incluye control negativo contra el backend antiguo del usuario y un E2E de fail-loud con `exit 1`) · escenarios happy/edge/side ✓ · design/tasks: N/A (Fast Path sin `plan_*.md`, declarado y trazado en los docblocks)
**QA** [✓] sin hallazgos bloqueantes de código; 1 ID cosmético de formato en un fichero de estado del arnés (ID-01, remediado por el hook de commit) + 3 observaciones informativas (OBS-01/02/03)
**Tests** KEEP **11** / REMOVE **0**
**Suite** [✓] `pnpm test` exit 0 — 21 ficheros / 157 tests (+11 vs baseline) · `pnpm type-check` 0 · `oxlint` (check) 0 · `lint-filenames` 0 · `format:check` 1 (ID-01)
**Workload** ✅ 5 ficheros / 385 líneas de código+config, dentro del SLO

Tests a eliminar por `/build`: **ninguno**.

```
🔄 HANDOFF → /scribe | Gate: reviewer | Artefactos: [.agents/docs/review_2026-09-17_dev-port-fallback.md, .agents/checkpoint.yml, .agents/.state/build_state.json, .agents/context/history.md, backend/src/utils/corsOrigins.ts, backend/src/__tests__/corsOrigins.test.ts, src/__tests__/devServerConfig.test.ts, backend/src/index.ts, vite.config.ts] | Pendiente: (1) commitear con el hook activo — lint-staged debe formatear .agents/.state/build_state.json (ID-01) y `pnpm format:check` debe quedar verde; (2) normalizar la fecha del ciclo a 2026-09-17 (OBS-03); (3) reindexar index-mcp y `mem_save type:session` (el índice no tiene los 3 ficheros nuevos)
```
