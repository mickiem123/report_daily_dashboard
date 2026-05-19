# Task 06: JS product extractors

> Depends on: 05
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Port the 6 `product_data_*()` functions from `deprecated/report.py` into `public/js/extractors.js`. These take the latest 22 Supabase rows and produce one product dict per call, ready for card rendering. Apply the pending features (Task 2 in MASTER): add `group` field for M+/D+ metrics, add `inverse: true` for `kh_cancel_dplus`.

## Success Criteria
- [ ] `public/js/extractors.js` exists, exposes `window.extractors = { hose, margin, phaisinh, scash, sfund, momoi }`.
- [ ] Each extractor returns a dict with the canonical shape (see CONTEXT.md → "Product extractors").
- [ ] `productDataMargin` adds `group: "M+"` to all M+ sub_metrics (cols `slkh_register_mplus` through `slkh_giai_ngan_mplus`).
- [ ] `productDataPhaisinh` adds `group: "D+"` to all D+ sub_metrics; adds `inverse: true` to `kh_cancel_dplus`.
- [ ] Tests in `tests/extractors.test.html` cover each extractor with: full data row, partial nulls row, all-null row.
- [ ] All tests pass.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T05 done — `window.compute` available.
- [ ] `deprecated/report.py` is readable for line-by-line porting reference.
- [ ] User has confirmed the column → product mapping in `deprecated/MAINTENANCE.md` is the authoritative spec.

