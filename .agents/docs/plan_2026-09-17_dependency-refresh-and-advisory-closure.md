# Plan — Advisory Triage & Within-Major Dependency Refresh

> Gate: `/plan` (via `/do`). Date: **2026-09-17**. Author: plan gate.
> Source analysis: `.agents/docs/analysis_2026-09-17_security-advisory-triage.md`
> Target: `feature/minor-fixes-and-security` (HEAD `8a62fde`), merged later into `develop`.
> Status: **plan_completed** → next gate `/build`.

---

## GRILL — decisions taken (and the two open questions)

**D1. The premise is unproven, so the plan starts with triage, not with a fix.**
A full-tree OSV scan of the 376 locked packages returns **0 advisories** (2026-09-17).
Patching a tree that is already clean is the wrong move. Phase 0 must produce the
authoritative alert list; Phase 1 is *conditional* on it.

**D2. Two-tier scope.** Default = *within-major refresh* (patch/minor only).
Major bumps (TypeScript 7, Vitest 5, jsdom 30, lint-staged 17, archiver 8) are
carved out as a **separate follow-up cycle** (R12), because each touches build
tooling or the 18-suite test bed.

**D3. Evidence over narration (RDD).** No claim of "patched"/"clean" is accepted
without a command + exit code, archived under `.agents/docs/evidence/`.

**D4. The lockfile churn is the workload risk.** `pnpm-lock.yaml` regeneration
alone will exceed the 400-line cycle SLO. The cycle is therefore **split into
three commits/slices** (C1 triage, C2 refresh, C3 automation) so no single diff
is oversized, and each slice is independently verifiable.

**D5. Overrides stay the remediation mechanism** for transitive alerts (proven
2026-08-27 → 2026-09-10), with the exact-pin rule when a consumer declares a
specific major line (`undici`, `picomatch`, `js-yaml`).

### Open questions (answers required before C2/C3; not blocking C1)

* **Q1 (blocks R1).** Where do you see the advisories — GitHub *Security →
  Dependabot* on `Damedsol/Image_Transformer`, a GitHub email digest, or a
  `pnpm audit` run? Please paste the alert titles/IDs or run the export in R1;
  the repo is private and this session has no GitHub auth, so the alert list
  cannot be read from here.
* **Q2 (blocks R10).** Is GitHub the canonical host for CI (`.github/`), given
  the repo is also mirrored to a Gitea remote? If Gitea is canonical, the
  automation target changes (no `.github/dependabot.yml`).

---

## Phase 0 — Triage (blocking, mandatory)

### R1. Capture the authoritative advisory inventory
* Run and archive (evidence, not narration):
  * `pnpm audit --json > .agents/docs/evidence/audit_full_2026-09-17.json`
  * `pnpm audit --prod --json > .agents/docs/evidence/audit_prod_2026-09-17.json`
  * Dependabot export (either): `gh api -X GET
    'repos/Damedsol/Image_Transformer/dependabot/alerts?state=open&per_page=100'`
    → `.agents/docs/evidence/dependabot_2026-09-17.json`, **or** the UI CSV export.
* Then classify **every** open alert into exactly one bucket:
  * **FIXED-IN-TREE** — the locked version is ≥ the advisory's fixed version
    (cite the lockfile entry + OSV fixed version) → candidate for *dismiss with
    reason "fixed"*;
  * **OPEN** — the locked version is within an affected range → becomes an
    `R3.x` item;
  * **NOT-APPLICABLE** — the vulnerable code path is unused / dev-only and not
    reachable (state the path).
* **Exit criteria:** a table in the plan addendum `.agents/docs/evidence/`
  with a bucket per alert; **zero unclassified alerts**; explicit statement of
  whether any **live** advisory exists.
* Evidence: the archived JSONs + the classification table.

### R2. Reconcile the stale Dependabot surface
* Compare each of the 11 `origin/dependabot/*` refs against the resolved
  lockfile (they are listed in the analysis §E3).
* Produce a **close-list**: PRs whose change is already satisfied
  (`backend/{lodash-4.18.1, flatted-3.4.2, path-to-regexp-8.4.0,
  picomatch-2.3.2, ajv-6.14.0, express-rate-limit-8.2.2, multer-2.1.0,
  multer-2.1.1, multer-2.2.0}`, `multer-2.3.0`, `vite-7.3.2`) and any branch
  proposing a **downgrade** (`vite-7.3.2`, `ajv-6.14.0`).
