# Analysis — Security Advisory Triage & Dependency Freshness

> Gate: `/do` → `/plan` (read-only analysis). Date: **2026-09-17**.
> Scope: whole repository (`/projects/Github/imageTransformer`), HEAD
> `8a62fde` on `feature/minor-fixes-and-security` (= `origin/develop`).
> Request: *"analyze the project — there are security advisory problems —
> contemplate updating the dependencies."*

---

## 1. Headline result

**The locked dependency tree currently resolves to zero known advisories.**

A full-tree scan of all **376 named packages at their exact locked versions**
(via the OSV/GHSA+CVE database) returned **0 hits** on 2026-09-17.

Therefore the reported "security advisory problem" is **not reproducible
against the committed tree**. It must come from one of the following
sources — which is what Phase 0 of the plan resolves:

| # | Candidate source | Likelihood | How it is confirmed |
|---|---|---|---|
| a | Stale Dependabot alerts/PRs whose fixes already landed via `pnpm-workspace.yaml` overrides (11 stale `origin/dependabot/*` refs exist) | **High** | Alert export (R1) + branch reconciliation (R2) |
| b | Alerts computed against a commit older than `8a62fde` (pre-remediation) | Medium | Alert export timestamps vs. fix commit |
| c | Alerts visible only in the authenticated GitHub UI (repo is private; no auth available in this session) | Medium | User/`gh` export (R1) |
| d | "Advisory" used loosely to mean *dependency drift* (outdated majors) rather than a live CVE | Medium | §3 freshness table |
| e | npm-audit-only advisory not indexed by OSV (malware/typosquat/unmaintained) | Low | `pnpm audit --json` (T0.1) |

---

## 2. Evidence

### E1 — Full-tree advisory scan (2026-09-17)

* Method: extracted every `name@version` entry from the **packages** section of
  `pnpm-lock.yaml` (lines 170–2391 → 483 entries, 376 of them advisory-relevant
  named packages; the remainder are optional platform binaries —
  `@esbuild/linux-x64`, `@img/sharp-*`, `@oxlint/binding-*`,
  `lightningcss-*`, `@rolldown/binding-*` — whose advisories are reported
  against their parent package, which *was* scanned).
* Query: `POST https://api.osv.dev/v1/querybatch` with
  `{package: {name, ecosystem: "npm"}, version}` per entry.
