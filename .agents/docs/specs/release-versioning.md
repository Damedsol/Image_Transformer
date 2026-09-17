# Spec: Release Versioning

> Living spec for how a release version is declared, kept in sync and published.
> Mirrors the OpenSpec-equivalent flow documented in `.agents/specs/README.md`
> (the repo has no `domain.yaml`; the Markdown specs under `.agents/docs/specs/`
> play that role, together with the code guards they point at).

## A. 2026-09-17 release 2.1.0 — version carriers + consistency guard

> Merged from an **ad-hoc release chore** (`/scribe` handed it to `/build` because
> the carriers are code/config, outside that gate's write scope). No
> `change_spec.yaml` existed; the cycle-local requirement is `R1` in the test
> docblock and maps onto `V1` below. Reviewer ✅ APROBADO
> (`.agents/docs/review_2026-09-17_release-2.1.0.md`, 4 KEEP / 0 REMOVE).
> The tagging and completion half of this section was corrected on 2026-09-17
> after finishing the release — see "Tagging and completion".

- [✓] **V1. Every carrier agrees with the single source of truth.** The released
  version is declared once, in the root `package.json`, and must be identical in
  every other carrier. Guarded by
  `backend/src/__tests__/versionConsistency.test.ts` (4 tests, zero dependencies):
  the root value drives the expectation, each carrier must expose a semver, and
  the pure `findVersionMismatches` detector is proven non-vacuous with synthetic
  lookups. A carrier whose pattern stops matching yields `null` and fails, so a
  rename cannot pass silently.

### Carrier inventory (audited against the 2.0.0 release, commit `f128550`)

| Carrier | Where |
|---|---|
| **Source of truth** | `package.json` → `version` |
| Backend manifest | `backend/package.json` → `version` |
| Docs badge | `README.md` → `badge/version-X.Y.Z-blue.svg` |
| Container defaults (×2) | `docker-compose.prod.yml` → `image: ${BACKEND_IMAGE:-image-transformer-backend:X.Y.Z}` and the frontend equivalent |
| Harness manifest | `.agents/project_manifest.yaml` → `version` |

**Not carriers, and why:** `docker-compose.yml` (dev) builds from Dockerfiles and
declares no `image:` tag; `docker/nginx.conf` only mentions service names;
`pnpm-lock.yaml` — pnpm records no version for workspace projects, so
`preferFrozenLockfile: true` is unaffected by a bump; `.deepsec/package.json` is a
local, gitignored audit workspace.

### Tagging and completion

- Tags are **annotated** and **`V`-prefixed** (`gitflow.prefix.versiontag`):
  `V1.0.0 … V1.3.2`, `V2.0.0`, `V2.1.0` — **20 tags as of 2026-09-17**. They are
  created by `git flow release finish`, which also back-merges the release into
  `develop` and deletes the release branch.
- **Known gap:** `V2.0.1` was never created. That release was merged into `main`
  (merge `54ffdad`) but never finished/tagged, so `main` sat at 2.0.1 while
  `develop` stayed at 2.0.0 — the drift that made the 2.1.0 finish conflict.
  Optional repair: `git tag -a V2.0.1 54ffdad -m "V2.0.1"`.
- **Hard requirements of `finish`** (all verified in the installed git-flow AVH,
  `/usr/bin/git-flow-release`):
  - `-m "<message>"` is **mandatory in any non-TTY run**: the tag is annotated
    (`:872`) and, without a message, git opens the editor — which fails with
    `La entrada estándar no es un terminal` → `Fatal: Tagging failed. Please run
    finish again to retry.`
  - a **clean working tree** is mandatory (`:817`, unconditional — `start`
    honours `gitflow.allowdirty` at `:571`), so queue no harness or doc edits
    while a release is in flight.
  - `run_filter_hook` appends the tag name to the given message when no filter
    hook exists (`/usr/bin/gitflow-common:758-759`, `echo "$@"`), so
    `-m "V2.1.0"` yields the annotation `V2.1.0 V2.1.0`; use `-f <file>` for an
    exact single-line annotation.
  - the finish is **idempotent**: it skips an already-merged branch (`:844`) and
    an existing tag (`:859`), so re-running after a failure is the intended
    recovery (never resolve by starting a new release).
- **Conflict recovery** when `main` carries an untagged or un-back-merged release
  bump: the merge into `main` conflicts on exactly the version carriers. Take the
  release side — `git checkout --theirs -- <carriers>` — because the new release
  supersedes the old bump *and* carries the dependency refresh `main` lacks; then
  `git add <carriers>`, `git commit --no-edit`, and re-run the finish.
- `push` remains a human decision: `finish` only pushes with `-p`, which this
  project does not use.

### Release procedure

1. Move (`package.json` first, as the source of truth) + `backend/package.json` +
   the README badge + both compose tags.
2. Sync `.agents/project_manifest.yaml` and add the `history.md` entry.
3. `pnpm test` (the guard proves the sync) and `biome format` (check-only) for the
   JSON/MD carriers.
4. Commit `chore: bump version X.Y.Z`; **no lockfile change**.
5. Finish from a **clean** tree:
   `git flow release finish -m "VX.Y.Z" X.Y.Z` → tag + back-merge + branch deleted.
6. Verify: `git show-ref --tags VX.Y.Z` · `git branch --list 'release/X.Y.Z'`
   (empty) · `git diff main develop -- <carriers>` (empty) · then push `main`,
   `develop` and `--tags` (human decision).

Acceptance criteria (met 2026-09-17 for 2.1.0): `pnpm test` exit 0 — 22 files /
161 tests (baseline 21 / 157) · `pnpm type-check` 0 · `oxlint` root + backend in
check mode 0 · `lint-filenames` 0 · `biome format` check-only 0 (71 files, no
fixes) · all carriers verified at `2.1.0` by independent extraction · after
finishing: tag `V2.1.0` on the merge commit `c5ae925`, `release/2.1.0` deleted,
back-merge in `develop`, and `git diff main develop -- <carriers>` empty.

Open (not acceptance-blocking): **OBS-01** the guard's `CARRIERS` list is
hardcoded — a new carrier must be added there (this inventory is the checklist
that makes the omission visible) · **OBS-02** the guard reads
`.agents/project_manifest.yaml`, so it would fail with `ENOENT` in a code-only
checkout (the directory is versioned and production images never run the suite) ·
**superseded claim:** §6 of `.agents/docs/review_2026-09-17_release-2.1.0.md`
states that the repository "has no tags" — that was wrong (the tag history above)
and is superseded by this section; the review artifact itself stays frozen as
evidence of that cycle.
