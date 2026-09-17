# Spec: Release Versioning

> Living spec for how a release version is declared and kept in sync across the
> repo. Mirrors the OpenSpec-equivalent flow documented in `.agents/specs/README.md`
> (the repo has no `domain.yaml`; the Markdown specs under `.agents/docs/specs/`
> play that role, together with the code guards they point at).

## A. 2026-09-17 release 2.1.0 — version carriers + consistency guard

> Merged from an **ad-hoc release chore** (`/scribe` handed it to `/build` because
> the carriers are code/config, outside that gate's write scope). No
> `change_spec.yaml` existed; the cycle-local requirement is `R1` in the test
> docblock and maps onto `V1` below. Reviewer ✅ APROBADO
> (`.agents/docs/review_2026-09-17_release-2.1.0.md`, 4 KEEP / 0 REMOVE).

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

**Not carriers, and why:** `docker-compose.yml` (dev) builds from Dockerfiles and
declares no `image:` tag; `docker/nginx.conf` only mentions service names;
`pnpm-lock.yaml` — pnpm records no version for workspace projects, so
`preferFrozenLockfile: true` is unaffected by a bump; `.deepsec/package.json` is a
local, gitignored audit workspace. The harness manifest
(`.agents/project_manifest.yaml`) also carries the version and is part of the same
sync, even though it is not application code.

### Release procedure

1. Move (`package.json` first, as the source of truth) + `backend/package.json` +
   the README badge + both compose tags.
2. Sync `.agents/project_manifest.yaml` and add the `history.md` entry.
3. `pnpm test` (the guard proves the sync; expected: the suite grows by the four
   guard tests only) and `biome format` (check-only) for the JSON/MD carriers.
4. Commit `chore: bump version X.Y.Z`; **no lockfile change**.
5. Push and tag are human decisions — the repository currently has no tags.

Acceptance criteria (met 2026-09-17 for 2.1.0): `pnpm test` exit 0 — 22 files /
161 tests (baseline 21 / 157) · `pnpm type-check` 0 · `oxlint` root + backend in
check mode 0 · `lint-filenames` 0 · `biome format` check-only 0 (71 files, no
fixes) · all carriers verified at `2.1.0` by an independent extraction.

Open (not acceptance-blocking): **OBS-01** the guard's `CARRIERS` list is
hardcoded — a new carrier must be added there (this inventory is the checklist
that makes the omission visible) · **OBS-02** the guard reads
`.agents/project_manifest.yaml`, so it would fail with `ENOENT` in a code-only
checkout (the directory is versioned and production images never run the suite).
