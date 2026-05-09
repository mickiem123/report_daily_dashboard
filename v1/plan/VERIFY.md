# VERIFY — End-to-End Integration

> Final task. Run AFTER T01-T12 are all `done` in log.md.
> READ-ONLY. Report results in log.md T13 entry.

## Goal
Confirm the full system works as a coherent product: data flows from Supabase → fetched on load → computed → rendered as cards → editable via grid → writes back to Supabase → cards re-render. Match the experience to the original Python report's output, plus the new pending features.

## Pre-conditions
- [ ] All 12 prior tasks marked `done` in log.md.
- [ ] Production Cloudflare Pages URL is live and points to latest `main`.
- [ ] Supabase has at least 22 rows in `daily_metrics` (so trend / outlier detection runs).
- [ ] At least 1 row each in `weekly_metrics` and `monthly_metrics`.
- [ ] `.env` filled, `config.js` has correct URL + anon key.
- [ ] User has the password (`123`).

## Verification Checklist

### A. Unit test pages all green
Open each in browser; expect "N passed, 0 failed":
- [ ] `tests/compute.test.html`
- [ ] `tests/extractors.test.html`
- [ ] `tests/render.test.html`
- [ ] `tests/validation.test.html`

### B. Static dashboard render (read path)
On the production URL (or latest preview):
- [ ] Page loads in < 3s on a normal connection.
- [ ] No console errors.
- [ ] All 3 sections (`#daily`, `#weekly`, `#monthly`) visible with their period labels.
- [ ] Each section shows up to 6 product cards (HOSE, Margin, Phái sinh, SCASH, SFUND, Mở mới).
- [ ] Cards sorted: tăng → giữ nguyên → giảm.
- [ ] Within each bucket, fixed priority: HOSE → Margin → Phái sinh → SCASH → SFUND → Mở mới.
- [ ] Each card has: trend emoji, name, verb badge (correctly colored), headline metric, pinned metrics, "Xem chi tiết" toggle.
- [ ] Click "Xem chi tiết" → details expand smoothly, click again → collapse.
- [ ] Margin card details show an **M+** group label with indented sub-metrics.
- [ ] Phái sinh card details show a **D+** group label with indented sub-metrics.
- [ ] In Phái sinh's D+ group, the "KH cancel D+" metric: a positive delta value is rendered with the **down/red** color (inverse), a negative delta with up/green.
- [ ] Numeric formatting matches Python output style (e.g., `1.234,5 tỷ`, `8,52%`).
- [ ] Trend emojis visible where applicable (📈 / 📉 / 🔴 / blank).

### C. Refresh flow
- [ ] Click "↻ Tải lại" on Daily → confirm dialog appears.
- [ ] Click OK → loading state → re-renders within ~2s.
- [ ] Click Cancel on the confirm → no fetch happens.
- [ ] Click button twice within 5s → second click ignored (debounced).
- [ ] Block network in DevTools, click refresh → error message displayed, page not broken.

### D. Auth + grid
- [ ] Click "⊞ Nhập liệu" on Daily without prior auth → password prompt.
- [ ] Enter wrong password → "Sai mật khẩu" alert → grid stays hidden.
- [ ] Enter `123` → grid appears below cards.
- [ ] Click "⊞ Nhập liệu" again on Daily → grid toggles closed (no second password prompt).
- [ ] Open Weekly's grid → password prompt appears (per-section auth).
- [ ] First column "Ngày" frozen on left (visible while scrolling horizontally).
- [ ] Header row frozen on top (visible while scrolling vertically).
- [ ] Empty row visible at bottom of grid.
- [ ] Reload the page → grid stays closed by default; opening prompts password again (sessionStorage may or may not persist depending on browser session — verify behavior matches expectation).

### E. Cell validation (in grid)
- [ ] Type letters in any numeric cell → red border + tooltip "Phải là số" → cell value reverts on blur.
- [ ] Type `2` in `thi_phan_co_so` (which expects 0–1 decimal) → yellow border + tooltip about percent range.
- [ ] Type `-5` in a count column (e.g., `slkh_margin`) → yellow border + tooltip "Không thể âm".
- [ ] Type a value 50× larger than recent history in a stable column → orange border + tooltip showing z value > 3.
- [ ] Empty cell → no warning border (nulls allowed).
- [ ] Bad date format in `ngay` (e.g., `15/9/2024`) → red border + tooltip "Định dạng YYYY-MM-DD".

### F. CRUD save flow
- [ ] Edit a numeric cell on an existing row → wait 1 second → check Supabase Table Editor in another tab → value updated.
- [ ] Same edit → wait 1s → corresponding card on the dashboard updates its delta value.
- [ ] Spam-edit one cell 5 times within 1s → DevTools Network tab shows only **1** PATCH/POST to Supabase (debounce confirmed).
- [ ] Click "+ Thêm dòng" → empty row at bottom.
- [ ] Type tomorrow's date in `ngay` + a numeric value → wait 1s → row appears in Supabase.
- [ ] Click 🗑 on the just-added row → confirm dialog with the date → click OK → row gone from grid + Supabase.
- [ ] Click 🗑 → click Cancel on the confirm → row stays.
- [ ] Reload page → all surviving edits persist.
- [ ] Try to save a row with empty `ngay` → alert "Cần có giá trị 'Ngày'", no Supabase write.

### G. Cards reflect writes correctly
- [ ] Edit `thi_phan_co_so` for the most recent daily row → wait 1s → HOSE card's headline value + delta + verb update accordingly.
- [ ] Edit a value to make HOSE go from "tăng" to "giảm" → after re-render, card moves position in the sort order (down to giảm bucket).

### H. Cross-browser smoke (best-effort)
- [ ] Chrome/Edge desktop: full pass on B–G above.
- [ ] Safari desktop: best-effort spot check on B + D + F.
- [ ] Mobile (any browser): page loads and is at least readable (responsive layout is best-effort, not required to be perfect).

### I. Git & deployment workflow sanity
- [ ] `main` branch on Cloudflare Pages production URL is the latest commit.
- [ ] A test feature branch push produces a preview URL within ~1 minute.
- [ ] PRs from feature branches to `main` show preview link in the GitHub PR description (Cloudflare comment) or in checks.

### J. Repo hygiene
- [ ] `deprecated/` contains the old Python tool, untouched.
- [ ] `.gitignore` excludes `.env`, `node_modules`, `*.pyc`.
- [ ] `README.md` accurate: quickstart works for a fresh teammate cloning the repo.
- [ ] `supabase_schema.sql` runs cleanly on a fresh Supabase project.
- [ ] `.env.example` has all required keys with placeholder values.

## Failure Handling
If any check above fails:
1. Append an entry to log.md `## Decisions Log`:
   ```
   T13 FAIL: <which check> — <what was observed> — <hypothesized cause>
   ```
2. Set T13 Status = `failed`, Esc = Y.
3. Do NOT silently re-run; the planner will diagnose and issue a fix-forward task (per fix-forward policy).

## Sign-off
When ALL boxes above are checked:
- [ ] User has personally clicked through the dashboard.
- [ ] User has personally edited a row, reloaded, and confirmed persistence.
- [ ] User has personally deleted a row, reloaded, and confirmed deletion.
- [ ] User updates log.md T13 entry: Status = `done`, Confidence = HIGH.
- [ ] User updates MASTER.md Status: PLANNING → COMPLETE.

## Out of Scope for This Verify
- Performance / load testing
- Penetration testing of the password gate (it's known weak by design)
- Mobile responsive perfection
- Real-time multi-user concurrency
- Supabase backup / restore drill
