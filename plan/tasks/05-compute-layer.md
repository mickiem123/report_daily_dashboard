# Task 05: JS compute layer (port from Python)

> Depends on: 04
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Port the core utility functions from `deprecated/report.py` into `public/js/compute.js`, with browser-runnable unit tests in `tests/compute.test.html`. These functions are pure (input → output, no side effects) so they're TDD-friendly.

## Success Criteria
- [ ] `public/js/compute.js` exists, exposes utility functions on `window.compute = { ... }`.
- [ ] All ported functions have at least 3 test cases each in `tests/compute.test.html`: happy path, edge case, error/null case.
- [ ] Tests pass when opening `tests/compute.test.html` in a browser (visible green/red list, console summary).
- [ ] Test output for representative inputs matches Python output byte-for-byte (where deterministic).
- [ ] No external deps — pure vanilla JS.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T04 done — page skeleton works.
- [ ] `deprecated/report.py` is readable for line-by-line porting reference.

### Post-conditions (verify after completing)
- [ ] `window.compute` exposes: `clean`, `fmt`, `diff`, `detectTrend`, `isManhDelta`, `metricHistory`, `serialToDate`, `weekdayVn`, `mad`, `robustZ`.
- [ ] All test cases in `tests/compute.test.html` pass.
- [ ] `compute.js` is loaded by `index.html` BEFORE `main.js`.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/compute.js` (create)
- `tests/compute.test.html` (create)
- `tests/lib/test-runner.js` (create — minimal assertion helper)
- `public/index.html` (add `<script src="js/compute.js"></script>` before `main.js`)

**Files NOT to touch:**
- `public/js/main.js` — only add the script tag in HTML.
- `deprecated/` — read only.

## Steps

### Step 1: Read source-of-truth functions in `deprecated/report.py`
Locate and review (do NOT modify):
- `clean(v)`
- `fmt(v, unit)`
- `diff(today, prev, unit)`
- `detect_trend(col_idx, rows)`  ← note pending update in MASTER (3-day streak logic)
- `is_manh_delta(today, prev, history, cfg)`
- `_metric_history(col_idx, rows, today_val)`
- `serial_to_date(serial)`  ← may not be needed (Supabase returns ISO date strings)
- `weekday_vn(date)`

### Step 2: Write minimal browser test runner
Create `tests/lib/test-runner.js`:
```js
// Tiny assert helper. Renders results into #results and logs to console.
window.tests = [];
window.test = function (name, fn) { window.tests.push({ name, fn }); };
window.assert = function (cond, msg) {
  if (!cond) throw new Error("assertion failed: " + (msg || ""));
};
window.assertEq = function (got, want, msg) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) throw new Error(`expected ${b}, got ${a} (${msg || ""})`);
};
window.runTests = function () {
  const results = document.getElementById("results");
  let pass = 0, fail = 0;
  for (const t of window.tests) {
    try { t.fn(); pass++; results.innerHTML += `<div style="color:#5fc992">✓ ${t.name}</div>`; }
    catch (e) { fail++; results.innerHTML += `<div style="color:#ff6363">✗ ${t.name} — ${e.message}</div>`; }
  }
  results.innerHTML += `<hr><div><strong>${pass} passed, ${fail} failed</strong></div>`;
  console.log(`${pass} passed, ${fail} failed`);
};
```

### Step 3: Create `public/js/compute.js`
Implement each function as a JS port. Match Python semantics exactly. Wrap in IIFE that sets `window.compute`.

Key rules:
- `clean(v)`: returns `null` if v is `null`, `undefined`, NaN, or a number < -2_000_000_000 (legacy Excel error sentinel — keep the check defensively even though Supabase shouldn't store such values).
- `fmt(v, unit)`: handle units `%`, `tỷ`, `KH`, `HĐ`, `tài khoản`. For `%` multiply input × 100, format with thousands separator + `%`. For `tỷ` use Vietnamese thousands separator (e.g., `1.234,5 tỷ` matches Python output).
- `diff(today, prev, unit)`: return `{ verb, prep, valStr, deltaStr, pctDelta }` matching Python's table:
  | pctDelta | verb | prep |
  |---|---|---|
  | > +5 | `tăng mạnh` | `lên` |
  | > 0 | `tăng` | `lên` |
  | < -5 | `giảm mạnh` | `về` |
  | < 0 | `giảm` | `về` |
  | == 0 or both null | `giữ nguyên mức` | `` |
  - For `unit === "%"`, `lên` becomes `lên mức`, `về` becomes `về mức`.
- `detectTrend(colName, rows)` — implement the EXTENDED logic from MASTER pending Task 1 (Python doesn't have full version yet):
  - 📈 if last 3+ values strictly increasing
  - 📉 if last 3+ values strictly decreasing
  - 🔴 if `pctDelta(today, prev) < -15`
  - else `""`
- `mad(arr)`: median absolute deviation. Helper for `robustZ`.
- `robustZ(value, history)`: `(value - median(history)) / (1.4826 * mad(history))`. Return 0 if MAD is 0.
- `isManhDelta(today, prev, history, cfg)`: ports Python verbatim. Returns `true`/`false`. `cfg = { mode: 'pct'|'pp', floor: number, k_sigma: number }`.
- `metricHistory(colName, rows, todayVal)`: returns last 20 numeric values from rows, excluding the latest if it equals `todayVal`. Used as input to `robustZ`.
- `serialToDate(serial)` — ONLY needed if any code path passes Excel serials. Supabase stores ISO strings, so likely unused. Keep stub but mark `// possibly unused — Supabase returns ISO`.
- `weekdayVn(dateStr)`: returns `"T2"`..`"T7"` from a YYYY-MM-DD string. Sat/Sun roll back to Friday like Python.

