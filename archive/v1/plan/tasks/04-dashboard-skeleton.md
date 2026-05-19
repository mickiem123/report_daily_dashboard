# Task 04: Dashboard skeleton + Supabase fetch

> Depends on: 02, 03
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Create the static HTML scaffold (`public/index.html`), wire in Supabase JS client, fetch the last 22 rows from each of the 3 tables on page load, and store them in `window.STATE` for downstream tasks. No card rendering yet — just confirm the data plumbing works end to end.

## Success Criteria
- [ ] `public/index.html` exists, renders a basic dark-themed page with 3 placeholder sections (`#daily`, `#weekly`, `#monthly`).
- [ ] On page load, the Supabase JS client fetches last 22 rows (ordered by `ngay` descending, then reversed to ascending) from each table.
- [ ] `window.STATE = { daily: [...], weekly: [...], monthly: [...] }` populated after fetch.
- [ ] Loading state visible during fetch, error state visible on failure.
- [ ] Browser console shows `STATE ready: { daily: <n>, weekly: <n>, monthly: <n> }` log on success.
- [ ] No CDN fetches at runtime — Supabase JS bundled into `public/assets/supabase.min.js`.
- [ ] Production preview URL renders without errors.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T02 done — Supabase tables exist and have at least some rows.
- [ ] T03 done — Cloudflare Pages connected.
- [ ] User has filled `.env` with real `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- [ ] Executor has fetched current Supabase JS client docs via context7 to confirm v2 API shape.

### Post-conditions (verify after completing)
- [ ] Files exist: `public/index.html`, `public/js/config.js`, `public/js/main.js`, `public/assets/supabase.min.js`.
- [ ] Opening preview URL: page loads, dark theme visible, 3 section headings visible.
- [ ] Browser DevTools network tab shows 3 successful `GET` requests to `<SUPABASE_URL>/rest/v1/<table>?...`.
- [ ] `window.STATE` defined and populated in console.
- [ ] No console errors.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/index.html` (create)
- `public/js/config.js` (create)
- `public/js/main.js` (create)
- `public/assets/supabase.min.js` (create — vendored bundle)
- `public/assets/style.css` (create — base CSS)
- `.gitignore` (only if we need to ignore something new)

**Files NOT to touch:**
- Anything inside `deprecated/`.
- `supabase_schema.sql` (already final).
- `js/compute.js`, `js/extractors.js`, `js/render.js`, `js/grid.js` — those are later tasks.

## Steps

### Step 1: Vendor the Supabase JS client
- Download `@supabase/supabase-js` v2.x UMD build to `public/assets/supabase.min.js`.
- Use the version pinned in CONTEXT.md tech stack. Source: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 (download once, commit the file — no runtime CDN).
- Verify file size is reasonable (<100KB minified).

### Step 2: Create `public/js/config.js`
```js
// Public anon key — safe to commit (RLS enforces row access).
// Production-grade auth would use Supabase Auth + JWTs; out of scope for MVP.
window.SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";
window.WRITE_PASSWORD = "123";
```
> Replace placeholders with values from `.env`. This file IS committed (anon key is public by Supabase design).

### Step 3: Create `public/assets/style.css` (base only)
Port the design tokens (CSS variables) and base body styles from `deprecated/report.py`'s `_html_shell()`.
Minimum viable for this task:
```css
:root {
  --bg-app: #07080a;
  --bg-surface: #101111;
  --text-primary: #e7e7e7;
  --text-muted: #9a9a9a;
  --accent-blue: #55b3ff;
  --accent-green: #5fc992;
  --accent-red: #ff6363;
  --accent-yellow: #ffbc33;
  --border: #1f2022;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg-app); color: var(--text-primary); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
section { padding: 24px; border-bottom: 1px solid var(--border); }
section h2 { margin: 0 0 16px; font-size: 24px; }
.section-actions { display: flex; gap: 8px; margin-bottom: 16px; }
.section-actions button { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border); padding: 8px 14px; border-radius: 6px; cursor: pointer; }
.section-actions button:hover { border-color: var(--accent-blue); }
.placeholder { color: var(--text-muted); font-style: italic; }
.loading, .error { padding: 16px; text-align: center; }
.error { color: var(--accent-red); }
.up { color: var(--accent-green); }
.down { color: var(--accent-red); }
.flat { color: var(--text-muted); }
```
> Full design system (cards, badges, etc.) ports incrementally in T07/T08. This is just enough to not look broken.

