# T03 — TypeScript contract + mock fixture

## Purpose
Define the canonical TypeScript types that every component and test will consume, plus a 22-row mock fixture that mirrors real Supabase data. This is the contract that lets the AI design tool produce visuals against fake-but-shape-correct data, and lets the executor wire components to the data layer without surprises.

## Pre-conditions
- T02 is merged to `feat/v2-react-rewrite`
- `src/lib/` exists (created during scaffold or this task)
- `src/fixtures/` exists (created during this task if absent)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T03-ts-contract-fixture`
2. Create `src/lib/types.ts` with these named exports:
   - `Row` — interface mirroring the Supabase row shape (43 fields after deprecated columns dropped). Mark all numeric metric fields as `number | null` (Supabase returns null for missing). `ngay: string` (ISO date). Refer to the original column list in the README of the legacy repo or `MAINTENANCE.md` if available.
   - `Status` — type alias `"up" | "down" | "flat"`
   - `SubMetric` — `{ label: string; value: string; delta: string; important: boolean; group?: string; inverse?: boolean }`
   - `ProductCard` — `{ key: string; name: string; trend_emoji: string; headline_label: string; headline_value: string; headline_delta: string; verb: string; sub_metrics: SubMetric[] }`
   - `Mode` — type alias `"daily" | "weekly" | "monthly"`
   - `ValidationSeverity` — type alias `"ok" | "warn" | "error" | "outlier"`
   - `CellValidation` — `{ severity: ValidationSeverity; message?: string }`
3. Create `src/fixtures/sample-rows.ts` exporting `sampleDailyRows: Row[]` containing exactly 22 rows ending with date `2026-05-07`. Values must be plausible:
   - market shares as decimals (e.g., `thi_phan_co_so: 0.0852` not `8.52`)
   - margin balances in tỷ (e.g., `tong_du_no_margin: 42074`)
   - account counts as integers (e.g., `slkh_margin: 23177`)
   - One earlier row should produce a "tăng mạnh" verb on margin and a "giảm" verb on at least one product when run through extractors (so the design tool sees both green and red statuses)
4. Also export `sampleWeeklyRows` (3 rows) and `sampleMonthlyRows` (3 rows) with the same shape but different periodicity in the `ngay` field
5. Run `npm run typecheck` — must pass
6. Commit with message: `T03: add TS contract types + 22-row mock fixture`
7. Request review

## Post-conditions
- `src/lib/types.ts` exports every type listed in step 2 with full type bodies, no `any`
- `src/fixtures/sample-rows.ts` exports 3 named arrays (`sampleDailyRows`, `sampleWeeklyRows`, `sampleMonthlyRows`)
- `sampleDailyRows.length === 22`
- `sampleDailyRows[21].ngay === "2026-05-07"`
- All rows pass typechecking against `Row[]`
- `npm run typecheck` exits 0

## Files in scope
- src/lib/types.ts (create)
- src/fixtures/sample-rows.ts (create)

## Out of scope
- Any compute, extraction, or component code — those are T04+
- Validation severity rules — those are T05

## Success criteria
- Types are exhaustively named exports, no implicit defaults
- Fixture rows cover at least: one rising metric (positive delta), one falling metric (negative delta), one zero-delta (flat), one null value, one outlier (>3σ from history)
- Fixture exports importable as `import { sampleDailyRows } from '@/fixtures/sample-rows'`

## Notes
The fixture is the single source of truth for the design tool. Anything you put here is what the designer will see. Make the row dates monotonic ascending (oldest to newest) to match how `compute.detectTrend` and `compute.metricHistory` expect the data ordered. Keep `Row` strictly aligned with the Supabase column names (snake_case) — the data-layer hooks in T06 will return objects matching this shape.
