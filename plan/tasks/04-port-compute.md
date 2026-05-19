# T04 — Port compute logic to TS with Vitest TDD

## Purpose
Port the v1 `compute.js` module to typed TypeScript with full Vitest coverage. This module is the math + formatting backbone every card depends on. TDD: write tests first, then implementation. All Vietnamese number/percent formatting must match v1 exactly.

## Pre-conditions
- T03 is merged to `feat/v2-react-rewrite` (types are available)
- `src/fixtures/sample-rows.ts` exists with 22 daily rows
- `vitest.config.ts` is configured

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T04-port-compute`
2. Reference the v1 source at `main` branch path `public/js/compute.js` (read-only — do not modify v1)
3. Create `tests/compute.test.ts` FIRST — write failing tests for every export listed below before any implementation
4. Test coverage must include:
   - `clean(v)`: nullish input, string input, Date input, sentinel `< -2_000_000_000`, valid number passthrough
   - `fmt(v, unit)`: `%` (decimal → "8,52%"), `tỷ` (e.g., 1234.5 → "1.235 tỷ"), `KH` / `HĐ` / `tài khoản` (with commas as thousand separators), `null` → "N/A"
   - `fmt` tolerates legacy mojibake unit token `tá»·` and normalizes to `tỷ`
   - `diff(today, prev, unit)`: 5 verbs (`tăng mạnh` >5%, `tăng` >0, `giữ nguyên mức` =0, `giảm` <0, `giảm mạnh` <-5%); preposition swap to `lên mức` / `về mức` for `%` unit; null inputs return N/A shape
   - `detectTrend(colName, rows)`: `📈` for 3+ consecutive increases, `📉` for 3+ consecutive decreases, `🔴` for single-day drop > 15%, `""` otherwise. Sudden drop has precedence over streaks.
   - `median`, `mad`, `robustZ`: standard statistical correctness on flat / monotonic / single-outlier series
   - `isManhDelta(today, prev, history, cfg)`: floor mode (return true if `|delta| >= floor`), z-score mode (return true if `|z| >= k_sigma`), `pct` vs `pp` calculation modes
   - `metricHistory(colName, rows, todayVal, window=20)`: returns up to window+1 prior values, removes today's value if duplicated at end
   - `serialToDate(serial)`: Excel serial → Date (1900 epoch base date)
   - `weekdayVn(date)`: Mon–Fri returns "T2"–"T6"; Saturday & Sunday roll to "T6" (the v1 behavior)
5. Create `src/lib/compute.ts` with named exports for every function under test:
   `clean`, `normalizeUnit`, `fmt`, `diff`, `detectTrend`, `isManhDelta`, `metricHistory`, `serialToDate`, `weekdayVn`, `mad`, `robustZ`, `median`
6. Implementation must produce identical outputs to v1 on all test cases. Translate but do not behavior-change. Use `Row` type from `@/lib/types` where helpful (history accepts `(number | null)[]`).
7. Run `npm run test` — all green
8. Run `npm run typecheck` — exits 0
9. Commit messages may be granular: `T04: tests for fmt`, `T04: implement clean+fmt`, etc. Final commit completes the task.
10. Request review

## Post-conditions
- `src/lib/compute.ts` exports all 12 named functions listed in step 5 with full TypeScript signatures (no `any`)
- `tests/compute.test.ts` has at least 25 test cases, all green
- Vitest output shows `compute.test.ts` passing 25+
- All formatter outputs use Vietnamese-locale separators: thousands `.` and decimal `,` (e.g., `1.234,5` reads as one-thousand-two-hundred-thirty-four-point-five)
- No imports of React, DOM, or any browser API in `src/lib/compute.ts`

## Files in scope
- src/lib/compute.ts (create)
- tests/compute.test.ts (create)

## Out of scope
- Extractors, validation, components, data layer

## Success criteria
- All 25+ tests pass
- TypeScript strict mode clean
- Logic layer has zero React/DOM dependencies (verifiable: `grep -r "from 'react'" src/lib/compute.ts` returns nothing)

## Notes
v1's `compute.js` is the reference but writes to `window.compute`. Drop that pattern entirely — TypeScript named exports replace global window namespacing. If v1 has subtle bugs (e.g., mojibake `tá»·` tolerance was added late as a hotfix), preserve the behavior in v2 to keep imported legacy CSV data rendering correctly. When in doubt about a specific v1 output, prefer matching v1's exact string over "what looks correct" — the user already accepted those outputs.
