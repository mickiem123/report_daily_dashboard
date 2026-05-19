# Context

## Architecture
- **Frontend:** Vite + React 18 + TypeScript SPA, deployed as static assets to Cloudflare Pages.
- **Frontend layers:** (1) visual components in `src/components/`, (2) pure logic in `src/lib/` (compute, extractors, validation, types), (3) data in `src/data/` (Supabase client + TanStack Query hooks).
- **Backend:** Supabase Postgres (unchanged from v1). 3 tables: `daily_metrics`, `weekly_metrics`, `monthly_metrics`. RLS public read + public write. `ngay` is the unique key per table. Schema in `/supabase_schema.sql`.
- **Auth:** Shared password `"123"` gates the entire app at the hero landing every page load. No Supabase Auth, no per-user accounts.
- **Data flow:** App opens → hero gate → unlock → `useDaily/useWeekly/useMonthly` hooks fetch last 22 rows from each table via TanStack Query → extractors compute 6 product cards → Section renders cards in active tab → modal grid uses upsert/delete via Supabase client directly.

## Conventions
- Language: TypeScript 5.4+, strict mode on
- Framework: React 18 + Vite 5
- Styling: Tailwind CSS 3 + shadcn/ui components (Radix primitives under the hood)
- Test framework: Vitest + React Testing Library
- Lint: ESLint with `@typescript-eslint` recommended + `eslint-plugin-react-hooks`
- Branch model: long-lived integration branch `feat/v2-react-rewrite`, feature branches per task, `--no-ff` merge to integration branch (never to `main` until cutover)
- Files end with newline. UTF-8 encoding mandatory (Vietnamese diacritics must render — never strip them).

## Commands
- Install deps: `npm install`
- Dev server: `npm run dev` (Vite default port 5173)
- Run all tests: `npm run test` (alias for `vitest run`)
- Run a single test: `npx vitest run <pattern>` (e.g., `npx vitest run compute`)
- Watch tests: `npm run test:watch`
- Build: `npm run build` (output to `dist/`)
- Preview built bundle: `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (alias for `tsc --noEmit`)

## File layout

```
/                           ← repo root
├── CLAUDE.md, AGENTS.md, .cursorrules
├── package.json, tsconfig.json, vite.config.ts, tailwind.config.ts
├── components.json         ← shadcn/ui registry config
├── index.html              ← Vite entry
├── src/
│   ├── main.tsx            ← React root + provider tree
│   ├── App.tsx             ← top-level router (hero ↔ dashboard) + state
│   ├── components/
│   │   ├── ui/             ← shadcn primitives (button, dialog, tabs, table, etc.)
│   │   ├── BgPattern.tsx   ← dots + fade-edges + drift
│   │   ├── Hero.tsx        ← landing + password form
│   │   ├── Tabs.tsx        ← glass pill tabs (Daily/Weekly/Monthly)
│   │   ├── Card.tsx        ← front face + flip wrapper
│   │   ├── CardBack.tsx    ← back face with groups
│   │   ├── Section.tsx     ← 6-card grid + states
│   │   ├── Modal.tsx       ← glass full-screen modal shell
│   │   ├── DataGrid.tsx    ← TanStack Table inside modal
│   │   └── Toast.tsx       ← save toast
│   ├── lib/
│   │   ├── types.ts        ← Row, ProductCard, SubMetric, Group, Status
│   │   ├── compute.ts      ← clean, fmt, diff, detectTrend, MAD z-score
│   │   ├── extractors.ts   ← hose, margin, phaisinh, scash, sfund, momoi
│   │   ├── validation.ts   ← validateCell + severity rules
│   │   └── tokens.ts       ← design tokens as TS constants if needed beyond CSS vars
│   ├── data/
│   │   ├── supabase.ts     ← createClient(url, anonKey)
│   │   ├── queries.ts      ← useDaily, useWeekly, useMonthly (TanStack Query)
│   │   └── mutations.ts    ← upsertRow, deleteRow
│   ├── fixtures/
│   │   └── sample-rows.ts  ← 22-row mock data matching Row type, used by tests + design tool
│   └── styles/
│       └── globals.css     ← Tailwind layers + design token CSS vars + Be Vietnam Pro / JetBrains Mono @import
├── tests/
│   ├── compute.test.ts
│   ├── extractors.test.ts
│   └── validation.test.ts
├── deprecated_v1/          ← only after final cutover; not created during this plan
└── supabase_schema.sql     ← reference, do not change
```

## Design system (canonical — match exactly)

**Style:** glassmorphism dark, Apple/Linear vibe.

**Color tokens (CSS vars in globals.css):**
- `--bg-base: #06100f`         (deep dark teal)
- `--bg-elev: #0c1a18`         (elevated surface tint)
- `--text-primary: #e9ecec`
- `--text-muted: #9bb0ad`
- `--border-glass: rgba(95, 201, 178, 0.12)`
- `--accent-teal: #5fc9b2`     (primary glow + tab active + button border)
- `--accent-emerald: #4ade80`  (mesh secondary)
- `--accent-cyan: #67e8f9`     (mesh tertiary)
- `--status-up: #5fc992`       (status green, kept from v1)
- `--status-down: #ff6363`     (status red, kept from v1)
- `--status-flat: #9bb0ad`     (gray for no-change)
- `--glow-up: rgba(95, 201, 146, 0.22)`
- `--glow-down: rgba(255, 99, 99, 0.22)`

