# Session Log — 2026-05-12

## Scope
- Supabase-style UI restyle execution and bug-fix pass.
- Table data-entry interruption fix.
- Branch revert + Cloudflare Pages deployment recovery.

## Timeline (high level)
1. Implemented global UI refresh plan on `ssi-dashboard-v2-plan`:
   - Default dark theme + toggle.
   - Number typography with Geist Mono (`font-number` usage across cards/grid).
   - Card interaction changed from flip to inline expand/collapse.
   - Sub-metric summary capped at 3 items under headline.
   - Subtle animated background movement with reduced-motion fallback.
2. Refined table readability/theme integration (sticky columns, min widths, tokenized colors).
3. Full verification run:
   - Tests/typecheck/build passed.
   - Lint had one existing warning from TanStack `useReactTable` compatibility rule.
4. Fixed table edit flow (first pass):
   - Removed per-keystroke save behavior.
   - Added explicit `Lưu thay đổi` action in grid footer.
   - Moved save to staged/batch flow in section logic.
5. User reported typing still interrupted.
6. Fixed table edit flow (second pass):
   - Existing-row inputs changed to uncontrolled typing buffer.
   - Commit on blur/Enter only.
   - Added regression test for multi-character typing in one focus session.
7. Committed and pushed branch:
   - Commit: `8d88125`
   - Branch: `feat/v2-react-rewrite`
8. User requested revert and deploy:
   - Found local head commit `a3b5f46` above pushed branch.
   - Reset branch hard to `origin/feat/v2-react-rewrite` (`8d88125`).
9. First deploy succeeded technically but app blank at runtime:
   - Deployment URL: `https://acc92b3a.ssi-dashboard-v2.pages.dev`
   - Root cause: missing Vite env vars in build (reverted workspace had no `ssi-dashboard-v2-plan/.env`), causing runtime throw `Missing Supabase env vars`.
10. Rebuilt with explicit env vars injected in shell and redeployed:
    - Fixed deployment URL: `https://5c9a8655.ssi-dashboard-v2.pages.dev`

## Key Code Changes (session)
- Theme + app shell:
  - `src/App.tsx`
  - `src/components/Layout.tsx`
  - `src/styles/globals.css`
  - `tailwind.config.ts`
- Cards/background:
  - `src/components/Card.tsx`
  - `src/components/CardBack.tsx`
  - `src/components/BgPattern.tsx`
- Data entry flow:
  - `src/components/DataGrid.tsx`
  - `src/components/Section.tsx`
- Supporting UI tokenization:
  - `src/components/Hero.tsx`
  - `src/components/Tabs.tsx`
  - `src/components/SectionHeader.tsx`
  - `src/components/Toast.tsx`
  - several `src/components/ui/*` style updates
- Design doc:
  - `DESIGN.md` (added)

## Test/Verification Summary
- Final successful verification before commit/push:
  - `npm run test -- --run` → passed (113 tests).
  - `npm run typecheck` → passed.
  - `npm run build` → passed.
  - `npm run lint` → passed with 1 existing warning (`react-hooks/incompatible-library` on TanStack table hook usage).

## Git Actions
- Commit created: `8d88125`  
  Message: `T14: apply supabase-dark UI refresh and explicit table save flow`
- Pushed to remote: `origin/feat/v2-react-rewrite`
- Later rollback action:
  - `git reset --hard origin/feat/v2-react-rewrite`
  - Resulting HEAD remained `8d88125`.

## Deployment Actions
- Deploy attempt 1:
  - URL: `https://acc92b3a.ssi-dashboard-v2.pages.dev`
  - Status: blank page due to missing env vars in build output.
- Deploy attempt 2 (recovery):
  - Build with explicit `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WRITE_PASSWORD`.
  - URL: `https://5c9a8655.ssi-dashboard-v2.pages.dev`
  - Status: successful deployment.

## Final State
- Branch state for target app work: `feat/v2-react-rewrite` at `8d88125`.
- Runtime blank-page issue resolved by env-correct rebuild and redeploy.