* Result: `{"status":200,"total":376,"hits":0}`.
* Coverage caveat: OSV aggregates GHSA + CVE + MAL advisories, but it is a
  point-in-time cross-check, **not** a replacement for `pnpm audit` (npm
  registry advisories) nor for GitHub Dependabot (the user's alert source).
* **`pnpm audit` could not be executed in this gate**: the `/do` bash sandbox
  is restricted to read-only file utilities (`pnpm`, `node`, `git remote`, … are
  rejected). Re-running it is **T0.1** in the plan (build gate has shell access).

### E2 — Repository state

* Working tree clean; `HEAD = 8a62fde` = `origin/develop`;
  `origin/main = 54ffdad` (merge of `release/2.0.1`) — i.e. the 2026-09-10
  security remediation **is on both long-lived branches**.
* The 2026-09-10 cycle closed: `pnpm audit` full + `--prod` = 0, suite
  135/135, spec `security-hardening.md` §C (R9–R15), ADR-0004.
* `.deepsec/findings.json` (SAST export, run `2026-09-10T12:58`) holds
  **25 findings: 2 HIGH, 16 MEDIUM, 7 BUG**. Spot-verification of the
  previously-reported sinks in the current tree:
  * `escapeHtml()` applied to filenames/badges — `src/utils/html.ts`,
    consumed by `ImageConverter.ts:285` and `ImagePreview.ts:52` ✔
  * magic-byte validation wired in the controller
    (`imageController.ts:109` → `utils/imageValidation.ts:104`) ✔
  * backend prod stage `USER node` (`backend/Dockerfile:42`) ✔
  * all `FROM` digest-pinned in both Dockerfiles ✔
  * SPA CSP present and `listen 8080` with the unprivileged image
    (`docker/nginx.conf:4,16,75,121`) ✔
  * → the 2026-09-10 findings are closed; the export file is historical.

### E3 — Stale Dependabot surface (most probable cause of the report)

11 stale remote refs still point at pre-remediation or nonsensical bumps:

```
origin/dependabot/npm_and_yarn/backend/{ajv-6.14.0, express-rate-limit-8.2.2,
  flatted-3.4.2, lodash-4.18.1, multer-2.1.0, multer-2.1.1, multer-2.2.0,
  path-to-regexp-8.4.0, picomatch-2.3.2}
origin/dependabot/npm_and_yarn/{multer-2.3.0, vite-7.3.2}
```

Every one of these is already satisfied by the current lockfile
(`lodash@4.18.1`, `flatted@3.4.2`, `path-to-regexp@8.4.0`, `picomatch@2.3.2`,
`multer@2.3.0`, `ajv@8.20.0`, `express-rate-limit@8.3.2`, `vite@8.2.2`), and
two (`multer-2.2.0`, `multer-2.3.0`) were already merged. Alerts whose fix was
applied through **overrides** rather than by merging the Dependabot PR are the
classic case of an alert/PR list that keeps showing "security problems" long
after the code is patched.

### E4 — No supply-chain automation exists

* There is **no `.github/` directory**: no Dependabot config (no version
  updates, no grouping), no CI workflow, no automated audit gate.
* `pnpm audit` is not wired into any script (`qa` = type-check + lint + format
  + test only), so nothing fails when a new advisory lands. This is the
  structural reason the project keeps discovering advisories late.

### E5 — Guardrails that constrain any bump (traps for the build gate)

From `pnpm-workspace.yaml`:

| Setting | Effect on a refresh |
|---|---|
| `minimumReleaseAge: 7200` (5 days) | **any target version published <5 days ago will refuse to install** — pick versions older than 2026-09-12 |
| `preferFrozenLockfile: true` | plain `pnpm install` will **not** rewrite the lockfile; use `pnpm up` / explicit `--lockfile-only` |
| `strictPeerDependencies: true` | a bump whose peer graph conflicts aborts the whole install |
| `blockExoticSubdeps: true` | exotic transitive specs are rejected |
| `catalog:` | shared devDeps must be bumped **in the catalog**, never inline |
| backend deps are **exact-pinned** (`"zod": "4.4.3"`) | every backend bump is an explicit `package.json` edit |
| overrides with a range resolve to the **maximum** | the 2026-09-10 lesson (`undici` 8.10.2 → 7.29.0): pin exactly when a consumer expects a specific major line |

---

## 3. Dependency freshness (62 packages probed against registry `latest`)

Installed versions come from `pnpm-lock.yaml`; `latest` from the npm registry,
both read 2026-09-17.

### 3.1 Within-major updates available (low risk)

| Package | Installed | Latest | Declared in |
|---|---|---|---|
| `@biomejs/biome` | 2.4.15 | **2.5.14** | catalog `^2.0.0` |
| `@commitlint/cli` / `config-conventional` | 21.0.1 | **21.2.2** | catalog `^21.0.0` |
| `concurrently` | 10.0.4 | **10.0.5** | catalog `^10.0.4` |
| `globals` | 17.6.0 | **17.12.0** | catalog `^17.0.0` |
| `oxlint` | 1.67.0 | **1.83.0** | catalog `^1.0.0` |
| `vite` | 8.2.2 | **8.3.0** | catalog `^8.0.0` |
| `helmet` | 8.1.0 | **8.3.0** | backend (exact) |
| `express-rate-limit` | 8.3.2 | **8.7.0** | backend (exact) |
| `multer` | 2.3.0 | **2.4.0** | backend (exact) |
| `zod` | 4.4.3 | **4.6.5** | backend (exact) |
| `tsx` | 4.21.0 | **4.23.13** | backend (exact) |
| `minimatch@^10` (override) | 10.2.3 | **10.2.6** | override exact floor |
| `brace-expansion@^5` (override) | 5.0.9 | **5.0.12** | override exact floor |
| `flatted` (override) | 3.4.2 | **3.4.4** | override exact floor |
| `path-to-regexp` (override) | 8.4.0 | **8.4.2** | override exact floor |
| `fast-uri` (override `>=4.1.3`) | 4.1.4 | 4.1.5 | range → auto on regen |
| `ip-address` (override `>=10.3.1`) | 10.5.0 | 10.7.2 | range → auto on regen |
| `postcss` (override `>=8.5.23`) | 8.5.26 | 8.5.28 | range → auto on regen |
| `tar-stream` (via archiver) | 3.2.0 | 3.2.1 | transitive |
| `rolldown` (via vite) | 1.2.5 | 1.2.9 | transitive |

### 3.2 Already at latest (no action)

`cors` 2.8.6 · `dotenv` 17.4.2 · `express` 5.2.1 · `pino` 10.3.1 ·
`pino-pretty` 13.1.3 · `sharp` 0.35.4 · `@types/express` 5.0.6 ·
`@types/multer` 2.2.0 · `@types/cors` 2.8.19 · `husky` 9.1.7 · `esbuild` 0.28.2 ·
`qs` 6.16.0 · `body-parser` 2.3.0 · `glob` 13.0.6 · `jws` 4.0.1 ·
`lodash` 4.18.1 · `semver` 7.8.5 · `busboy` 1.6.0 · `router` 2.2.0 ·
`send` 1.2.1 · `serve-static` 2.2.1 · `ajv` 8.20.0 · `tough-cookie` 6.0.2 ·
`lightningcss` 1.33.0 · `minipass` 7.1.3 · `cross-spawn` 7.0.6 · `rxjs` 7.8.2.

### 3.3 Major bumps available (breaking — must be a separate cycle)

| Package | Installed | Latest | Blocker / migration cost |
|---|---|---|---|
| `typescript` | 6.0.3 | 7.0.2 | compiler behaviour + `tsc` flags; FE+BE build |
| `vitest` / `@vitest/ui` / `@vitest/mocker` | 4.1.11 | 5.0.1 | config + API surface; 18 suites |
| `jsdom` | 29.1.1 | 30.1.0 | test env behaviour |
| `lint-staged` | 16.4.0 | 17.5.1 | pre-commit config |
| `archiver` + `@types/archiver` | 7.0.1 / 7.0.0 | 8.0.0 / 8.0.0 | ZIP streaming API used by `imageProcessor` |
| `nanoid` | 3.3.18 | 6.0.1 | transitive via postcss — must stay in 3.x |
| `js-yaml` | 4.3.2 | 5.4.2 | cosmiconfig declares `^4.1.0` → **cannot** move to 5.x |

### 3.4 Deliberately pinned low (documented exceptions)

* `undici` **7.29.0** — `jsdom@29` declares `^7.25.0`; latest is 8.10.2 (out of line).
* `picomatch` **2.3.2** — consumers expect the 2.x line (latest is 4.0.7).
* `js-yaml` **`>=4.3.2 <5`** — cosmiconfig `^4.1.0`.

---

## 4. Residual (non-blocking) observations

1. **`innerHTML` templates remain in 9 places** (`ImageConverter` ×6,
   `ImagePreview`, `DropZone`, `main.ts`, `TnIcon`). All interpolate either
   static markup or values passed through `escapeHtml()`; the two unescaped
   interpolations (`image.preview` data-URL, `image.id`) are not
   attacker-controlled in the current flow. The durable fix is building nodes
   with `createElement`/`textContent` instead of template strings —
   defense-in-depth, not a live vulnerability.
2. **No CI + no Dependabot config**: the only reason advisories are discovered
   by hand. Fixing this (§Phase 3) has more security value than any single bump.
3. **index-mcp has no project for this repo** (`projects-github-imagetransformer`
   → "proyecto no indexado"), so `mem_*` continuity is unavailable; the memory
   handoff must wait for the next `/scribe` re-index.
4. Old `dist/` build output is present locally but untracked/ignored — no impact.

---

## 5. Conclusion feeding the plan

1. **No evidence of a live CVE** in the locked tree (0/376 via OSV); the report
   needs disambiguation before any "fix" is attempted, otherwise we risk
   re-patching already-patched dependencies and closing nothing.
2. **The actionable, defensible work is**: (a) capture the authoritative alert
   inventory and close the stale Dependabot surface, (b) refresh within-major to
   the newest safe patches, (c) install the automation that prevents this class
   of drift.
3. **Major bumps are explicitly out of scope** for this cycle (each needs its
   own migration plan; the 18-suite test bed is the guardrail).
