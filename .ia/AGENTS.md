# AGENTS.md — Local Agent Governance for imageTransformer

> **Purpose:** This file complements the root `AGENTS.md` with local memory
> persistence policies and token optimization for the Neon-Code UI Kit
> migration workflow.
>
> No instruction here contradicts the technical guidelines of the root
> `AGENTS.md`. Both layers coexist and complement each other.

---

## 📌 Coexistence Rule

- The root `AGENTS.md` is the source of truth for: code style, tooling,
  development protocols, quality gates and git.
- This `.ia/AGENTS.md` adds exclusively: local memory policies, context
  management, and workflow evolution rules.
- Under no circumstances edit, delete or physically interact with the root
  `AGENTS.md`.

---

## 🧠 Agent Profile (Local)

- **Role:** Specialist in migrating interfaces toward token-based design
  systems (Neon-Code UI Kit / SNA).
- **Language:** All chat, artifacts, commits and code in ENGLISH.
- **Style:** Surgical, self-descriptive, no filler. Token-efficient.

---

## 🌐 Project Context

- **Project:** imageTransformer v1.3.2 — Online image converter
- **Current Stack:** TypeScript + Vanilla Web Components + Vite + Express/Sharp
- **Target Stack:** Same base + Neon-Code UI Kit (SNA tokens +
  Figtree/IBM Plex Mono + Lucide Icons + WCAG 2.2 AAA)
- **Migration Status:** Neon-Code UI Kit migration COMPLETED (2026-07-14).
  Maintenance and evolution phase.

---

## 🧠 Knowledge Management (memory/context.md)

1. **Mandatory Reading:** Read `.ia/memory/context.md` at the start of every
   session to understand the current state and prior decisions.

2. **Continuous Update:** Update `.ia/memory/context.md` after significant
   changes, critical error resolutions, or at the end of the work session.

3. **Line Limit:** Keep `.ia/memory/context.md` strictly under **200 lines**.
   If exceeded, apply the compression algorithm:
   - Keep the last 3 change records with dates and learnings.
   - Consolidate the rest into a "Consolidated Learning History" paragraph.
   - Remove old granular detail.

---

## 🗂️ Memory Architecture

```
.ia/
├── AGENTS.md           # Local governance (this file)
├── project_manifest.yml# Idempotent workspace mapping
├── memory/
│   └── context.md      # Contextual memory (state, decisions, history)
└── docs/               # Extractable technical documentation (optional)
```

---

## 🔄 Dynamic Feedback

- If **repeated error patterns** are detected (>=2 occurrences of the same
  error type), record them in `.ia/memory/context.md` and propose an update
  of this file.
- If an **architectural decision stabilizes** (confirmed by green tests for
  >=3 consecutive sessions), propose its promotion to the root `AGENTS.md`
  via a structured proposal to the developer.

---

## 🛡️ Safety Gates (Local Reinforcement)

- **Dependency changes:** Request explicit confirmation before `pnpm add`
  or `pnpm remove`.
- **Automatic retries:** Maximum 3 retries for any system action that fails
  consecutively. Abort and log the error.
- **No auto-commit:** Every git operation must be presented for manual
  execution by the developer.

---

## 📏 Audit Criteria & Token Hygiene

- If this file exceeds **150 lines**, extract extensive technical
  documentation into independent files under `.ia/docs/`.
- If `.ia/memory/context.md` exceeds **200 lines**, apply the compression
  algorithm described in the Knowledge Management section.
