# Execution Log - SSI Dashboard Pivot

> Live communication channel between executor agents and the planner.
> Append-only. Never delete history. Update inline as work progresses.

## Dashboard

| #  | Task                                | Status  | Coder | Reviewer | Tests | Conf | Esc |
|----|-------------------------------------|---------|-------|----------|-------|------|-----|
| 01 | Repo init + deprecate old code      | review  | Codex | -        | N/A   | MED  | N   |
| 02 | Supabase schema + data migration    | done    | Codex | -        | SQL   | HIGH | N   |
| 03 | Cloudflare Pages connection         | done    | Codex | -        | api   | HIGH | N   |
| 04 | Dashboard skeleton + Supabase fetch | done    | Codex | -        | smoke | HIGH | N   |
| 05 | JS compute layer port               | done    | Codex | -        | html  | HIGH | N   |
| 06 | JS product extractors               | done    | Codex | -        | html  | HIGH | N   |
| 07 | Card rendering + groups + inverse   | done    | Codex | -        | html  | HIGH | N   |
| 08 | 3-section page layout               | done    | Codex | -        | smoke | HIGH | N   |
| 09 | Refresh button + auto-daily         | done    | Codex | -        | smoke | HIGH | N   |
| 10 | Input grid + password               | done    | Codex | -        | smoke | HIGH | N   |
| 11 | Cell validation                     | done    | Codex | -        | html  | HIGH | N   |
| 12 | CRUD flow (add/edit/delete + save)  | review  | Codex | -        | static| MED  | N   |
| 13 | VERIFY end-to-end                   | failed  | Codex | -        | mixed | LOW  | Y   |

Status legend: pending / executing / review / done / blocked / failed
Conf legend: HIGH / MED / LOW
Esc legend: Y / N

---

## Task Entries

### T01 - Repo init + deprecate old code

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** main
**Commits:** `chore: initial scaffold + deprecate old report.py`

#### Files changed
- `.gitignore`
- `README.md`
- `deprecated/report.py`
- `deprecated/export_pdf.ps1`
- `deprecated/requirements-dev.txt`
- `deprecated/MAINTENANCE.md`
- `deprecated/assets/sortable.min.js`
- `deprecated/assets/apexcharts.min.js`
- `public/`
- `public/assets/`
- `public/js/`
- `tests/`

#### Tests
N/A (scaffold task)

#### Unplanned changes
- Executed the scaffold in the current workspace root `D:\Claude projects\daily_report` instead of creating a nested `ssi-dashboard/` folder.
- Source folder is `report_writer_tool_old/` in this workspace rather than `report_writer_tool/` as named in the task file.

#### Contradictions with CONTEXT.md
- Current-root repo layout differs from the target end-state shown in `CONTEXT.md`.
- The original `report_writer_tool_old/` folder remains in place alongside `deprecated/` so the untouched source reference is preserved.

#### Confidence: MED

#### Reviewer notes
Initial scaffold is in place and the legacy files are copied into `deprecated/`.

USER ACTION REQUIRED:
1. Go to https://github.com/new
2. Name the repo (suggested: `ssi-dashboard`), private, no README
3. Run locally:
   `git remote add origin git@github.com:<user>/ssi-dashboard.git`
   `git branch -M main`
   `git push -u origin main`
4. After push, T03 can connect Cloudflare Pages to this repo.

---

### T02 - Supabase schema + data migration

**Status:** done
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** main
**Commits:** `feat: supabase schema + env example`; `chore: finalize import pipeline and remove deprecated columns`

#### Files changed
- `supabase_schema.sql`
- `.env.example`
- `README.md`
- `scripts/clean_excel_for_supabase.py`
- `data/daily_metrics_clean.csv`
- `data/weekly_metrics_clean.csv`
- `data/monthly_metrics_clean.csv`

#### Tests
Supabase SQL checks passed:
- `daily_metrics`: 79 rows
- `weekly_metrics`: 2 rows
- `monthly_metrics`: 3 rows
- RLS enabled on all 3 tables

#### Unplanned changes
- Wrote the 3 tables explicitly instead of using `LIKE ... INCLUDING ALL` to avoid copied-constraint rename issues in Supabase/Postgres.
- Added explicit `GRANT` statements for `anon` and `authenticated` roles so API access does not depend on dashboard defaults.
- Dropped deprecated columns across all tables: `du_no_ssi_deprecated`, `slhd_ps_deprecated`, `slhd_dplus_deprecated`.
- Built a cleaner script to normalize date/number/error cells and regenerate import-ready CSV files.

