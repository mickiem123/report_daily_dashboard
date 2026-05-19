# DataGrid Input Focus Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the table editor so typing in a cell never loses focus after one character, including on the live deployed app.

**Architecture:** Reproduce the bug on the live deployment, capture a deterministic failing regression test in `DataGrid`, then apply the smallest code change in `DataGrid`/render identity to preserve input focus across rerenders. Verify with targeted tests and live browser interaction.

**Tech Stack:** React, TanStack Table, Vitest, Testing Library, agent-browser CLI

---

### Task 1: Reproduce and isolate focus-loss trigger

**Files:**
- Modify: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/docs/superpowers/plans/2026-05-12-datagrid-input-focus-stability.md`
- Test: live URL `https://5c9a8655.ssi-dashboard-v2.pages.dev`

- [ ] **Step 1: Reproduce bug on live page with deterministic interaction**

```bash
agent-browser open https://5c9a8655.ssi-dashboard-v2.pages.dev
agent-browser snapshot -i --json
# click "Nh?p li?u", click a numeric input cell, type multiple chars quickly
```

- [ ] **Step 2: Record exact trigger pattern (which column/row/state causes blur)**

```text
Capture whether blur occurs only when validation tooltip is present, only existing rows, or all cells.
```

- [ ] **Step 3: Identify root cause in component identity/composition**

```text
Map live behavior to DataGrid render path: input remount key, Tooltip trigger wrapper, or table row identity churn.
```

### Task 2: TDD regression before production change

**Files:**
- Modify: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/datagrid.test.tsx`
- Test: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/datagrid.test.tsx`

- [ ] **Step 1: Write a failing test for the exact live blur pattern**

```tsx
it("keeps focus while typing continuously in existing row cell after prior commit", async () => {
  const user = userEvent.setup();
  render(<DataGrid mode="daily" rows={makeRows()} onCellEdit={vi.fn()} onAddRow={vi.fn()} onDeleteRow={vi.fn()} {...defaultProps} />);
  const input = screen.getByTestId("cell-2026-04-08-gtgd_cs_ssi");

  await user.click(input);
  await user.type(input, "1234");

  expect(input).toHaveValue(expect.stringContaining("1234"));
  expect(document.activeElement).toBe(input);
});
```

- [ ] **Step 2: Run only this test and verify RED**

```bash
npm run test -- tests/datagrid.test.tsx --run
# Expected: FAIL on activeElement/value assertion reproducing focus loss
```

### Task 3: Minimal implementation fix

**Files:**
- Modify: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/src/components/DataGrid.tsx`
- Test: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan/tests/datagrid.test.tsx`

- [ ] **Step 1: Implement smallest change matching root cause**

```tsx
// Example fix shape (final fix depends on repro evidence):
// - stabilize row identity with getRowId
// - avoid wrapper that steals focus
// - avoid value/key patterns that remount inputs
```

- [ ] **Step 2: Run targeted tests and verify GREEN**

```bash
npm run test -- tests/datagrid.test.tsx --run
npm run typecheck
# Expected: PASS
```

- [ ] **Step 3: Re-test on live page with same manual sequence**

```bash
agent-browser open https://5c9a8655.ssi-dashboard-v2.pages.dev
agent-browser snapshot -i --json
# repeat typing steps in the same cell and verify no blur
```
