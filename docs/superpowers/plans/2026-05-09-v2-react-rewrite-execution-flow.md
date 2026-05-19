# SSI Dashboard v2 React Rewrite Execution Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish T08-T18 of the SSI Dashboard v2 React rewrite with controlled parallelism, TDD where behavior is testable, and review gates before dependent work starts.

**Architecture:** Keep the existing project plan authoritative: `plan/MASTER.md`, `plan/CONTEXT.md`, `plan/tasks/*.md`, and `plan/log.md`. Work proceeds on `feat/v2-react-rewrite`, using feature branches where practical; if direct integration-branch work is unavoidable, record the deviation in `plan/log.md`.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind, shadcn-style local UI primitives, TanStack Query, TanStack Table, Supabase, Vitest, React Testing Library, agent-browser/Playwright for rendered UI checks.

---

## Flow Decision

Use **subagent-driven execution for independent UI tasks**, then switch to **inline/sequential execution for tightly coupled integration tasks**.

- Use parallel agents for `T08`, `T09`, and `T10` only after the git baseline is clean enough to branch safely.
- Do not parallelize `T11`, `T12`, `T13`, `T14`, `T15`, `T16`, `T17`, or `T18`; each depends on behavior or UI surfaces created by previous tasks.
- Use TDD for logic, state, validation, data routing, and component behavior tests.
- Use visual/browser verification for UI motion, focus, layout, tabs, modal behavior, and final acceptance.
- Review after every task, with a stronger integration review after `T08-T10`, `T12`, `T16`, and `T18`.

## Required Pre-Work: Tool and Repo Readiness

**Files:**
- Inspect: `plan/log.md`
- Inspect: `src/lib/compute.ts`
- Inspect: git status at repo root
- Modify only if approved: files involved in current dirty worktree bookkeeping

- [ ] **Step 1: Confirm current baseline**

Run:

```powershell
git -C "D:\Claude projects\daily_report" status --short --untracked-files=all
git -C "D:\Claude projects\daily_report" branch --show-current
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run test
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run typecheck
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run build
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run lint
```

Expected:
- Branch is `feat/v2-react-rewrite`.
- `test`, `typecheck`, `build` pass.
- `lint` currently fails on `src/lib/compute.ts` no-useless-assignment until fixed.
- Dirty git status must be understood before branching.

- [ ] **Step 2: Resolve bookkeeping before feature work**

Decision required:
- If the legacy root-to-`v1/` move is intentional, commit it separately before T08.
- If it is accidental, do not start T08 until the user confirms how to restore or preserve it.
- If `plan/WAVE3-*.md` files should be kept, add them to a coordination/docs commit.

Do not mix this cleanup with any T08-T18 feature commit.

- [ ] **Step 3: Fix the existing lint blocker**

Write or identify a focused test only if the edit changes behavior. This should be a no-behavior cleanup in `src/lib/compute.ts`.

Run:

```powershell
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run lint
npm --prefix "D:\Claude projects\daily_report\ssi-dashboard-v2-plan" run test
```

Expected:
- `lint` passes.
- Existing `59` tests still pass.

Commit separately:

```powershell
git add "ssi-dashboard-v2-plan/src/lib/compute.ts"
git commit -m "T04: clean compute lint assignment"
```

Use a different commit message if the final scope differs.

---

## Phase 1: Wave 3 Parallel UI Shell

Run `T08`, `T09`, and `T10` as separate subagents only if their write scopes stay mostly separate. Each subagent must update only its own task section in `plan/log.md`.

### Task 1: T08 Hero Landing

**Files:**
- Create: `src/components/Hero.tsx`
- Modify: `src/App.tsx`
- Test: `tests/hero.smoke.test.tsx`
- Log: `plan/log.md`

- [ ] **Step 1: Mark T08 executing**

Update `plan/log.md` T08 dashboard row and T08 section:
- `Status: executing`
- `Coder: Codex`
- `Started: <ISO timestamp>`
- `Branch: feature/T08-hero-landing`
- Notes include preflight assumptions.

- [ ] **Step 2: Write failing smoke test**

Test these behaviors:
- Hero renders `SSI Báo Cáo`.
- Wrong password shows `Sai mật khẩu`.
- Correct password calls `onUnlock`.
- Input has password type and supports submit via form.

Run:

```powershell
npx vitest run tests/hero.smoke.test.tsx
```

Expected: fail because `Hero` does not exist.

- [ ] **Step 3: Implement minimal Hero and App unlock state**

