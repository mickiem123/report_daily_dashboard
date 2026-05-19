# Task 12: CRUD flow (add / edit / delete + Supabase save)

> Depends on: 11
> Estimated complexity: M
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Make the grid persist edits to Supabase: cell edits debounce-save via `upsert` keyed by `ngay`, an "Add row" button appends a new editable row, a per-row "Delete" button removes a row from Supabase after confirmation. After any successful write, re-fetch + re-render that section's cards so the dashboard reflects the change.

## Success Criteria
- [ ] Cell edit (with severity != "error") triggers a debounced 1-second `upsert` on the row's `ngay`.
- [ ] An "Add row" button appends an empty row to the grid; once `ngay` + at least one numeric value present, save runs.
- [ ] Each row has a "🗑" delete button that triggers `confirm("Xóa dòng <ngay>?")` → on OK, `DELETE` from Supabase.
- [ ] After any successful save / delete, that section's `STATE[mode]` is refreshed and cards re-render.
- [ ] Saving without a `ngay` is blocked (shows alert, no Supabase call).
- [ ] Save errors surface visibly (toast or alert) and do not corrupt the grid.
- [ ] Manual end-to-end smoke confirmed: edit a row → reopen page → edit persists.

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T11 done — validation runs on cell edit.
- [ ] T10's Tabulator `cellEdited` callback can be extended (it currently only validates).
- [ ] Executor has fetched current Supabase JS client docs via context7 to confirm `.upsert(row, { onConflict: 'ngay' })` and `.delete().eq('ngay', val)` signatures for v2.x.

### Post-conditions (verify after completing)
- [ ] Edit cell → wait 1s → Supabase Table Editor shows updated value.
- [ ] Add row + fill ngay + 1 cell → save → row appears in Supabase.
- [ ] Delete row → confirm → row gone from Supabase + grid + cards.
- [ ] Page reload → all changes persist.
- [ ] Cards re-render after each successful save (e.g., HOSE card delta value changes if you edit `thi_phan_co_so`).

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `public/js/grid.js` (extend with save/delete logic)
- `public/js/main.js` (export a `reloadSection(mode)` helper grid.js can call)
- `public/index.html` (add per-section "Add row" button)
- `public/assets/style.css` (delete button + add row button styling)

**Files NOT to touch:**
- `compute.js`, `extractors.js`, `render.js`, `validation.js`, `config.js`.
- `supabase_schema.sql`.

## Steps

### Step 1: Expose a reusable `reloadSection` helper in main.js
Refactor part of `loadAll()` so a single section can be re-fetched. Add to `main.js`:
```js
async function reloadSection(mode) {
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const rows = await fetchTable(client, TABLES[mode]);
  window.STATE[mode] = rows;
  renderSection(mode);
}
window.reloadSection = reloadSection;
```
This lets grid.js refresh the cards after a save without doing all 3 sections.

### Step 2: Add Supabase write helpers to grid.js
At top of `grid.js` IIFE, add:
```js
const TABLE_NAMES = {
  daily: "daily_metrics",
  weekly: "weekly_metrics",
  monthly: "monthly_metrics",
};

function getClient() {
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// Returns a clean copy of the row: drop empty strings, drop the `id` field
// (Supabase manages it), and ensure ngay is a non-empty string.
function sanitizeRow(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "id" || k === "pushed_at") continue;
    if (v === "" || v === undefined) {
      out[k] = null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function upsertRow(mode, row) {
  const clean = sanitizeRow(row);
  if (!clean.ngay) {
    alert("Cần có giá trị 'Ngày' trước khi lưu.");
    return false;
  }
  const client = getClient();
  const { error } = await client
    .from(TABLE_NAMES[mode])
    .upsert(clean, { onConflict: "ngay" });
  if (error) {
    console.error("upsert failed:", error);
    alert(`Lưu thất bại: ${error.message}`);
    return false;
  }
  return true;
}

async function deleteRow(mode, ngay) {
  const client = getClient();
  const { error } = await client
    .from(TABLE_NAMES[mode])
    .delete()
    .eq("ngay", ngay);
  if (error) {
    console.error("delete failed:", error);
    alert(`Xóa thất bại: ${error.message}`);
    return false;
  }
  return true;
}
```

