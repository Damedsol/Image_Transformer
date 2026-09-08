# Plan de Arquitectura: Continuación de la Sesión de Seguridad (ses_fbb1)

> **Fecha:** 2026-08-28 · **Gate:** 1-6 (plan) · **Estado:** DRAFT
> **Contexto:** Continúa la sesión opencode `session-ses_fbb1.md` (auditoría SCA).
> **Hallazgo clave:** La auditoría quedó **mayormente aplicada** en el ciclo
> `plan_2026-08-27_dependency-security-remediation.md` (sharp 0.35.3, multer 2.2.0,
> zod 4.4.3, trust proxy, rate-limit IP-only, ZIP randomBytes, vite host). Solo
> **2 hallazgos LOW quedan pendientes**, uno de ellos explícitamente diferido.

## GRILL: Alineación de Dominio

- **Términos clave:** CSP directives (`defaultSrc`/`scriptSrc`/`connectSrc`),
  `'unsafe-inline'`, wildcard origin (`*.onrender.com`), in-memory `ipQuotas` Map
  (quota diaria por IP), `DAILY_QUOTA_PER_IP`.
- **Decisiones previas (ADRs/contexto):**
  - `plan_2026-08-27_dependency-security-remediation.md` → **explicitly deferred** the
    CSP `'unsafe-inline'` + `connectSrc` wildcard change ("API sirve solo JSON, low-value,
    deployment risk").
  - `error.message` leak → **ya mitigado** (gated a `NODE_ENV === "development"`).
  - `history.md` 2026-08-27 · "Dependabot security remediation" → deps/config ya cerrado.
- **Consistencia:** [✓] El vocabulario del audit (`CSP`, `unsafe-inline`, `ipQuotas`)
  coincide con el código actual (`securityMiddleware.ts`, `imageController.ts`).
  [⚠️] `imageController.ts` cuota usa un `Map` plano sin límite; el audit la marca
  LOW pero es una fuga de memoria real en producción (entries por IP acumuladas/día).

## PROPOSE: Intención, Alcance y Approach

- **Intención:** Cerrar los **2 hallazgos LOW restantes** de la sesión ses_fbb1 que
  aún no están aplicados: (A) endurecer la CSP eliminando `'unsafe-inline'` y el
  wildcard `https://*.onrender.com`; (B) acotar el crecimiento del `ipQuotas` Map.
- **in-scope:**
  - A. Refactor CSP en `securityMiddleware.ts` a funciones puras testeables; quitar
    `'unsafe-inline'` de `scriptSrc`/`styleSrc`; `connectSrc` solo orígenes exactos.
  - B. Extraer la lógica de cuota a un módulo testeable con límite de entradas
    (`QuotaStore` acotado) y reutilizarlo en `imageController.ts`.
- **out-of-scope:**
  - Re-bump de dependencias ya aplicadas (sharp/multer/zod/vite) — cerrado.
  - Residuales dev-only (`undici`×5 vía jsdom/vitest, `esbuild`×1 vía tsx/vite/vitest)
    — no alcanzables en producción; requieren bumps de tooling, no de producción.
  - Cambio del `Map` a Redis/DB persistente — fuera de YAGNI en este ciclo.
- **Approach:** Refactor local (no nuevo módulo de infraestructura) con extracción
  de funciones puras para habilitar TDD, SIN romper el comportamiento HTTP actual.
- **Subagente:** no se añaden dependencias → `/audit` **no** requerido.
- **Recomendación /reviewer:** [ ] No crítica, pero toca seguridad (CSP + cuota) →
  **sí** recomendar `/reviewer` al cierre, con énfasis en: no romper la política CSP
  de producción y no cambiar semántica de la cuota diaria.

## SPEC: Requisitos y Escenarios

### A. CSP endurecida

- **R1.** `configureHelmet()` debe producir una CSP sin `'unsafe-inline'` en
  `scriptSrc` ni `styleSrc`.
- **R2.** `connectSrc` debe contener SOLO orígenes exactos (`'self'`, `backendOrigin`,
  orígenes permitidos de `allowedOrigins`) — **sin** el wildcard `https://*.onrender.com`.
- **R3.** La directiva `defaultSrc` permanece `['self']`; `imgSrc`/`fontSrc`/`frameSrc`
  sin cambios (API solo sirve JSON + `/temp` estáticos).
- **R4.** La CSP no debe aplicar `'unsafe-inline'` a `script-src-attr`/`style-src-attr`
  (si helmet los emite por defecto, quitar igualmente la variante inline).

**Happy:** API responde 200 con `Content-Security-Policy` sin inline ni wildcard.
**Edge:** sin `CORS_ORIGIN`/`CORS_ORIGINS`/`BACKEND_URL` → fallback a
`https://image-transformer-r99u.onrender.com` exacto (sin wildcard).
**Side:** el frontend SPA NO lo sirve el backend (lo sirve nginx/Vite), por lo que
la CSP del backend no afecta al HTML actual — el cambio es seguro.

### B. Cuota acotada

- **R5.** El store de cuota debe limitar el número de entradas de IP (`maxEntries`)
  para evitar crecimiento de memoria no acotado.
- **R6.** Al superar el límite, evictar entradas expiradas (día anterior) primero;
  si aún excede, evictar por LRU (la entrada menos recientemente usada).
- **R7.** `DAILY_QUOTA_PER_IP` y `MAX_FILES_PER_REQUEST` semántica intacta.
- **R8.** No persistir entre reinicios (igual que hoy — documentado en comentario).

**Happy:** cuota diaria funciona igual; store acotado.
**Edge:** 0 entries / `maxEntries` pequeño (1-2) → no lanza, evicta correctamente.
**Side:** límite de `maxEntries` configurable vía `process.env.IP_QUOTA_MAX_ENTRIES`
con default seguro (p.ej. 10_000).

### Criterios de aceptación

- `pnpm test` verde (nuevas suites `securityMiddleware.test.ts` + `quota.test.ts`).
- `pnpm type-check` verde.
- `pnpm build` verde.
- `pnpm audit --prod` sigue en **0** vulns (sin cambios de deps).
- Smoke manual: `curl -I`/POST de conversión sigue funcionando.

## DESIGN: Arquitectura

- **Verificación principios:**
  - `[✓] DRY:` la lógica de cuota y de CSP se extraen a un único lugar reutilizable
    (evita duplicar en `imageController`/`securityMiddleware`).
  - `[✓] YAGNI/KISS:` no se introduce Redis/DB; solo un `Map` acotado con evicción.
    CSP se endurece sin reescribir el esquema de helmet.
  - `[✓] ÚLTIMO RECURSO:` extraer a `quota.ts` y `buildCspDirectives` (en el propio
    `securityMiddleware.ts`) se justifica por **testabilidad** — `imageController` y
    `configureHelmet` no son unit-testables sin harness HTTP completo; funciones puras
    sí. No es una dependencia ni un nuevo framework.
  - `[✓] TDD:` nuevo test primero (vitest, globals, jsdom) en `backend/src/__tests__/`.

- **Archivos implicados:**
  - **Modificar:** `backend/src/middlewares/securityMiddleware.ts` → extraer
    `buildCspDirectives()` puro; `configureHelmet()` lo consume.
  - **Crear:** `backend/src/utils/quota.ts` → `QuotaStore` (Map acotado, evicción
    expiración→LRU). `backend/src/__tests__/quota.test.ts`.
  - **Crear:** `backend/src/__tests__/securityMiddleware.test.ts`.
  - **Modificar:** `backend/src/controllers/imageController.ts` → usar `QuotaStore`
    (reemplaza el `Map` plano e `checkIPQuota` inline); leer
    `IP_QUOTA_MAX_ENTRIES`.
  - **Ningún** archivo eliminado (sin dead code a remover).

- **Dependencias & Configuración:** ninguna nueva. Solo nueva env opcional
  `IP_QUOTA_MAX_ENTRIES` (default 10_000). No tocar `pnpm-workspace.yaml`.

- **Seguridad:**
  - **Inyección:** CSP sin wildcard ni inline reduce superficie XSS/inline-script.
  - **Fugas:** sin cambio de datos (cuota sigue en memoria).
  - **Accesos:** la CSP endurecida no abre nuevos orígenes (los restringe).
  - **DoS/memoria:** `QuotaStore` acotado mitiga crecimiento no acotado del `Map`.

- **Rendimiento:**
  - Operación costosa: evicción por LRU requiere búsqueda/orden. Mitigación: `Map`
    con orden de inserción (iterator) + expiración por `resetAt < hoy` (O(1) por
    lookups; evicción solo en inserción cuando `size > maxEntries`).

## TASKS: Checklist TDD

### Fase Red: Configuración del Caso Fallido

**A — CSP**

- [✓] **T1:** Crear `backend/src/__tests__/securityMiddleware.test.ts`.
- [✓] **T2:** Test que llama a `buildCspDirectives()` (o `configureHelmet().bind` con
  req/res mockeados) y asserta: `scriptSrc`/`styleSrc` NO contienen `'unsafe-inline'`;
  `connectSrc` NO incluye `*.onrender.com`; incluye `backendOrigin` exacto. → **RED** si
  la implementación actual (inline) se usa tal cual.

**B — Cuota**

- [✓] **T3:** Crear `backend/src/__tests__/quota.test.ts`.
- [✓] **T4:** Test `QuotaStore`: (a) respeta `maxEntries` y evicta la más antigua; (b)
  evicta expiraciones (resetAt anterior) antes que LRU; (c) `DAILY_QUOTA_PER_IP`
  semántica (count/reset) intacta. → **RED** (no existe la clase).

### Fase Green: Implementación y Validación

- [✓] **T5:** En `securityMiddleware.ts`: extraer `buildCspDirectives()` como función
  pura (sin `'unsafe-inline'`, sin wildcard; `connectSrc` = `['self', backendOrigin,
  ...allowedOrigins]`); `configureHelmet()` la usa. Pasar T1/T2.
- [✓] **T6:** Crear `backend/src/utils/quota.ts` con `QuotaStore` (constructor
  `{ maxEntries }`, `get`, `set`, evicción expiración→LRU). Pasar T3/T4.
- [✓] **T7:** En `imageController.ts`: reemplazar `ipQuotas`/`checkIPQuota` con
  instancia `QuotaStore` (+ leer `IP_QUOTA_MAX_ENTRIES`). Mantener `DAILY_QUOTA_PER_IP`.
- [✓] **T8:** Ejecutar `pnpm vitest run backend/src/__tests__/securityMiddleware.test.ts`
  y `pnpm vitest run backend/src/__tests__/quota.test.ts` → verde.
- [✓] **T9:** Ejecutar `pnpm type-check` y `pnpm build` → verde. ✅ *(ejecutado 2026-08-28 a petición del usuario: ambos verdes).*

### Fase Refactor: Limpieza y Optimización

- [✓] **T10:** Revisar que no quede `Map` plano/`Math.random` residual ✅ *(verificado vía grep: limpio)*; `biome format`
  y `oxlint` limpios ✅ *(ejecutado: 1 fix de formato aplicado por biome, resto limpio).*
- [✓] **T11:** `pnpm qa` completo verde ✅ *(95/95)*; smoke manual `POST /api/convert` (pendiente opcional) + `pnpm audit
  --prod` = 0 ✅ *(tras fix qs, ver nota)*. Nota 1: `session-ses_fbb1.md` ELIMINADO a petición del usuario (causaba el fallo lint-filenames; ahora 95/95). Nota 2: el audit reveló 2 moderate NUEVAS en `qs@6.15.2` (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) → fix con override `"qs": ">=6.16.0"` + lockfile regenerado → `audit --prod` = 0.

## Riesgos

- **[CSP break en producción]:** [Medio] Si el frontend dependiera de la CSP del
  backend, quitar `'unsafe-inline'` rompería scripts inline. **Mitigación:** el backend
  sirve solo JSON + `/temp`; el HTML frontend lo sirve nginx/Vite. Validar con smoke +
  `/reviewer` antes de merge.
- **[Quota evicción prematura]:** [Bajo] `maxEntries` demasiado pequeño evicta IPs
  activas. **Mitigación:** default 10_000 + `IP_QUOTA_MAX_ENTRIES` configurable;
  evicción prioriza expiradas.
- **[Regression en tests]:** [Bajo] Refactor de `checkIPQuota` a `QuotaStore` podría
  cambiar semántica. **Mitigación:** mantener exacta la lógica de `resetAt`/`count`;
  T5-T7 paso a paso con tests.

## Handoff

→ **REVISADO.** Gate completado: 1-6 (plan). Artefactos: este plan.
Próximo agente: **/build** (`pnpm` scripts QA + build; NO auto-commit/push).
Recomendación: /reviewer con énfasis en CSP producción + semántica de cuota.
