# T05 — Port extractors + validation to TS with Vitest TDD

## Purpose
Port two related logic modules in one task: `extractors.ts` (the 6 product-card builders) and `validation.ts` (cell-level input validation). Both are pure functions with TDD. Extractors define card content INCLUDING the new Margin grouping (T+7 + Trading Plus + M+) and restored Vietnamese diacritics in every label.

## Pre-conditions
- T04 is merged to `feat/v2-react-rewrite` (compute layer available)
- `src/lib/types.ts` and `src/fixtures/sample-rows.ts` exist
- Can run in parallel with T04 if T04 is in progress, but reviewer must merge T04 first

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T05-port-extractors-validation`

### Extractors
2. Create `tests/extractors.test.ts` FIRST. Test cases must verify:
   - Each of 6 functions (`hose`, `margin`, `phaisinh`, `scash`, `sfund`, `momoi`) returns a `ProductCard` with the correct `key`, `name`, and at minimum an `headline_value` formatted via `fmt`
   - `margin(...)` `sub_metrics` array contains items with `group: "T+7"` for `Du nợ T+7` and `SLKH T+7`
   - `margin(...)` `sub_metrics` array contains items with `group: "Trading Plus"` for `Du nợ Trading Plus` and `SLKH Trading Plus`
   - `margin(...)` `sub_metrics` array contains items with `group: "M+"` for all 6 M+ metrics (register, active, du_no, co_du_no, giai_ngan, slkh_giai_ngan)
   - `margin(...)` ungrouped sub_metrics: `SLKH Margin` and `Dư nợ SPV`
   - `phaisinh(...)` includes `group: "D+"` on D+ metrics and `inverse: true` ONLY on `KH cancel D+`
   - All sub_metric `label` strings render full Vietnamese diacritics (e.g., `"Thị Phần CN"`, `"Thanh khoản thị trường"`, `"Phái Sinh"`)
3. Create `src/lib/extractors.ts` exporting 6 named functions: `hose`, `margin`, `phaisinh`, `scash`, `sfund`, `momoi`. Each takes `(today: Row, prev: Row | null, rows: Row[]) => ProductCard`. Use the v1 `extractors.js` as reference for column mappings — preserve ALL `important` flag logic, MANH_CFG configurations, and the `inverse: true` flag on `KH cancel D+`.
4. **Critical: restore Vietnamese diacritics on every label string.** The full mapping (refer to legacy `MAINTENANCE.md` for source-of-truth canonical Vietnamese). Examples:
   - `"Thi phan HOSE"` → `"Thị Phần HOSE"`
   - `"Thanh khoan thi truong"` → `"Thanh khoản thị trường"`
   - `"Du no T+7"` → `"Dư nợ T+7"`
   - `"Phai sinh"` → `"Phái Sinh"`
   - `"Du no Trading Plus"` → `"Dư nợ Trading Plus"`
   - `"KH cancel D+"` → `"KH hủy D+"`
   - `"SLKH co du no M+"` → `"SLKH có dư nợ M+"`

### Validation
5. Create `tests/validation.test.ts` FIRST. Test cases must verify:
   - Type error: non-numeric input on a numeric column → severity `"error"` with revert message
   - Range warn: percent column value > 1 (because % is decimal in DB) → severity `"warn"`
   - Range warn: negative count column → severity `"warn"`
   - Outlier: value with robust z-score >= 3 vs history → severity `"outlier"`
   - Date format: invalid `ngay` string → severity `"error"`
   - Inverse-aware logic does NOT live here (that's display-only in render)
   - Flat history fallback: if MAD = 0, do not flag every value as outlier (use a sane fallback)
6. Create `src/lib/validation.ts` exporting `validateCell(field: string, value: unknown, history: (number | null)[]): CellValidation`
7. Run `npm run test` — all green
8. Run `npm run typecheck` — exits 0
9. Commit incrementally: `T05: tests for extractors`, `T05: implement extractors with VN diacritics`, `T05: tests for validation`, `T05: implement validation`, etc.
10. Request review

## Post-conditions
- `src/lib/extractors.ts` exports all 6 functions with `(today: Row, prev: Row | null, rows: Row[]) => ProductCard` signature
- `src/lib/validation.ts` exports `validateCell` with the signature above
- `tests/extractors.test.ts` has at least 12 cases (2 per product), all green
- `tests/validation.test.ts` has at least 6 cases, all green
- Every label string in extractors output is Vietnamese-diacritics-correct (manually verify a sample of 10 labels by eye — UTF-8 encoding required)
- `margin(...)` returns sub_metrics with exactly 3 distinct `group` values: `"T+7"`, `"Trading Plus"`, `"M+"`
- No `any` types
- No React or DOM imports

## Files in scope
- src/lib/extractors.ts (create)
- src/lib/validation.ts (create)
- tests/extractors.test.ts (create)
- tests/validation.test.ts (create)

## Out of scope
- Card rendering (T10/T11)
- Actual Supabase integration (T06)
- Data grid integration of validation (T14)

## Success criteria
- 18+ total tests passing across both modules
- A snapshot of `margin(...)` output shows exactly 3 group sections
- Full Vietnamese label coverage verified by eye

## Notes
Use the v1 `extractors.js` and `validation.js` (under `public/js/` on `main`) as your literal reference, but treat them as untrusted — v1 ASCII-stripped labels because of an encoding workaround that never got reverted. v2 must NOT do that. The fixture from T03 should already have outlier values for testing — leverage them.
