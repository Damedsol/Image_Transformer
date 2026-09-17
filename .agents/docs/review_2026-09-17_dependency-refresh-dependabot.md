# Review — Dependency Refresh + Dependabot Enablement

- **Fecha:** 2026-09-17 · **Gate:** `/reviewer` · **Ciclo:** R1–R12 (plan de 2026-09-17)
- **HEAD:** `8a62fde` (`feature/minor-fixes-and-security`) · working tree **no commiteado**
- **Artefactos revisados:** `.agents/docs/plan_2026-09-17_dependency-refresh-and-advisory-closure.md` (md5 `0cba839e1de57093d3e5e491302b87a1`), `.agents/specs/change_spec.yaml` (md5 `271d5de3170986e434271bf9ff6233e9`), `.agents/.state/build_state.json` (md5 `8b182861f3248203d0fef8e7b1a1d846`), `.github/dependabot.yml` (md5 `25e82977272fd7096adf6f142c60e990`)
- **Candidato congelado antes de opinar:** `git diff --stat` → `5 files changed, 120 insertions(+), 85 deletions(-)`; código/config = 4 ficheros (231 líneas con el nuevo) → **dentro del SLO (≤5 fich / ≤400 líneas)** ✔
- **`build_hash`:** `slices C1+C2a + dependabot.yml @ 8a62fde — change_spec.yaml 2026-09-17-dependency-refresh-and-advisory-closure`
- **`reviewer_hash`:** `999cd501cde9cf83`

---

## 1. VERIFY — R1..R12

Verificación **independiente** (re-ejecutada en este gate, no copiada del build report).

| ID | Requisito | Veredicto | Evidencia propia |
|---|---|---|---|
| R1 | Inventario de advisories como evidencia | ✅ / ⚠️ parcial-externo | `pnpm audit` **0** y `pnpm audit --prod` **0** re-ejecutados (exit 0); JSON archivado presente. La exportación de Dependabot sigue **bloqueada** (no hay `gh`, repo privado) → parcial justificado, no imputable al ciclo |
| R2 | Reconciliación de ramas Dependabot obsoletas | ✅ | `git branch -r \| grep -c dependabot` = **11** (coincide con el informe); las 11 están clasificadas con veredicto y comandos. **Ninguna debe mergearse** |
| R3 | Remediación de advisory vivo | ✅ no-op justificado | Audit 0/0 + OSV 0/376 (build) y **0/57 post-cambio** (re-verificado por mí) → no hay advisory vivo. Registrado explícitamente como no-op |
| R4 | Catalog floors (dev tooling) | ⬜ diferido declarado | `pnpm install` reporta biome 2.5.14 / commitlint 21.2.2 / concurrently 10.0.5 / globals 17.12.0 / oxlint 1.83.0 / vite 8.3.0 disponibles → slice C2b. Declarado en plan + checkpoint |
| R5 | Pins runtime del backend | ✅ | Invariante A/B propia: **10/10** deps productivas con `declared == resolved`: helmet **8.3.0**, express-rate-limit **8.7.0**, zod **4.6.2**, tsx **4.23.13** (multer 2.3.0 se mantiene: 2.4.0 bloqueado por `minimumReleaseAge`) |
| R6 | Override floors | ✅ | Resuelto en lockfile: minimatch **10.2.6**, flatted **3.4.4**, path-to-regexp **8.4.2**, ip-address **10.7.0**, postcss **8.5.28**; pines deliberados intactos: undici **7.29.0**, picomatch **2.3.2**, js-yaml **4.3.2**, brace-expansion **5.0.9**, fast-uri **4.1.4** |
| R7 | Verificación del árbol | ✅ | Ver §3 (suite) + smoke propio 200/200 |
| R8 | Script `check:security` | ⬜ diferido declarado | Slice C3 |
| R9 | Dependabot + CI | ⚠️ parcial + **ID-01** | `.github/dependabot.yml` presente, parsea, valida estructuralmente (0 claves desconocidas, 0 directorios solapados). El workflow CI sigue pendiente por decisión del usuario (declarado). **Defecto en `ignore` → ID-01** |
| R10 | ADR-0005 | ⬜ diferido declarado | Slice C3 |
| R11 | Sin majors / docker base / `.env` / cambio de comportamiento | ✅ | `git diff --name-only` = `backend/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.agents/*` → **cero ficheros de código fuente**; `backend/temp` ignorado; sin `.env` tocado |
| R12 | Majors como ciclo aparte | ✅ | Registrado (typescript 7, vitest 5, jsdom 30, lint-staged 17, archiver 8) |