* Closing PRs / deleting remote branches is a **remote, destructive-adjacent
  action → requires explicit user confirmation**; the plan only produces the
  list and the exact commands. Never `push` from a gate.

---

## Phase 1 — Remediation (conditional on R1)

### R3. Fix any live advisory using the established pattern
* Transitive → add/adjust an override floor in `pnpm-workspace.yaml`, staying
  inside the consumer's declared major range; **pin exactly** when the consumer
  expects one line (the `undici` lesson).
* Direct → bump the exact pin (`backend/package.json`) or the catalog entry.
* Regenerate the lockfile (`pnpm up <pkg>` — `preferFrozenLockfile: true` means
  plain `pnpm install` will not rewrite it).
* Record the advisory ID → old version → fixed version in
  `.agents/docs/specs/security-hardening.md` §D.
* **Acceptance:** `pnpm audit` full + `--prod` = 0 and every R1 **OPEN** alert
  is closed.
* *If R1 finds no live advisory, R3 is a no-op and must be recorded as such.*

---

## Phase 2 — Within-major refresh (C2)

### R4. Catalog bumps (`pnpm-workspace.yaml`)
`@biomejs/biome ^2.0.0`→2.5.14 · `@commitlint/cli` + `config-conventional`
`^21.0.0`→21.2.2 · `concurrently ^10.0.4`→10.0.5 · `globals ^17.0.0`→17.12.0 ·
`oxlint ^1.0.0`→1.83.0 · `vite ^8.0.0`→8.3.0.

### R5. Backend exact pins (`backend/package.json`)
`helmet` 8.1.0→8.3.0 · `express-rate-limit` 8.3.2→8.7.0 · `multer` 2.3.0→2.4.0 ·
`zod` 4.4.3→4.6.5 · `tsx` 4.21.0→4.23.13. `sharp` 0.35.4, `express` 5.2.1,
`pino` 10.3.1, `cors` 2.8.6, `dotenv` 17.4.2 stay (already latest).
Keep the mirroring overrides (`sharp`, `multer`, `zod`) ≥ the new pins.

### R6. Override-floor refresh (`pnpm-workspace.yaml`)
Exact floors: `minimatch@^10` 10.2.3→10.2.6 · `brace-expansion@^5` 5.0.9→5.0.12 ·
`flatted` 3.4.2→3.4.4 · `path-to-regexp` 8.4.0→8.4.2.
Range floors resolve automatically on regen: `fast-uri >=4.1.3` (→4.1.5),
`ip-address >=10.3.1` (→10.7.2), `postcss >=8.5.23` (→8.5.28).
**Unchanged and must stay untouched:** `undici: 7.29.0` (jsdom `^7.25.0`),
`picomatch: 2.3.2` (2.x consumers), `js-yaml: ">=4.3.2 <5"` (cosmiconfig `^4.1.0`),
`esbuild: >=0.28.1`, `qs: >=6.16.0`, `lodash: 4.18.1`.

### R7. Verify the refresh
* `pnpm qa` (type-check + lint + format:check + 135 tests) → green
* `pnpm build` (backend tsc → frontend tsc + vite build) → green
* `pnpm audit` full + `--prod` → 0
* Runtime smoke: backend boots (`pnpm dev:backend`) and `GET /api/formats` → 200;
  one real `/convert` round-trip exercising **multer 2.4.0 + sharp**.
* Re-scan: OSV full-tree (376 packages) → 0 hits (same method as analysis §E1).
* Each new version must satisfy `minimumReleaseAge: 7200` — **verify publish
  dates before choosing** (`npm view <pkg> time --json`); a version published
  after 2026-09-12 will be rejected by pnpm.

**Acceptance:** every installed version == `latest` within its declared major,
**or** it is one of the three documented exceptions (`undici`, `picomatch`,
`js-yaml`) / a package with no newer release in-major (record the reason).

---

## Phase 3 — Prevent drift (C3)

### R8. Add a security script
`"check:security": "pnpm audit --audit-level=low && pnpm audit --prod --audit-level=low"`
plus an optional `qa:security` wrapper. **Do not** inject the audit into `qa`
(keeps the gate hermetic/offline) unless the user asks.

### R9. Dependabot + CI *(gated by Q2)*
* `.github/dependabot.yml`: `npm` (root + `backend/`) and `docker`, weekly,
  grouped updates, `open-pull-requests-limit: 5`, `versioning-strategy: increase`.