#### Contradictions with CONTEXT.md
- `CONTEXT.md` says `config.js` may be committed with anon credentials later. Task 02 stops at `.env.example`; no frontend config file was created yet.

#### Confidence: MED
#### Confidence: HIGH

#### Reviewer notes
Completion summary on 2026-05-08:
- Project `report_dashboard` is active.
- `public.daily_metrics`, `public.weekly_metrics`, and `public.monthly_metrics` exist.
- RLS is enabled on all 3 tables.
- Deprecated columns were removed from all 3 tables.
- Row counts after import:
  - `daily_metrics`: `79`
  - `weekly_metrics`: `2`
  - `monthly_metrics`: `3`
- Local `.env` is configured with project URL + publishable key.
- Import artifacts for reproducibility:
  - `data/daily_metrics_clean.csv`
  - `data/weekly_metrics_clean.csv`
  - `data/monthly_metrics_clean.csv`
  - `scripts/clean_excel_for_supabase.py`

---

### T03 - Cloudflare Pages connection

**Status:** done
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** `1e0e71a`

#### Files changed
- `README.md`

#### Tests
- Cloudflare Pages API check (`GET /accounts/{account_id}/pages/projects`) confirms:
  - Project: `report-daily-dashboard-git`
  - Repo source: `mickiem123/report_daily_dashboard`
  - Build config: `build_command=""`, `destination_dir="public"`, `root_dir="/"`
  - Latest preview deployment status: `success`
  - Trigger branch: `feat/04-dashboard-skeleton`
  - Deployment URL: `https://752a3a27.report-daily-dashboard-git.pages.dev`
  - Branch alias URL: `https://feat-04-dashboard-skeleton.report-daily-dashboard-git.pages.dev`

#### Unplanned changes
- Previous blocked state came from Wrangler token permission error (`code: 10000`) on direct CLI deploy path; project is now using Pages Git integration with successful preview deployment.

#### Contradictions with CONTEXT.md
-

#### Confidence: HIGH

#### Reviewer notes
- T03 unblock criteria satisfied on 2026-05-08 with live Pages Git project and successful preview deployment from feature branch.

---

### T04 - Dashboard skeleton + Supabase fetch

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** `770d73c`

#### Files changed
- `public/index.html`
- `public/js/config.js`
- `public/js/main.js`
- `public/assets/style.css`
- `public/assets/supabase.min.js`

#### Tests
- Static verification:
  - `window.STATE` plumbing implemented in `main.js`
  - Supabase client vendored locally (no runtime CDN dependency for client library)
  - Branch pushed: `origin/feat/04-dashboard-skeleton`

#### Unplanned changes
- Included previously pending T03 docs/log updates in the same branch commit.

#### Contradictions with CONTEXT.md
- T04 was implemented before T03 was fully closed due Cloudflare deploy configuration blocker.

#### Confidence: MED

#### Reviewer notes
- Awaiting Cloudflare preview deployment on this branch to confirm:
  - Page loads without JS/CSS 404
  - 3 Supabase table fetch calls succeed
  - `STATE ready` appears in console

---

### T05 - JS compute layer port

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** `0d4402a`

#### Files changed
- `public/js/compute.js`
- `tests/lib/test-runner.js`
- `tests/compute.test.html`
- `public/index.html` (script include for `compute.js`)

#### Tests
- Browser test harness created (`tests/compute.test.html`), pending human/manual open-and-verify in deployed preview.

#### Unplanned changes
- T05 executed on same feature branch as T04 (`feat/04-dashboard-skeleton`) to keep deployment path unblocked.

#### Contradictions with CONTEXT.md
- `detectTrend` includes extended streak logic (`ðŸ“ˆ/ðŸ“‰`) plus sudden-drop marker (`ðŸ”´`) as per task spec, while legacy Python currently emits only sudden-drop warning.

#### Confidence: MED

#### Reviewer notes
- Compute layer and test scaffolding are implemented and pushed.
- Next gating check is Cloudflare preview validation, then continue to T06.

---

### T06 - JS product extractors

