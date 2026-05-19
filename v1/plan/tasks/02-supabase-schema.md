# Task 02: Supabase schema + data migration

> Depends on: 01
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Set up the Supabase database (3 tables) and provide the user with clear, copy-pasteable SQL plus a step-by-step guide for migrating their existing Excel data into Supabase via the Table Editor.

## Success Criteria
- [ ] `supabase_schema.sql` exists at repo root with full schema for all 3 tables.
- [ ] All 3 tables (`daily_metrics`, `weekly_metrics`, `monthly_metrics`) created in user's Supabase project.
- [ ] Each table has 43 numeric columns + `id` + `ngay` (UNIQUE) + `pushed_at`.
- [ ] Row Level Security policies grant public SELECT to all 3 tables.
- [ ] User has pasted historical data from `daily_data.xlsx`, `weekly_data.xlsx`, `monthly_data.xlsx` into corresponding Supabase tables.
- [ ] Sanity check: `select count(*) from daily_metrics;` returns ≥ 22 rows.
- [ ] User has recorded `SUPABASE_URL` and `SUPABASE_ANON_KEY` in a local `.env` file (gitignored).
- [ ] `.env.example` committed showing required keys (with placeholders).

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T01 done — `ssi-dashboard/` repo exists with empty `public/` folder.
- [ ] User confirms they have access to `daily_data.xlsx`, `weekly_data.xlsx`, `monthly_data.xlsx` on their machine.
- [ ] Supabase MCP server is connected and usable (or executor is prepared to give user manual SQL Editor instructions).

### Post-conditions (verify after completing)
- [ ] `supabase_schema.sql` committed at repo root.
- [ ] `.env.example` committed at repo root.
- [ ] Supabase project exists; URL + anon key recorded in `.env` (NOT committed).
- [ ] All 3 tables visible in Supabase Table Editor.
- [ ] `select count(*)` ≥ 22 on `daily_metrics` (or user-confirmed minimum data present).
- [ ] At least 1 row in `weekly_metrics` and `monthly_metrics` (user may have less history; just confirm the path works).

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `supabase_schema.sql` (create)
- `.env.example` (create)
- `.env` (NOT committed — user creates locally; executor may write template if user wants)
- `README.md` (append a "Supabase setup" section pointing to schema + env steps)

**Files NOT to touch:**
- Anything inside `deprecated/`.
- Anything inside `public/` (T04 handles that).

## Steps

### Step 1: Write `supabase_schema.sql`
Create `supabase_schema.sql` at repo root with the following content. Schema details come from `deprecated/MAINTENANCE.md` column reference.

