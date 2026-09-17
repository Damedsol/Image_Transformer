# Advisory Triage — 2026-09-17 (T0.1 / T0.3 / T1.1)

> Executed in the `/build` gate (shell available; `/do` could only read files).
> Plan: `.agents/docs/plan_2026-09-17_dependency-refresh-and-advisory-closure.md` §Phase 0.
> Environment: pnpm 11.15.0 · Node 24.18.0 (Volta-resolved; the pi-bundled Node 22.23.2
> in `PATH` is *not* what pnpm uses) · HEAD `8a62fde` on `feature/minor-fixes-and-security`.

## T0.1 — `pnpm audit` (authoritative npm-registry advisories)

| Command | Result | Exit | Evidence |
|---|---|---|---|
| `pnpm audit --json` | `advisories: {}` — 0 info/low/moderate/high/critical over 481 installed packages (293 dev + 107 optional + 161 prod) | 0 | `evidence/audit_full_2026-09-17.json` |
| `pnpm audit --prod --json` | `advisories: {}` — 0 over 188 production packages | 0 | `evidence/audit_prod_2026-09-17.json` |

Combined with the OSV full-tree scan from the analysis (376 named packages at
their exact locked versions → **0 hits**), the locked dependency tree is
confirmed clean by two independent advisory sources.

## T0.3 — Alert classification (R1 exit criteria)

| Source | Alerts found | Bucket | Unclassified |
|---|---|---|---|
| `pnpm audit` (full) | 0 | — (nothing to classify) | 0 |
| `pnpm audit --prod` | 0 | — (nothing to classify) | 0 |
| OSV full-tree querybatch | 0 | — (nothing to classify) | 0 |
| GitHub **Dependabot alerts** | **not readable from this environment** | see T0.2 | ⚠️ **pending** |