Implement only the T08 contract:
- `Hero` named export.
- Prop surface: `{ onUnlock: () => void }`.
- Read password from `import.meta.env.VITE_WRITE_PASSWORD`, fallback to `123` only in test/dev if needed.
- Focus password input on mount.
- No session persistence.
- Hard cut from hero to placeholder dashboard.

- [ ] **Step 4: Verify T08**

Run:

```powershell
npm run test
npm run typecheck
npm run build
```

Expected:
- All pass.
- Hero test included.

- [ ] **Step 5: Review T08**

Reviewer checks:
- No persistence/sessionStorage.
- Vietnamese diacritics preserved.
- Form-only glass container.
- `BgPattern` remains App-level.
- No T09 layout work included.

Commit:

```powershell
git add src/components/Hero.tsx src/App.tsx tests/hero.smoke.test.tsx plan/log.md
git commit -m "T08: add Hero landing with password gate"
```

### Task 2: T09 Layout Shell and Tabs

**Files:**
- Create: `src/components/Tabs.tsx`
- Create: `src/components/Layout.tsx`
- Modify: `src/App.tsx`
- Test: `tests/tabs.smoke.test.tsx`
- Likely modify: `src/components/ui/tabs.tsx` if current primitive is insufficient
- Log: `plan/log.md`

- [ ] **Step 1: Mark T09 executing after T08 interface is known**

If running in parallel with T08, coordinate the `App.tsx` merge carefully. If there is any conflict, stop and log escalation.

- [ ] **Step 2: Write failing tabs/layout test**

Test these behaviors:
- Default mode is `daily`.
- Clicking `Weekly` renders child with `weekly`.
- Clicking `Monthly` renders child with `monthly`.
- Exactly one tab has selected state.
- Keyboard navigation works if shadcn/Radix tabs are installed.

Run:

```powershell
npx vitest run tests/tabs.smoke.test.tsx
```

Expected: fail because layout components do not exist.

- [ ] **Step 3: Decide tab primitive**

Current `src/components/ui/tabs.tsx` is only a `div`, not a real Radix tab primitive. Use one of these approaches:
- Preferred: install/implement proper shadcn/Radix tabs if dependency policy allows adding `@radix-ui/react-tabs`.
- Conservative fallback: implement accessible roving/selected buttons inside `DashboardTabs` and record the deviation because `T09` says shadcn primitive provides keyboard navigation.

Do not silently keep the current stub while claiming shadcn keyboard behavior.

- [ ] **Step 4: Implement DashboardLayout and DashboardTabs**

Keep scope to shell only:
- Header wordmark `SSI · Báo Cáo`.
- Sticky centered glass pill tabs.
- Render prop child: `{(mode) => React.ReactNode}`.
- App unlocked view renders `DashboardLayout` with placeholder `Section: {mode}`.

- [ ] **Step 5: Verify and review T09**

Run:

```powershell
npm run test
npm run typecheck
npm run build
```

Reviewer checks:
- Instant tab switch, no animation.
- No Section implementation.
- Keyboard behavior truthfully matches implementation.
- No visual work outside T09 scope.

Commit:

```powershell
git add src/components/Tabs.tsx src/components/Layout.tsx src/App.tsx tests/tabs.smoke.test.tsx plan/log.md
git commit -m "T09: add dashboard layout shell with glass pill tabs"
```

### Task 3: T10 Card Front

**Files:**
- Create: `src/components/Card.tsx`
- Optional create: `src/lib/status.ts`
- Test: `tests/card.test.tsx`
- Log: `plan/log.md`

- [ ] **Step 1: Mark T10 executing**

T10 can run in parallel with T08/T09 because it does not need `App.tsx`.

- [ ] **Step 2: Write failing card tests**

Test:
- Verb starting `tăng` produces `data-status="up"`.
- Verb starting `giảm` produces `data-status="down"`.
- Other verb produces `flat`.
- Important metrics render on front.
- Non-important metrics do not render on front.
- `inverse: true` flips delta color.

Run:

```powershell
npx vitest run tests/card.test.tsx
```

Expected: fail because `Card` does not exist.

- [ ] **Step 3: Implement minimal Card front**

Use `ProductCard` only. Do not fetch data, create section grid, or implement flip state.

- [ ] **Step 4: Verify and review T10**

Run:

```powershell
npm run test
npm run typecheck
npm run build
```

Reviewer checks:
- Aura subtle.
- Inverse color logic correct.
- All labels render from `ProductCard` with diacritics intact.
- No back face or flip behavior.

Commit:

```powershell
git add src/components/Card.tsx tests/card.test.tsx plan/log.md
git commit -m "T10: add Card front face with status aura and hover lift"
```

---

## Phase 2: Sequential UI Integration