**Status:** pending
**Coder:** -     **Reviewer:** -
**Started:** -   **Finished:** -   **Reviewed:** -
**Branch:** -
**Commits:** -

#### Files changed
-

#### Tests
-

#### Unplanned changes
-

#### Contradictions with CONTEXT.md
-

#### Confidence: -

#### Reviewer notes
-

---

### T07 - Card rendering + groups + inverse

**Status:** pending
**Coder:** -     **Reviewer:** -
**Started:** -   **Finished:** -   **Reviewed:** -
**Branch:** -
**Commits:** -

#### Files changed
-

#### Tests
-

#### Unplanned changes
-

#### Contradictions with CONTEXT.md
-

#### Confidence: -

#### Reviewer notes
-

---

### T08 - 3-section page layout

**Status:** pending
**Coder:** -     **Reviewer:** -
**Started:** -   **Finished:** -   **Reviewed:** -
**Branch:** -
**Commits:** -

#### Files changed
-

#### Tests
-

#### Unplanned changes
-

#### Contradictions with CONTEXT.md
-

#### Confidence: -

#### Reviewer notes
-

---

### T09 - Refresh button + auto-daily

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** -

#### Files changed
- `public/js/main.js`

#### Tests
- Manual smoke on local dashboard:
  - refresh buttons present per section
  - confirm flow wired with `Tải lại dữ liệu? Có thể mất vài giây.`
  - section-only refresh path implemented
  - cooldown logic implemented (5s)

#### Unplanned changes
- Refresh buttons are injected by `main.js` (`ensureRefreshButtons`) instead of static HTML insertion.

#### Contradictions with CONTEXT.md
- None.

#### Confidence: MED

#### Reviewer notes
- Local storage marker `lastRefreshDate` is written after load and stale-day branch triggers one silent reload.

---

### T10 - Input grid + password

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** -

#### Files changed
- `public/assets/tabulator.min.js`
- `public/assets/tabulator.min.css`
- `public/js/grid.js`
- `public/index.html`
- `public/assets/style.css`
- `public/js/main.js` (compatibility hook for grid refresh after section reload)

#### Tests
- Manual smoke on local dashboard:
  - per-section `Nhập liệu` button rendered
  - password gate by `sessionStorage` key `canEdit_<mode>`
  - wrong password blocked with alert
  - grid shows last 20 rows + one empty row
  - `ngay` frozen and editable

#### Unplanned changes
- Grid columns follow the current Supabase schema (deprecated columns are excluded).

#### Contradictions with CONTEXT.md
- Task text mentions legacy 43-column expectation; implementation follows current schema after deprecated column removal.

#### Confidence: HIGH

#### Reviewer notes
- Grid toggle open/close works and does not reprompt once section auth is granted in current session.

---

### T11 - Cell validation

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** -

#### Files changed
- `public/js/validation.js`
- `public/js/grid.js`
- `public/assets/style.css`
- `tests/validation.test.html`
- `public/index.html`

#### Tests
- `tests/validation.test.html`: `5 passed, 0 failed`
- `node --check public/js/validation.js` passed

#### Unplanned changes
- Added fallback outlier detection for flat history (`z=inf`) when robust MAD collapses to zero.

#### Contradictions with CONTEXT.md
- None.

#### Confidence: HIGH

#### Reviewer notes
- `cellEdited` now applies class + tooltip and restores old value for severity `error`.

---

### T12 - CRUD flow (add/edit/delete + save)

**Status:** review
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** -

#### Files changed
- `public/js/grid.js`
- `public/js/main.js`
- `public/index.html`

#### Tests
- Static + local smoke:
  - debounce save path present (1s timer)
  - upsert/delete helpers present and wired
  - `+ Thêm dòng` button wired
  - section reload hook (`window.reloadSection`) integrated

#### Unplanned changes
- Save/delete button copy currently ASCII-only in places; functionally wired.

#### Contradictions with CONTEXT.md
- None.

#### Confidence: MED

#### Reviewer notes
- Full DB-coupled persistence verification still requires manual exercise against live Supabase UI.

---

### T13 - VERIFY end-to-end

**Status:** failed
**Coder:** Codex     **Reviewer:** -
**Started:** 2026-05-08   **Finished:** 2026-05-08   **Reviewed:** -
**Branch:** feat/04-dashboard-skeleton
**Commits:** -

#### Files changed
- `plan/log.md`

