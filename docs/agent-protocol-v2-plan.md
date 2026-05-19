# Agent Protocol

You are an executor agent on this repository. Read this file fully before any work. Re-read it when resuming a session.

## Entry Point
Before doing anything:
1. Read `/plan/MASTER.md` — overview, task list, sequencing
2. Read `/plan/CONTEXT.md` — architecture, conventions, commands
3. Read `/plan/PREFLIGHT.md` — checklist to run for every task
4. Pick up next task per "Task Pickup Protocol" below

## 4 Coding Principles (NON-NEGOTIABLE)

**P1 — Think Before Coding**
State assumptions in your log.md entry before writing code. Ask if unclear. Do not guess at intent.

**P2 — Simplicity First**
Write the minimum code to satisfy the task. No speculative features, no "while I'm here" refactors, no future-proofing.

**P3 — Surgical Changes**
Touch only files in task scope. Clean your own orphans (unused imports, dead vars you introduced). Do not reformat or restructure unrelated code.

**P4 — Goal-Driven Execution**
Verify against task post-conditions and VERIFY.md success criteria. Tests passing + post-conditions met = done. Nothing else counts as done.

## Read-Only vs Writable

**READ-ONLY** (never edit these):
- `/plan/MASTER.md`
- `/plan/CONTEXT.md`
- `/plan/tasks/*.md`
- `/plan/VERIFY.md`
- `/plan/PREFLIGHT.md`
- `/plan/EXAMPLE-LOG.md`
- `/CLAUDE.md`, `/AGENTS.md`, `/.cursorrules` (after T01 creates them)

**WRITABLE**:
- `/plan/log.md` — the only communication channel between agents and back to planner
- Repo source code per current task scope

## Task Pickup Protocol

1. Open `/plan/log.md`
2. Find first dashboard row with Status=`pending` and all listed dependencies = `done`
3. In that task's per-task entry section, fill:
   - `Status: executing`
   - `Coder: <your-agent-id>`
   - `Started: <ISO timestamp>`
   - `Branch: feature/TNN-<short-name>`
4. Update the dashboard row: Status to `executing`, Coder column filled
5. Open `/plan/tasks/TNN-*.md` and read it fully
6. Verify every pre-condition listed in the task. If any fail:
   - Set `Status: blocked`, `Esc: Y`
   - Write the blocker reason in your entry
   - STOP. Do not proceed.
7. Run `/plan/PREFLIGHT.md` checklist
8. Begin task work

## Git Protocol

This plan uses a **long-lived integration branch** named `feat/v2-react-rewrite` instead of `main` as the merge target. The repo's `main` branch holds the legacy vanilla v1 code and is untouched until final cutover.

- Always branch from `feat/v2-react-rewrite`:
  ```
  git checkout feat/v2-react-rewrite && git pull origin feat/v2-react-rewrite
  git checkout -b feature/TNN-<short-name>
  ```
- Every commit message starts with `TNN: ` followed by imperative voice.
  Example: `T03: add user login endpoint`
- Small frequent commits are encouraged: failing test, green, refactor, WIP — all fine
- On reviewer approval: merge to `feat/v2-react-rewrite` with `--no-ff` to preserve task boundary
  ```
  git checkout feat/v2-react-rewrite && git merge --no-ff feature/TNN-<short-name>
  git branch -d feature/TNN-<short-name>
  git push origin feat/v2-react-rewrite
  ```
- On git conflict: STOP. Set `Esc: Y`, `Status: blocked`, write the conflict in your entry. Do not auto-resolve.
- Do NOT push to or merge into `main` during this plan. Only the planner triggers final cutover after VERIFY passes.

## log.md Write Rules

- **Append-only.** Never delete history. If an entry is superseded, mark the old one `failed` and write a new one below.
- **Dashboard table** (top of file): coordinator writes only. If you are working solo, you act as your own coordinator.
- **Per-task entry section**: only the agent assigned to that task writes their own entry. Do not edit other agents' entries.
- **Timestamps**: ISO 8601 format, e.g., `2026-05-09T14:32:00Z`
- **Status states**: `pending` / `executing` / `review` / `done` / `blocked` / `failed`
- **Confidence**: `H` / `M` / `L`. `L` requires an explanation in Notes.
- **Escalation flag**: set `Esc: Y` when blocked, on conflict, on ambiguity, or any unplanned change. Otherwise `Esc: N`.

See `/plan/EXAMPLE-LOG.md` for a filled sample.

## Exit Check (fill before requesting review)

In your per-task entry, fill these fields completely:
- **Files**: every file added, modified, or deleted in this task
- **Tests**: which tests were added or changed; all green? yes/no with command output
- **Unplanned changes**: any file edits outside the task's declared scope? List them. Should be 0 unless explicitly documented why.
- **Contradictions**: any conflicts found between task spec, CONTEXT.md, or actual code? List them.
- **Confidence**: H/M/L on whether all post-conditions are met
- **Notes**: anything the reviewer needs to know

## Review Protocol

- After your exit check is filled, set `Status: review` in your entry and on the dashboard
- A reviewer agent (separate dispatch) reads: the task file, your entry, your diff
- Two-stage review:
  1. Tests pass + every post-condition met
  2. Code quality, principle compliance, no scope creep
- Reviewer writes "Reviewer notes" in your entry and sets `Reviewed: <timestamp>`
- If approved: reviewer merges to `feat/v2-react-rewrite` with `--no-ff`, sets `Status: done`
- If rejected: reviewer sets `Status: executing` back, writes what to fix; original coder picks up

## Done Definition

A task is done when ALL of these are true:
- Tests green (run the command in CONTEXT.md)
- Every post-condition in the task file is satisfied
- Reviewer has signed off
- Branch is merged to `feat/v2-react-rewrite`
- log.md entry shows `Status: done` with `Reviewed` timestamp filled

Anything less is not done. Do not mark done early.

## Escalation

Set `Esc: Y` and STOP when:
- A pre-condition fails
- Git conflict on merge
- Task contradicts CONTEXT.md or another task
- Required info is missing from the plan
- Confidence is `L` and you cannot raise it

Write the blocker clearly in your log.md entry. Do not freelance to unblock yourself.

## Resume Protocol (new session)

1. Re-read this file (`/CLAUDE.md`) fully
2. Read `/plan/MASTER.md` and `/plan/CONTEXT.md`
3. Open `/plan/log.md`, find first task with Status `pending` or `blocked`
4. If a task is `executing` with no recent activity (>1 hour), check its branch:
   - If commits exist, decide whether to continue or mark `failed` and start clean
   - If no commits, mark `failed` and re-pick from `pending`
5. Resume per Task Pickup Protocol

## Test & Build Commands

See `/plan/CONTEXT.md` section "Commands". If missing or unclear, escalate.

## Final Note

If anything in this file conflicts with `/plan/CONTEXT.md` or a task file, **escalate via log.md**. Do not silently choose. Planner intent must be clarified.
