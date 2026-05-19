# Task 10: Input grid (Tabulator) + password gate

> Depends on: 08
> Estimated complexity: L
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Add a "Nhập liệu" (Input) button to each section. Click → prompt password → on success, reveal an Excel-like grid (Tabulator) below the cards showing the last 20 rows + 1 empty new-entry row. Grid is editable in this task; CRUD save flow is T12.

## Success Criteria
- [ ] Tabulator v6.3.x bundled locally (`public/assets/tabulator.min.js` + `tabulator.min.css`).
- [ ] Each section has an "Nhập liệu" button.
- [ ] Click button → if no `sessionStorage.canEdit` → `prompt("Nhập mật khẩu:")` → check against `WRITE_PASSWORD` (from config.js).
- [ ] Wrong password → alert "Sai mật khẩu" → grid stays hidden.
- [ ] Correct password → store `sessionStorage.canEdit = "1"` (per-section keys: `canEdit_daily`, `canEdit_weekly`, `canEdit_monthly`).
- [ ] Grid revealed below cards. Shows last 20 rows + 1 empty row at bottom.
- [ ] First column (`ngay`) frozen on the left.
- [ ] Header row frozen on top.
- [ ] All 43 columns visible (horizontal scroll).
- [ ] Cell editing works locally (no save yet — that's T12).
- [ ] Clicking the button again after open → toggles grid visibility (does not re-prompt password if already authed).

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T08 done (full layout works).
- [ ] User has confirmed password is `123` (per Q34 / decisions log).
- [ ] Executor fetched current Tabulator v6.3 docs via context7.

### Post-conditions (verify after completing)
- [ ] Click → password prompt → grid shows.
- [ ] Frozen header + frozen `ngay` column scroll independently.
- [ ] All 43 column headers visible (with horizontal scroll).
- [ ] Empty bottom row exists.
- [ ] Cell click → enters edit mode → tab/enter advances → grid renders edit visually (save deferred to T12).

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/assets/tabulator.min.js` (vendored, create)
- `public/assets/tabulator.min.css` (vendored, create)
- `public/js/grid.js` (create)
- `public/js/main.js` (add button handler, init grid on first reveal)
- `public/index.html` (add `<link>` + `<script>` for Tabulator, button, grid container per section)
- `public/assets/style.css` (grid container + theme overrides)

**Files NOT to touch:**
- `compute.js`, `extractors.js`, `render.js`.
- Validation logic (T11).
- CRUD logic (T12).

## Steps

### Step 1: Vendor Tabulator
Download to `public/assets/`:
- `tabulator.min.js` (Tabulator v6.3.x)
- `tabulator.min.css` (basic theme)
Source: https://unpkg.com/tabulator-tables@6.3 (download once, commit).

### Step 2: Add CSS link + JS script in index.html
```html
<link rel="stylesheet" href="assets/tabulator.min.css" />
...
<script src="assets/tabulator.min.js"></script>
```
Order matters — Tabulator script before `grid.js`.

### Step 3: Add input button + grid container per section
Inside `.section-actions`:
```html
<button class="btn-input" data-mode="daily" onclick="window.grid.toggle('daily')">⊞ Nhập liệu</button>
```
Below `.content` div, add:
```html
<div class="grid-container hidden" id="grid-daily"></div>
```
Repeat for weekly and monthly.

### Step 4: Create `public/js/grid.js`
```js
(function () {
  // 43-column definition shared by all 3 grids.
  // Match supabase_schema.sql column names.
  const PERCENT_COLS = new Set([
    "thi_phan_co_so","thi_phan_cn","thi_phan_ds","ty_trong_spv",
    "thi_phan_phai_sinh","ty_le_slhd_dplus","ty_le_slkh_dplus","ty_le_scash_casa"
  ]);

  // For percent columns: stored as decimal (0.0852), displayed as 8.52
  function pctFormatter(cell) {
    const v = cell.getValue();
    if (v === null || v === undefined) return "";
    return (Number(v) * 100).toFixed(2);
  }
  function pctMutator(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(String(value).replace(",", "."));
    if (isNaN(n)) return null;
    return n / 100;
  }
  function numFormatter(cell) {
    const v = cell.getValue();
    if (v === null || v === undefined) return "";
    return String(v);
  }

  function buildColumns() {
    // Pull from config; keep order matching schema.
    const cols = [
      { title: "Ngày", field: "ngay", frozen: true, editor: "date", width: 120, headerSort: false },
    ];
    const numericCols = [
      "thi_phan_co_so","thi_phan_cn","thi_phan_ds","gtgd_cs_ssi","thanh_khoan_ttcs",
      "tong_du_no_margin","slkh_margin","du_no_t7","slkh_t7","du_no_trading_plus","slkh_trading_plus",
      "slkh_register_mplus","slkh_active_mplus","du_no_mplus","slkh_co_du_no_mplus","giai_ngan_mplus","slkh_giai_ngan_mplus",
      "du_no_ssi_deprecated","du_no_spv","ty_trong_spv",
      "thi_phan_phai_sinh","thanh_khoan_tt_ps","slhd_ps_deprecated","slkh_ps","slhd_dplus_deprecated",
      "ty_le_slhd_dplus","slkh_dplus","ty_le_slkh_dplus","kh_cancel_dplus","kh_register_dplus","kh_giu_qua_dem","kh_sd_dplus","slhd_giu_qua_dem","du_no_dplus_giai_ngan","du_no_dplus_cuoi_ngay",
      "so_du_scash","so_du_casa_scash","ty_le_scash_casa","slkh_scash",
      "so_du_sfund","slkh_sfund","slkh_mo_moi"
    ];
    for (const f of numericCols) {
      const isPct = PERCENT_COLS.has(f);
      cols.push({
        title: f,
        field: f,
        editor: "input",
        width: 130,
        formatter: isPct ? pctFormatter : numFormatter,
        mutatorEdit: isPct ? pctMutator : undefined,
      });
    }
    return cols;
  }

  const tables = {}; // mode -> Tabulator instance

  function checkPassword(mode) {
    const key = `canEdit_${mode}`;
    if (sessionStorage.getItem(key) === "1") return true;
    const pwd = prompt("Nhập mật khẩu:");
    if (pwd === window.WRITE_PASSWORD) {
      sessionStorage.setItem(key, "1");
      return true;
    } else {
      alert("Sai mật khẩu");
      return false;
    }
  }

  function toggle(mode) {
    if (!checkPassword(mode)) return;
    const container = document.getElementById(`grid-${mode}`);
    if (!container) return;
    container.classList.toggle("hidden");

    if (!container.classList.contains("hidden") && !tables[mode]) {
      init(mode);
    }
  }

  function init(mode) {
    const container = document.getElementById(`grid-${mode}`);
    const data = (window.STATE[mode] || []).slice(-20).reverse(); // newest top
    data.unshift({}); // empty row at very top? OR: append at bottom per CONTEXT.md
    // Per CONTEXT.md: "input row in last (bottom)". So:
    data.pop();                                  // undo unshift
    const display = (window.STATE[mode] || []).slice(-20);  // newest at bottom
    display.push({}); // empty row at very bottom

    tables[mode] = new window.Tabulator(container, {
      data: display,
      columns: buildColumns(),
      layout: "fitDataStretch",
      height: "60vh",
      reactiveData: false,
      // Frozen first column already set on the column def.
    });
  }

  // Allow re-init when STATE updates (T12 will call this after save).
  function refresh(mode) {
    if (tables[mode]) {
      tables[mode].destroy();
      delete tables[mode];
    }
    const container = document.getElementById(`grid-${mode}`);
    if (container && !container.classList.contains("hidden")) {
      init(mode);
    }
  }

  window.grid = { toggle, refresh, _tables: tables };
})();
```

### Step 5: CSS for grid container
```css
.grid-container {
  margin-top: 24px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-surface);
}
.grid-container.hidden { display: none; }