**Typography:**
- Display + body: Be Vietnam Pro (weights 400, 500, 700, 800), import via Google Fonts in `globals.css`
- Mono (numbers): JetBrains Mono (weights 400, 500, 700)
- Vietnamese diacritics MUST render correctly. Do not ASCII-strip labels.

**Spacing scale (Tailwind defaults are fine):** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px.

**Glass treatment:** `backdrop-blur-md` + `bg-white/5` + `border border-white/10` + subtle inner highlight via `box-shadow inset 0 1px 0 rgba(255,255,255,0.04)`.

**Animation language:**
- Card hover: `translateY(-4px)` + brighten + glow intensify, 200ms ease-out
- Card flip: 3D rotateY 0→180deg, 600ms ease-in-out, `transform-style: preserve-3d`
- BG drift: pattern translates 1–2px per second via long-cycle CSS `@keyframes`
- First-mount-after-login: cards stagger fade-up 50ms apart + numbers count-up 1200ms ease-out
- Tab switch / refresh / subsequent renders: instant, no animation (calm default)
- Save toast: slide-up + fade, 200ms in, hold 2s, 200ms out

## Patterns to follow
- Logic layer is **pure** — `compute.ts`, `extractors.ts`, `validation.ts` import nothing from React or DOM. They take and return plain data. Tests cover them with Vitest, no jsdom needed.
- Components consume the **TS contract** (`Row`, `ProductCard`, etc.) — never raw Supabase rows except inside `data/queries.ts` where mapping happens.
- Components must support **all states**: loading (skeleton), empty ("Chưa có dữ liệu" glass card), error (retry button), and populated.
- Every interactive element has a **focus ring** (Tailwind `focus-visible:ring-2 ring-accent-teal/60`).
- All user-visible Vietnamese strings use full diacritics. No ASCII fallback.
- Use `cn()` helper from shadcn for conditional class merging, not string concat.
- Numbers formatted via `fmt()` from compute layer, never inline.

## Patterns to avoid
- Inline styles (use Tailwind classes; CSS vars only inside `globals.css`).
- Stripping Vietnamese diacritics from labels for any reason.
- Importing React or DOM into `src/lib/*` (logic layer must stay framework-agnostic).
- Adding chart libraries (ApexCharts, Recharts, Chart.js). Charts are out of scope.
- Default exports — use named exports throughout for grep-ability.
- Generic display fonts (Inter, Roboto) — Be Vietnam Pro is required.

## Known constraints
- Must run on Node 20+ (Vite 5 requirement).
- All bundled assets must be local — no runtime CDN. Supabase JS client is npm package, not CDN.
- Bundle size budget: under 500 KB gzipped for the main JS chunk.
- Cloudflare Pages build environment: Node 20, build command `npm run build`, output dir `dist/`.
- Browser support: latest 2 versions of Edge, Chrome, Safari, Firefox.

## Reminder
Protocol for writing log.md, git, and exit checks lives in `/CLAUDE.md`. Read it first if not already.
