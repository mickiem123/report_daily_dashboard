# SSI Dashboard Pivot — Master Plan

> Generated: 2026-05-08
> Status: PLANNING

## Goal
Pivot the SSI report tool from a Python-generated static HTML emailed via Teams into a live online dashboard at `report-daily.pages.dev` where teammates view real-time data and a designated user(s) edit rows directly in an Excel-like grid.

## Architecture
- **DB:** Supabase Postgres, 3 tables (`daily_metrics`, `weekly_metrics`, `monthly_metrics`), identical schema, `ngay` is unique key per table.
- **Frontend:** single-page static HTML deployed to Cloudflare Pages. Vanilla JS (no framework). Fetches all 3 tables on load, renders 3 stacked sections (daily → weekly → monthly).
- **Compute:** all delta/trend/anomaly logic runs in browser JS (port from Python `report.py`).
- **Input:** Tabulator grid revealed by a button per section. Excel-like editing, upserts to Supabase. Shared password (`123`) gates write access.
- **Hosting:** Cloudflare Pages connected to GitHub repo. Push to feature branch = preview URL. Merge to `main` = live URL.
- **Old code:** `report.py` + `export_pdf.ps1` + assets moved to `deprecated/` (kept for reference, not deleted).

## Tech Stack
- Supabase (Postgres + REST + JS client `@supabase/supabase-js@2.x`)
- Tabulator `6.3.x` (grid library, MIT licensed, bundled locally)
- Vanilla JS ES2022, no React/Vue/build step
- Cloudflare Pages (static hosting)
- Git + GitHub
- MCP servers assumed available: Supabase MCP, Cloudflare/Vercel MCP

## Dependency Graph
```
01-repo-init → 02-supabase-schema → 03-cloudflare-deploy
                       ↓
                 04-dashboard-skeleton
                       ↓
                 05-compute-layer
                       ↓
                 06-product-extractors
                       ↓
                 07-card-render
                       ↓
                 08-page-layout
                       ↓
              ┌────────┴────────┐
        09-refresh-flow   10-input-grid
                                 ↓
                          11-validation
                                 ↓
                          12-crud-flow
                                 ↓
                          VERIFY (T13)
```

## Task Index
| # | Task | Depends On | Status |
|---|------|------------|--------|
| 01 | Repo init + folder structure + deprecate old code | none | TODO |
| 02 | Supabase schema + data migration guide | 01 | TODO |
| 03 | Cloudflare Pages connection + git workflow | 01 | TODO |
| 04 | Dashboard HTML skeleton + Supabase fetch | 02, 03 | TODO |
| 05 | JS compute layer (port Python utilities) | 04 | TODO |
| 06 | JS product extractors (6 products) | 05 | TODO |
| 07 | Card rendering w/ groups + inverse color | 06 | TODO |
| 08 | 3-section page layout (daily/weekly/monthly stacked) | 07 | TODO |
| 09 | Refresh button + daily auto-refresh | 08 | TODO |
| 10 | Input grid (Tabulator + password gate) | 08 | TODO |
| 11 | Cell validation (z-score + type + rules) | 10 | TODO |
| 12 | Add/edit/delete row + Supabase upsert | 11 | TODO |
| 13 | VERIFY — end-to-end integration test | all | TODO |

## Decisions Log
- **Cloudflare Pages over Vercel** — already live at `report-daily.pages.dev`, no SSR needed, no migration cost. Vercel rejected: no advantage for static-only.
- **Vanilla JS over React/Vue** — no build step, single HTML file, easier hosting + debugging. Tradeoff: more verbose code, accepted.
- **Tabulator over Handsontable** — MIT license (Handsontable is commercial), Excel-like UX, ~50KB bundle. AG Grid rejected: heavier, more setup.
- **Drop ApexCharts** — chart modal deprecated per user, no one uses it. Removes 200KB asset.
- **Browser-side compute over Edge Function** — no server, instant updates, ports cleanly from Python. Tradeoff: 22 rows × 3 tables fetched every page load. Acceptable size (<100KB JSON).
- **Shared password `123` for write** — Q20 option A. Stops bots/randoms. Upgrade to Supabase Auth later if needed.
- **`ngay` (date) as unique key** — natural key, prevents duplicate rows per period, enables clean upsert.
- **Public read RLS, password-only write JS** — read uses anon key with public SELECT policy. Write also uses anon key but JS gates the call behind password prompt. (NOT cryptographically secure; deters casual abuse only.)
- **JS port over Python keep + API** — user voted "easiest". Single language frontend = simpler.
- **All 22 rows pushed to Supabase per table** — needed for trend detection (3-day streak) and anomaly detection (z-score over 20-day history).
- **Inline cell edit, debounced save** — 1-second debounce on blur, upsert on `ngay`. Last-write-wins for concurrent edits (acceptable for ~3 person team).
- **Soft confirm on delete** — Q37, JS `confirm()` dialog before DELETE call. No undo / soft-delete column (kept simple).
- **No edit audit trail** — Q38, no `updated_by` / `updated_at` audit columns.
- **% columns stored as decimals (0.0852)** — matches existing Excel storage. Display formatted as `8.52%`. User types `8.52` in grid → JS converts to `0.0852` on save.

## Out of Scope
- Per-user authentication (only shared password for now)
- Edit history / audit log
- Soft delete / undo
- Real-time collaboration (multi-cursor / live updates between users)
- Chart modal (ApexCharts) — deprecated
- PDF/PNG export — deprecated for online version (PowerShell script kept in `deprecated/` for offline use if needed)
- Mobile responsive layout (desktop-first; if it works on mobile bonus)
- i18n switching (Vietnamese only)
- Backend API / Edge Functions
- Migration from Cloudflare to Vercel
- Local report.py modifications (frozen, moved to deprecated/)

## User Manual Steps Required
The executor cannot do these — flag clearly in log.md when blocked on user action:
1. Create Supabase project (free tier) → record URL + anon key in `.env.example`
2. Run `supabase_schema.sql` in Supabase SQL Editor
3. Open Supabase Table Editor → paste data from each Excel file into corresponding table
4. Create new GitHub repo + push initial commit (executor can scaffold but user pushes/auths)
5. Connect Cloudflare Pages to GitHub repo via Cloudflare dashboard