### Post-conditions (verify after completing)
- [ ] Each of 6 extractor functions returns the canonical dict shape.
- [ ] `extractors.js` loads cleanly (no console errors when included).
- [ ] All test cases in `tests/extractors.test.html` pass.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/extractors.js` (create)
- `tests/extractors.test.html` (create)
- `tests/fixtures/sample-rows.js` (create — sample row fixtures shared by tests)
- `public/index.html` (add `<script src="js/extractors.js"></script>` after compute.js)

**Files NOT to touch:**
- `public/js/compute.js`, `public/js/main.js` (T05/T04).
- `deprecated/`.

## Steps

### Step 1: Read the 6 Python source functions
Locate in `deprecated/report.py`:
- `product_data_hose(today, prev, rows)`
- `product_data_margin(today, prev, rows)`
- `product_data_phaisinh(today, prev, rows)`
- `product_data_scash(today, prev, rows)`
- `product_data_sfund(today, prev, rows)`
- `product_data_momoi(today, prev, rows)`

Note the dict shape returned:
```js
{
  key: "margin",
  name: "Margin",
  trend_emoji: "📈",
  headline_label: "...",
  headline_value: "...",
  headline_delta: "...",
  verb: "tăng",
  chart_keys_default: [...],   // keep the field even though chart deprecated, for shape-compat
  sub_metrics: [
    { label, value, delta, important, group?, inverse? }
  ]
}
```

### Step 2: Map Python column indices → Supabase column names
Reference `deprecated/MAINTENANCE.md` table. Build a lookup map at top of `extractors.js`:
```js
// Match snake_case names from supabase_schema.sql
const COL = {
  ngay: "ngay",
  thi_phan_co_so: "thi_phan_co_so",
  thi_phan_cn: "thi_phan_cn",
  thi_phan_ds: "thi_phan_ds",
  gtgd_cs_ssi: "gtgd_cs_ssi",
  thanh_khoan_ttcs: "thanh_khoan_ttcs",
  tong_du_no_margin: "tong_du_no_margin",
  // ... all 43 columns
};
```
> Use the column names verbatim from `supabase_schema.sql`. If executor finds a mismatch, STOP and ask before guessing.

### Step 3: Implement each extractor
Each function takes `(today, prev, rows)` where:
- `today` = `rows[rows.length - 1]` (last row)
- `prev`  = `rows[rows.length - 2]`
- `rows`  = full 22-row array (used for trend detection + history)

Use `window.compute.diff`, `window.compute.fmt`, `window.compute.detectTrend`, `window.compute.isManhDelta`, `window.compute.metricHistory`.

Example (`hose`):
```js
function hose(today, prev, rows) {
  const { fmt, diff, detectTrend, isManhDelta, metricHistory } = window.compute;
  const c = (k) => today[k];
  const p = (k) => (prev ? prev[k] : null);

  // Headline: thị phần cơ sở (decimal %)
  const headline = diff(c(COL.thi_phan_co_so), p(COL.thi_phan_co_so), "%");

  const subs = [];
  // SLKH Margin example would go in product_data_margin, not here.
  subs.push({
    label: "Thị phần CN",
    value: fmt(c(COL.thi_phan_cn), "%"),
    delta: diff(c(COL.thi_phan_cn), p(COL.thi_phan_cn), "%").deltaStr,
    important: false,
  });
  // ... and so on for all HOSE-related cols (per Python)

  // Determine `important` via isManhDelta where MANH_CFG applies
  // (e.g., thanh_khoan_ttcs uses MANH_CFG.hose_liq_mkt)
  const liqHistory = metricHistory(COL.thanh_khoan_ttcs, rows, c(COL.thanh_khoan_ttcs));
  const liqImportant = isManhDelta(c(COL.thanh_khoan_ttcs), p(COL.thanh_khoan_ttcs), liqHistory, MANH_CFG.hose_liq_mkt);
  subs.push({
    label: "Thanh khoản thị trường CS",
    value: fmt(c(COL.thanh_khoan_ttcs), "tỷ"),
    delta: diff(c(COL.thanh_khoan_ttcs), p(COL.thanh_khoan_ttcs), "tỷ").deltaStr,
    important: liqImportant,
  });

  return {
    key: "hose",
    name: "HOSE",
    trend_emoji: detectTrend(COL.thi_phan_co_so, rows),
    headline_label: "Thị phần cơ sở",
    headline_value: headline.valStr,
    headline_delta: headline.deltaStr,
    verb: headline.verb,
    chart_keys_default: ["thi_phan_co_so", "thi_phan_cn", "thi_phan_ds"],
    sub_metrics: subs,
  };
}
```

Define `MANH_CFG` at top of file matching Python:
```js
const MANH_CFG = {
  hose_liq_mkt:    { mode: "pct", floor: 15.0, k_sigma: 3.0 },
  ps_liq:          { mode: "pct", floor: 15.0, k_sigma: 3.0 },
  ps_dplus_ratio:  { mode: "pp",  floor: 1.0,  k_sigma: 3.0 },
};
```

For `margin`:
- All M+ sub_metrics (`slkh_register_mplus`, `slkh_active_mplus`, `du_no_mplus`, `slkh_co_du_no_mplus`, `giai_ngan_mplus`, `slkh_giai_ngan_mplus`) get `group: "M+"`.
- Non-M+ subs unchanged (no `group` field).

For `phaisinh`:
- D+ sub_metrics (`slkh_dplus`, `ty_le_slkh_dplus`, `kh_cancel_dplus`, `kh_register_dplus`, `kh_giu_qua_dem`, `kh_sd_dplus`, `du_no_dplus_giai_ngan`, `du_no_dplus_cuoi_ngay`) get `group: "D+"`.
- `kh_cancel_dplus` ALSO gets `inverse: true`.

> Skip deprecated columns: `slhd_ps_deprecated`, `slhd_dplus_deprecated`, `slhd_giu_qua_dem`, `du_no_ssi_deprecated`, `ty_trong_spv` per MAINTENANCE.md.

### Step 4: Write fixture
Create `tests/fixtures/sample-rows.js`:
```js
// Single fixture used across extractor + render tests.
// Build a fully-populated row, a partial row (some nulls), and an all-null row.
window.fixtures = {
  fullRow: {
    ngay: "2024-09-15",
    thi_phan_co_so: 0.0852,
    thi_phan_cn: 0.0900,
    thi_phan_ds: 0.0805,
    gtgd_cs_ssi: 1234.5,
    thanh_khoan_ttcs: 14500,
    tong_du_no_margin: 12345.6,
    slkh_margin: 22000,
    // ... fill every column with a sensible value
  },
  prevRow: { /* same shape, slightly different values */ },
  fullHistory: [ /* 22 rows, slowly varying */ ],
  // Partial / null cases:
  partialRow: { ngay: "2024-09-15", thi_phan_co_so: 0.0852, /* most nulls */ },
  nullRow: { ngay: "2024-09-15" /* everything else null */ },
};
```

### Step 5: Write tests in `tests/extractors.test.html`
```html
<!doctype html><html><head><meta charset="utf-8"><title>extractors tests</title>
<style>body{background:#07080a;color:#e7e7e7;font-family:monospace;padding:24px}#results>div{margin:4px 0}</style>
</head><body>
<h1>extractors.js tests</h1><div id="results"></div>
<script src="lib/test-runner.js"></script>
<script src="../public/js/compute.js"></script>
<script src="fixtures/sample-rows.js"></script>
<script src="../public/js/extractors.js"></script>
<script>
const F = window.fixtures;
const E = window.extractors;

test("hose: returns canonical shape", () => {
  const p = E.hose(F.fullRow, F.prevRow, F.fullHistory);
  assertEq(p.key, "hose");
  assert(Array.isArray(p.sub_metrics));
  assert(typeof p.headline_value === "string");
});

test("margin: M+ subs have group: 'M+'", () => {
  const p = E.margin(F.fullRow, F.prevRow, F.fullHistory);
  const mplus = p.sub_metrics.filter(s => s.group === "M+");
  assert(mplus.length >= 6, `expected ≥ 6 M+ subs, got ${mplus.length}`);
});

test("phaisinh: D+ subs have group: 'D+'", () => {
  const p = E.phaisinh(F.fullRow, F.prevRow, F.fullHistory);
  const dplus = p.sub_metrics.filter(s => s.group === "D+");
  assert(dplus.length >= 6, `expected ≥ 6 D+ subs, got ${dplus.length}`);
});

test("phaisinh: kh_cancel_dplus has inverse: true", () => {
  const p = E.phaisinh(F.fullRow, F.prevRow, F.fullHistory);
  const cancel = p.sub_metrics.find(s => s.label && s.label.toLowerCase().includes("cancel"));
  assert(cancel, "no cancel metric found");
  assertEq(cancel.inverse, true);
});

test("nullRow: produces N/A values, no crashes", () => {
  for (const name of ["hose","margin","phaisinh","scash","sfund","momoi"]) {
    const p = E[name](F.nullRow, null, [F.nullRow]);
    assertEq(p.key, name);
    assert(Array.isArray(p.sub_metrics));
  }
});

window.runTests();
</script>
</body></html>
```

### Step 6: Wire into index.html
Add to `public/index.html` after compute.js:
```html
<script src="js/extractors.js"></script>
```

### Step 7: Branch + commit + verify
```bash
git checkout -b feat/06-extractors
git add public/js/extractors.js tests/ public/index.html
git commit -m "feat(extractors): port 6 product_data_* + groupings"
git push -u origin feat/06-extractors
```
Open `tests/extractors.test.html` → green. PR → merge.

## Verification
- Open extractors test page → all green.
- In dashboard console: `window.extractors.margin(window.STATE.daily.at(-1), window.STATE.daily.at(-2), window.STATE.daily)` returns valid dict.
- Inspect M+/D+ groupings via `JSON.stringify(...).includes('"group":"M+"')`.

## When to STOP and ASK (Think Before Coding — Principle 1)
- Python source has logic the executor cannot fully understand → quote the lines in log.md, ask for clarification.
- A column in `MAINTENANCE.md` doesn't exist in `supabase_schema.sql` → STOP, do not silently rename.
- The `chart_keys_default` field is in scope but charts are deprecated → keep the field for shape compat but value can be `[]` if nothing fits. Note in log.md.
- `is_manh_delta` references config not in MANH_CFG (missed metric) → ask before adding.

## After Completion
Update log.md T06 entry:
- Files changed: list
- Tests: X/Y passing in extractors.test.html
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if all 6 extractors return shape-compat dicts and groups + inverse work
- Set Status = `review`
