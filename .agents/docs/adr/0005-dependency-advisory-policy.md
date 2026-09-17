# ADR-0005: Dependency Advisory Policy and Supply-Chain Automation

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** User + pipeline (plan → build → reviewer ❌→ build → reviewer ✅ → scribe)
- **Related:** `.agents/docs/specs/security-hardening.md` §D (R16–R21) ·
  `.agents/docs/evidence/advisory_triage_2026-09-17.md` ·
  `.agents/docs/review_2026-09-17_dependency-refresh-dependabot-repass.md`

## Context

The user reported "security advisory problems" and asked to update the
dependencies. Triage found **no live advisory**: `pnpm audit` (full + prod) and
an OSV full-tree scan of every locked package both returned **zero**. What
existed was an **automation gap**:

- The repository had **no `.github/` directory in any branch** (`git log --all --
  .github` is empty), so scheduled **Dependabot version updates never ran**.
- Dependabot **alerts and security updates are a repository setting** and work
  with no config file — which is how 13 advisories and 11 stale
  `dependabot/*` branches appeared while nothing kept the tree fresh.
- Advisories were therefore discovered and patched by hand, one cycle at a time.

Two real defects were found and fixed during the cycle: `pnpm up -r` rewrote
manifest contracts and produced a 1 198-line lockfile diff, and a stale override
floor silently defeated an exact pin (`zod` declared 4.6.2, resolved 4.4.3).

## Decision

1. **Triage before fixing.** A reported advisory is first classified from two
   independent sources — `pnpm audit --json` (full + `--prod`) and an OSV
   `querybatch` over every locked `name@version` — and every alert is bucketed as
   **FIXED-IN-TREE / OPEN / NOT-APPLICABLE**. Remediation is conditional on an
   OPEN bucket; a clean tree is closed with the *dismissal evidence* instead.
2. **Two ceiling mechanisms, no `ignore` rules.** Version ceilings live in
   `pnpm-workspace.yaml` (overrides) and in the manifest ranges. Because
   `resolutionMode` is `lowest-direct`, **an override floor must be ≥ the exact
   pin it mirrors** (otherwise the override wins and silently holds the older
   version). Dependabot `ignore` is reserved for direct dependencies that must be
   blocked deliberately — never for transitive packages, since `ignore` also
   applies to *security* updates while version updates only touch
   manifest-declared dependencies.
3. **Surgical lockfile work.** `pnpm up -r` is banned: use
   `pnpm install --no-frozen-lockfile`, which preserves existing resolutions and
   only re-resolves what the manifest/override change requires.
4. **Respect `minimumReleaseAge: 7200`.** The newest *allowed* patch is computed
   from registry publish dates; when the newest release is younger than 5 days,
   the previous patch is the target.
5. **Dependabot version updates enabled** (`.github/dependabot.yml`): npm
   workspace (`directories: ["/", "/backend"]`, `groups.minor-and-patch` +
   `group-by: dependency-name`) plus docker for both digest-pinned Dockerfiles.
   Majors arrive as individual PRs and are handled in their own cycles.
6. **Evidence is archived**, not narrated: `pnpm audit` JSONs and the triage
   table live under `.agents/docs/evidence/`, and the invariants are guarded by
   `backend/src/__tests__/dependencyConfig.test.ts`.

## Consequences

- An advisory surface that can be re-audited in two commands, with the expected
  result (**0**) archived per cycle.
- The pin↔floor invariant and the "no ignore for transitive packages" rule are
  **enforced by tests**, so the two defects of this cycle cannot silently return.
- Every Dependabot PR must be reviewed for three things: `catalog:` specifiers
  staying `catalog:` (a PR inlining them or turning an exact pin into a caret is
  rejected), override floors moving with their pins, and ADR-0004 verification
  for Docker digest bumps.
- Deliberately **not** automated yet: the CI workflow
  (`.github/workflows/security.yml`) and the `check:security` script, plus the
  OSV scan as a committed script — tracked as slice C3.
- `Dependabot alerts` and `Dependabot version updates` are different features;
  enabling the file does not enable the alerts, and vice versa. Both must be
  verified in the repository settings after the first run.