Skeleton:
```js
(function () {
  const ERR_THRESHOLD = -2_000_000_000;

  function clean(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") {
      if (Number.isNaN(v)) return null;
      if (v < ERR_THRESHOLD) return null;
    }
    return v;
  }

  function fmt(v, unit) {
    v = clean(v);
    if (v === null) return "N/A";
    // ... per Python
  }

  function diff(today, prev, unit) { /* ... */ }
  function detectTrend(colName, rows) { /* ... */ }
  function mad(arr) { /* ... */ }
  function robustZ(value, history) { /* ... */ }
  function isManhDelta(today, prev, history, cfg) { /* ... */ }
  function metricHistory(colName, rows, todayVal) { /* ... */ }
  function serialToDate(serial) { /* possibly unused */ }
  function weekdayVn(dateStr) { /* ... */ }

  window.compute = { clean, fmt, diff, detectTrend, mad, robustZ, isManhDelta, metricHistory, serialToDate, weekdayVn };
})();
```

> Use TDD: write test for each function FIRST in `compute.test.html`, watch it fail, then implement.

### Step 4: Write `tests/compute.test.html`
```html
<!doctype html>
<html><head><meta charset="utf-8"><title>compute tests</title>
<style>body{background:#07080a;color:#e7e7e7;font-family:monospace;padding:24px}#results>div{margin:4px 0}</style>
</head><body>
<h1>compute.js tests</h1><div id="results"></div>
<script src="lib/test-runner.js"></script>
<script src="../public/js/compute.js"></script>
<script>
const { clean, fmt, diff, detectTrend, mad, robustZ, isManhDelta, metricHistory, weekdayVn } = window.compute;

test("clean: null/undefined -> null", () => { assertEq(clean(null), null); assertEq(clean(undefined), null); });
test("clean: NaN -> null",          () => { assertEq(clean(NaN), null); });
test("clean: error sentinel -> null", () => { assertEq(clean(-2_500_000_000), null); });
test("clean: real number -> same", () => { assertEq(clean(1234.5), 1234.5); });

test("fmt: percent decimal -> percent display", () => { assertEq(fmt(0.0852, "%"), "8,52%"); }); // adjust separator if needed
test("fmt: tỷ formatting",                       () => { assertEq(fmt(1234.5, "tỷ"), "1.234,5 tỷ"); }); // adjust to match Python output
test("fmt: null -> N/A",                         () => { assertEq(fmt(null, "%"), "N/A"); });

test("diff: increase >5%", () => { const r = diff(110, 100, "tỷ"); assertEq(r.verb, "tăng mạnh"); });
test("diff: equal -> giữ nguyên", () => { const r = diff(100, 100, "tỷ"); assertEq(r.verb, "giữ nguyên mức"); });
test("diff: percent unit prep", () => { const r = diff(0.10, 0.08, "%"); assertEq(r.prep, "lên mức"); });

test("detectTrend: 3 increases -> 📈", () => {
  const rows = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }];
  assertEq(detectTrend("x", rows), "📈");
});
test("detectTrend: 3 decreases -> 📉", () => {
  const rows = [{ x: 5 }, { x: 4 }, { x: 3 }, { x: 2 }];
  assertEq(detectTrend("x", rows), "📉");
});
test("detectTrend: sudden drop -> 🔴", () => {
  const rows = [{ x: 100 }, { x: 100 }, { x: 100 }, { x: 80 }];
  assertEq(detectTrend("x", rows), "🔴");
});

test("mad: simple", () => { assertEq(mad([1,2,3,4,5]), 1); });

test("robustZ: zero MAD returns 0", () => { assertEq(robustZ(10, [5,5,5,5]), 0); });

test("isManhDelta: pct above threshold", () => {
  assert(isManhDelta(120, 100, [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100], { mode: "pct", floor: 15, k_sigma: 3 }));
});

test("metricHistory: returns last 20 excluding today", () => {
  const rows = Array.from({length: 25}, (_, i) => ({ x: i }));
  const h = metricHistory("x", rows, 24);
  assertEq(h.length, 20);
});

test("weekdayVn: Mon -> T2", () => { assertEq(weekdayVn("2024-09-09"), "T2"); }); // Mon
test("weekdayVn: Sun rolls Fri", () => { assertEq(weekdayVn("2024-09-08"), "T6"); }); // Sun -> Fri label

window.runTests();
</script>
</body></html>
```