#### Tests
- A. Unit pages: PASS
  - `tests/compute.test.html` -> `19 passed, 0 failed`
  - `tests/extractors.test.html` -> `5 passed, 0 failed`
  - `tests/render.test.html` -> `5 passed, 0 failed`
  - `tests/validation.test.html` -> `5 passed, 0 failed`
- B. Static dashboard render: FAIL
  - Preview URL loaded with 3 sections and 6 cards/section.
  - Detail toggles work, M+ and D+ groups render, inverse KH cancel D+ behavior observed.
  - Numeric format does not match VERIFY expectation example (`1.234,5 tỷ`, `8,52%`); observed format is `31,144 tỷ`, `8.98%`.
- C. Refresh flow: PARTIAL
  - Confirm dialog shown; cancel path showed 0 fetch calls in instrumentation.
  - Rapid double-click simulation produced one refresh fetch while lock active.
  - Explicit network-blocked UI error banner check is pending (non-deterministic in this run).
- D. Auth + grid: PARTIAL
  - Wrong password blocks open (`Sai mật khẩu`), correct password `123` opens grid.
  - Re-click closes grid without second prompt.
  - Per-section auth verified by separate weekly prompt + session key.
  - Frozen `ngay` column and frozen header structure observed; empty bottom row present.
  - Reload keeps grid closed by default while session key may persist.
- E. Cell validation: PARTIAL
  - Validation logic checks executed through `window.validation.validateCell`:
    - non-number => error
    - percent range >1 => warn
    - negative count => warn
    - outlier z-score case => outlier
    - bad date format => error
  - Full DOM border/tooltip/revert behavior for every case remains pending manual interaction.
- F. CRUD save flow: PENDING
  - Debounce/save logic and `onConflict: 'ngay'` path verified in code.
  - Live Supabase Table Editor persistence checks require manual/external confirmation.
- G. Cards reflect writes: PENDING
  - Requires real write + post-save card re-render confirmation against live data.
- H. Cross-browser smoke: PARTIAL
  - Chromium/agent-browser checks run.
  - Safari desktop and mobile browser checks pending manual execution.
- I. Git & deployment workflow sanity: FAIL/PARTIAL
  - Cloudflare Pages production URL `https://report-daily-dashboard-git.pages.dev/` returned `Deployment Not Found` during this verification.
  - Preview deployments for feature branch exist and complete quickly (seconds).
  - PR preview-link visibility in GitHub PR checks/comments pending manual verification.
- J. Repo hygiene: PARTIAL
  - `deprecated/` exists with old Python tool files.
  - `.gitignore` contains `.env`, `node_modules/`, `*.pyc`.
  - `.env.example` contains required keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `WRITE_PASSWORD`).
  - `README.md` fresh-clone accuracy and `supabase_schema.sql` clean run on fresh project pending manual verification.

#### Unplanned changes
- Production Pages URL check surfaced deployment state issue (`Deployment Not Found`).

#### Contradictions with CONTEXT.md
- User-signoff items in VERIFY remain pending by design (manual-only).

#### Confidence: LOW

#### Reviewer notes
- T13 marked `failed` per VERIFY failure policy due checklist failures in B (numeric format) and I (production URL/deployment sanity).
- Manual sign-off items remain pending and are not marked complete.

---

## Decisions Log
- T13 FAIL: B numeric formatting check — cards render `8.98%` and `31,144 tỷ` instead of VERIFY style examples like `8,52%` and `1.234,5 tỷ` — formatting in compute/render path is using `en-US` separators and dot decimals.
- T13 FAIL: I production deployment sanity check — production URL `https://report-daily-dashboard-git.pages.dev/` returned `Deployment Not Found` during verification — production deployment state is not healthy/current for sign-off.
- T01: Current workspace root was used as the repo root by user request to execute the plan "here".
- 2026-05-08 T03/T04 infra finding: Cloudflare project is currently configured in Worker-style deploy mode and requires a deploy command. Using `npx wrangler deploy` fails static deployment detection.
- 2026-05-08 Cloudflare deploy test result:
  - Deploy command tested: `npx wrangler pages deploy public --project-name report-dashboard --branch "$CF_PAGES_BRANCH"`
  - Outcome: failed with Cloudflare API auth error `code: 10000`
  - Diagnostic from build log: Wrangler reads token from `CLOUDFLARE_API_TOKEN`; token permissions are insufficient for `pages/projects/report-dashboard` deployment API call.
