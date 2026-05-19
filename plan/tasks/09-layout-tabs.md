# T09 — Layout shell + glass pill tabs

## Purpose
Build the dashboard layout that lives behind the unlocked state: sticky glass pill tab bar at top with three tabs (Daily / Weekly / Monthly), and a content area below that renders only the active tab's section. Background pattern is inherited from App. Tab change is instant (no animation per design).

## Pre-conditions
- T02, T07, T08 merged
- shadcn `Tabs` primitive is installed (T02)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T09-layout-tabs`
2. Create `src/components/Tabs.tsx` exporting `DashboardTabs` (named). Uses shadcn `<Tabs>` primitive under the hood but with the glass pill skin (Tailwind classes overriding shadcn defaults).
3. Tabs component contract:
   ```ts
   type DashboardTabsProps = {
     value: Mode;
     onValueChange: (m: Mode) => void;
     children: React.ReactNode; // expects 3 <TabsContent value="daily|weekly|monthly"> children
   };
   ```
4. Visual:
   - Container: `sticky top-4 z-30 mx-auto flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md`
   - Each tab trigger: `rounded-full px-5 py-2 text-sm transition-colors`
   - Active state: `bg-accent-teal/15 text-accent-teal shadow-[0_0_24px_rgba(95,201,178,0.25)]`
   - Inactive: `text-text-muted hover:text-text-primary`
   - Labels are English: `Daily`, `Weekly`, `Monthly`
5. Create `src/components/Layout.tsx` exporting `DashboardLayout` (named). Composition:
   - Top bar (header): on the left a wordmark `SSI · Báo Cáo` (small, mono-numeric look). Right side: empty for now.
   - Tab bar centered below header.
   - Content area: `<main>` with `mx-auto max-w-7xl px-6 pb-24 pt-8`.
6. Layout owns the active-tab state: `useState<Mode>("daily")`. Pass `value` and `onValueChange` to `DashboardTabs`. Render section content via the `children` slot, which is a render-prop:
   ```ts
   type DashboardLayoutProps = { children: (mode: Mode) => React.ReactNode };
   ```
7. Wire into `App.tsx`: when unlocked is true, render `<DashboardLayout>{(mode) => <div>Section: {mode}</div>}</DashboardLayout>`. T12 fills in the actual `<Section />`.
8. Smoke test `tests/tabs.smoke.test.tsx`: render `<DashboardLayout>` with a stub child; click each tab; assert child receives correct mode; assert exactly one tab is in active styling at a time.
9. Accessibility: tabs must be keyboard navigable (shadcn primitive provides this; verify `Tab` / `Arrow` keys work).
10. Run tests + typecheck — both green
11. Commit: `T09: add dashboard layout shell with glass pill tabs`
12. Request review

## Post-conditions
- `src/components/Layout.tsx` and `src/components/Tabs.tsx` exist as named exports
- App renders `<DashboardLayout>` after unlock with active tab state working
- Clicking tabs swaps the rendered section instantly (no fade)
- Active tab has teal glow; inactive tabs are dim
- Tab bar is sticky at the top during scroll (verify in dev)
- Keyboard nav (Tab + Arrow keys) works
- Smoke test passes

## Files in scope
- src/components/Tabs.tsx (create)
- src/components/Layout.tsx (create)
- src/App.tsx (modify — replace dashboard placeholder with `<DashboardLayout>`)
- tests/tabs.smoke.test.tsx (create)

## Out of scope
- Section render (T12)
- Refresh button or Nhập liệu button placement (T16, T13)
- Tab change animation (instant by design)

## Success criteria
- Layout + tabs render and function
- Glass pill aesthetic matches CONTEXT.md design system
- One active tab at a time, English labels
- Smoke test passes

## Notes
shadcn Tabs primitive uses Radix under the hood — you can use it as the trigger source but the visual wrapper is custom. Don't try to forcibly restyle Radix internals; instead pass your own className overrides via the `className` prop on shadcn's TabsList / TabsTrigger.