### Step 3: Add debounced save on cellEdited
Replace the simple `cellEdited` from T11 with this composite handler in `init(mode)`:
```js
const saveTimers = new Map(); // ngay -> timeoutId

function scheduleSave(mode, ngay, getRow) {
  if (saveTimers.has(ngay)) clearTimeout(saveTimers.get(ngay));
  const t = setTimeout(async () => {
    saveTimers.delete(ngay);
    const ok = await upsertRow(mode, getRow());
    if (ok) {
      // Re-render cards for this section so deltas reflect new values.
      if (typeof window.reloadSection === "function") {
        try { await window.reloadSection(mode); } catch (e) { console.warn(e); }
      }
    }
  }, 1000);
  saveTimers.set(ngay, t);
}
```
And in the `cellEdited` callback (extend, do not replace, T11's validation block):
```js
cellEdited: function (cell) {
  const field = cell.getField();
  const value = cell.getValue();
  const allRows = window.STATE[mode] || [];
  const result = window.validation.validateCell(field, value, allRows);

  // (visual feedback from T11 — keep it)

  if (result.severity === "error") return; // do not save errored cells

  const rowData = cell.getRow().getData();
  if (!rowData.ngay) return; // need a date before we can upsert
  scheduleSave(mode, rowData.ngay, () => cell.getRow().getData());
},
```

### Step 4: Add row controls to grid columns
Extend `buildColumns()`:
```js
cols.push({
  title: "",
  field: "_actions",
  width: 60,
  hozAlign: "center",
  headerSort: false,
  formatter: () => '<button class="row-delete" title="Xóa dòng">🗑</button>',
  cellClick: async function (e, cell) {
    if (!e.target.classList.contains("row-delete")) return;
    const row = cell.getRow();
    const ngay = row.getData().ngay;
    if (!ngay) {
      // Empty unsaved row — just remove from grid
      row.delete();
      return;
    }
    if (!confirm(`Xóa dòng ${ngay}?`)) return;
    const ok = await deleteRow(mode, ngay);
    if (ok) {
      row.delete();
      if (typeof window.reloadSection === "function") {
        try { await window.reloadSection(mode); } catch (err) { console.warn(err); }
      }
    }
  },
});
```

### Step 5: Add "Add row" button per section
HTML — inside each `.section-actions`:
```html
<button class="btn-add-row hidden" data-mode="daily" onclick="window.grid.addRow('daily')">+ Thêm dòng</button>
```
Show this button only after `canEdit_<mode>` is set (so it doesn't appear before password). In grid.js, after a successful auth in `toggle()`:
```js
const addBtn = document.querySelector(`.btn-add-row[data-mode="${mode}"]`);
if (addBtn) addBtn.classList.remove("hidden");
```

Add `addRow`:
```js
function addRow(mode) {
  if (sessionStorage.getItem(`canEdit_${mode}`) !== "1") {
    alert("Bạn cần đăng nhập trước.");
    return;
  }
  const t = tables[mode];
  if (!t) {
    // Grid not yet open — open it first
    toggle(mode);
    return;
  }
  t.addRow({}, false); // append at bottom, not top
}
```
Update `window.grid` export:
```js
window.grid = { toggle, refresh, addRow, _tables: tables };
```

### Step 6: CSS
```css
.btn-add-row.hidden { display: none; }
.btn-add-row { background: var(--bg-surface); color: var(--accent-green); border: 1px solid var(--accent-green); padding: 8px 14px; border-radius: 6px; cursor: pointer; }
.btn-add-row:hover { background: rgba(95,201,146,0.1); }
.tabulator .row-delete { background: transparent; border: none; cursor: pointer; font-size: 16px; padding: 0; opacity: 0.6; }
.tabulator .row-delete:hover { opacity: 1; }
```

### Step 7: Manual end-to-end smoke test (no automated test for write side-effects — too entangled with live DB)
Run on the preview URL:
1. Open dashboard → daily section loads cards.
2. Click "⊞ Nhập liệu" → enter `123`.
3. Edit a numeric cell → wait 1s → Supabase Table Editor shows updated value (verify in another tab).
4. After 1s, the daily card for that product should show the new value reflected.
5. Click "+ Thêm dòng" → empty row appears at bottom.
6. Type tomorrow's date in `ngay` + 1 numeric → wait 1s → row appears in Supabase.
7. Click 🗑 on the new row → confirm → row gone from grid + Supabase + card re-renders.
8. Reload page → all changes persist.

### Step 8: Commit + push
```bash
git checkout -b feat/12-crud
git add public/
git commit -m "feat(crud): debounced upsert + delete + add row + reload"
git push -u origin feat/12-crud
```
PR → confirm preview → merge.

## Verification
- DB writes confirmed in Supabase Table Editor.
- Cards re-render after save (delta values change).
- No data corruption: edit a cell, refresh page, value matches what was edited.
- Delete fully removes row from DB and grid.
- Spam-edit a single cell quickly → only one Supabase call goes out (debounce works) — verify in DevTools Network tab.

## When to STOP and ASK (Think Before Coding — Principle 1)
- `cellEdited` callback doesn't expose the full row → use `cell.getRow().getData()` (Tabulator v6.3 supports this); if API differs in installed version, ask before workaround.
- Concurrent edits scenario (two teammates edit same row simultaneously) — last-write-wins is the spec. Don't add transactions / version columns. If user later asks for protection, escalate as new task.
- Supabase returns RLS error — STOP, do not disable RLS. Verify T02 created `public_write_*` policies.
- User wants soft-delete (mark deleted, don't remove) — STOP, this is OUT OF SCOPE per MASTER. Confirm with user if they want it added.
- Adding a row in the grid that conflicts with an existing `ngay` — `upsert` will UPDATE the existing row. This may surprise the user. Confirm copy: maybe show a warning before saving when `ngay` already exists in `window.STATE[mode]`.

## After Completion
Update log.md T12 entry:
- Files changed: list
- Tests: end-to-end smoke completed (no automated tests — DB-coupled)
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if smoke test 1-8 all pass
- Set Status = `review`
