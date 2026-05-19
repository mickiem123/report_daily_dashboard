# Root App Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the React v2 dashboard the repository root app and move the legacy vanilla dashboard into `archive/v1`.

**Architecture:** Preserve app source, tests, Supabase files, docs, and plan history while changing only paths. Remove generated build and QA artifacts from tracked source so future work starts from source files, not bundled output. Keep the existing root `AGENTS.md` as the repo-level instruction file and move the old nested agent protocol out of the root filename conflict.

**Tech Stack:** Git path moves, Vite, React, TypeScript, Vitest.

---

### Task 1: Move App To Root

**Files:**
- Move: `ssi-dashboard-v2-plan/*` -> repo root
- Move: `v1/*` -> `archive/v1/*`
- Preserve: root `AGENTS.md`
- Move: `ssi-dashboard-v2-plan/AGENTS.md` -> `docs/agent-protocol-v2-plan.md`

- [ ] **Step 1: Remove generated tracked app artifacts**

Run:

```powershell
git rm -r ssi-dashboard-v2-plan/dist
git rm ssi-dashboard-v2-plan/qa-desktop-modal-fresh.png ssi-dashboard-v2-plan/qa-desktop-modal.png ssi-dashboard-v2-plan/qa-mobile-modal.png
```

Expected: tracked generated build output and QA screenshots are removed from the source tree.

- [ ] **Step 2: Archive legacy v1**

Run:

```powershell
New-Item -ItemType Directory -Force archive | Out-Null
git mv v1 archive/v1
```

Expected: legacy vanilla app is under `archive/v1`.

- [ ] **Step 3: Move v2 app contents to root without overwriting root AGENTS**

Run:

```powershell
git mv ssi-dashboard-v2-plan/AGENTS.md ssi-dashboard-v2-plan/docs/agent-protocol-v2-plan.md
Get-ChildItem -Force ssi-dashboard-v2-plan | Where-Object { $_.Name -ne 'docs' } | ForEach-Object { git mv $_.FullName . }
```

Expected: app config, source, tests, public assets, and Supabase files move to root.

- [ ] **Step 4: Move nested docs to root docs**

Run:

```powershell
Get-ChildItem -Force ssi-dashboard-v2-plan/docs | ForEach-Object {
  $target = Join-Path docs $_.Name
  if (Test-Path $target) {
    Get-ChildItem -Force $_.FullName | ForEach-Object { git mv $_.FullName $target }
  } else {
    git mv $_.FullName docs
  }
}
```

Expected: project documentation and this plan live under root `docs/`.

- [ ] **Step 5: Remove empty nested app folder**

Run:

```powershell
Remove-Item -LiteralPath ssi-dashboard-v2-plan -Recurse -Force
```

Expected: `ssi-dashboard-v2-plan/` no longer exists.

### Task 2: Verify Layout And App

**Files:**
- Verify: root `package.json`
- Verify: root `src/`
- Verify: root `tests/`
- Verify: `archive/v1/`

- [ ] **Step 1: Confirm git status only contains intended moves/removals**

Run:

```powershell
git status --short
```

Expected: path moves from `ssi-dashboard-v2-plan/` to root, `v1/` to `archive/v1/`, and generated artifacts removed.

- [ ] **Step 2: Run tests**

Run:

```powershell
npm run test -- --run
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: PASS, with generated `dist/` ignored.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -A
git commit -m "chore: make v2 dashboard the root app"
```

Expected: one commit containing only layout cleanup and generated artifact removal.

---

## Self-Review

- Spec coverage: app root move, legacy archive, generated artifact cleanup, verification, and commit are covered.
- Placeholder scan: no placeholders remain.
- Type consistency: no code API changes are planned.
