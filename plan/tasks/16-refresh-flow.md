# T16 — Refresh flow (per-tab button + auto-stale-day + cooldown)

## Purpose
Add the manual "↻ Tải lại" button per section that re-fetches the active mode, plus the silent auto-refresh-on-new-day behavior from v1 (if the calendar day has changed since last fetch, re-fetch all 3 modes once on app open). Manual refresh has a 5-second cooldown.

## Pre-conditions
- T12 merged (Section render works)
- T06 merged (data hooks support `refetch()`)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T16-refresh-flow`
2. Add a `<RefreshButton>` component in `src/components/SectionHeader.tsx` (or co-located with `NhapLieuButton` from T13). Glass pill style matching Nhập liệu. Label "↻ Tải lại" with diacritics. Props:
   ```ts
   type RefreshButtonProps = { mode: Mode };
   ```
3. Behavior:
   - Click → confirm via shadcn `<AlertDialog>` "Tải lại dữ liệu <ngày/tuần/tháng>?"
   - Confirm → call `queryClient.invalidateQueries({ queryKey: [mode] })`
   - Set local `cooldownUntil: Date` 5 seconds in the future, disable button until then
   - Disabled button shows different visual: opacity-50, cursor-not-allowed
4. Auto-stale-day: in `src/lib/use-auto-stale-refresh.ts`, export `useAutoStaleRefresh()` that runs once on App mount:
   - Read `localStorage.getItem("ssi-last-refresh-date")`
   - If absent or differs from today's `YYYY-MM-DD`, invalidate all 3 query keys (`["daily"]`, `["weekly"]`, `["monthly"]`) silently and write today's date to localStorage
   - No UI feedback for this — silent reload
5. Wire `useAutoStaleRefresh()` in `App.tsx` after the unlocked state turns true (only run when user has logged in).
6. Place `<RefreshButton>` in the section header next to `<NhapLieuButton>`.
7. Tests `tests/refresh-flow.test.tsx`:
   - Click refresh → confirm dialog appears
   - Confirm → queryClient.invalidateQueries called with correct queryKey
   - Within 5s of refresh → button is disabled
   - After 5s → button enabled again
   - useAutoStaleRefresh: with localStorage date matching today → no invalidation; with different date → invalidation called
8. Run tests + typecheck — green
9. Commit: `T16: add refresh button + auto-stale-day behavior`
10. Request review

## Post-conditions
- Refresh button visible in each section header
- Click → confirm → re-fetch only that mode
- 5-second cooldown enforced
- Auto-stale fires once per page-load when calendar day differs from last
- 5+ test cases pass

## Files in scope
- src/components/SectionHeader.tsx (modify — add RefreshButton; or new file)
- src/lib/use-auto-stale-refresh.ts (create)
- src/App.tsx (modify — wire useAutoStaleRefresh after unlock)
- tests/refresh-flow.test.tsx (create)

## Out of scope
- Global "refresh all" button — out of scope, per-section only
- Pull-to-refresh on mobile — out of scope
- Real-time subscriptions via Supabase Realtime — out of scope

## Success criteria
- Manual refresh works per section with cooldown
- Auto-stale fires silently on day change
- Confirm dialog uses Vietnamese diacritics
- Tests green

## Notes
The 5-second cooldown is a soft anti-spam guard. Use a `useState<number>` for `cooldownUntil` (epoch ms) and check `Date.now() < cooldownUntil` to compute disabled state. Re-render every second while cooling down via a 1s interval — but cancel the interval after cooldown expires to avoid wasted renders.