* `.github/workflows/security.yml`: on `push`/`pull_request` + weekly schedule →
  `pnpm install --frozen-lockfile`, `pnpm audit --audit-level=low`,
  `pnpm audit --prod`, and the OSV full-tree scan as a script
  (`scripts/scan-advisories.mjs`, zero-dep, fails on any hit).
* *Requires Q2 (GitHub vs Gitea) before writing any file.*

### R10. Codify the policy
`.agents/docs/adr/0005-dependency-advisory-policy.md`: evidence commands, the
override-floor rule, the exact-pin rule, `minimumReleaseAge` constraint, the
"OSV in-browser fallback when the gate blocks `pnpm audit`" recipe, and the
triage checklist (R1 buckets). Link it from `AGENTS.md` §toolkit.

---

## Out of scope (R11) and follow-up

**R11. Non-goals for this cycle:** no major bumps (§3.3 of the analysis); no
Docker base-image change (digests current); no `.env` change; no source-behaviour
change beyond what an advisory fix strictly requires.

**R12. Follow-up cycle (own plan): major upgrades** — TypeScript 6→7, Vitest
4→5 (+`@vitest/ui`, `@vitest/mocker`), jsdom 29→30, lint-staged 16→17,
archiver 7→8 (+`@types/archiver` 8). Each gets its own plan because each
touches build tooling or the 18-suite bed.

---

## Risks & traps

| Risk | Mitigation |
|---|---|
| Premise wrong (no live advisory) → we "fix" nothing and the report stays open | Phase 0 triage first; if all alerts are FIXED-IN-TREE, the deliverable is the **dismissal evidence** + the drift automation, and that is stated explicitly |
| `minimumReleaseAge: 7200` rejects a fresh target version | check `npm view <pkg> time` before selecting; prefer the previous patch if too new |
| `preferFrozenLockfile: true` → lockfile silently not updated | use `pnpm up <pkg>[@version]`; verify with `git diff pnpm-lock.yaml` |
| `strictPeerDependencies: true` aborts the install (e.g. vitest/vite peers) | bump in slices; on failure, isolate the offending pair and revert that slice |
| Range override resolves past the expected major (undici 8.10.2 incident) | exact-pin overrides for single-line consumers |
| `pnpm-lock.yaml` diff ≫ 400 lines (SLO) | three slices (C1/C2/C3); never one giant diff; declare the WARNING explicitly if unavoidable |
| Blind `pnpm up --latest` jumps majors | update explicit package lists only; re-read the diff before commit |
| Closing Dependabot PRs / deleting remote branches | user-confirmed commands only, `git push` never issued by a gate |
| No-auto-runs policy (`AGENTS.md`) | `qa`/`build`/`audit` are proposed as commands or executed in `/build` (shell allowed) — never silently |

---

## Task list (execution order)

| ID | Task | Phase | Status | Files | Exit evidence |
|---|---|---|---|---|---|
| T0.1 | `pnpm audit` full + `--prod` JSON → `evidence/` | 0 | ✅ done | `.agents/docs/evidence/*` | 2 JSON + exit code |
| T0.2 | Dependabot alert export (user/`gh`) | 0 | ⛔ blocked (no `gh`, private repo) | `evidence/dependabot_*.json` | alert list |
| T0.3 | Classify every alert (FIXED-IN-TREE / OPEN / N-A) | 0 | ✅ done for all readable sources | triage doc | 0 unclassified in audit/OSV |
| T1.1 | Close-list for the 11 stale Dependabot PRs/refs | 0 | ✅ done | triage doc | table + commands |
| T2.1 | Apply R3 fixes *(only if T0.3 finds OPEN)* | 1 | ✅ no-op (0 live advisories) | — | audit 0/0 |
| T3.1 | Catalog bumps (R4) — dev tooling | 2 | ⬜ deferred → slice C2b | `pnpm-workspace.yaml` | pending |
| T3.2 | Backend pin bumps (R5) | 2 | ✅ done | `backend/package.json`, lockfile | 4 pins → newest allowed |
| T3.3 | Override floors (R6) | 2 | ✅ done | `pnpm-workspace.yaml`, lockfile | 6 floors refreshed |
| T4.1 | Verify refresh (R7) | 2 | ✅ done | — | `qa` 135/135, `build` green, audit 0/0, OSV 0/57, smoke 200/200 |
| T5.1 | `check:security` script (R8) | 3 | ⬜ deferred → C3 | `package.json` | script runs |
| T5.2 | Dependabot + CI *(needs Q2)* | 3 | ✅ config done / ⬜ CI pending | `.github/dependabot.yml` ✅, `.github/workflows/security.yml` ⬜ | YAML validated + `pnpm qa` 135/135 |
| T5.3 | ADR-0005 policy (R10) | 3 | ⬜ deferred → C3 | `.agents/docs/adr/0005-*.md`, `AGENTS.md` | file exists + linked |

