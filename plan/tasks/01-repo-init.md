# Task 01: Repo init + deprecate old code

> Depends on: none
> Estimated complexity: S
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Create a fresh git repository for the new dashboard project, scaffold the target folder structure, and move the old Python tool into a `deprecated/` folder for reference.

## Success Criteria
- [ ] New empty folder `ssi-dashboard/` exists at user-chosen location, initialized as git repo.
- [ ] Folder structure matches CONTEXT.md "Project Structure" section.
- [ ] All files from old `report_writer_tool/` (except `out/`, `tests/`, `__pycache__`) are inside `ssi-dashboard/deprecated/`.
- [ ] `.gitignore` excludes `node_modules/`, `out/`, `*.pyc`, `__pycache__/`, `.DS_Store`, `*.log`.
- [ ] `README.md` written with: project goal, links to MASTER.md/CONTEXT.md (in plan folder), quickstart, and "deprecated/ is read-only reference" note.
- [ ] Initial commit made on `main` branch with message: `chore: initial scaffold + deprecate old report.py`.
- [ ] User has been told (via log.md) the exact `git remote add` + `git push -u origin main` commands needed to push to a new GitHub repo.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] User has confirmed location for new `ssi-dashboard/` folder. If unclear, default to sibling of existing `report_writer_tool/`. Ask in log.md if unsure.
- [ ] Existing `report_writer_tool/` directory is intact (do NOT modify it; we COPY files from it).
- [ ] `git`, `node`, `python` available on system (check `--version`).

### Post-conditions (verify after completing)
- [ ] `ssi-dashboard/.git/` exists.
- [ ] `ssi-dashboard/deprecated/report.py` exists and is byte-identical to original.
- [ ] `ssi-dashboard/deprecated/export_pdf.ps1` exists.
- [ ] `ssi-dashboard/deprecated/MAINTENANCE.md` exists.
- [ ] `ssi-dashboard/deprecated/assets/sortable.min.js` and `apexcharts.min.js` exist.
- [ ] `ssi-dashboard/public/` exists (empty for now, will be filled in T04).
- [ ] `ssi-dashboard/tests/` exists (empty for now).
- [ ] `ssi-dashboard/.gitignore` and `ssi-dashboard/README.md` committed.
- [ ] `git log --oneline` shows exactly one commit on `main`.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- Anything inside the NEW `ssi-dashboard/` directory.

**Files NOT to touch:**
- Anything inside the existing `report_writer_tool/` directory. COPY only, never move/delete.

## Steps

### Step 1: Create new project folder
- Create `ssi-dashboard/` at user-chosen location (sibling to `report_writer_tool/` is fine).
- `cd ssi-dashboard && git init`.

### Step 2: Scaffold folder structure
Create empty folders:
- `public/`
- `public/assets/`
- `public/js/`
- `tests/`
- `deprecated/`

### Step 3: Copy old tool into deprecated/
Copy these files from `../report_writer_tool/` to `./deprecated/`:
- `report.py`
- `export_pdf.ps1`
- `requirements-dev.txt`
- `MAINTENANCE.md` (if exists)
- `assets/sortable.min.js` → `deprecated/assets/sortable.min.js`
- `assets/apexcharts.min.js` → `deprecated/assets/apexcharts.min.js`

Do NOT copy: `out/` (generated output), `tests/` (old pytest), `__pycache__/`, `.git/`.

### Step 4: Write `.gitignore`
```
# OS
.DS_Store
Thumbs.db

# Python (deprecated folder may regenerate these)
__pycache__/
*.pyc
*.pyo
deprecated/out/

# Node (in case we ever add tooling)
node_modules/
npm-debug.log

# Editor
.vscode/
.idea/

# Env (keep .env.example, ignore real .env)
.env
.env.local

# Logs
*.log
```

### Step 5: Write `README.md`
Minimal content:
```markdown
# SSI Dashboard

Live dashboard replacing the old `report.py` Excel-to-HTML workflow.

## Status
In active development. See `../plan/MASTER.md` for the implementation plan
and `../plan/log.md` for live progress.

## Quickstart (once T04+ complete)
1. Open `public/index.html` in any modern browser.
2. To edit data: click "Nhập liệu" on a section, enter password.

## Architecture
- Cloudflare Pages serves `public/` as a static site.
- Supabase Postgres holds 3 tables (daily/weekly/monthly).
- Vanilla JS handles all compute + rendering in browser.

## `deprecated/`
Old Python report tool (`report.py`, `export_pdf.ps1`, etc.) moved here for
reference. **Read-only.** Do not modify or run from this folder.

## Plan / Tasks
The implementation plan, task contracts, and live execution log live in
`../plan/`. Always read `../plan/CONTEXT.md` before working on a task.
```

### Step 6: Commit and prepare for push
```bash
git add .
git commit -m "chore: initial scaffold + deprecate old report.py"
```

### Step 7: Document the push step in log.md
The executor cannot create a GitHub repo on the user's behalf. Append to log.md T01 entry:
```
USER ACTION REQUIRED:
1. Go to https://github.com/new
2. Name the repo (suggested: "ssi-dashboard"), private, no README
3. Run locally:
   git remote add origin git@github.com:<user>/ssi-dashboard.git
   git branch -M main
   git push -u origin main
4. After push, set status of T01 to `done` in log.md.
T03 will use this remote URL to connect Cloudflare Pages.
```

## Verification
```bash
cd ssi-dashboard
ls -la                                    # should show .git, public/, deprecated/, tests/, README.md, .gitignore
ls deprecated/                            # should show report.py, export_pdf.ps1, etc.
git log --oneline                         # should show 1 commit
git status                                # should show "nothing to commit, working tree clean"
```
Diff old vs deprecated copy:
```bash
diff -r ../report_writer_tool/report.py deprecated/report.py    # no output = identical
```

## When to STOP and ASK (Think Before Coding — Principle 1)
- Old `report_writer_tool/` location is uncertain.
- A file in scope already exists with conflicting content.
- User wants different folder name than `ssi-dashboard/`.
- `report_writer_tool/` has uncommitted changes user might want preserved differently.

## After Completion
Update log.md T01 entry:
- Files changed: list every file copied/created
- Tests: N/A (no logic this task)
- Unplanned changes: any deviation, with reason
- Contradictions with CONTEXT.md: any
- Confidence: HIGH/MED/LOW that T02 starts cleanly
- Set Status = `review` (or `blocked` if waiting on user GitHub push)
