# SSI Dashboard v2 — Master Plan

## Goal
Rebuild the SSI Báo Cáo dashboard frontend as a modern React + TypeScript application with glassmorphism dark UI, AI-design-tool-friendly architecture, and full Vietnamese diacritic support. Existing Supabase backend (3 tables, RLS, schema) stays unchanged. Vanilla v1 stays alive on `main` branch until v2 is verified, then DNS swap completes the cutover. Success = teammates open hero landing, type password, see immersive dashboard with 6 cards across 3 tabs (Daily/Weekly/Monthly), can flip cards for grouped details, and can push daily rows via a glass full-screen modal grid — all on `feat/v2-react-rewrite`.

## Scope

**In scope:**
- Long-lived integration branch `feat/v2-react-rewrite` for entire v2 build
- Vite + React 18 + TypeScript + Tailwind + shadcn/ui scaffold
- Glassmorphism dark theme with teal/emerald palette and dots+drift background pattern
- Be Vietnam Pro display+body font + JetBrains Mono numbers
- Hero landing (password gate every page load, hard-cut transition, shared bg)
- Sticky glass pill tabs (Daily/Weekly/Monthly), single section visible at a time
- Card component with status aura glow, hover lift, 3D click-flip to back face
- Card back face with grouped sub-metrics: Margin gets 3 groups (T+7, Trading Plus, M+); Phai sinh keeps D+
- Section render: first-mount-after-login = stagger pop-in + count-up wow; subsequent = instant
- Glass full-screen modal grid for editing (Esc + X close, debounced auto-save with toast)
- Vietnamese diacritics restored in every label
- TanStack Query for Supabase fetch, TanStack Table for the data grid
- New Cloudflare Pages project for v2 (DNS swap when verified)
- TDD for compute / extractors / validation logic layer; smoke tests for components

**Out of scope:**
- ApexCharts / chart modal (permanently dropped, do not reintroduce)
- Per-user auth via Supabase Auth (post-MVP — keep shared password `123`)
- Mobile responsive pixel-perfection (best-effort, desktop-first)
- Tab change animations (instant swap, calm)
- Touching legacy v1 code on `main`
- Schema migrations or BE changes
- Dark/light theme toggle (dark only for v2)
- Card chart series modal that v1 had behind ApexCharts

## Sequencing

| TNN | Title                                                    | Depends on | Parallelizable with |
|-----|----------------------------------------------------------|------------|---------------------|
| T01 | Bootstrap agent protocol files                           | —          | —                   |
| T02 | Scaffold Vite + React + TS + Tailwind + shadcn + tokens  | T01        | —                   |
| T03 | TypeScript contract + mock fixture                       | T02        | —                   |
| T04 | Port compute logic to TS with Vitest TDD                 | T03        | T05                 |
| T05 | Port extractors + validation to TS with Vitest TDD       | T03        | T04                 |
| T06 | Supabase client + TanStack Query data layer              | T03        | T04, T05            |
| T07 | Background pattern component (dots + fade + drift)       | T02        | T04, T05, T06       |
| T08 | Hero landing component (gate + form + transition)        | T02, T07   | T09                 |
| T09 | Layout shell + glass pill tabs                           | T02, T07   | T08                 |
| T10 | Card front face (status aura + hover + headline)         | T04, T05   | T11 (parallel after T04)|
| T11 | Card back face + 3D flip (groups M+/T+7/TP/D+)           | T10        | —                   |
| T12 | Section render + states + first-mount choreography       | T06, T11   | —                   |
| T13 | Modal shell (glass full-screen + Esc/X)                  | T09        | T12                 |
| T14 | DataTable in modal + cell validation UI                  | T13, T05   | —                   |
| T15 | CRUD: upsert/delete/add row + debounce + toast           | T14, T06   | —                   |
| T16 | Refresh flow (per-tab btn + auto-stale + cooldown)       | T12        | T15                 |
| T17 | New Cloudflare Pages project setup + deploy verification | T15, T16   | —                   |
| T18 | VERIFY end-to-end                                        | T17        | —                   |

## How to use this plan
1. Read `/CLAUDE.md` at repo root
2. Read this file
3. Read `/plan/CONTEXT.md`
4. Pick up T01 first; follow Task Pickup Protocol in CLAUDE.md

## Success criteria
See `/plan/VERIFY.md`.

## Decisions Log (planner-owned, append-only)

- **2026-05-09 D1** — Long-lived branch `feat/v2-react-rewrite` chosen over fresh repo. Preserves git history and CF Pages connection availability. Vanilla v1 stays on `main`.
- **2026-05-09 D2** — Stack pivoted from vanilla JS to React + Vite + TS + Tailwind + shadcn/ui. Reason: user wants 21dev / shadcn components; vanilla cannot host them.
- **2026-05-09 D3** — Hybrid workflow approved: AI design tool produces 3 visual mockups (hero, card, modal) only; logic + data + integration all live in repo. Contract-first via TypeScript types.
- **2026-05-09 D4** — Tabulator dropped, replaced with shadcn DataTable (TanStack Table). Reason: shadcn-native, integrates cleanly with the design system.
- **2026-05-09 D5** — New Cloudflare Pages project for v2. Old project stays alive on vanilla until DNS swap. Safer rollback.
- **2026-05-09 D6** — Hero entry choreography: first-mount-after-login = cards stagger pop-in + numbers count-up; every subsequent render = instant. The "wow" is a one-shot moment, not ongoing behavior.
- **2026-05-09 D7** — Margin card structure: 3 groups on back face (T+7, Trading Plus, M+) + 2 ungrouped flat metrics (SLKH Margin, Du no SPV). Phai sinh card stays one-group (D+).
- **2026-05-09 D8** — Vietnamese diacritics must be restored in every user-facing label. v1 stripped them ("Thi phan" instead of "Thị Phần"). v2 must show them correctly.