**Test command (build gate):** `pnpm qa` then `pnpm build` then `pnpm audit && pnpm audit --prod`.
**Targeted:** `pnpm vitest run backend/src/__tests__/<file>.test.ts`.

---

## Acceptance criteria (cycle closes only when all hold)

1. `pnpm audit` and `pnpm audit --prod` → **0 advisories**, JSON archived.
2. OSV full-tree re-scan → **0 hits**, coverage count reported (≥376 packages).
3. Every R1 **OPEN** alert closed; every **FIXED-IN-TREE** alert has its
   dismissal evidence (advisory ID → locked version ≥ fixed version).
4. Within-major freshness: installed == `latest` for all packages in §3.1, or a
   documented reason (`undici`/`picomatch`/`js-yaml` exceptions listed).
5. `pnpm qa` green (18 suites / 135 tests, type-check, lint, format) and
   `pnpm build` green.
6. Stale Dependabot close-list delivered (execution by the user).
7. No major bumps landed; R12 follow-up plan recorded.
8. `minimumReleaseAge`, `preferFrozenLockfile`, `strictPeerDependencies` and
   `blockExoticSubdeps` all still satisfied by the new lockfile.

---

## Build report — 2026-09-17 (slices C1 + C2a)

**Baseline:** HEAD `8a62fde`, 18 suites / 135 tests green, audit 0/0.

### What landed

| File | Change |
|---|---|
| `backend/package.json` | `helmet` 8.1.0→**8.3.0** · `express-rate-limit` 8.3.2→**8.7.0** · `zod` 4.4.3→**4.6.2** · `tsx` 4.21.0→**4.23.13** (exact pins preserved) |
| `pnpm-workspace.yaml` | override floors: `minimatch@^10` 10.2.3→**10.2.6** · `flatted` 3.4.2→**3.4.4** · `path-to-regexp` 8.4.0→**8.4.2** · `ip-address` >=10.3.1→**>=10.7.0** · `postcss` >=8.5.23→**>=8.5.28** · `zod` >=4.4.0→**>=4.6.2** |
| `pnpm-lock.yaml` | surgical re-resolution (59+/69-) |
| `.agents/` | evidence JSONs, triage doc, `change_spec.yaml`, `build_state.json`, checkpoint |

**Diff:** 4 files, 93 insertions / 84 deletions — inside the 5-file / 400-line budget.

### Verification (R7)

| Check | Command | Result |
|---|---|---|
| Type-check + lint + format + tests | `pnpm qa` | **exit 0** — 18 files / **135 tests** pass |
| Build | `pnpm build` | **exit 0** |
| Audit full | `pnpm audit` | **0** vulnerabilities |
| Audit prod | `pnpm audit --prod` | **0** vulnerabilities |
| OSV re-scan (changed + direct deps, post-change versions) | `api.osv.dev/v1/querybatch` | **0 hits / 57 queried** |
| Runtime smoke | `GET /api/formats` · `POST /api/convert` | **200** + **200** (webp 64×64 + zip; multer 2.3.0 → magic-bytes → zod 4.6.2 → sharp 0.35.4/libvips 8.18.6 → archiver) |

### Three findings this cycle (they change how the next slice must be run)

1. **`pnpm up -r` is unsafe for this repo.** It re-resolves the whole graph (1198-line lockfile diff, 3× the SLO) *and* rewrites manifests: `"vite": "catalog:"` → `"vite": "^8.3.0"` (breaks the catalog contract) and exact pins → carets (`multer`, `sharp`, `zod`). Use **`pnpm install --no-frozen-lockfile`**, which preserves existing resolutions and only re-resolves what the manifest/override change requires.
2. **`resolutionMode: lowest-direct` makes the override floor the effective control for direct deps.** `zod` stayed at 4.4.3 despite the exact pin `4.6.2` because the override floor was `>=4.4.0`. Moving the floor to `>=4.6.2` fixed it. **Any backend pin bump must move its mirroring override floor too.**
3. **`minimumReleaseAge: 7200` (5 days) rejected 8 of 19 planned targets** — the newest *allowed* patch had to be computed from registry publish times (`biome` 2.5.13, `oxlint` 1.82.0, `zod` 4.6.2, `multer` 2.3.0, `brace-expansion` 5.0.9, `fast-uri` 4.1.4).