**Every machine-readable advisory source returns zero. No live advisory exists
in the tree, therefore R3 (remediation) is a no-op** — recorded here as required
by the plan ("if R1 finds no live advisory, R3 is a no-op and must be recorded
as such").

### T0.2 — Dependabot export: BLOCKED (user action required)

`gh` CLI is not installed on this machine (`gh: orden no encontrada`) and the
repository is private, so the Dependabot alert list cannot be fetched:

* **Option 1 (UI):** GitHub → repo → *Security* → *Dependabot alerts* → export
  CSV, or paste the alert titles/IDs into the next session.
* **Option 2 (`gh`, needs install + auth):**
  ```bash
  gh api -X GET 'repos/Damedsol/Image_Transformer/dependabot/alerts?state=open&per_page=100' \
    > .agents/docs/evidence/dependabot_2026-09-17.json
  ```
  (Repo slug taken from the deepsec finding metadata: `Damedsol/imagetransformer`.
  Confirm the canonical slug — the GitHub web redirect resolved to
  `Damedsol/Image_Transformer`.)

Until that list is classified, the triage remains **partial** and Q1 stays open.
The evidence above makes it very likely that every open Dependabot alert falls in
the **FIXED-IN-TREE** bucket (see T1.1).

## T1.1 — Stale Dependabot surface: close-list

All 11 `origin/dependabot/*` refs predate the 2026-09-10 remediation and propose
versions the lockfile already meets or exceeds. None carries a change we still
need. None of them should be merged.

| Remote ref | PR bump | Head commit | Locked today | Verdict |
|---|---|---|---|---|
| `.../backend/ajv-6.14.0` | ajv 6.12.6 → 6.14.0 | `a392e49` 2026-02-22 | `ajv@8.20.0` | **obsolete line** — superseded by 8.x; `ajv` is not a direct dep |
| `.../backend/express-rate-limit-8.2.2` | 8.2.1 → 8.2.2 | `48b02d6` 2026-03-06 | `8.3.2` | **satisfied** (> 8.2.2) — superseded by the C2 refresh (8.7.0) |
| `.../backend/flatted-3.4.2` | 3.3.3 → 3.4.2 | `585b50d` 2026-03-21 | `3.4.2` (override) | **already fixed via override** |
| `.../backend/lodash-4.18.1` | 4.17.23 → 4.18.1 | `f30dc85` 2026-04-10 | `4.18.1` (override) | **already fixed via override** |
| `.../backend/multer-2.1.0` | 2.0.2 → 2.1.0 | `e80a5cc` 2026-03-03 | `2.3.0` | **satisfied** — superseded |
| `.../backend/multer-2.1.1` | 2.0.2 → 2.1.1 | `7d22e9a` 2026-03-05 | `2.3.0` | **satisfied** — superseded |
| `.../backend/multer-2.2.0` | 2.1.1 → 2.2.0 | `19e93fa` 2026-06-20 | `2.3.0` | **merged** (commit `1bb860a`) |
| `.../backend/path-to-regexp-8.4.0` | 8.3.0 → 8.4.0 | `38e0c4d` 2026-03-28 | `8.4.0` (override) | **already fixed via override** |
| `.../backend/picomatch-2.3.2` | 2.3.1 → 2.3.2 | `6b11c1b` 2026-03-26 | `2.3.2` (override) | **already fixed via override** |
| `.../multer-2.3.0` | 2.2.0 → 2.3.0 | `6ae3e3a` 2026-09-09 | `2.3.0` | **merged** |
| `.../vite-7.3.2` | vite 7.3.1 → 7.3.2 | `37296aa` 2026-04-06 | `vite@8.2.2` | **obsolete line / would downgrade** |

**Recommended action (user-executed; a gate must never push):**

1. Close every open Dependabot PR from the list above with the reason
   *"superseded / already fixed via pnpm overrides"* (GitHub UI, or
   `gh pr close <n> --comment "…"`).
2. Optionally dismiss the corresponding alerts as **"fixed"** — the locked
   versions already satisfy the advisory ranges.
3. Delete the dead remote branches:
   ```bash
   git push origin --delete \
     dependabot/npm_and_yarn/backend/ajv-6.14.0 \
     dependabot/npm_and_yarn/backend/express-rate-limit-8.2.2 \
     dependabot/npm_and_yarn/backend/flatted-3.4.2 \
     dependabot/npm_and_yarn/backend/lodash-4.18.1 \
     dependabot/npm_and_yarn/backend/multer-2.1.0 \
     dependabot/npm_and_yarn/backend/multer-2.1.1 \
     dependabot/npm_and_yarn/backend/multer-2.2.0 \
     dependabot/npm_and_yarn/backend/path-to-regexp-8.4.0 \
     dependabot/npm_and_yarn/backend/picomatch-2.3.2 \
     dependabot/npm_and_yarn/multer-2.3.0 \
     dependabot/npm_and_yarn/vite-7.3.2
   ```
   *(Destructive on the remote — requires the user's explicit confirmation and is
   outside any gate's permissions.)*

## T5.2 — Why Dependabot was not implemented, and what was added

### Root cause (evidence, not opinion)

| Check | Command | Result |
|---|---|---|
| Did `.github/` ever exist on any branch? | `git log --all --oneline -- .github` | **empty output** — no commit ever touched it |
| Any `dependabot.yml` anywhere in history? | `git log --all --oneline --name-only -- '**/dependabot.yml'` | **empty output** |
| Was the repo *prepared* for it? | `grep -n github .ls-lint.json` | `.github` is already in the filenames-linter `ignore` list — the directory was anticipated but never created |

Meanwhile Dependabot was clearly **running** (13 advisory reports in 2026-08/09 and 11
`origin/dependabot/*` branches). That combination is the whole explanation:

* **Dependabot alerts** and **Dependabot security updates** are *repository settings*
  driven by the dependency graph + advisory DB. They work with **no config file** —
  which is how the 13 alerts and 11 alert-driven PR branches were raised against
  manifests (`npm_and_yarn/backend/...` encodes the manifest directory).
* **Dependabot version updates** (the scheduled weekly PRs that keep dependencies
  fresh) require `.github/dependabot.yml`. It never existed → no scheduled updates
  ever ran → the drift documented in the analysis §3 (biome 2.4.15, oxlint 1.67.0,
  vite 8.2.2, jsdom 29, …) accumulated silently, and every advisory had to be
  discovered and patched by hand.

This was **not** a regression introduced by any commit — the repository was created
without a `.github/` directory and never gained one.

### What was added

`.github/dependabot.yml`, adapted from `/projects/Github/currencyExchange/.github/dependabot.yml`.
The reference is a **single-package** workspace (`packages: ["."]`), so three things
had to change, not just be copied:

| Aspect | Reference (currencyExchange) | Here (`imageTransformer`) | Why |
|---|---|---|---|
| Directory | `directory: "/"` | `directories: ["/", "/backend"]` + `group-by: dependency-name` | two manifests share one lockfile; the option reference forbids overlapping directories per ecosystem, and `group-by` collapses them to **one PR per dependency** instead of one per directory |
| `ignore` | undici, nanoid, @fluentui | undici `>=8`, nanoid `>=4`, picomatch `>=3`, js-yaml `>=5` | mirrored from this repo's override floors / consumer majors (the same regressions already paid for in 2026-09) |
| Ecosystem | npm only | npm **+ docker** (`/`, `/backend`) | both Dockerfiles pin base images by digest (ADR-0004) — without this entry the digests rot silently; each such PR needs the ADR-0004 verification, not just a green CI |
| Commit messages | default | `chore(deps)` / `chore(deps-dev)` | Dependabot commits must satisfy `commitlint` (config-conventional) |
| Groups | `minor-and-patch` | same, plus `group-by` | majors stay individual PRs — they are the breakers (typescript 7, vitest 5, jsdom 30, lint-staged 17, archiver 8 = the R12 follow-up cycle) |

### Verification performed

* YAML parses (Biome does not target YAML, so the file was parsed explicitly).
* Structural validation script: `version: 2` ✔ · both entries declare
  `package-ecosystem` + directories + `schedule.interval` ✔ · **0 unknown keys** ✔ ·
  **0 overlapping directory values** per ecosystem (the documented hard constraint) ✔.
* `node scripts/lint-filenames.mjs` → exit 0 (`.github` is ignored by design).
* `pnpm qa` → **exit 0, 18 files / 135 tests** with the new directory present.

### Watch-list for the first run

1. **`catalog:` integrity** — pnpm 11 catalogs are the repo contract; a Dependabot PR
   that rewrites `"vite": "catalog:"` into an inline version, or turns a backend exact
   pin into a caret, must be **rejected** (this is exactly what `pnpm up -r` did locally
   on 2026-09-17).
2. **Mirroring override floors** — with `resolutionMode: lowest-direct`, a backend pin
   bump only takes effect if its override floor moves too (`zod` case).
3. **`minimumReleaseAge: 7200`** — Dependabot may open a PR for a version younger than
   5 days; the local lockfile update then needs `pnpm install --no-frozen-lockfile`.
4. Confirm backend runtime deps (`helmet`, `zod`, `multer`, `sharp`…) actually receive
   PRs. If they do not, the fallback is to drop `directories` and register a second
   `npm` entry — but only after checking the non-overlap rule.

### Still not implemented (deliberately)

* `.github/workflows/security.yml` (CI: `pnpm install --frozen-lockfile` → `pnpm qa` →
  `pnpm audit` + `--prod` → OSV scan). It needs the user's go-ahead: it introduces
  GitHub Actions runs this repo has never had, and a Node 24 / pnpm 11 setup step.
* `pnpm check:security` script, `scripts/scan-advisories.mjs`, and ADR-0005
  (`dependency-advisory-policy`).

---

## Conclusion

1. **No live security advisory** — confirmed independently by `pnpm audit`
   (full + prod) and the OSV full-tree scan.
2. The perceived "security advisory problem" is the **stale Dependabot PR/alert
   surface** (T1.1), not a vulnerability in the shipped code.
3. The remaining value is (a) closing that surface and (b) the **within-major
   dependency refresh**, which is what C2 implements — with the
   `minimumReleaseAge: 7200` constraint applied (see the plan addendum in
   `history.md` / the build report).
