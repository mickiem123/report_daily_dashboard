# Task 09: Refresh button + daily auto-refresh

> Depends on: 08
> Estimated complexity: S
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Add a "Tải lại" (Refresh) button to each section. Manual click → confirm dialog → re-fetch + re-render. On page load, check if today's date differs from last refresh date; if so, auto-refresh once silently.

## Success Criteria
- [ ] Each section has a "Tải lại" button in `.section-actions`.
- [ ] Click → `confirm("Tải lại dữ liệu? Có thể mất vài giây.")` → if Yes, re-fetch that section's table + re-render that section.
- [ ] Debounce: button disabled for 5s after a successful refresh (prevent double-click overload).
- [ ] On page load: read `localStorage.lastRefreshDate`. If different from today's `YYYY-MM-DD` → silently call `loadAll()` once → write today to localStorage.
- [ ] Refresh failures: show error in section content + restore the previous content if it existed (no permanent breakage).

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T08 done — full dashboard renders.
- [ ] `loadAll()` and `renderSection()` exist in `main.js`.

### Post-conditions (verify after completing)
- [ ] Click button → confirm appears → click OK → loading state → content refreshes.
- [ ] Click Cancel → no action.
- [ ] Spam-click within 5s of last refresh → button disabled visually.
- [ ] Open DevTools → Application → localStorage → see `lastRefreshDate` set after first load.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/main.js` (add refreshSection, autoRefreshIfStale)
- `public/index.html` (add buttons inside each `.section-actions`)
- `public/assets/style.css` (button disabled state)

**Files NOT to touch:**
- Other JS modules. Refresh logic stays in main.js.

## Steps

### Step 1: Add refresh button HTML
In each `.section-actions` div in `index.html`:
```html
<button class="btn-refresh" data-mode="daily" onclick="window.refresh('daily')">↻ Tải lại</button>
```
Repeat for weekly and monthly with respective `data-mode`.

### Step 2: Implement refresh in `main.js`
```js
const REFRESH_DEBOUNCE_MS = 5000;
const lastRefreshAt = { daily: 0, weekly: 0, monthly: 0 };

async function refreshSection(mode) {
  const now = Date.now();
  if (now - lastRefreshAt[mode] < REFRESH_DEBOUNCE_MS) {
    return; // debounced, ignore silently
  }
  if (!confirm("Tải lại dữ liệu? Có thể mất vài giây.")) return;

  const btn = document.querySelector(`.btn-refresh[data-mode="${mode}"]`);
  if (btn) { btn.disabled = true; btn.textContent = "Đang tải…"; }

  const el = document.querySelector(`#${mode} .content`);
  const prevHtml = el ? el.innerHTML : null;
  if (el) el.innerHTML = '<div class="loading">Đang tải…</div>';

  try {
    const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const rows = await fetchTable(client, TABLES[mode]);
    window.STATE[mode] = rows;
    renderSection(mode);
    lastRefreshAt[mode] = Date.now();
  } catch (err) {
    console.error("refresh failed:", err);
    if (el) el.innerHTML = `<div class="error">Lỗi: ${err.message || err}</div>` + (prevHtml ? `<div style="margin-top:12px">${prevHtml}</div>` : "");
  } finally {
    if (btn) {
      setTimeout(() => { btn.disabled = false; btn.textContent = "↻ Tải lại"; }, REFRESH_DEBOUNCE_MS);
    }
  }
}

window.refresh = refreshSection;

function autoRefreshIfStale() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const last = localStorage.getItem("lastRefreshDate");
  if (last !== today) {
    // Update localStorage AFTER successful loadAll to avoid flapping on errors
    loadAll().then(() => localStorage.setItem("lastRefreshDate", today));
  }
}
```

Modify the bottom of `main.js`:
```js
// Replace direct loadAll() call:
// document.addEventListener("DOMContentLoaded", loadAll);
// with:
document.addEventListener("DOMContentLoaded", () => {
  loadAll().then(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lastRefreshDate", today);
  });
});
```

> Note: the simpler version unconditionally fetches on every page load. The "auto-refresh once per day" is conceptually only useful if we cached data in `localStorage` and skipped fetch on same-day reload. Per CONTEXT.md, we always fetch on load (cheap, ~3 small queries). So the auto-daily logic mostly degenerates to "always fetch once on open". Keep the localStorage write as a marker for future use (e.g., showing "last updated" label).

> ⚠️ Re-read user requirement Q13/Q28: "refresh daily" + "manual refresh w/ confirmation". Auto-fetch on every page open already satisfies "team always sees latest when opening". Manual button covers in-session refresh. Confirm with user in log.md if any ambiguity remains.

### Step 3: CSS for disabled state
Add to `style.css`:
```css
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
```

### Step 4: Manual test
- Open dashboard → wait for load.
- Click "↻ Tải lại" on Daily → confirm dialog → OK → loading → re-render.
- Click again immediately → should be disabled with "Đang tải…" or no response.
- Wait 5s+ → click again → works.
- Click Cancel → nothing happens.

### Step 5: Commit + push
```bash
git checkout -b feat/09-refresh
git add public/
git commit -m "feat(refresh): per-section refresh button with debounce + auto-load"
git push -u origin feat/09-refresh
```

## Verification
- Click → confirm → reload visible.
- Spam click → debounced.
- Cancel → no fetch.
- Failure case (block network in DevTools) → error shows, page not broken.

## When to STOP and ASK (Think Before Coding — Principle 1)
- The "auto-daily" requirement (Q13) is interpreted as a marker only (since we fetch on every page open anyway). Confirm in log.md before deviating.
- User wants different button text or location → ask, don't guess.

## After Completion
Update log.md T09 entry:
- Files changed: list
- Tests: manual click + debounce confirmed
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if button works
- Set Status = `review`