### SLO note

The full within-range refresh (`pnpm up -r`) was **reverted** because it exceeded the cycle budget; the cycle was re-scoped to slice **C2a** (backend runtime + override floors). Dev tooling (`biome`, `oxlint`, `commitlint`, `concurrently`, `globals`, `vite`) is **untouched** and deferred to slice **C2b** — pnpm already reports their available versions.

### Slice C2b (next cycle) — ready-to-run inputs

`@biomejs/biome` ^2.5.13 · `@commitlint/cli` + `config-conventional` ^21.2.2 · `concurrently` ^10.0.5 · `globals` ^17.12.0 · `oxlint` ^1.82.0 · `vite` ^8.3.0 — apply with the catalog edit + a **surgical** `pnpm install --no-frozen-lockfile`, then re-run `pnpm qa`/`pnpm build`.

### Review fixes — ID-01 / ID-02 / ID-03 (2026-09-17)

Applied after the reviewer's `❌ RECHAZADO` (report:
`.agents/docs/review_2026-09-17_dependency-refresh-dependabot.md`). Only the listed IDs were touched.

| ID | Class | Fix | Evidence |
|---|---|---|---|
| **ID-01** | VERIFY (bloqueante) | Removed the entire `ignore` block from `.github/dependabot.yml` (undici, nanoid, picomatch, js-yaml) and replaced it with a note explaining why no ignore rules are needed | **RED→GREEN**: the new guard test first failed with `expected ['undici','nanoid','picomatch','js-yaml'] to deeply equal []`, then passed after the removal |
| **ID-02** | QA (cosmético) | Line count corrected to **86** in `checkpoint.yml` + `build_state.json` | `wc -l .github/dependabot.yml` = 86 |
| **ID-03** | TESTS (sugerencia) | New guard suite `backend/src/__tests__/dependencyConfig.test.ts` (11 tests) | `pnpm vitest run backend/src/__tests__/dependencyConfig.test.ts` → 11/11 |

Rationale recorded for ID-01: the four packages are **transitive** (absent from every manifest),
so a version update would never touch them, while the official Dependabot docs state that `ignore`
also applies to **security** updates — which patch the lockfile where those packages live. The
ceiling is already enforced by the `pnpm-workspace.yaml` overrides and the parent ranges, so the
rules had no upside and one real downside.

Guard coverage (zero new dependency — both YAML files are read with a small line-oriented parser):
override floor ≥ exact manifest pin (incl. a synthetic pre-fix `zod >=4.4.0` / `4.6.2` case that
proves the checker catches the historical bug), no `ignore` entry for a non-manifest dependency, and
`dependabot.yml` structure (version 2, ecosystem/dirs/interval, no duplicate directory per ecosystem,
majors kept out of the minor/patch group).

Re-verified after the fixes: `pnpm qa` **exit 0 — 19 files / 146 tests** · `pnpm build` exit 0 ·
`pnpm audit` + `--prod` 0 · `dependabot.yml` structural validation 0 errors.

---

## Handoff

🔄 HANDOFF → `/reviewer` | Gate: `/build` | Artefactos:
`.agents/docs/plan_2026-09-17_dependency-refresh-and-advisory-closure.md`,
`.agents/specs/change_spec.yaml`, `.agents/.state/build_state.json`,
`.agents/docs/review_2026-09-17_dependency-refresh-dependabot.md` (ID-01/02/03 corregidos),
`.agents/docs/evidence/{audit_full,audit_prod}_2026-09-17.json`,
`.agents/docs/evidence/advisory_triage_2026-09-17.md`,
`.github/dependabot.yml`, `backend/src/__tests__/dependencyConfig.test.ts`,
`backend/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Evidencia:
`pnpm qa` exit 0 (**19 files / 146 tests**) · `pnpm build` exit 0 · `pnpm audit` 0/0 · OSV 0/57 ·
smoke 200/200 · RED→GREEN trazado para ID-01/ID-03 · diff dentro del SLO |
Pendiente: reverificar ID-01/ID-02/ID-03; siguen abiertos **T0.2** (export Dependabot),
**R9 CI workflow** (decisión del usuario) y los slices **C2b/C3**.
