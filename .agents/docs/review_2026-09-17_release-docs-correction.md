# Review — Corrección documental del release 2.1.0

- **Fecha:** 2026-09-17 · **Gate:** `/reviewer` · **Ciclo:** release-2.1.0 documentation corrections (`/build`, harness-only) · **Rama:** `develop`
- **Nota de alcance:** no hay `plan_*.md` ni deltas de `change_spec.yaml` (corrección de arnés, solo `.agents/`). El "requisito" es que **cada afirmación corregida sea verdadera**; por eso la verificación es afirmación por afirmación contra el código de git-flow y contra el estado medido del repo, sin fiarme de la narración del build.
- **HEAD:** `70d54fda` (tag anotado `V2.1.0` → commit `c5ae925`) · árbol con **4 ficheros `.agents/` modificados, 0 de código y 0 de test**
- **Candidato congelado:** `git diff --stat` → `4 files changed, 143 insertions(+), 88 deletions(-)` (`build_state.json`, `checkpoint.yml`, `history.md`, `release-versioning.md`)
- **Hash de la superficie revisada** (`.agents` diff): `25b8b8c44923194337b8df2562c95a8643b666ecfbf07fd45ae72b481a9c3f63`
- **`build_hash`:** `docs-corrections@70d54fda: release-versioning.md (…) + checkpoint + build_state + history`
- **`reviewer_hash`:** `87e9c3146c8986e1` = `sha256(build_hash + "\n" + diff_stat)[0:16]`, ambos leídos del checkpoint tal como los dejó `/build`

---

## 1. VERIFY — afirmación por afirmación

| Afirmación corregida | Verificación independiente | Estado |
|---|---|---|
| Tags **anotados** y con prefijo **`V`** | `git config --get gitflow.prefix.versiontag` → `V`; `git show V1.0.0 / V2.0.0 / V2.1.0 --no-patch` → los tres son objetos *tag* anotados | ✅ |
| "**21 tags**" | `git show-ref --tags \| wc -l` → **20** (V1.0.0 · V1.1.0–V1.1.9 · V1.2.0–V1.2.3 · V1.3.0–V1.3.2 · V2.0.0 · V2.1.0) | ❌ **ID-01** |
| `V2.1.0` existe y apunta al merge `c5ae925` (objeto `70d54fda`) | `git show-ref --tags V2.1.0` → `70d54fda…`; `git show V2.1.0 --no-patch` → commit `c5ae925` | ✅ |
| `V2.0.1` no existe | `git show-ref --tags V2.0.1` → vacío (exit 1) | ✅ |
| `release/2.1.0` borrada | `git branch --list 'release/2.1.0'` → vacío | ✅ |
| `main` y `develop` ambas en 2.1.0 (deriva cerrada) | `git diff main develop -- package.json backend/package.json README.md docker-compose.prod.yml .agents/project_manifest.yaml` → **vacío** | ✅ |
| `finish` exige **árbol limpio** (`git-flow-release:817`) | Leído: `require_clean_working_tree` incondicional dentro de `cmd_finish`; `:571` (`gitflow.allowdirty`) está en el handler de `start` | ✅ |
| `-m` obligatorio sin TTY (`:872`; flags `:768`/`:769`) | Leído: `opts="-a"` y `-m` solo si `FLAGS_message` ≠ ""; coincide con el fallo real observado (`nano` + "no es un terminal") | ✅ |
| Idempotencia: salta merge ya hecho (`:844`) y tag existente (`:859`) | Leído en el script | ✅ |
| Anotación `V2.1.0 V2.1.0` por `run_filter_hook` (`gitflow-common:758-759`) | Leído: rama `else` → `echo "$@"` con (mensaje, nombre del tag); coincide con la anotación real del tag | ✅ |
| "`main` 9 commits por delante de `origin/main`" | `git rev-list --count origin/main..main` → **9** | ✅ |
| "`develop` **6** commits por delante de `origin/develop`" | `git rev-list --count origin/develop..develop` → **12** (el 6 era de antes del back-merge y además es volátil) | ❌ **ID-02** |
| `-F <fichero>` produce anotación exacta sin duplicar | **Inferido** del código (el fichero no atraviesa `run_filter_hook`), no ejercitado | ⚠️ OBS-02 |

**Escenarios:** happy (todas las citas de código y de estado verificadas) ✅ · edge (los **conteos**: 2 fallos) ❌ · side (sin código afectado; el release en sí está correcto) ✅.

## 2. QA

- **Sin código ni tests tocados** → los checks de *code-hygiene* (catch silencioso, `console.log`, funciones, secretos, anidamiento) son **N/A**: el diff es exclusivamente `.agents/`.
- Sí verificado: `pnpm exec biome format .` en **modo check (sin `--write`)** → `Checked 71 files … No fixes applied`, exit 0 ✅ · `checkpoint.yml` parsea **sin claves duplicadas** (loader estricto propio) ✅ · `build_state.json` parsea ✅ · `history.md` 177 líneas (< 200) ✅.
- **Coherencia documental:** la afirmación falsa original (*"has no tags"*) solo reaparece **marcada como superada** (spec, checkpoint, history) ✅; `review_2026-09-17_release-2.1.0.md` sigue **sin editar** (artefacto congelado) ✅.

