# T08 — Hero landing component (gate + form + transition)

## Purpose
Build the password-gated landing page that every visitor sees first. Title, subtitle, password input, CTA button. On correct password, hard-cut to dashboard. On wrong password, show inline error. The bg pattern from T07 stays visible (no separate bg here).

## Pre-conditions
- T02, T07 merged (scaffold + bg pattern in place)
- `VITE_WRITE_PASSWORD` env var is read via `import.meta.env`

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T08-hero-landing`
2. Create `src/components/Hero.tsx` as a named export. Props:
   ```ts
   type HeroProps = { onUnlock: () => void };
   ```
3. Layout: full-viewport flex-center column. Title `<h1>SSI Báo Cáo</h1>` (Be Vietnam Pro 800, 5xl on desktop). Subtitle `<p>Live dashboard · Báo cáo theo ngày, tuần, tháng</p>`. Form with shadcn `<Input type="password" />` (max length 32) + shadcn `<Button>` labeled "Vào hệ thống". Below input: optional error text slot, hidden until wrong submit.
4. Glass treatment on the form container only (not the title): backdrop-blur, white/5 bg, border white/10, rounded-2xl, p-8, max-w-md.
5. State: local `useState<string>` for the input, local `useState<string | null>` for error.
6. On submit:
   - Read `VITE_WRITE_PASSWORD` from env
   - If input matches → call `props.onUnlock()` (no transition; parent does instant swap)
   - If not → set error to `"Sai mật khẩu"` (Vietnamese diacritics), clear input
7. Wire `Enter` key to submit (form's default submit handler, with `e.preventDefault()`).
8. Accessibility: `<label>` linked to `<Input>`, `aria-invalid` toggled on error, focus moves to input on mount.
9. In `src/App.tsx`, manage a `unlocked: boolean` state. When false, render `<Hero onUnlock={() => setUnlocked(true)} />`. When true, render dashboard placeholder (`<div>Dashboard goes here</div>` for now — T09 fills it). Bg pattern stays at the App level so both views share it.
10. Smoke test `tests/hero.smoke.test.tsx`: render Hero with a stub onUnlock; type wrong pw, assert error appears; type "123" (test reads from a mocked env), assert onUnlock called.
11. Run `npm run test`, `npm run typecheck` — both pass
12. Commit: `T08: add Hero landing with password gate`
13. Request review

## Post-conditions
- `src/components/Hero.tsx` exports `Hero` named React component
- App.tsx alternates between `<Hero>` and dashboard placeholder via `unlocked` state
- Wrong password shows "Sai mật khẩu" inline below input
- Correct password (`VITE_WRITE_PASSWORD` value) calls onUnlock
- Pressing Enter inside input submits the form
- Reloading the page returns to Hero (unlocked state is in-memory, no persistence)
- All Vietnamese strings render correctly
- Smoke test passes

## Files in scope
- src/components/Hero.tsx (create)
- src/App.tsx (modify — add unlocked state + conditional render)
- tests/hero.smoke.test.tsx (create)

## Out of scope
- Hard-cut transition styling (it IS hard cut — no animation; that's the design)
- Session memory / sessionStorage — explicitly NOT used; every page load shows Hero
- Per-user auth, account creation, password reset flows
- Visual polish beyond the basic glass form (the user may swap with a 21dev component later; structure stays the same so swap is one-file)

## Success criteria
- Hero renders title + subtitle + form
- Bg pattern visible behind hero (continuity with future dashboard view)
- Wrong pw shows error, correct pw triggers unlock
- Smoke test passes

## Notes
The user said they may swap this hero with a 21dev component later. Keep the props surface MINIMAL (`onUnlock` only) so the swap is one file. Do not add unnecessary children, render-props, or styling props — they will all need to be migrated and create churn.