**Escenarios:** happy ✅ (install/lockfile consistentes, suite verde, backend convierte) · edge ✅ (`minimumReleaseAge` → se eligió el patch permitido: biome 2.5.13, oxlint 1.82.0, zod 4.6.2, multer 2.3.0; `lowest-direct` vs pin exacto → detectado y corregido moviendo el floor a `zod >=4.6.2`) · side ✅ (dev tooling intacto y diferido).

**Invariante crítica re-verificada (fue el defecto real del ciclo):** para todo pin exacto con override espejo, `floor(override) >= pin` → `multer`, `sharp`, `zod` **OK**; y `declared == resolved` en las 10 deps productivas. El fallo de `zod` (4.4.3) está efectivamente corregido.

---

## 2. QA — Code Hygiene

No se añadió ni modificó **código fuente** (`git diff --name-only` lo confirma), por lo que los checks de funciones/anidamiento/duplicación son **vacuos** en este ciclo. Aplicado al entregable (config):

- Secretos hardcodeados → ✅ ninguno (`dependabot.yml`, `pnpm-workspace.yaml`, `package.json`).
- Comentarios que explican el **porqué** → ✅ (el YAML documenta causas raíz y el checklist de revisión; nota: la justificación del bloque `ignore` es **incorrecta** → ID-01).
- Catch silencioso / `console.log` / Último Recurso → ✅ N/A (sin código).
- Coherencia de contrato de manifiestos → ✅ `catalog:` intacto (10 entradas), pins exactos del backend intactos, `engines`/`packageManager` sin tocar.

## 3. Tests — Clasificación (test-classification)

**Tests nuevos o modificados en este ciclo: 0.** No hay producción nueva sin test que juzgar (el cambio es configuración de dependencias); la red de seguridad es la suite de regresión existente.

- ✅ KEEP — **0** (nada que conservar: sin tests nuevos)
- ❌ REMOVE — **0** (nada de andamiaje)
- ⚠️ SUGERENCIA — **1**: falta un test de contrato que hubiera atrapado el defecto de `zod` en la suite en lugar de en verificación manual → ID-03.

## 4. Suite (evidencia obligatoria)

| Comando | Resultado | Exit |
|---|---|---|
| `pnpm qa` (type-check FE+BE + oxlint + filenames + `biome format .` + `vitest run`) | **18 ficheros / 135 tests passed** | **0** |
| `pnpm audit` / `pnpm audit --prod` | *No known vulnerabilities found* (ambos) | 0 |
| `pnpm --filter image-transformer-backend list --prod --depth 0` | zod 4.6.2 · helmet 8.3.0 · express-rate-limit 8.7.0 · sharp 0.35.4 | 0 |
| Smoke runtime (arranque real + `GET /api/formats` + `POST /api/convert`) | **200** + **200** (webp 64×64 + zip; multer 2.3.0 → magic-bytes → zod 4.6.2 → sharp 0.35.4) | 0 |
| Validador estructural de `dependabot.yml` | `version:2` ✔ · 0 claves desconocidas ✔ · 0 directorios solapados ✔ | 0 |

> `pnpm install --frozen-lockfile` **no** se pudo re-ejecutar aquí: el hook pre-install bloquea `install` en el gate `/reviewer` (comportamiento correcto). La consistencia manifiestos↔lockfile se verificó por vía equivalente: `pnpm ls` + invariante `declared == resolved` en las 10 deps productivas + lockfile parseado.

---

## 5. Findings

### ❌ ID-01 [VERIFY] — El bloque `ignore` es inerte para version updates y puede silenciar *security updates* (`ignores` de `undici`, `nanoid`, `picomatch`, `js-yaml`)

**Fichero:** `.github/dependabot.yml` (entrada npm, bloque `ignore`)

**Hechos verificados (no opinión):**

