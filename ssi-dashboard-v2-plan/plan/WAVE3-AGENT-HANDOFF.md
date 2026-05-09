# Wave 3 Agent Handoff (T08-T12)

## Current Baseline
- Repository root: `D:/Claude projects/daily_report`
- Project root for v2: `D:/Claude projects/daily_report/ssi-dashboard-v2-plan`
- Integration branch: `feat/v2-react-rewrite`
- Baseline commit before Wave 3: `7a722e9`
- Task status:
  - Done: `T01`-`T07`
  - Pending: `T08`-`T12`

## Non-Negotiable Contract
- Read first, in order:
  1. `ssi-dashboard-v2-plan/CLAUDE.md`
  2. `ssi-dashboard-v2-plan/AGENTS.md`
  3. `ssi-dashboard-v2-plan/plan/MASTER.md`
  4. `ssi-dashboard-v2-plan/plan/CONTEXT.md`
  5. `ssi-dashboard-v2-plan/plan/PREFLIGHT.md`
  6. `ssi-dashboard-v2-plan/plan/tasks/08-hero-landing.md` through `12-section-render.md`
- Logging protocol:
  - Update `ssi-dashboard-v2-plan/plan/log.md` dashboard row and task section for each task.
  - Fill Started/Finished/Reviewed/Files/Tests/Contradictions/Confidence.
- Branch model:
  - Preferred per-task branch from `feat/v2-react-rewrite`.
  - If executing directly on integration branch, explicitly record deviation in `log.md`.

## Wave 3 Execution Order
1. Parallel shell tasks:
   - `T08` Hero landing
   - `T09` Layout + tabs
   - `T10` Card front
2. Sequential integration tasks:
   - `T11` Card back + flip (depends on `T10`)
   - `T12` Section render + states + first-mount choreography (depends on `T09`, `T11`, and data layer from `T06`)

## File Ownership by Task
- `T08`:
  - `src/components/Hero.tsx`
  - `src/App.tsx`
  - `tests/hero.smoke.test.tsx`
- `T09`:
  - `src/components/Tabs.tsx`
  - `src/components/Layout.tsx`
  - `src/App.tsx`
  - `tests/tabs.smoke.test.tsx`
- `T10`:
  - `src/components/Card.tsx`
  - optional `src/lib/status.ts`
  - `tests/card.test.tsx`
- `T11`:
  - `src/components/Card.tsx`
  - `src/components/CardBack.tsx`
  - optional `src/styles/globals.css` utility additions
  - `tests/card-flip.test.tsx`
- `T12`:
  - `src/components/Section.tsx`
  - `src/lib/section.ts`
  - `src/lib/use-first-mount.ts`
  - `src/lib/use-count-up.ts`
  - `src/App.tsx`
  - `tests/section.test.tsx`
  - `tests/section.helpers.test.ts`

## Existing Interfaces You Must Reuse
- Types:
  - `src/lib/types.ts` (`Row`, `ProductCard`, `Mode`, etc.)
- Core logic:
  - `src/lib/compute.ts`
  - `src/lib/extractors.ts`
  - `src/lib/validation.ts`
- Data hooks/mutations:
  - `src/data/queries.ts` (`useDaily/useWeekly/useMonthly`)
  - `src/data/mutations.ts`
- Visual baseline:
  - `src/components/BgPattern.tsx`
  - `src/styles/globals.css`

## Required Behavior Constraints
- UTF-8 Vietnamese diacritics must be preserved in UI strings.
- Do not add charting libs.
- Keep logic layer (`src/lib/*`) React/DOM free.
- Use named exports for new modules.
- Tabs are instant-switch (no tab animation).
- First-mount choreography in `T12` runs once per page-load only.
- `BgPattern` remains mounted at App level for hero and dashboard continuity.

## Verification Gate (Must Pass Before Merge)
- Run from `ssi-dashboard-v2-plan`:
  1. `npm run test`
  2. `npm run typecheck`
  3. `npm run build` (recommended for Wave completion sanity)
- Record command outcomes in each task section in `plan/log.md`.

## Known Context from Wave 2
- `vitest.config.ts` has `globals: true`; use standard `npm run test`.
- Data layer and compute/extractor/validation are integrated and passing.
- Do not rewrite completed Wave 2 modules unless strictly required by `T08`-`T12`.