```sql
-- SSI Dashboard — Supabase schema
-- Run this entire file in Supabase SQL Editor (one shot).

-- Drop existing if re-running (DESTRUCTIVE — comment these 3 lines if data already in place)
DROP TABLE IF EXISTS daily_metrics   CASCADE;
DROP TABLE IF EXISTS weekly_metrics  CASCADE;
DROP TABLE IF EXISTS monthly_metrics CASCADE;

CREATE TABLE daily_metrics (
    id                      SERIAL PRIMARY KEY,
    ngay                    DATE NOT NULL UNIQUE,
    thi_phan_co_so          NUMERIC,
    thi_phan_cn             NUMERIC,
    thi_phan_ds             NUMERIC,
    gtgd_cs_ssi             NUMERIC,
    thanh_khoan_ttcs        NUMERIC,
    tong_du_no_margin       NUMERIC,
    slkh_margin             NUMERIC,
    du_no_t7                NUMERIC,
    slkh_t7                 NUMERIC,
    du_no_trading_plus      NUMERIC,
    slkh_trading_plus       NUMERIC,
    slkh_register_mplus     NUMERIC,
    slkh_active_mplus       NUMERIC,
    du_no_mplus             NUMERIC,
    slkh_co_du_no_mplus     NUMERIC,
    giai_ngan_mplus         NUMERIC,
    slkh_giai_ngan_mplus    NUMERIC,
    du_no_ssi_deprecated    NUMERIC,
    du_no_spv               NUMERIC,
    ty_trong_spv            NUMERIC,
    thi_phan_phai_sinh      NUMERIC,
    thanh_khoan_tt_ps       NUMERIC,
    slhd_ps_deprecated      NUMERIC,
    slkh_ps                 NUMERIC,
    slhd_dplus_deprecated   NUMERIC,
    ty_le_slhd_dplus        NUMERIC,
    slkh_dplus              NUMERIC,
    ty_le_slkh_dplus        NUMERIC,
    kh_cancel_dplus         NUMERIC,
    kh_register_dplus       NUMERIC,
    kh_giu_qua_dem          NUMERIC,
    kh_sd_dplus             NUMERIC,
    slhd_giu_qua_dem        NUMERIC,
    du_no_dplus_giai_ngan   NUMERIC,
    du_no_dplus_cuoi_ngay   NUMERIC,
    so_du_scash             NUMERIC,
    so_du_casa_scash        NUMERIC,
    ty_le_scash_casa        NUMERIC,
    slkh_scash              NUMERIC,
    so_du_sfund             NUMERIC,
    slkh_sfund              NUMERIC,
    slkh_mo_moi             NUMERIC,
    pushed_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_metrics  (LIKE daily_metrics INCLUDING ALL);
CREATE TABLE monthly_metrics (LIKE daily_metrics INCLUDING ALL);

-- LIKE...INCLUDING ALL copies the unique-index name; we must rename to avoid collision.
ALTER INDEX daily_metrics_ngay_key   RENAME TO daily_metrics_ngay_key_orig;
ALTER TABLE weekly_metrics  DROP CONSTRAINT IF EXISTS daily_metrics_ngay_key;
ALTER TABLE weekly_metrics  ADD  CONSTRAINT weekly_metrics_ngay_key  UNIQUE (ngay);
ALTER TABLE monthly_metrics DROP CONSTRAINT IF EXISTS daily_metrics_ngay_key;
ALTER TABLE monthly_metrics ADD  CONSTRAINT monthly_metrics_ngay_key UNIQUE (ngay);
ALTER INDEX daily_metrics_ngay_key_orig RENAME TO daily_metrics_ngay_key;

-- Enable RLS, public read only.
ALTER TABLE daily_metrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_daily"   ON daily_metrics   FOR SELECT USING (true);
CREATE POLICY "public_read_weekly"  ON weekly_metrics  FOR SELECT USING (true);
CREATE POLICY "public_read_monthly" ON monthly_metrics FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE policies — also public for now (gated by JS password only).
-- TODO: tighten to authenticated-only when adding Supabase Auth (post-MVP).
CREATE POLICY "public_write_daily"   ON daily_metrics   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_write_weekly"  ON weekly_metrics  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_write_monthly" ON monthly_metrics FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ STOP gate: if the `LIKE ... INCLUDING ALL` constraint-renaming doesn't work cleanly in user's Supabase Postgres version, fall back to writing each `CREATE TABLE` longhand (43 cols × 3) and report in log.md.

### Step 2: Write `.env.example`
```
# Copy this file to `.env` and fill in real values.
# `.env` is gitignored.
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
WRITE_PASSWORD=123
```

### Step 3: User runs schema in Supabase
Block here. Append to log.md T02 entry:
```
USER ACTION REQUIRED:
1. Create a Supabase project at https://supabase.com (free tier).
2. Open the SQL Editor in the Supabase dashboard.
3. Copy ALL contents of `ssi-dashboard/supabase_schema.sql`.
4. Paste into SQL Editor, click "Run".
5. Confirm 3 tables appear in Table Editor: daily_metrics, weekly_metrics, monthly_metrics.
6. Go to Project Settings → API → copy:
     - Project URL  → paste into ssi-dashboard/.env  as SUPABASE_URL=
     - anon public key → paste as SUPABASE_ANON_KEY=