1. **Ninguno de los 4 paquetes es dependencia directa de ningún manifiesto.** `grep` sobre `package.json` + `backend/package.json`: 0 coincidencias para `undici`, `nanoid`, `picomatch`, `js-yaml`. Solo existen como transitivos del lockfile y como overrides.
2. **Los version updates de Dependabot solo actúan sobre dependencias declaradas en manifiestos** → estas 4 reglas **no suprimen ningún PR de version update**: son inertes y aportan exactamente cero del beneficio declarado en el comentario ("so Dependabot does not propose a major that the consumers cannot accept").
3. **La documentación oficial dice que `ignore` también aplica a los security updates:** *"you can configure Dependabot to ignore those dependencies when it opens pull requests for **version updates and security updates**"* (`controlling-dependencies-updated`, sección *Ignoring specific dependencies*). Los security updates operan **sobre el lockfile**, donde estas 4 dependencias **sí** existen → la regla sí les afecta.
4. **El techo de versión ya está impuesto por otro mecanismo**, así que la regla es redundante incluso en su intención: `undici: 7.29.0` (pin exacto), `picomatch: 2.3.2` (pin exacto), `js-yaml: ">=4.3.2 <5"` en `pnpm-workspace.yaml`; y `nanoid` está retenido por el rango propio de `postcss@8.5.x` (`^3.3.16`).

**Impacto:** neto **puramente negativo**. Si en el futuro un aviso se parchea *solo* en la línea bloqueada (p. ej. `undici` 8.x, `js-yaml` 5.x), Dependabot **no abrirá el PR de security update** para esos paquetes. El alert seguiría visible en *Security → Dependabot* (los alerts no dependen del `dependabot.yml`), pero se pierde justamente la automatización que este ciclo (R9) venía a instaurar. Es el patrón heredado del repo de referencia (`currencyExchange`), donde esos paquetes **sí** son dependencias directas — al adaptarlo aquí dejó de tener sentido y no se detectó en el build.

**Corrección propuesta (2 minutos, /build):**
- Eliminar el bloque `ignore` completo de la entrada `npm` (`undici`, `nanoid`, `picomatch`, `js-yaml`). No hace falta sustituto: los overrides y los caret del catálogo ya fijan los techos, y los majors llegan como PRs individuales gracias a `groups` (solo agrupa minor/patch), para revisarlos uno a uno.
- Si en el futuro se quiere bloquear un major de una dependencia **directa**, usar `ignore` con `update-types: ["version-update:semver-major"]` **solo** si se acepta que también se bloquea el security update de ese major; en otro caso, dejar que el PR llegue y rechazarlo.
- Añadir al comentario del fichero el motivo (evitar que se reintroduzca).
- Re-validar: parseo YAML + validador estructural + `pnpm qa`.

### ⚠️ ID-02 [QA, cosmético] — Recuento de líneas inexacto en los registros

`diff_stat` en `checkpoint.yml` y `build_state.json` declara `dependabot.yml (new, 88 lines)`; el fichero tiene **87** líneas (`wc -l`). Sin impacto, pero es una cifra de evidencia. Corregir a 87 o eliminar el conteo al tocar el fichero por ID-01.

### ⚠️ ID-03 [TESTS, sugerencia no bloqueante] — Falta test de contrato del invariante pin↔floor

El defecto de `zod` (4.6.2 declarado → 4.4.3 resuelto por `resolutionMode: lowest-direct` + floor `>=4.4.0`) se detectó **manualmente**. Un test que parsee `pnpm-workspace.yaml` + `backend/package.json` y afirme `floor(override) >= pin` para cada pin espejo lo habría atrapado en la suite (135/135 habrían fallado en rojo). No bloquea: el defecto está corregido y verificado. Recomendado mientras se toca el fichero (candidato a `backend/src/__tests__/` siguiendo el patrón de `license-consistency.test.ts`, que ya parsea manifiestos).

---

## 6. Veredicto

### ❌ RECHAZADO (1 bloqueante, 2 secundarios)

Lo verificado está **sólido**: 0 advisories por dos fuentes, 4 pines runtime + 6 floors al último patch permitido, invariante pin↔floor correcta, suite 135/135, build verde, smoke 200/200, diff dentro del SLO y sin tocar código fuente. El rechazo es por **ID-01**, que es un defecto real en el artefacto central de este ciclo (la automatización de dependencias) con arreglo trivial.

Tests a eliminar por `/build`: **ninguno** (0 REMOVE).

Suite: ✅ 135/135 — no requiere `/debug`.

🔄 HANDOFF → `/build` | Gate: reviewer | Artefactos: [`.agents/docs/review_2026-09-17_dependency-refresh-dependabot.md`] | Pendiente: [ID-01 (bloqueante: quitar `ignore` inerte/peligroso de `.github/dependabot.yml`), ID-02 (cosmético: 87 líneas), ID-03 (sugerencia: test del invariante pin↔floor)]