/* Tabulator dark theme overrides */
.tabulator { background: var(--bg-surface); color: var(--text-primary); border: none; }
.tabulator .tabulator-header { background: var(--bg-app); border-bottom: 1px solid var(--border); }
.tabulator .tabulator-row { background: var(--bg-surface); border-bottom: 1px solid var(--border); }
.tabulator .tabulator-row.tabulator-row-even { background: rgba(255,255,255,0.02); }
.tabulator .tabulator-cell { border-right: 1px solid var(--border); }
.tabulator .tabulator-row.tabulator-selected { background: rgba(85,179,255,0.1); }
.tabulator-edit-list { background: var(--bg-surface); }
```

### Step 6: Wire script tag in index.html
```html
<script src="assets/tabulator.min.js"></script>
...
<script src="js/grid.js"></script>
<!-- after extractors.js + render.js + main.js -->
```

### Step 7: Manual test
- Click "⊞ Nhập liệu" → prompt → wrong password → alert.
- Click again → prompt → `123` → grid appears with last 20 rows.
- First column "ngay" frozen on left.
- Header row frozen on top.
- Click any cell → input editor.
- Empty row at bottom.
- Click button again → grid hides.
- Reopen → no password prompt (sessionStorage cached).

### Step 8: Commit + push
```bash
git checkout -b feat/10-input-grid
git add public/
git commit -m "feat(grid): tabulator integration + password gate"
git push -u origin feat/10-input-grid
```

## Verification
- Visual: grid appears + frozen columns/header.
- Functional: editing locally works (changes don't save yet — that's T12).
- Auth: wrong pw blocked, right pw allows, sessionStorage caches per-section.

## When to STOP and ASK (Think Before Coding — Principle 1)
- Tabulator v6.3 API differs from earlier versions; always confirm via context7.
- User wants per-user passwords or different password — STOP, this changes scope.
- Grid is too wide for laptop screens → don't reduce columns silently. Ask if executor should add a "show only essential cols" toggle.

## After Completion
Update log.md T10 entry:
- Files changed: list
- Tests: manual (auth + grid show + edit cells)
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if grid renders + auth works
- Set Status = `review`
