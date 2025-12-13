# Beads-Cody Reconciliation Contract (Pre-Alpha)

This document defines the intended behavior for keeping **Cody PBT** project artifacts in sync with a canonical **task backend**.

Today, the backend is **Beads** (via the `bd` tool). In the future, other systems (GitHub Issues, Jira, Monday, etc.) may become primary via adapters.

## Scope

In-scope:
- Reconciling **atomic tasks** (backend) with **Cody version tasklists** (visibility/completeness tracking).
- Ensuring version tasklists reflect backend task existence and completion.

Out-of-scope (for now):
- Making GitHub a hard dependency.
- Treating Cody “backlog ideas” as backend tasks before they are pulled into a version.

## Terminology (Avoiding Tool Leakage)

This repo currently uses **Cody PBT** as the planning/versioning system.

However, Liaison is designed to support other planning/versioning systems in the future.
In CLI/UI and internal abstractions, prefer neutral terms:

- "plan system" / "planning system" instead of "Cody"
- "version tasklist" instead of "Cody tasklist"
- "task backend" instead of "Beads" (even though Beads is the current backend)

This document uses "Cody" and "Beads" only to describe the current concrete implementations.

## Canonical Data & Files

### Cody PBT (file-based)

- Plan artifacts: `.cody/project/plan/{discovery,prd,plan}.md`
- Build artifacts: `.cody/project/build/feature-backlog.md`
- Version artifacts: `.cody/project/versions/<version>/{design,tasklist,retrospective}.md`

The reconciliation target is the **version tasklist**:

- `.cody/project/versions/<version>/tasklist.md`

### Beads (current backend)

- Supported interface: the `bd` CLI (often invoked as `bun x bd ...`).
- Persistence/export: `.beads/issues.jsonl` (JSONL).

Important: `.beads/issues.jsonl` is not treated as a stable programmatic API. The supported interface is `bd`.

## Core Concepts

### Task ID

- Task IDs are **opaque strings**.
- Do NOT hard-code, validate, or pattern-match a specific prefix (e.g. do not assume `owk-`).
- Multiple prefixes may coexist in a single project/version tasklist.
- Prefix selection is configurable per project to avoid collisions when repositories merge.

### Link Strategy (Option A)

The link between Cody and the backend task is stored in Cody:

- The **Cody version tasklist** contains the backend task ID in its **ID column**.

This enables future backends to reuse the same “task id” concept, even if Beads is replaced.

## Source of Truth & Conflict Resolution

- The backend (Beads today) is the **source of truth** for atomic task status.
- Cody tasklists are a **derived view** used for planning/monitoring completion of a version.
- On conflict, **backend wins**.
- Task IDs must never be duplicated.

## Required Reconciliation Behaviors

### 1) Cody → Backend (when work moves into a version)

When a task row exists in a Cody version tasklist but has **no task ID yet**:

- Create a new backend task.
- Write the returned task ID into the Cody tasklist `ID` cell.

This is how “backlogged ideas” become real atomic tasks.

### 2) Backend → Cody (status reconciliation)

When a Cody tasklist row has an ID that exists in the backend:

- If backend status is `closed` (or equivalent), mark the Cody row as completed.
- Otherwise, keep the Cody row in an incomplete state.

Exact status emoji/label mapping is allowed to evolve, but the invariant is:

- backend `closed` => Cody “done/checked”.

### 3) Backend deletions

If a task ID referenced by a Cody tasklist no longer exists in the backend:

- Strike through the entire Cody tasklist row (as a visible check-and-balance).
- Manual deletion may follow later.

Because Markdown tables do not support true row-level formatting, “strike through the row” means striking through each cell.

Example:

```md
| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| ~~abc-123~~ | ~~Do the thing~~ | ~~...~~ | ~~...~~ | ~~🟢~~ | ~~AGENT~~ |
```

## GitHub and Other Systems

GitHub issues (and later Jira/Monday/etc) may be introduced into the pool via adapters:

- If an incoming external issue can be matched to an existing task ID, link it.
- Otherwise create a new backend task and then link.

This is explicitly optional: Liaison must work without GitHub configured.

## Commit Convention

Commits may reference tasks using a backend-agnostic footer:

- `Refs: <id1> <id2> ...`

Multiple IDs are allowed.

## Non-Goals / Safety Constraints

- Do not erase existing features/functionality while iterating on reconciliation.
- Preserve history: do not rewrite historical task IDs.
- Treat Beads JSONL as persistence/export; use `bd` as the interface.