### Step 4: Create `public/js/main.js`
```js
// Entry point. Loads on page load, fetches Supabase, populates window.STATE.

const TABLES = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

const ROWS_PER_FETCH = 22;

window.STATE = { daily: [], weekly: [], monthly: [] };

async function fetchTable(client, tableName) {
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .order("ngay", { ascending: false })
    .limit(ROWS_PER_FETCH);
  if (error) throw error;
  // Reverse to chronological order so [-1] is most recent (matches Python convention).
  return (data || []).reverse();
}

async function loadAll() {
  const sections = ["daily", "weekly", "monthly"];
  sections.forEach((s) => {
    const el = document.querySelector(`#${s} .content`);
    if (el) el.innerHTML = '<div class="loading">Đang tải dữ liệu…</div>';
  });

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  try {
    const [daily, weekly, monthly] = await Promise.all([
      fetchTable(client, TABLES.daily),
      fetchTable(client, TABLES.weekly),
      fetchTable(client, TABLES.monthly),
    ]);
    window.STATE = { daily, weekly, monthly };
    console.log("STATE ready:", {
      daily: daily.length,
      weekly: weekly.length,
      monthly: monthly.length,
    });

    // Placeholder render — real cards come in T07/T08.
    sections.forEach((s) => {
      const el = document.querySelector(`#${s} .content`);
      if (!el) return;
      const rows = window.STATE[s];
      el.innerHTML = rows.length
        ? `<p class="placeholder">${rows.length} rows loaded. Card rendering coming in T08.</p>`
        : '<p class="placeholder">Chưa có dữ liệu.</p>';
    });
  } catch (err) {
    console.error("Fetch failed:", err);
    sections.forEach((s) => {
      const el = document.querySelector(`#${s} .content`);
      if (el) el.innerHTML = `<div class="error">Lỗi tải dữ liệu: ${err.message || err}</div>`;
    });
  }
}

document.addEventListener("DOMContentLoaded", loadAll);
```

### Step 5: Create `public/index.html`
```html
<!doctype html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SSI Dashboard</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <header style="padding: 24px;">
    <h1 style="margin:0">SSI Báo Cáo</h1>
    <p style="margin:4px 0 0; color: var(--text-muted);">Live dashboard</p>
  </header>

  <section id="daily">
    <h2>Báo cáo ngày</h2>
    <div class="section-actions">
      <!-- Refresh + Input buttons added in T09/T10 -->
    </div>
    <div class="content"><div class="loading">…</div></div>
  </section>

  <section id="weekly">
    <h2>Báo cáo tuần</h2>
    <div class="section-actions"></div>
    <div class="content"><div class="loading">…</div></div>
  </section>

  <section id="monthly">
    <h2>Báo cáo tháng</h2>
    <div class="section-actions"></div>
    <div class="content"><div class="loading">…</div></div>
  </section>

  <script src="assets/supabase.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### Step 6: Test locally
```bash
cd ssi-dashboard
python -m http.server 8000 -d public/
```
Open `http://localhost:8000`. Expect:
- Dark page with 3 sections.
- Each section briefly shows "Đang tải…" then "<n> rows loaded" or "Chưa có dữ liệu".
- Console shows `STATE ready: { daily: N, weekly: N, monthly: N }`.
- DevTools Network: 3 requests to Supabase, all 200.

### Step 7: Branch + commit + push + verify preview
```bash
git checkout -b feat/04-dashboard-skeleton
git add public/
git commit -m "feat(dashboard): skeleton + supabase fetch"
git push -u origin feat/04-dashboard-skeleton
```
Open the Cloudflare preview URL → verify same behavior as local. PR → merge to `main`.

## Verification
```bash
# Static checks
ls public/index.html public/js/config.js public/js/main.js public/assets/supabase.min.js public/assets/style.css
grep -q "SUPABASE_URL" public/js/config.js
grep -q "createClient" public/js/main.js
```
Browser:
- Open page → no console errors
- Check network tab → 3 Supabase REST calls succeed
- Check `window.STATE` in console → has expected shape

## When to STOP and ASK (Think Before Coding — Principle 1)
- Supabase JS v2 API has changed since CONTEXT.md docs reference (run context7 first; flag if signature differs).
- User's `.env` not filled in yet → block, instruct user.
- Network tab shows 401/403 → RLS policy issue. STOP. Verify T02 created `public_read_*` policies. Don't disable RLS without asking.
- Preview URL doesn't load JS files (404 on `/js/main.js`) → check Cloudflare build output dir is `public/`.

## After Completion
Update log.md T04 entry:
- Files changed: list
- Tests: manual (page loads, STATE populated, no errors). No unit tests yet — added in T05.
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if preview URL works
- Set Status = `review`
