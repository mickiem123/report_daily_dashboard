# Task 07: Card rendering + groups + inverse color

> Depends on: 06
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Port `render_card()` from `deprecated/report.py` into `public/js/render.js`, including the **two new features** from MASTER pending tasks 3 + 4:
- Render `group` labels with indented sub-metrics inside the collapsible details section.
- Apply inverse color logic when `inverse: true` (positive delta → red, negative → green).

## Success Criteria
- [ ] `public/js/render.js` exposes `window.render = { card, sortProducts }`.
- [ ] `card(product, rank)` returns an HTML string matching the Python template structure (same class names).
- [ ] Grouped sub-metrics render with a group header label + indented row visual.
- [ ] Metrics with `inverse: true` flip color: `+` → `down` class, `-` → `up` class.
- [ ] `sortProducts(productList)` implements tang/giu/giam bucket sort matching Python.
- [ ] Tests in `tests/render.test.html` confirm: shape of HTML, group rendering, inverse coloring, sort order.
- [ ] Full styling for cards / metrics / groups added to `public/assets/style.css`.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T06 done — `window.extractors` available with valid output.
- [ ] `deprecated/report.py` `render_card()` and `_html_shell()` (CSS) are readable.

### Post-conditions (verify after completing)
- [ ] `tests/render.test.html` all pass.
- [ ] On dashboard preview URL, replacing the placeholder logic with a manual call (e.g., paste in console: `document.querySelector('#daily .content').innerHTML = window.render.card(window.extractors.margin(...), 0)`) shows a styled card.
- [ ] Dark theme matches existing report look.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/render.js` (create)
- `public/assets/style.css` (extend — add card, badge, group, metric-row, details classes)
- `tests/render.test.html` (create)
- `public/index.html` (add `<script src="js/render.js"></script>` after extractors.js)

**Files NOT to touch:**
- `public/js/main.js` (T08 wires render into main.js).
- `deprecated/`.
- Earlier JS modules.

## Steps

### Step 1: Read source-of-truth
Locate in `deprecated/report.py`:
- `render_card(product, rank)` — full HTML template.
- `_sub_delta_class(delta_str)` — color class picker.
- `_row(metric)` — sub_metric row renderer.
- The CSS in `_html_shell()` for: `.product-card`, `.verb-badge`, `.hero-delta`, `.metric-row`, `.metric-delta`, `.up`/`.down`/`.flat`, `.details`, `.product-card::before` left stripe.

### Step 2: Implement helpers in `render.js`
```js
(function () {
  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function deltaClass(deltaStr, inverse) {
    if (!deltaStr) return "flat";
    const trimmed = deltaStr.trim();
    let cls = "flat";
    if (trimmed.startsWith("+")) cls = "up";
    else if (trimmed.startsWith("-") || trimmed.startsWith("−")) cls = "down";
    if (inverse) {
      if (cls === "up") cls = "down";
      else if (cls === "down") cls = "up";
    }
    return cls;
  }

  function verbClass(verb) {
    if (!verb) return "flat";
    if (verb.startsWith("tăng")) return "up";
    if (verb.startsWith("giảm")) return "down";
    return "flat";
  }

  function row(metric) {
    const cls = deltaClass(metric.delta, metric.inverse);
    return `
      <div class="metric-row">
        <span class="metric-label">${escapeHtml(metric.label)}</span>
        <span class="metric-value">${escapeHtml(metric.value)}</span>
        <span class="metric-delta ${cls}">${escapeHtml(metric.delta || "")}</span>
      </div>`;
  }

  function groupBlock(groupName, metrics) {
    return `
      <div class="metric-group">
        <div class="group-label">${escapeHtml(groupName)}</div>
        <div class="group-metrics">
          ${metrics.map(row).join("")}
        </div>
      </div>`;
  }

  function card(product, rank = 0) {
    const subs = (product.sub_metrics || []).filter(m => m.value && m.value !== "N/A");
    const pinned = subs.filter(m => m.important);
    const detailsAll = subs.filter(m => !m.important);

    // Split details by group
    const grouped = {};
    const ungrouped = [];
    for (const m of detailsAll) {
      if (m.group) {
        if (!grouped[m.group]) grouped[m.group] = [];
        grouped[m.group].push(m);
      } else {
        ungrouped.push(m);
      }
    }
    // Render groups in insertion order (Object key insertion is preserved).
    const groupHtml = Object.entries(grouped).map(([name, ms]) => groupBlock(name, ms)).join("");
    const ungroupedHtml = ungrouped.map(row).join("");

    const verbCls = verbClass(product.verb);
    const headlineDeltaCls = deltaClass(product.headline_delta);

    return `
      <article class="product-card ${verbCls}" data-key="${escapeHtml(product.key)}" data-rank="${rank}">
        <header class="card-header">
          <span class="trend-emoji">${product.trend_emoji || ""}</span>
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <span class="verb-badge ${verbCls}">${escapeHtml(product.verb || "")}</span>
        </header>
        <div class="hero">
          <div class="hero-label">${escapeHtml(product.headline_label || "")}</div>
          <div class="hero-value">${escapeHtml(product.headline_value || "")}</div>
          <div class="hero-delta ${headlineDeltaCls}">${escapeHtml(product.headline_delta || "")}</div>
        </div>
        <div class="pinned">${pinned.map(row).join("")}</div>
        ${detailsAll.length ? `
          <button class="toggle-details" onclick="window.render.toggle('${escapeHtml(product.key)}')">Xem chi tiết</button>
          <div class="details" id="details-${escapeHtml(product.key)}">
            ${groupHtml}
            ${ungroupedHtml}
          </div>` : ``}
      </article>`;
  }

  function toggle(key) {
    const el = document.getElementById(`details-${key}`);
    if (el) el.classList.toggle("open");
  }

  function sortProducts(list) {
    const PRIORITY = ["hose","margin","phaisinh","scash","sfund","momoi"];
    const bucket = (p) => {
      if (!p.verb) return 1;
      if (p.verb.startsWith("tăng")) return 0;
      if (p.verb.startsWith("giảm")) return 2;
      return 1;
    };
    return [...list].sort((a, b) => {
      const ba = bucket(a), bb = bucket(b);
      if (ba !== bb) return ba - bb;
      return PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key);
    });
  }

  window.render = { card, sortProducts, toggle };
})();
```

### Step 3: Extend `public/assets/style.css`
Add card / metric / group styles. Port from Python's `_html_shell()` CSS verbatim where possible. Required selectors:
```css
.product-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  margin-bottom: 16px;
}
.product-card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 12px 0 0 12px;
}
.product-card.up::before    { background: var(--accent-green); }
.product-card.down::before  { background: var(--accent-red); }
.product-card.flat::before  { background: var(--text-muted); }

