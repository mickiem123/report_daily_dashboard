# T02 — Scaffold Vite + React + TS + Tailwind + shadcn + design tokens

## Purpose
Create the v2 frontend project structure on the integration branch: Vite + React 18 + TypeScript + Tailwind + shadcn/ui, with design tokens (CSS variables and font imports) wired into `globals.css`. This is the foundation every subsequent task builds on.

## Pre-conditions
- T01 is merged to `feat/v2-react-rewrite`
- `feat/v2-react-rewrite` branch is clean (no uncommitted changes)
- Node 20+ available locally
- The legacy `public/` and other v1 folders are untouched on this branch (they live on `main`)

## Steps
1. From `feat/v2-react-rewrite`, branch to `feature/T02-scaffold-vite`
2. Initialize Vite at repo root: `npm create vite@latest . -- --template react-ts` (accept overwrite prompts only for files NOT already tracked; do not delete existing `plan/` or `CLAUDE.md`)
3. Install runtime deps: `npm install @supabase/supabase-js @tanstack/react-query @tanstack/react-table clsx class-variance-authority tailwind-merge lucide-react`
4. Install dev deps: `npm install -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
5. Init Tailwind: `npx tailwindcss init -p`
6. Configure `tailwind.config.ts` to scan `./src/**/*.{ts,tsx}` and extend theme with the CSS-var-driven color tokens listed in `/plan/CONTEXT.md` "Design system"
7. Init shadcn/ui: `npx shadcn@latest init` — when prompted, choose: TypeScript yes, base color "slate", CSS variables yes, components alias `@/components`, utils alias `@/lib/utils`
8. Add shadcn components needed downstream: `npx shadcn@latest add button dialog tabs table toast input label`
9. Create `src/styles/globals.css` containing: Tailwind layer directives, `@import` for Be Vietnam Pro and JetBrains Mono from Google Fonts, all CSS variables from CONTEXT.md design system, and a base `body { background: var(--bg-base); color: var(--text-primary); font-family: 'Be Vietnam Pro', sans-serif; }` rule
10. Update `src/main.tsx` to import `./styles/globals.css` and wrap `<App />` in a `QueryClientProvider`
11. Replace `src/App.tsx` content with a temporary stub that renders `<h1 className="text-2xl text-text-primary">SSI v2 scaffold ready</h1>` to confirm wiring
12. Add npm scripts in `package.json`: `dev`, `build`, `preview`, `test` (alias `vitest run`), `test:watch` (alias `vitest`), `lint`, `typecheck` (alias `tsc --noEmit`)
13. Configure `vitest.config.ts` with environment `jsdom` and `setupFiles: ['./tests/setup.ts']`; create `tests/setup.ts` importing `@testing-library/jest-dom`
14. Run `npm run typecheck` and `npm run build` — both must pass
15. Commit progressively (small commits encouraged); final commit message: `T02: scaffold Vite + React + TS + Tailwind + shadcn + design tokens`
16. Request review

## Post-conditions
- `package.json` exists with all dependencies above
- `npm run dev` starts a working Vite server on port 5173 showing the scaffold stub
- `npm run build` succeeds, output under `dist/`
- `npm run typecheck` exits 0
- `src/styles/globals.css` declares every CSS variable listed in CONTEXT.md
- Be Vietnam Pro and JetBrains Mono are imported and Vietnamese diacritics render correctly in the stub heading (verify by typing "ố" or similar in the stub)
- `src/components/ui/` contains shadcn primitives: button, dialog, tabs, table, toast, input, label
- `tailwind.config.ts` references CSS variables (e.g., `colors: { 'bg-base': 'var(--bg-base)', ... }`)
- `tsconfig.json` has `paths: { "@/*": ["./src/*"] }` and `strict: true`

## Files in scope
- package.json (create / modify)
- tsconfig.json, tsconfig.node.json (create / modify)
- vite.config.ts (create)
- vitest.config.ts (create)
- tailwind.config.ts (create)
- postcss.config.js (create)
- components.json (create — shadcn registry)
- index.html (create)
- src/main.tsx, src/App.tsx (create / modify)
- src/styles/globals.css (create)
- src/lib/utils.ts (create — shadcn `cn()` helper)
- src/components/ui/* (create — shadcn primitives only)
- tests/setup.ts (create)
- .gitignore (modify — add node_modules/, dist/, .DS_Store, *.log if not present)

## Out of scope
- Any business logic, types, or fixtures (those live in T03+)
- Any product components (Card, Hero, etc.) — only shadcn ui primitives in `src/components/ui/`
- Linting setup beyond defaults — ESLint config can be added in any later task if needed

## Success criteria
- All scripts in `package.json` runnable from a fresh `npm install`
- Stub page loads with correct Be Vietnam Pro typography and dark background
- Vietnamese characters render with proper diacritics (no boxes, no fallback)
- All design system CSS variables present in globals.css

## Notes
Resist the urge to add product code. This task scaffolds and wires only. The scaffold stub gets replaced in T08+T09. Keep CSS-vars-as-Tailwind-colors mapping explicit in `tailwind.config.ts` so all later components use Tailwind classes (e.g., `bg-bg-base`, `text-status-up`) rather than raw CSS-var references.
