# T06 — Supabase client + TanStack Query data layer

## Purpose
Wire up the data layer that fetches `Row[]` from each Supabase table, exposes typed React Query hooks (`useDaily`, `useWeekly`, `useMonthly`), and provides mutation helpers (`upsertRow`, `deleteRow`). Components consume hooks; they do not call Supabase directly.

## Pre-conditions
- T03 is merged (types available)
- T02 is merged (`@supabase/supabase-js` and `@tanstack/react-query` installed)
- Supabase project from v1 still exists at the URL stored in `.env` (do not create a new project)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T06-data-layer`
2. Create `.env.example` at repo root with three keys:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-publishable-key-here
   VITE_WRITE_PASSWORD=123
   ```
3. Confirm `.env` is gitignored (T02 should have set this; verify)
4. Create `src/data/supabase.ts` exporting a singleton client:
   ```ts
   import { createClient } from "@supabase/supabase-js";
   const url = import.meta.env.VITE_SUPABASE_URL;
   const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
   if (!url || !key) throw new Error("Missing Supabase env vars");
   export const supabase = createClient(url, key);
   ```
5. Create `src/data/queries.ts` exporting:
   - `useDaily(): UseQueryResult<Row[]>`
   - `useWeekly(): UseQueryResult<Row[]>`
   - `useMonthly(): UseQueryResult<Row[]>`
   Each fetches the last 22 rows from its table ordered by `ngay DESC`, then `reverse()`s to ascending so the array's last element is the newest row (matches v1 / fixture convention). Use TanStack Query keys `["daily"]`, `["weekly"]`, `["monthly"]`. Default `staleTime: 0` (always re-fetch on invalidate) and `refetchOnWindowFocus: false`.
6. Create `src/data/mutations.ts` exporting:
   - `upsertRow(mode: Mode, row: Partial<Row> & { ngay: string }): Promise<void>` — calls `.upsert(payload, { onConflict: "ngay" })` against the correct table
   - `deleteRow(mode: Mode, ngay: string): Promise<void>` — calls `.delete().eq("ngay", ngay)`
7. Confirm `src/main.tsx` already wraps `<App />` in `QueryClientProvider` (T02 should have set this; if not, add it now and document in log.md as scope-corrective)
8. Smoke test: write `tests/data-layer.smoke.test.ts` using Vitest mock to confirm the table-name routing is correct (mode "daily" hits `daily_metrics`, etc.). Do NOT hit live Supabase in tests — mock it.
9. Run `npm run typecheck`, `npm run test` — both pass
10. Commit: `T06: add Supabase client + TanStack Query hooks + mutations`
11. Request review

## Post-conditions
- `src/data/supabase.ts`, `src/data/queries.ts`, `src/data/mutations.ts` exist
- `.env.example` documents the 3 env vars
- 3 query hooks return typed `UseQueryResult<Row[]>`
- 2 mutation helpers return `Promise<void>` and use the correct table per mode
- Smoke test confirms table-name routing without hitting live Supabase
- `npm run typecheck` exits 0
- All tests green

## Files in scope
- src/data/supabase.ts (create)
- src/data/queries.ts (create)
- src/data/mutations.ts (create)
- tests/data-layer.smoke.test.ts (create)
- .env.example (create or modify)

## Out of scope
- Cache invalidation strategy on save (handled in T15)
- Optimistic updates (out of scope, last-write-wins is fine for 3-person team)
- Error boundary components (out of scope)

## Success criteria
- Hooks importable as `import { useDaily } from '@/data/queries'`
- Vite env vars typed: add a `vite-env.d.ts` reference in `src/` augmenting `ImportMetaEnv` with the 3 keys (TypeScript strict mode requires this)
- Smoke test passes with mocked Supabase client

## Notes
Do NOT create a new Supabase project. The existing project URL `nalezuibxxgincrwznqy.supabase.co` and its anon key from v1 are reused as-is — only the FE env-var format changes (now `VITE_*` prefix because Vite). The user will populate `.env` locally; the executor should not commit a real `.env` file.