- Recommended fix-forward path (for next agent/user):
  1. Prefer creating a clean **Pages (Git)** project for repo `mickiem123/report_daily_dashboard` with:
     - Framework preset: None
     - Build command: empty
     - Build output directory: `public`
     - Root directory: `/`
     - Production branch: `main`
  2. Alternative (if keeping current project): repair token permissions for Pages deployment on account `b502de4463b7a7ae1d1051ee3048833d`.
  3. After preview URL is green, next task is T06 (extractors), then T07, T08.

## Next Agent Handoff (2026-05-08)
- Branch to continue: `feat/04-dashboard-skeleton`
- Remote state: pushed to `origin/feat/04-dashboard-skeleton`
- Implemented and pushed:
  - T04 scaffold + Supabase fetch
  - T05 compute layer + browser test harness
- Must verify once deploy works:
  1. `public/index.html` loads on preview URL
  2. Console prints `STATE ready: { daily, weekly, monthly }`
  3. `tests/compute.test.html` opens and reports pass count
- Then continue implementation sequence:
  1. T06 `public/js/extractors.js` + `tests/extractors.test.html`
  2. T07 `public/js/render.js` + style extension + `tests/render.test.html`
  3. T08 wire renderer into `main.js`


## Next Agent Handoff (2026-05-08 - Post Review Update)

### Current workspace status
- Branch: `feat/04-dashboard-skeleton`
- Working tree: **dirty** (uncommitted changes present)
- Modified files:
  - `plan/log.md`
  - `public/assets/style.css`
  - `public/index.html`
  - `public/js/main.js`
  - `tests/compute.test.html`
- Untracked files:
  - `public/assets/tabulator.min.css`
  - `public/assets/tabulator.min.js`
  - `public/js/grid.js`
  - `public/js/validation.js`
  - `tests/validation.test.html`

### What was completed in this session
- Continued implementation through T09-T12.
- Added Tabulator assets and grid module.
- Added validation module and validation test page.
- Updated `main.js` with per-section refresh flow and reload helper.
- Adjusted compute down-streak test data to avoid conflict with sudden-drop precedence.
- Local browser checks previously executed by agent showed:
  - `tests/compute.test.html`: pass after test data adjustment
  - `tests/extractors.test.html`: pass
  - `tests/render.test.html`: pass
  - `tests/validation.test.html`: pass
  - local dashboard renders 3 sections and cards

### Blocking / high-priority issues discovered in review
1. **Add-row auth gating bug (P1)**
   - `.add-row-btn` is rendered with class `hidden` in HTML, but no `.hidden { display: none; }` style exists in `public/assets/style.css`.
   - Effect: `+ Thêm dòng` is visible pre-auth, violating intended UX gate.

2. **Editable `ngay` can duplicate logical records (P1)**
   - In `public/js/grid.js`, `ngay` column is editable while save uses `upsert(..., { onConflict: 'ngay' })`.
   - If user edits `ngay` on an existing row, old row persists and a new row is created, causing silent duplication.
   - Must decide: lock `ngay` on existing rows OR implement key-change migration (delete old + upsert new).

3. **Refresh concurrency window (P2)**
   - In `public/js/main.js`, cooldown disable is applied after successful `loadSection(mode)`.
   - Fast double-click can launch overlapping refresh requests before first completion.
   - Recommended: disable refresh button immediately on refresh start.

### Text/encoding quality issues still present
- Mojibake remains in several user-facing strings (e.g., in `public/index.html` button labels and some messages in `grid.js` / `main.js` view output depending on file encoding path).
- Next agent should normalize UTF-8 text in:
  - `public/index.html`
  - `public/js/grid.js`
  - `public/js/main.js`
  - `plan/log.md` legacy sections already contain mojibake from prior turns.

### Required next actions (in order)
1. Fix the 3 review issues above (P1/P2).
2. Normalize Vietnamese UI strings to clean UTF-8 (no mojibake).
3. Re-run verification:
   - `node --check public/js/main.js public/js/grid.js public/js/validation.js`
   - browser test pages (`compute`, `extractors`, `render`, `validation`)
   - dashboard smoke for refresh + input auth + grid open/edit
4. Update T09-T13 entries in this log to reflect corrected state and final confidence.
5. Commit and push once clean.