> If exact Python output strings (`8,52%` vs `8.52%`) differ — verify against actual Python output by running deprecated/report.py one final time and capturing a few formatted strings into a fixture. Update test expectations accordingly.

### Step 5: Wire `compute.js` into index.html
Edit `public/index.html`, add inside `<body>` before other JS:
```html
<script src="js/compute.js"></script>
```
Order must be: `supabase.min.js` → `config.js` → `compute.js` → `main.js`.

### Step 6: Branch + commit + verify
```bash
git checkout -b feat/05-compute-layer
git add public/js/compute.js tests/ public/index.html
git commit -m "feat(compute): port Python utility layer to JS + tests"
git push -u origin feat/05-compute-layer
```
Open `tests/compute.test.html` in browser → all tests green. PR → merge.

## Verification
- Open `tests/compute.test.html` → results show all green, console says `N passed, 0 failed`.
- Open dashboard preview URL → still loads (no regression on T04 behavior).
- Browser console: `typeof window.compute.clean === "function"`.

## When to STOP and ASK (Think Before Coding — Principle 1)
- Number formatting in Python uses locale-specific separators (e.g., `1.234,56` Vietnamese style). If executor is unsure of the exact format used by Python, run `report.py --text` once on a sample row and capture actual output → fixture.
- Python's `is_manh_delta` references rare edge cases (all-history-zero, etc.). If unclear, write a Python script to dump expected outputs for ~20 input combos → use as fixture.
- `serialToDate` — confirm whether any path needs it. If not, skip and note in log.md.

## After Completion
Update log.md T05 entry:
- Files changed: list
- Tests: X/Y passing in `compute.test.html`
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if every Python function has matching JS function with passing tests
- Set Status = `review`
