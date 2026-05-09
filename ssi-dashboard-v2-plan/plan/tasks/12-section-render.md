# T12 — Section render + states + first-mount choreography

## Purpose
Compose the active-tab section: fetch the appropriate `Row[]` via the data hook, run all 6 extractors, sort the resulting cards (tăng / giữ / giảm bucket then priority), and render them in a responsive grid. Include loading skeleton, empty state, error state. Apply the first-mount-after-login choreography (stagger pop-in + count-up) ONLY once per session; subsequent renders are instant.

## Pre-conditions
- T06 merged (data hooks available)
- T11 merged (full Card with flip ready)
- T09 merged (Layout passes mode to children)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T12-section-render`
2. Create `src/components/Section.tsx` exporting `Section` (named). Props:
   ```ts
   type SectionProps = { mode: Mode };
   ```
3. Inside Section:
   - Pick the appropriate hook by mode: daily → useDaily, weekly → useWeekly, monthly → useMonthly
   - Hook returns `{ data, isLoading, isError, error, refetch }`
   - `isLoading` → render skeleton placeholders (6 glass card outlines with shimmer animation)
   - `isError` → render centered glass card with `<p>Lỗi tải dữ liệu</p>` + a Retry button calling `refetch()`
   - `data && data.length === 0` → render centered glass card with `<p>Chưa có dữ liệu</p>`
   - `data && data.length >= 1` → run extractors, sort, render `<Card>` grid
4. Compute helpers (in `src/lib/section.ts`):
   - `buildCards(rows: Row[]): ProductCard[]` — rows is ascending; today = `rows[rows.length-1]`, prev = `rows[rows.length-2] ?? null`. Returns 6 cards by calling each extractor with `(today, prev, rows)`.
   - `sortCards(cards: ProductCard[]): ProductCard[]` — three buckets by verb (tăng / giữ / giảm), within each bucket priority order: hose, margin, phaisinh, scash, sfund, momoi. Identical logic to v1's `render.sortProducts`.
5. Grid: `grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3` — responsive 1/2/3 columns.
6. **First-mount choreography:**
   - Add a global `useFirstMount(): boolean` hook in `src/lib/use-first-mount.ts` that stores a `firstMountConsumed` flag in a module-scope variable (or a Zustand-light singleton). Returns `true` only once per page-load lifetime, when the dashboard first renders post-unlock.
   - When `useFirstMount()` returns true, the Section uses an animation wrapper that:
     - Staggers each Card's `opacity` from 0→1 with delays of `index * 50ms`
     - Inside each Card, the headline number "counts up" from 0 to its final value over 1200ms ease-out (use a small custom `<CountUp>` component or a hook in `src/lib/use-count-up.ts`). The label / delta / sub-metrics do NOT count up.
   - On subsequent renders (tab switch, refresh, re-mount of Section), `useFirstMount()` returns false and rendering is instant — no stagger, no count-up.
7. Wire Section into Layout's children render-prop in App.tsx (or directly in Layout):
   ```tsx
   <DashboardLayout>{(mode) => <Section mode={mode} />}</DashboardLayout>
   ```
8. Tests `tests/section.test.tsx`:
   - Render Section with mocked hook returning fixture rows → assert 6 cards rendered
   - Mock hook in loading state → assert skeleton placeholders
   - Mock hook in error state → assert error card + retry button
   - Mock hook with empty data → assert "Chưa có dữ liệu"
   - Sort test: cards in correct bucket+priority order (write a unit test on `sortCards` in `tests/section.helpers.test.ts`)
   - First-mount test: render Section twice in same test file; first render has stagger class on cards, second does not (mock `useFirstMount` accordingly)
9. Run tests + typecheck — green
10. Commit: `T12: add Section render with states + first-mount choreography`
11. Request review

## Post-conditions
- Section uses correct hook per mode
- 6 cards render in sorted order on populated data
- Loading / error / empty states all render correct visuals
- First-mount-after-login: cards stagger + count-up exactly once per page-load
- Subsequent renders are instant
- All tests green

## Files in scope
- src/components/Section.tsx (create)
- src/lib/section.ts (create — buildCards, sortCards)
- src/lib/use-first-mount.ts (create)
- src/lib/use-count-up.ts (create — small hook)
- src/App.tsx (modify — wire Section into Layout)
- tests/section.test.tsx (create)
- tests/section.helpers.test.ts (create)

## Out of scope
- Refresh button (T16)
- Modal / edit flow (T13–T15)
- Period label display (covered as part of states / can be added in T16)

## Success criteria
- All 4 states render correctly (loading / empty / error / populated)
- Sort logic matches v1
- First-mount choreography works exactly once
- Reduced-motion preference disables the stagger and count-up

## Notes
The first-mount logic is subtle. Don't tie it to React state inside Section — that resets on every Section re-mount (which happens on tab switch). Use a module-scoped boolean OR `sessionStorage` cleared on hero unlock. Test BOTH first render AND second render in the same test process to confirm the gate works.