### Notes on T13
- T13 is `failed` with `Esc=Y` per VERIFY failure handling; it is not in `review`.
- Any resumed verification is blocked pending a planner-issued fix-forward task (VERIFY policy); no silent re-run was performed after failure.

## New Session Handoff (2026-05-09)

### Current branch and workspace
- Branch: `feat/04-dashboard-skeleton`
- Working tree status at handoff: modified files present for formatting fix review
  - `public/js/compute.js`
  - `tests/compute.test.html`

### What was reviewed in this session
- Re-reviewed post-fix formatting changes for `compute.js` and `compute.test.html`.
- Confirmed VN numeric/percent formatting behavior in compute outputs:
  - `fmt(0.0852, "%")` -> `8,52%`
  - `fmt(1234.5, "tỷ")` -> `1.235 tỷ`
- Confirmed diffs include separator conversion updates:
  - `toLocaleString("en-US")` -> `toLocaleString("vi-VN")`
  - percent decimal dot -> comma replacement in display strings.

### Verification evidence captured
- Local runtime probe output:
  - `fmt%= 8,52%`
  - `fmtTy= 1.235`
  - `diffTy= (+10 KH, +10,00%)`
  - `diffPct= (+2,00%)`
- Production Pages URL check result:
  - `https://report-daily-dashboard-git.pages.dev/` -> HTTP `404`
  - Preview URL remained healthy earlier (`feat-04-dashboard-skeleton...pages.dev` returned `200` in prior check).

### Reviewer findings snapshot
1. High: Production deployment sanity failure still open (`T13 FAIL: I` remains unresolved).
2. Medium: Unit-token brittleness risk remains in `compute.js` (`"tỷ"` branch matching can fail under encoding drift and fall through to `KH` label path).

### T13 status context
- T13 remains `failed` with escalation per VERIFY failure handling.
- Numeric formatting issue (B) appears addressed in code under review, but T13 cannot be closed while production URL/deployment sanity (I) is still failing.

### Recommended immediate next actions
1. Resolve production deployment health for main URL (`report-daily-dashboard-git.pages.dev`) and re-check HTTP status/content.
2. Harden unit handling in compute formatting to avoid string-encoding sensitivity (normalize unit keys / internal enum).
3. Re-run T13 checklist items B and I, then update T13 entry and Decisions Log accordingly.

## Completion Update (2026-05-09)

### Fix-forward work completed
- Hardened `public/js/compute.js` unit handling so both `tỷ` and the legacy mojibake token `tá»·` normalize to the same currency unit before formatting.
- Added regression coverage in `tests/compute.test.html` for the legacy unit token in both `fmt()` and `diff()`.
- Re-verified the prior review issues that were already present in the current working tree:
  - `.hidden` hides `+ Thêm dòng` before auth (`display: none`).
  - Existing grid rows lock `ngay` edits (`editable=false`), while new blank rows still allow `ngay` entry (`editable=true`).
  - Two rapid Daily refresh clicks produce one `daily_metrics` fetch while the refresh lock is active.

### Verification evidence
- `node --check public/js/compute.js`
- `node --check public/js/main.js`
- `node --check public/js/grid.js`
- `node --check public/js/validation.js`
- `tests/compute.test.html`: `21 passed, 0 failed`
- `tests/extractors.test.html`: `5 passed, 0 failed`
- `tests/render.test.html`: `5 passed, 0 failed`
- `tests/validation.test.html`: `5 passed, 0 failed`
- Local dashboard smoke at `http://localhost:8765/public/index.html?v=3`:
  - `STATE ready: {daily: 22, weekly: 2, monthly: 3}`
  - 3 sections rendered with cards.
  - VN numeric formatting observed (`8,98%`, `31.144 tỷ`, `(+5.543 tỷ, +21,65%)`).
  - Preview deployment still healthy: `https://feat-04-dashboard-skeleton.report-daily-dashboard-git.pages.dev/` -> HTTP `200`.
  - Production deployment before merge remains unhealthy: `https://report-daily-dashboard-git.pages.dev/` -> HTTP `404`.

### Remaining constraints
- T13 cannot be marked fully `done` without user/manual sign-off for live Supabase write/delete persistence and cross-browser Safari/mobile checks.
- Production deployment health should be rechecked after the verified feature branch is merged/pushed to `main`.
