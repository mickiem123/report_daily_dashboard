# Task 08: 3-section page layout (daily / weekly / monthly stacked)

> Depends on: 07
> Estimated complexity: S
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Glue everything together: `main.js` runs all 6 extractors against `STATE.daily`, sorts, renders, injects into `#daily`. Repeat for weekly and monthly. Final visual: one scrollable page, three stacked sections, each with sorted product cards.

## Success Criteria
- [ ] `main.js` updated to call extractors → sort → render → inject for each section.
- [ ] Page shows 3 sections, each with up to 6 product cards rendered correctly.
- [ ] Cards sorted tang/giu/giam per priority order.
- [ ] Section headers display the period (date for daily, week range for weekly, month for monthly) — pulled from `today.ngay`.
- [ ] If a section has 0 rows, show "Chưa có dữ liệu" placeholder. Don't crash.
- [ ] No console errors.
- [ ] Production preview URL renders the full dashboard.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T07 done — `window.render` works.
- [ ] All earlier modules load via index.html script tags (verify order: supabase → config → compute → extractors → render → main).
- [ ] `window.STATE` populates from T04 fetch.

### Post-conditions (verify after completing)
- [ ] Visiting preview URL: 3 sections, cards rendered, no console errors.
- [ ] Manual click on "Xem chi tiết" toggles details (T07 already wired this).
- [ ] Dark theme + dark cards visible.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/main.js` (replace placeholder render with real card rendering)
- `public/index.html` (minor — add `<header>` for each section if not present, ensure section data attributes)
- `public/assets/style.css` (extend if needed for section layout)

**Files NOT to touch:**
- `compute.js`, `extractors.js`, `render.js`.
- `deprecated/`.

## Steps

### Step 1: Update `main.js` render path
Replace the placeholder block:
```js
// OLD (T04):
sections.forEach((s) => {
  const el = document.querySelector(`#${s} .content`);
  if (!el) return;
  el.innerHTML = `<p class="placeholder">${rows.length} rows loaded.</p>`;
});

// NEW (T08):
sections.forEach(renderSection);
```

Add new function:
```js
const PRODUCT_FNS = ["hose", "margin", "phaisinh", "scash", "sfund", "momoi"];

function renderSection(mode) {
  const el = document.querySelector(`#${mode} .content`);
  if (!el) return;
  const rows = window.STATE[mode] || [];
  if (rows.length < 1) {
    el.innerHTML = '<p class="placeholder">Chưa có dữ liệu.</p>';
    return;
  }
  const today = rows[rows.length - 1];
  const prev  = rows.length >= 2 ? rows[rows.length - 2] : null;

  // Update section header date
  const headerEl = document.querySelector(`#${mode} .period-label`);
  if (headerEl && today.ngay) headerEl.textContent = formatPeriod(mode, today.ngay);

  const products = PRODUCT_FNS.map(fn => window.extractors[fn](today, prev, rows));
  const sorted = window.render.sortProducts(products);
  el.innerHTML = sorted.map((p, i) => window.render.card(p, i)).join("");
}

function formatPeriod(mode, ngay) {
  // ngay is YYYY-MM-DD
  if (mode === "daily") return ngay;          // e.g., "2026-05-08"
  if (mode === "weekly") return `Tuần kết thúc ${ngay}`;
  if (mode === "monthly") return ngay.slice(0, 7); // "2026-05"
  return ngay;
}
```

### Step 2: Update `index.html`
Each section needs a header subtitle to show the period:
```html
<section id="daily" data-mode="daily">
  <header class="section-header">
    <h2>Báo cáo ngày <span class="period-label">…</span></h2>
    <div class="section-actions"></div>
  </header>
  <div class="content"><div class="loading">…</div></div>
</section>

<section id="weekly" data-mode="weekly">
  <header class="section-header">
    <h2>Báo cáo tuần <span class="period-label">…</span></h2>
    <div class="section-actions"></div>
  </header>
  <div class="content"><div class="loading">…</div></div>
</section>

<section id="monthly" data-mode="monthly">
  <header class="section-header">
    <h2>Báo cáo tháng <span class="period-label">…</span></h2>
    <div class="section-actions"></div>
  </header>
  <div class="content"><div class="loading">…</div></div>
</section>
```

### Step 3: Style adjustments
Add to `style.css`:
```css
.section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
.section-header h2 { display: flex; align-items: baseline; gap: 8px; }
.period-label { color: var(--text-muted); font-size: 14px; font-weight: normal; }
.content { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
@media (max-width: 768px) { .content { grid-template-columns: 1fr; } }
```

### Step 4: Manual smoke test locally
```bash
python -m http.server 8000 -d public/
```
Open `http://localhost:8000`:
- 3 sections visible.
- Each shows 6 cards (or fewer if some products unavailable).
- Cards in sorted order.
- Click "Xem chi tiết" → details expand smoothly.
- No console errors.

### Step 5: Commit + push + verify preview
```bash
git checkout -b feat/08-page-layout
git add public/
git commit -m "feat(layout): wire 3-section page with full card rendering"
git push -u origin feat/08-page-layout
```
Verify Cloudflare preview URL renders identically.

## Verification
- Visit preview URL → 3 sections, cards visible.
- Inspect `window.STATE` and confirm `daily.length >= 1`.
- Console: no errors.
- Click "Xem chi tiết" on Margin card → M+ group visible.
- Click on Phái sinh → D+ group visible. Cancel D+ metric color flips correctly.

## When to STOP and ASK (Think Before Coding — Principle 1)
- A section has 0 rows → render placeholder, don't crash. Confirm placeholder copy with user if unclear.
- Sort returns unexpected order → check `verb` field shape from extractors. Don't tweak sort silently.
- Layout looks broken on user's screen size → ask before adding complex responsive rules.

## After Completion
Update log.md T08 entry:
- Files changed: list
- Tests: manual visual smoke test
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if all 3 sections render correctly
- Set Status = `review`
