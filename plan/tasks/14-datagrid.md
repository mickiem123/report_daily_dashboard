# T14 — DataTable in modal + cell validation UI

## Purpose
Build the editable data grid that lives inside the modal: shadcn DataTable (TanStack Table) showing the last ~20 rows for the active mode plus one blank row at the bottom for adding today's entry. Cell-level validation from T05's `validateCell` runs on each cell change. Errors block the change and revert; warnings/outliers show a colored border with tooltip.

## Pre-conditions
- T05 merged (validation.ts available)
- T13 merged (Modal shell ready)
- T02 merged (shadcn `Table` primitive installed)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T14-datagrid`
2. Create `src/components/DataGrid.tsx` exporting `DataGrid` (named). Props:
   ```ts
   type DataGridProps = {
     mode: Mode;
     rows: Row[];
     onCellEdit: (ngay: string, field: keyof Row, newValue: number | string | null) => void;
     onAddRow: () => void;
     onDeleteRow: (ngay: string) => void;
   };
   ```
3. Use TanStack Table's `useReactTable` hook to build column defs. Column list:
   - First column `ngay` (frozen, type=date input). Editable ONLY when the row is the blank "add new" row. Existing rows have ngay locked.
   - Then every numeric Row field as its own column. Headers should show the Vietnamese label (e.g., "Thị Phần CN", not snake_case). Provide a small `FIELD_LABELS: Record<keyof Row, string>` constant in `src/lib/field-labels.ts` for this mapping.
   - Last column: a delete button (trash icon from lucide-react)
4. % columns (e.g., `thi_phan_co_so`, `thi_phan_phai_sinh`, etc.) display as `value * 100` with a `%` suffix; on edit, divide by 100 before saving (round-trip mutator). Maintain a list `PERCENT_FIELDS: Set<keyof Row>` in same file.
5. Cell rendering: each editable cell uses an inline `<input>` (or shadcn `<Input>`) that triggers `onCellEdit` on `onBlur` and `onChange`. After every change, run `validateCell(field, newValue, history)` where history is a slice of prior values from the same column.
   - severity `"error"` → revert the cell value, show a red toast "Giá trị không hợp lệ" (in DataGrid local UI; not the same toast as T15 save)
   - severity `"warn"` or `"outlier"` → keep the value, add a colored border to the cell (warn=yellow, outlier=orange) and a tooltip on hover with `validation.message`
6. Use shadcn `<Tooltip>` primitive (install via `npx shadcn@latest add tooltip` if not yet — extend T14 to handle that install in one of its commits).
7. The blank "add row" sits at the bottom with `ngay` editable. When user enters a valid date and at least one numeric value, that row's edit triggers `onAddRow` (parent handles upsert in T15).
8. The delete button asks for confirmation via shadcn `<AlertDialog>` (install if not present): "Xác nhận xóa dòng <ngay>?" with confirm/cancel.
9. Render the DataGrid inside the Modal in Section.tsx by replacing the placeholder. The Section's local state owns `rows` (initialized from the hook's data) and stub `onCellEdit / onAddRow / onDeleteRow` handlers — actual mutations are wired in T15. Until T15 those handlers can `console.warn("T15 wires this")`.
10. Tests `tests/datagrid.test.tsx`:
    - Render with 5 fixture rows → assert correct row count + 1 blank row at bottom
    - Edit a numeric cell to a valid value → onCellEdit called with parsed number
    - Edit a numeric cell to "abc" → cell reverts, no onCellEdit call (or called with null)
    - Edit a percent cell to "8.52" → onCellEdit called with `0.0852` (round-trip)
    - Outlier value → cell has `data-severity="outlier"` attribute
    - Click delete → confirm dialog appears
11. Run tests + typecheck — green
12. Commit: `T14: add DataGrid with cell validation UI`
13. Request review

## Post-conditions
- DataGrid renders inside Modal, columns match Row schema with VN labels
- ngay editable only on add-row
- Numeric / percent / count fields all edit-and-revert correctly
- Validation severities visually distinguish: error (revert), warn (yellow border), outlier (orange border)
- Tooltip on warn/outlier shows message
- Delete button + confirm dialog functional
- 6+ test cases pass

## Files in scope
- src/components/DataGrid.tsx (create)
- src/lib/field-labels.ts (create — FIELD_LABELS map + PERCENT_FIELDS set)
- src/components/Section.tsx (modify — pass rows + handler stubs to DataGrid)
- src/components/ui/tooltip.tsx (create via shadcn add)
- src/components/ui/alert-dialog.tsx (create via shadcn add)
- tests/datagrid.test.tsx (create)

## Out of scope
- Actual Supabase upsert / delete (T15)
- Save toast (T15)
- Refresh button in section header (T16)
- Cooldown logic (T16)

## Success criteria
- Grid is keyboard-navigable (Tab between cells; Enter commits)
- VN labels in headers (no snake_case visible)
- Percent round-trip works
- All validation severities surface visually
- Tests green

## Notes
TanStack Table is headless; you control the markup completely. Use shadcn's Table primitive for the container/row/cell wrappers, and wire `useReactTable` for column defs + sorting (sorting can default to ngay descending). Don't try to use Tabulator — it was v1 and is dropped per CONTEXT.md.
