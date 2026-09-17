# `.agents/specs/` — change specs (OpenSpec-equivalent)

This directory holds the **machine-readable contract** that `/build` implements
and `/reviewer` verifies, one file per cycle.

## Flow

```
/plan   → writes `.agents/specs/change_spec.yaml` (status: draft → active)
          with the requirement list R1..Rn, scenarios (happy/edge/side) and
          verifiable acceptance criteria
/build  → implements only what the spec enumerates; nothing without an R-ID
/review → verifies each R against evidence; gaps become ID-XX findings
/scribe → MERGES the deltas into the living spec under
          `.agents/docs/specs/`, then flips this file to `status: archived`
```

Equivalence with OpenSpec: `change_spec.yaml` ≈
`openspec/changes/[change]/proposal.md`, and the merge step ≈
`openspec/changes/[x] → openspec/specs/`. This repository keeps specs as
Markdown under `.agents/docs/specs/` (`license-attribution.md`,
`security-hardening.md`) and uses this YAML file only for the *active* change.

## Rules

- A spec without `R1..Rn` blocks `/build`.
- Archived specs are never edited afterwards: supersede them with a new cycle.
- Deferred requirements are listed explicitly (with the cycle they moved to), not
  silently dropped — the checkpoint's `pending_ids` is the live mirror.