### Task 4: Integration Review for T08-T10

**Files:**
- Inspect: `src/App.tsx`
- Inspect: `src/components/Hero.tsx`
- Inspect: `src/components/Layout.tsx`
- Inspect: `src/components/Tabs.tsx`
- Inspect: `src/components/Card.tsx`
- Inspect: tests added in T08-T10

- [ ] **Step 1: Merge or reconcile T08-T10**

If feature branches were used:

```powershell
git checkout feat/v2-react-rewrite
git merge --no-ff feature/T08-hero-landing
git merge --no-ff feature/T09-layout-tabs
git merge --no-ff feature/T10-card-front
```

If direct branch work happened, ensure `plan/log.md` records the deviation.

- [ ] **Step 2: Run integration gate**

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

Expected:
- All pass.

Do not start T11 until this gate is green.

### Task 5: T11 Card Back and 3D Flip

**Files:**
- Modify: `src/components/Card.tsx`
- Create: `src/components/CardBack.tsx`
- Optional modify: `src/styles/globals.css`
- Test: `tests/card-flip.test.tsx`
- Log: `plan/log.md`

- [ ] **Step 1: Write failing flip/back tests**

Test:
- Clicking card toggles back content.
- Margin groups show `T+7`, `Trading Plus`, `M+`.
- Phái sinh shows `D+`.
- Back face renders unimportant metrics.
- Back/front both use `backface-visibility` classes or equivalent.

- [ ] **Step 2: Implement CardBack and internal flip state**

Preserve T10 front tests. Add internal state only if no external `onFlip` is passed; keep API compatible.

- [ ] **Step 3: Browser motion check**

Run dev server and use `agent-browser`:

```powershell
npm run dev
agent-browser open http://localhost:5173
agent-browser snapshot -i --json
```

Manually verify in browser automation that click flips smoothly and no layout shift occurs.

- [ ] **Step 4: Review T11**

Run full gate:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

Commit:

```powershell
git add src/components/Card.tsx src/components/CardBack.tsx tests/card-flip.test.tsx plan/log.md
git commit -m "T11: add Card back face and 3D flip"
```

### Task 6: T12 Section Render and First-Mount Choreography

**Files:**
- Create: `src/components/Section.tsx`
- Optional create: `src/lib/section.ts`
- Optional create: `src/lib/use-first-mount.ts`
- Optional create: `src/lib/use-count-up.ts`
- Modify: `src/App.tsx`
- Test: `tests/section.test.tsx`
- Optional test: `tests/section.helpers.test.ts`
- Log: `plan/log.md`

- [ ] **Step 1: Write failing tests for section states**

Test:
- Loading renders skeletons.
- Empty renders `Chưa có dữ liệu`.
- Error renders retry button `Thử lại`.
- Populated renders 6 cards.
- Cards sort by status and fixed product priority.
- First render applies choreography flag; later tab changes do not.

- [ ] **Step 2: Implement pure section helper first**

Put sorting/selection behavior in a pure helper if it keeps `Section.tsx` small. No React imports in `src/lib/*`.

- [ ] **Step 3: Implement Section component**

Use query hooks from `src/data/queries.ts` and extractors from `src/lib/extractors.ts`. Wire into `DashboardLayout`.

- [ ] **Step 4: Review T12 with visual check**

Run:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Use `agent-browser` for a rendered check of hero unlock, tabs, cards, and states where mockable.

Commit:

```powershell
git add src/components/Section.tsx src/lib/section.ts src/lib/use-first-mount.ts src/lib/use-count-up.ts src/App.tsx tests/section.test.tsx tests/section.helpers.test.ts plan/log.md
git commit -m "T12: render dashboard sections with states and first-mount choreography"
```

Adjust `git add` list to actual files created.

---

## Phase 3: Modal, Grid, CRUD, Refresh

Execute sequentially. Do not dispatch these in parallel because each layer depends on the previous layer's UI contract.

### Task 7: T13 Modal Shell

**Flow:** TDD for open/close behavior; browser check for focus trap/Esc/backdrop.

**Files:**
- Create: `src/components/Modal.tsx`
- Modify: likely `src/components/Section.tsx`
- Test: modal smoke test
- Log: `plan/log.md`

Review before T14:
- Esc closes.
- X closes.
- Focus behavior is acceptable.
- No DataTable or CRUD logic included.

### Task 8: T14 DataTable and Validation UI

**Flow:** TDD for row/cell behavior and validation routing; browser check for editable grid ergonomics.