## 3. Tests — Clasificación

| Veredicto | Nº | Detalle |
|---|---|---|
| ✅ KEEP | 0 | — |
| ❌ REMOVE | 0 | — |

**N/A:** este ciclo no añade ni modifica tests (documentación pura). La invariante que documenta ya está guardada por `versionConsistency.test.ts`, que sigue verde.

## 4. Suite — evidencia

| Comando | Resultado | Exit |
|---|---|---|
| `pnpm test` (runner del manifiesto) | **22 ficheros / 161 tests passed** (idéntico al release: no se tocó código) | **0** |
| `pnpm exec biome format .` (check-only) | 71 ficheros, sin cambios propuestos | **0** |
| Validación propia | `checkpoint.yml` sin claves duplicadas · `build_state.json` parsea | **0** |

No requiere `/debug`.

## 5. Workload

| Métrica | Valor | Estado |
|---|---|---|
| Ficheros | **4**, todos en `.agents/` (143+/88−) | ✅ |
| Código/config | **0** | ✅ fuera del SLO por la convención de los 3 ciclos previos (declarado explícitamente por `/build`) |

Sin motivo de split.

## 6. Hallazgos

### ❌ ID-01 [VERIFY, bloqueante] — "21 tags" es falso; son **20**

- **Evidencia:** `git show-ref --tags | wc -l` → **20**. Enumeración real: `V1.0.0`, `V1.1.0`–`V1.1.9` (10), `V1.2.0`–`V1.2.3` (4), `V1.3.0`–`V1.3.2` (3), `V2.0.0`, `V2.1.0` = **20**.
- **Ocurrencias (4):**
  1. `.agents/docs/specs/release-versioning.md:46` → `— 21 tags.`
  2. `.agents/checkpoint.yml:25` → `evidence: "… git show-ref --tags → 21 tags …"`
  3. `.agents/.state/build_state.json:24` → `"tags": "git show-ref --tags → 21 tags …"`
  4. `.agents/context/history.md:12` → `21 tags (…), sin V2.0.1`
- **Corrección:** poner **20**. (La enumeración por rangos que ya aparece en el spec es correcta y no necesita cambios.)

### ❌ ID-02 [VERIFY, bloqueante] — "develop 6 commits por delante" está desfasado y es volátil

- **Evidencia:** `git rev-list --count origin/develop..develop` → **12** (el `main → 9` sí es correcto y verificado). El `6` proviene de la salida del terminal **antes** de que el finish hiciera el back-merge del release en `develop`.
- **Ocurrencia:** `.agents/checkpoint.yml`, en `pending_ids` → `"USER: push main + develop + tags (main is 9 commits ahead of origin/main, develop 6)"`.
- **Corrección recomendada:** quitar las cifras (caducan con cada commit) y dejar algo estable tipo *"both branches have unpushed commits"*; si se quieren mantener números, tomarlos en el momento de escribir.

## 7. Observaciones (no bloquean, sin acción)

- **OBS-01:** el objeto del tag `V1.0.0` tiene nombre interno **`VV1.0.0`** mientras la ref es `refs/tags/V1.0.0` — residuo histórico de un renombrado (probablemente un `release/V1.0.0` con el prefijo ya incluido). Inocuo y ajeno a este ciclo; explica una duplicación histórica del prefijo, no la actual.
- **OBS-02:** la afirmación sobre `-F <fichero>` (anotación exacta, sin duplicar) está **inferida del código**, no ejercitada. No hay evidencia en contra; queda anotada como no probada empíricamente.
- **OBS-03:** cualquier cifra de "commits por delante" en el arnés nace caducada; mejor evitarlas (lo mismo que pide ID-02).

## 8. Veredicto

### Reporte — ❌ RECHAZADO

**ID-01 [VERIFY]** `21 tags` → son **20** (4 ocurrencias: `release-versioning.md:46`, `checkpoint.yml:25`, `build_state.json:24`, `history.md:12`) — en un ciclo cuyo único propósito es la exactitud factual, un dato falso no puede pasar.
**ID-02 [VERIFY]** `develop 6 commits por delante` → son **12** y la cifra es volátil (`checkpoint.yml`, `pending_ids`).
**Tests a eliminar por `/build`:** ninguno.
**Suite:** ✅ verde — `pnpm test` exit 0 (22 ficheros / 161 tests); `biome format` check-only 0. **No requiere `/debug`.**
**Resto del ciclo:** correcto — la release 2.1.0 está bien cerrada (tag `V2.1.0` → `c5ae925`, rama borrada, `main`/`develop` ambas en 2.1.0) y todas las citas de git-flow quedaron verificadas contra el código.

```
🔄 HANDOFF → /build | Gate: reviewer | Artefactos: [.agents/docs/review_2026-09-17_release-docs-correction.md, .agents/checkpoint.yml (status: reviewer_rejected)] | Pendiente: ID-01 (20 tags en 4 sitios) + ID-02 (quitar/corregir la cifra de develop en pending_ids); sin tests que eliminar; suite ya verde
```
