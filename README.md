# SSI Dashboard

Live dashboard replacing the old `report.py` Excel-to-HTML workflow.

## Status
In active development. See `plan/MASTER.md` for the implementation plan
and `plan/log.md` for live progress.

## Quickstart
The dashboard app is not complete yet. The target runtime is:

1. Open `public/index.html` in any modern browser.
2. To edit data: click `Nhap lieu` on a section, enter password.

## Architecture
- Cloudflare Pages serves `public/` as a static site.
- Supabase Postgres holds 3 tables: daily, weekly, monthly.
- Vanilla JS handles compute and rendering in the browser.

## Supabase setup
1. Run `supabase_schema.sql` in the Supabase SQL Editor.
2. Copy `.env.example` to `.env` and fill in your project URL and anon key.
3. Migrate Excel data by pasting `A2:AQ<lastrow>` from each workbook into the matching table.
4. Keep percentage values as decimals such as `0.0852`, not `8.52`.

## deprecated/
Old Python report tool (`report.py`, `export_pdf.ps1`, and related assets)
is copied here for reference. Treat it as read-only.

## Plan / Tasks
The implementation plan, task contracts, and live execution log live in
`plan/`. Read `plan/CONTEXT.md` before working on a task.