**Files:**
- Create: `src/components/DataGrid.tsx`
- Possibly create: `src/components/ui/tooltip.tsx`
- Possibly create: `src/components/ui/alert-dialog.tsx`
- Tests for validation display and edit/revert behavior
- Log: `plan/log.md`

Review before T15:
- Type errors block save and revert.
- Warnings/outliers show non-blocking state.
- `ngay` editability rules are correct.
- No Supabase write behavior yet except callback wiring.

### Task 9: T15 CRUD, Debounce, Toast

**Flow:** TDD for `useDebouncedSave`, mutation routing, and toast helpers. Browser check for save feedback.

**Files:**
- Create: `src/lib/use-debounced-save.ts`
- Create/modify: `src/components/Toast.tsx`
- Modify: `src/components/DataGrid.tsx`
- Modify: `src/App.tsx` if provider needed
- Tests for debounce and mutation callbacks
- Log: `plan/log.md`

Review before T16:
- Debounce cancels previous pending saves.
- Save success toast says `Đã lưu`.
- Errors surface without lying about save state.

### Task 10: T16 Refresh Flow

**Flow:** TDD for cooldown/localStorage date logic; browser check for confirm dialog and disabled state.

**Files:**
- Likely modify: `src/components/Section.tsx`
- Optional create: `src/lib/refresh.ts`
- Tests for cooldown and new-day stale logic
- Log: `plan/log.md`

Review gate:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

Then run dev preview with `agent-browser` through:
- Hero unlock.
- Tab switch.
- Modal open/close.
- Refresh confirm/cooldown.

---

## Phase 4: Deployment and Final Verification

### Task 11: T17 Cloudflare Pages Setup

**Flow:** Sequential, documentation-first, real deployment only if credentials/tools exist.

**Files:**
- Modify: `README.md`
- Create: `docs/deploy.md`
- Optional create/modify: Node version config if required by Cloudflare
- Log: `plan/log.md`

Current known gaps:
- `wrangler` CLI is missing.
- Cloudflare API token env vars are not set.
- Tool discovery did not expose a Cloudflare Pages MCP action.

Plan:
- Document manual Cloudflare Pages setup exactly.
- If the user provides credentials or installs Wrangler, verify real deploy.
- If no credentials/tooling, mark T17 blocked with `Esc: Y` per task instructions; do not fake deployment success.

### Task 12: T18 End-to-End VERIFY

**Flow:** Checker pass, not feature implementation.

**Files:**
- Inspect: `plan/VERIFY.md`
- Inspect: `plan/log.md`
- Inspect: README/deploy docs
- No source changes unless verification exposes a specific bug

Run:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
npm run preview
```

Use `agent-browser` against preview URL for:
- Hero.
- Correct/wrong password.
- Dashboard tabs.
- Cards and flip.
- Modal grid.
- Refresh.
- Empty/loading/error states where testable.

Final review:
- Every `VERIFY.md` item is checked or explicitly blocked.
- No `TODO`/`FIXME`.
- No React/DOM imports in `src/lib/*`.
- No `any`.
- Log entries have `Files`, `Tests`, `Unplanned`, `Contradictions`, `Confidence`.

---

## Review Schedule

- Review after each task before marking `done`.
- Integration review after `T08-T10` before `T11`.
- Visual/browser review after `T11` and `T12`.
- Full gate review after `T16`.
- Deployment review after `T17`.
- Final checker review at `T18`.

## Subagent Dispatch Rules

Use subagents only for:
- `T08`, `T09`, `T10` if branches are clean and write scopes are respected.
- Optional read-only review agents after a task is ready for review.

Do not use subagents for:
- Dirty git cleanup.
- Conflict resolution.
- `T11+` implementation unless a subtask has a truly isolated write set.
- Cloudflare deployment without credentials.

Each worker must be told:
- You are not alone in the codebase.
- Do not revert edits made by others.
- Own only the assigned files.
- Update only your task section in `plan/log.md`.
- Stop and log escalation on conflicts or contradictions.

## TDD Rules by Task Type

- Pure logic/helpers: write failing unit tests first, then implement.
- Component behavior: write React Testing Library smoke/behavior tests first.
- Visual-only styling: write minimal structural test, then verify with browser.
- Deployment/docs: no TDD; verify by build output, preview URL, and documented manual steps.

## Immediate Next Move

Do not start T08 yet. First resolve:
1. Dirty git status around legacy v1 move.
2. Existing lint error in `src/lib/compute.ts`.
3. Whether to install proper Radix/shadcn primitives for tabs/dialog/tooltip/alert-dialog, or record a controlled local-primitive deviation.

After those are resolved, dispatch `T08`, `T09`, and `T10` in parallel, then review and merge them before continuing sequentially.