.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.product-name { margin: 0; font-size: 18px; }
.trend-emoji { font-size: 20px; }
.verb-badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; background: var(--bg-app); }
.verb-badge.up   { background: rgba(95,201,146,0.15); color: var(--accent-green); }
.verb-badge.down { background: rgba(255,99,99,0.15); color: var(--accent-red); }

.hero { margin-bottom: 16px; }
.hero-label { color: var(--text-muted); font-size: 13px; }
.hero-value { font-size: 28px; font-weight: 600; }
.hero-delta { font-size: 14px; }

.pinned, .details, .group-metrics { display: flex; flex-direction: column; gap: 6px; }
.metric-row {
  display: grid; grid-template-columns: 1fr auto auto; gap: 12px;
  padding: 6px 0; border-bottom: 1px dashed var(--border); font-size: 14px;
}
.metric-label { color: var(--text-muted); }
.metric-value { font-variant-numeric: tabular-nums; }
.metric-delta { font-variant-numeric: tabular-nums; min-width: 80px; text-align: right; }

.toggle-details {
  margin-top: 12px; background: transparent; color: var(--accent-blue);
  border: none; cursor: pointer; padding: 4px 0; font-size: 13px;
}
.details { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.details.open { max-height: 2000px; }

.metric-group {
  border-left: 2px solid var(--accent-blue); padding-left: 12px; margin: 12px 0;
  background: rgba(85,179,255,0.04); border-radius: 0 8px 8px 0;
}
.group-label {
  font-size: 12px; font-weight: 600; color: var(--accent-blue);
  text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 0 4px;
}
```

### Step 4: Tests `tests/render.test.html`
```html
<!doctype html><html><head><meta charset="utf-8"><title>render tests</title>
<style>body{background:#07080a;color:#e7e7e7;font-family:monospace;padding:24px}#results>div{margin:4px 0}</style>
</head><body>
<h1>render.js tests</h1><div id="results"></div>
<script src="lib/test-runner.js"></script>
<script src="../public/js/compute.js"></script>
<script src="fixtures/sample-rows.js"></script>
<script src="../public/js/extractors.js"></script>
<script src="../public/js/render.js"></script>
<script>
const F = window.fixtures;
const R = window.render;
const E = window.extractors;

test("card: returns string with product class", () => {
  const html = R.card(E.hose(F.fullRow, F.prevRow, F.fullHistory), 0);
  assert(typeof html === "string");
  assert(html.includes("product-card"));
  assert(html.includes("data-key=\"hose\""));
});

test("card: M+ group label rendered", () => {
  const html = R.card(E.margin(F.fullRow, F.prevRow, F.fullHistory), 0);
  assert(html.includes('class="group-label">M+'));
});

test("card: D+ group label rendered", () => {
  const html = R.card(E.phaisinh(F.fullRow, F.prevRow, F.fullHistory), 0);
  assert(html.includes('class="group-label">D+'));
});

test("inverse: positive delta with inverse:true gets 'down' class", () => {
  const fakeProduct = {
    key: "test", name: "Test", verb: "tăng",
    headline_label: "x", headline_value: "1", headline_delta: "+1",
    sub_metrics: [{ label: "Cancel", value: "10 KH", delta: "(+5 KH)", important: false, group: "D+", inverse: true }]
  };
  const html = R.card(fakeProduct, 0);
  assert(html.includes('class="metric-delta down">'), "expected down class for inverse positive delta");
});

test("inverse: negative delta with inverse:true gets 'up' class", () => {
  const fakeProduct = {
    key: "test", name: "Test", verb: "giảm",
    headline_label: "x", headline_value: "1", headline_delta: "-1",
    sub_metrics: [{ label: "Cancel", value: "10 KH", delta: "(-5 KH)", important: false, group: "D+", inverse: true }]
  };
  const html = R.card(fakeProduct, 0);
  assert(html.includes('class="metric-delta up">'));
});

test("sortProducts: tang -> giu -> giam order", () => {
  const list = [
    { key: "scash", verb: "giảm" },
    { key: "hose", verb: "tăng" },
    { key: "margin", verb: "giữ nguyên mức" },
  ];
  const sorted = R.sortProducts(list);
  assertEq(sorted.map(p => p.key), ["hose", "margin", "scash"]);
});

window.runTests();
</script>
</body></html>
```

### Step 5: Wire script tag
In `public/index.html`, after extractors.js add:
```html
<script src="js/render.js"></script>
```

### Step 6: Manual visual smoke test (no integration yet)
After deploy:
- Open dashboard preview URL.
- In console: `document.querySelector('#daily .content').innerHTML = window.render.card(window.extractors.margin(window.STATE.daily.at(-1), window.STATE.daily.at(-2), window.STATE.daily), 0)`
- Should see styled card with M+ group section visible after clicking "Xem chi tiết".

### Step 7: Commit + push
```bash
git checkout -b feat/07-card-render
git add public/js/render.js public/assets/style.css tests/ public/index.html
git commit -m "feat(render): port render_card + groups + inverse"
git push -u origin feat/07-card-render
```

## Verification
- `tests/render.test.html` all green.
- Manual smoke test in console renders a card.
- No console errors on dashboard load.

## When to STOP and ASK (Think Before Coding — Principle 1)
- Python's `render_card` uses HTML structure not obvious from a quick read → quote in log.md, ask before guessing.
- CSS variable naming differs between `_html_shell()` and CONTEXT.md → keep CONTEXT.md as source of truth, ask if conflict is meaningful.
- `escapeHtml` is fine for label text but Vietnamese delta strings include en-dash `−` etc. — verify `deltaClass` handles both `-` and `−`.

## After Completion
Update log.md T07 entry:
- Files changed: list
- Tests: X/Y passing
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if manual smoke test renders correctly + tests green
- Set Status = `review`
