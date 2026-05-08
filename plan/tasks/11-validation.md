# Task 11: Cell validation (type + range + outlier)

> Depends on: 10
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Add validation that runs on each cell edit. Flag suspicious cells visually (red border, tooltip explaining why). Hard-block save only on type errors. Outliers and range issues are warnings (yellow border) — user can still save through them.

## Success Criteria
- [ ] `public/js/validation.js` exposes `window.validation = { validateCell, validateRow }`.
- [ ] On cell edit, Tabulator's `cellEdited` callback runs validators.
- [ ] Type error (non-numeric in numeric col) → red border + tooltip "Phải là số" → cell value reverts to previous.
- [ ] Range error (% column outside 0-1, or count column < 0) → yellow border + tooltip explaining range.
- [ ] Outlier (|robust z-score| > 3 vs last 20 rows) → orange border + tooltip "Giá trị bất thường (z=X.X)".
- [ ] Tests in `tests/validation.test.html` cover each rule with happy path, edge case, error case.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T10 done — grid renders + sessionStorage auth.
- [ ] `window.compute.robustZ` and `window.compute.metricHistory` available from T05.

### Post-conditions (verify after completing)
- [ ] Cell with text in numeric col → red border + revert.
- [ ] Cell `=2` in `thi_phan_co_so` (decimal % > 1) → yellow border + tooltip.
- [ ] Cell with extreme outlier → orange border + tooltip showing z.
- [ ] Tests pass.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/validation.js` (create)
- `public/js/grid.js` (extend init() to wire `cellEdited` callback)
- `public/assets/style.css` (add `.cell-warn`, `.cell-error`, `.cell-outlier` classes)
- `tests/validation.test.html` (create)
- `public/index.html` (add `<script src="js/validation.js"></script>` after compute.js)

**Files NOT to touch:**
- `compute.js` (rules use existing helpers).
- CRUD save (T12).

## Steps

### Step 1: Define validation rules
```js
// public/js/validation.js
(function () {
  const PERCENT_COLS = new Set([
    "thi_phan_co_so","thi_phan_cn","thi_phan_ds","ty_trong_spv",
    "thi_phan_phai_sinh","ty_le_slhd_dplus","ty_le_slkh_dplus","ty_le_scash_casa",
  ]);
  const NON_NEGATIVE_COLS = new Set([
    "gtgd_cs_ssi","thanh_khoan_ttcs","tong_du_no_margin","slkh_margin",
    "du_no_t7","slkh_t7","du_no_trading_plus","slkh_trading_plus",
    "slkh_register_mplus","slkh_active_mplus","du_no_mplus","slkh_co_du_no_mplus",
    "giai_ngan_mplus","slkh_giai_ngan_mplus","du_no_spv","thanh_khoan_tt_ps",
    "slkh_ps","slkh_dplus","kh_cancel_dplus","kh_register_dplus","kh_giu_qua_dem",
    "kh_sd_dplus","du_no_dplus_giai_ngan","du_no_dplus_cuoi_ngay",
    "so_du_scash","so_du_casa_scash","slkh_scash","so_du_sfund","slkh_sfund","slkh_mo_moi",
  ]);

  // Returns { ok: bool, severity: 'error'|'warn'|'outlier'|'none', message: string }
  function validateCell(field, value, allRows) {
    if (field === "ngay") {
      if (!value) return { ok: false, severity: "error", message: "Ngày không được để trống" };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { ok: false, severity: "error", message: "Định dạng YYYY-MM-DD" };
      }
      return { ok: true, severity: "none", message: "" };
    }

    // Empty allowed for any numeric col → store as null
    if (value === "" || value === null || value === undefined) {
      return { ok: true, severity: "none", message: "" };
    }

    // Type check — must be a number
    const n = Number(String(value).replace(",", "."));
    if (isNaN(n)) {
      return { ok: false, severity: "error", message: "Phải là số" };
    }

    // Range checks
    if (PERCENT_COLS.has(field)) {
      // Stored as decimal — display in grid is value × 100, so user types 8.52 -> mutator stores 0.0852
      // The value here is already post-mutator (decimal), expected 0..1
      if (n < 0 || n > 1) {
        return { ok: false, severity: "warn", message: `% phải trong khoảng 0–100` };
      }
    }
    if (NON_NEGATIVE_COLS.has(field)) {
      if (n < 0) {
        return { ok: false, severity: "warn", message: "Không thể âm" };
      }
    }

    // Outlier check — only if allRows has ≥ 5 prior rows
    if (Array.isArray(allRows) && allRows.length >= 5) {
      const history = window.compute.metricHistory(field, allRows, n);
      if (history.length >= 5) {
        const z = window.compute.robustZ(n, history);
        if (Math.abs(z) > 3) {
          return { ok: false, severity: "outlier", message: `Giá trị bất thường (z=${z.toFixed(1)})` };
        }
      }
    }

    return { ok: true, severity: "none", message: "" };
  }

  function validateRow(row, allRows) {
    const errors = {};
    for (const [field, value] of Object.entries(row)) {
      const result = validateCell(field, value, allRows);
      if (!result.ok) errors[field] = result;
    }
    return errors;
  }

  window.validation = { validateCell, validateRow };
})();
```

### Step 2: Wire into grid.js cellEdited callback
In `init()` of grid.js, extend Tabulator config:
```js
tables[mode] = new window.Tabulator(container, {
  data: display,
  columns: buildColumns(),
  layout: "fitDataStretch",
  height: "60vh",
  cellEdited: function (cell) {
    const field = cell.getField();
    const value = cell.getValue();
    const allRows = window.STATE[mode] || [];
    const result = window.validation.validateCell(field, value, allRows);

    const cellEl = cell.getElement();
    cellEl.classList.remove("cell-error", "cell-warn", "cell-outlier");
    cellEl.removeAttribute("title");

    if (result.severity === "error") {
      cellEl.classList.add("cell-error");
      cellEl.setAttribute("title", result.message);
      cell.restoreOldValue(); // revert
    } else if (result.severity === "warn") {
      cellEl.classList.add("cell-warn");
      cellEl.setAttribute("title", result.message);
    } else if (result.severity === "outlier") {
      cellEl.classList.add("cell-outlier");
      cellEl.setAttribute("title", result.message);
    }
  },
});
```

### Step 3: CSS for severity levels
```css
.tabulator .tabulator-cell.cell-error    { box-shadow: inset 0 0 0 2px var(--accent-red); }
.tabulator .tabulator-cell.cell-warn     { box-shadow: inset 0 0 0 2px var(--accent-yellow); }
.tabulator .tabulator-cell.cell-outlier  { box-shadow: inset 0 0 0 2px #ff8c33; }
```

### Step 4: Tests `tests/validation.test.html`
```html
<!doctype html><html><head><meta charset="utf-8"><title>validation tests</title>
<style>body{background:#07080a;color:#e7e7e7;font-family:monospace;padding:24px}#results>div{margin:4px 0}</style>
</head><body>
<h1>validation.js tests</h1><div id="results"></div>
<script src="lib/test-runner.js"></script>
<script src="../public/js/compute.js"></script>
<script src="../public/js/validation.js"></script>
<script>
const V = window.validation;

test("ngay empty -> error",      () => { assertEq(V.validateCell("ngay", "", []).severity, "error"); });
test("ngay bad format -> error", () => { assertEq(V.validateCell("ngay", "15/9/2024", []).severity, "error"); });
test("ngay good -> ok",          () => { assertEq(V.validateCell("ngay", "2024-09-15", []).ok, true); });

test("text in numeric -> error", () => { assertEq(V.validateCell("tong_du_no_margin", "abc", []).severity, "error"); });
test("empty numeric ok",         () => { assertEq(V.validateCell("tong_du_no_margin", "", []).ok, true); });
test("negative count -> warn",   () => { assertEq(V.validateCell("slkh_margin", -5, []).severity, "warn"); });
test("percent over 1 -> warn",   () => { assertEq(V.validateCell("thi_phan_co_so", 1.5, []).severity, "warn"); });

test("outlier: z > 3 flagged", () => {
  const rows = Array.from({length: 20}, () => ({ tong_du_no_margin: 100 })); // stable history
  const result = V.validateCell("tong_du_no_margin", 1000, rows);
  assertEq(result.severity, "outlier");
});

test("outlier: insufficient history -> ok", () => {
  const rows = [{ tong_du_no_margin: 100 }];
  const result = V.validateCell("tong_du_no_margin", 1000, rows);
  assertEq(result.ok, true);
});

window.runTests();
</script>
</body></html>
```

### Step 5: Wire script tag
In `index.html` after compute.js (so validation can use it):
```html
<script src="js/validation.js"></script>
```

### Step 6: Manual test
- Open grid → type `abc` in numeric cell → red border + reverts.
- Type `2.0` in `thi_phan_co_so` (raw decimal) → yellow border + tooltip.
- Type `99999` in a stable column → orange border + tooltip with z value.

### Step 7: Commit + push
```bash
git checkout -b feat/11-validation
git add public/js/validation.js public/js/grid.js public/assets/style.css tests/validation.test.html public/index.html
git commit -m "feat(validation): cell-level type/range/outlier checks"
git push -u origin feat/11-validation
```

## Verification
- Tests page → all green.
- Manual: each severity level visually distinct.
- Type error reverts cell value (Tabulator `restoreOldValue`).

## When to STOP and ASK (Think Before Coding — Principle 1)
- Percent columns: Tabulator's `mutatorEdit` returns the decimal value to validate; confirm by logging cell value during validation.
- The percent display flow (user types 8.52, mutator stores 0.0852, validator sees 0.0852) needs end-to-end confirmation. STOP and trace if behavior unclear.
- Outlier threshold (z > 3) feels too lenient/strict → ask before tuning.

## After Completion
Update log.md T11 entry:
- Files changed: list
- Tests: X/Y passing
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if all 3 severities work
- Set Status = `review`