7. Reply "schema done" so the executor can proceed.
```

### Step 4: User pastes Excel data into Supabase
Once user confirms schema is in place, give this guide. Append to log.md T02 entry:
```
USER ACTION REQUIRED — Migrate Excel data:

For EACH of the 3 Excel files (daily_data.xlsx, weekly_data.xlsx, monthly_data.xlsx):

A. Open the .xlsx file in Excel.
B. Select all data ROWS (skip header row 1) — i.e., A2:AQ<lastrow>.
   Note: AQ = column 43, the SLKH mở mới column.
C. Copy (Ctrl+C).
D. In Supabase, go to Table Editor → open the matching table:
     daily_data.xlsx   → daily_metrics
     weekly_data.xlsx  → weekly_metrics
     monthly_data.xlsx → monthly_metrics
E. Click "Insert" → "Insert rows" (or paste icon, depending on UI version).
   If a paste-from-clipboard option is unavailable, use "Insert" → "Insert row"
   one at a time and paste cell-by-cell (slow), OR ask the executor to write a
   one-time bulk-import Python script (fallback).
F. Date column ('ngay'): Supabase expects YYYY-MM-DD. If Excel shows DD/MM/YYYY,
   reformat the column in Excel before pasting (Format Cells → Custom →
   yyyy-mm-dd).
G. Percentage columns: leave as decimals (e.g., 0.0852, NOT 8.52). The
   dashboard multiplies ×100 for display.
H. After paste, run:
     select count(*) from daily_metrics;
   to confirm row count matches Excel.

If anything breaks, paste the error into log.md and the executor will write a
fallback bulk-import script.
```

### Step 5: Append README setup section
Add to `README.md`:
```markdown
## Supabase setup

1. Run `supabase_schema.sql` in Supabase SQL Editor.
2. Copy `.env.example` to `.env` and fill in your project URL + anon key.
3. Migrate Excel data by pasting into Supabase Table Editor (see plan/tasks/02-supabase-schema.md for details).
```

### Step 6: Commit
```bash
git add supabase_schema.sql .env.example README.md
git commit -m "feat: supabase schema + env example"
git push  # to feat/02-supabase-schema branch (then PR to main per CONTEXT workflow)
```

## Verification
```bash
# Local file checks:
ls supabase_schema.sql .env.example
grep -c "CREATE TABLE" supabase_schema.sql                   # expect ≥ 1 (the daily one; others use LIKE)
grep "ENABLE ROW LEVEL SECURITY" supabase_schema.sql | wc -l # expect 3
```
In Supabase SQL Editor (user runs):
```sql
select count(*) from daily_metrics;     -- expect ≥ 22 ideally
select count(*) from weekly_metrics;    -- expect ≥ 1
select count(*) from monthly_metrics;   -- expect ≥ 1
select * from daily_metrics order by ngay desc limit 3;  -- spot-check values look right
```

## When to STOP and ASK (Think Before Coding — Principle 1)
- `LIKE ... INCLUDING ALL` constraint trick fails in user's Postgres version → ask before writing 3× longhand.
- User reports paste truncates / mangles data → ask before writing fallback import script (vs. them retrying with smaller batches).
- User wants different table names than `daily_metrics` / `weekly_metrics` / `monthly_metrics` → ask, then propagate everywhere.
- User asks to skip RLS entirely → STOP. RLS is a sane default. Push back; only relax with explicit confirmation.

## After Completion
Update log.md T02 entry:
- Files changed: `supabase_schema.sql`, `.env.example`, `README.md`
- Tests: row counts confirmed in Supabase
- Unplanned changes: any (e.g., needed bulk-import fallback)
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if user confirms data pasted clean; LOW if any column mismatch
- Set Status = `review` once user confirms data migration done
