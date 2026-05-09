# T15 — CRUD: upsert / delete / add row + debounce + toast

## Purpose
Wire the DataGrid handlers from T14 to the actual Supabase mutations from T06. Edits debounce 1 second before saving. After successful save, show "Đã lưu" toast bottom-right (slides up + fade). On save error, show error toast with retry. Cache invalidation re-fetches the affected mode so cards reflect the change.

## Pre-conditions
- T14 merged (DataGrid with stub handlers exists)
- T06 merged (mutations.ts available)
- shadcn `Toast` primitive installed (T02)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T15-crud-flow`
2. Create `src/lib/use-debounced-save.ts` exporting `useDebouncedSave<T>(saveFn: (val: T) => Promise<void>, delay = 1000)` — returns a `(val: T) => void` that schedules the save and cancels prior pending. Also returns the current `status: "idle" | "saving" | "saved" | "error"` and the most recent error.
3. Create `src/components/Toast.tsx` — a thin wrapper using shadcn's `useToast` hook. Helper functions `toastSaved()` and `toastError(message: string)`.
4. In `Section.tsx`, replace the stubbed handlers with real ones:
   - **onCellEdit** — collect cell changes per row in a local map keyed by `ngay`. Use `useDebouncedSave` per row. When debounce fires, call `upsertRow(mode, { ngay, ...changes })`. On success → `toastSaved()` + invalidate `[mode]` query. On error → `toastError(err.message)`.
   - **onAddRow** — same as upsert with the new ngay key (Supabase upsert on `ngay` UNIQUE handles both insert and update).
   - **onDeleteRow** — call `deleteRow(mode, ngay)`. On success → invalidate query. On error → toast.
5. Use TanStack Query's `queryClient.invalidateQueries({ queryKey: [mode] })` from inside the handlers (`useQueryClient` hook).
6. Optimistic update: NOT required for MVP. Last-write-wins is acceptable per CONTEXT.md and prior decisions. Keep it simple.
7. Toast styling: glass pill, position bottom-right. shadcn ToastProvider needs to be mounted at App level — add it in `src/App.tsx` if not already there.
8. Tests `tests/crud-flow.test.tsx`:
   - Mock `upsertRow` to resolve → onCellEdit triggers save after 1s → assert `toastSaved` called
   - Mock `upsertRow` to reject → assert `toastError` called with the error message
   - onDeleteRow calls deleteRow with correct mode + ngay
   - Multiple rapid edits to same cell within 1s → only ONE upsertRow call (debounce works)
   - Test the debounce hook directly in `tests/use-debounced-save.test.ts`: 3 calls in 100ms → 1 saveFn invocation after delay
9. Run tests + typecheck — green
10. Commit: `T15: wire CRUD + debounced save + toast feedback`
11. Request review

## Post-conditions
- Editing a cell, waiting 1 second → `upsertRow` called and "Đã lưu" toast appears bottom-right
- Adding a new row works via the same debounce path
- Deleting a row works via confirm + `deleteRow`
- Errors surface as toast with message
- Cards refresh after save (because query is invalidated)
- 5+ test cases pass

## Files in scope
- src/lib/use-debounced-save.ts (create)
- src/components/Toast.tsx (create)
- src/components/Section.tsx (modify — replace stub handlers with real)
- src/App.tsx (modify if needed — add ToastProvider)
- tests/crud-flow.test.tsx (create)
- tests/use-debounced-save.test.ts (create)

## Out of scope
- Refresh button (T16)
- Cooldown (T16)
- Optimistic updates
- Audit log / undo (out of scope per MVP)

## Success criteria
- Debounce coalesces rapid edits
- Toast renders correctly with VN diacritics
- Cache invalidates → cards on dashboard reflect changes after modal close (or even while open)
- All tests green

## Notes
The 1-second debounce means a user typing across multiple cells gets one save per cell once they pause. That's the v1 UX and it works. Don't try to coalesce across cells — keep one debounce per (ngay, field) cell to avoid lost updates. Use a `Map<string, Timeout>` keyed by `${ngay}:${field}` if needed.
