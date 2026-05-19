# T13 — Modal shell (glass full-screen + Esc/X)

## Purpose
Build the reusable full-screen glass modal that the input grid (T14) lives inside. Esc + X both close. Backdrop blurs the dashboard behind. Trigger button "Nhập liệu" lives in the section header (added here as a stub; wired to data later).

## Pre-conditions
- T09 merged (Layout exists; modal triggers will live in section headers)
- shadcn `Dialog` primitive is installed (T02)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T13-modal-shell`
2. Create `src/components/Modal.tsx` exporting `Modal` (named) — a wrapper around shadcn `<Dialog>` with custom glass styling. Props:
   ```ts
   type ModalProps = {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     title: string;
     children: React.ReactNode;
   };
   ```
3. Visual:
   - Overlay: `fixed inset-0 bg-black/40 backdrop-blur-md` (dashboard blurs behind)
   - Content panel: `fixed inset-4 md:inset-8 rounded-2xl border border-white/10 bg-bg-elev/80 backdrop-blur-xl p-6 md:p-8` — covers ~95% of screen
   - Header inside content: title + close X button on top-right (use lucide-react `<X>` icon, size 20)
   - Children area: `relative flex h-full flex-col` so the grid can fill remaining space
4. Behavior:
   - Esc closes (shadcn Dialog provides this; verify)
   - Click on X button calls `onOpenChange(false)`
   - Click on backdrop closes (shadcn default)
   - Focus trap inside modal (shadcn provides via Radix)
   - Body scroll locked while open (shadcn provides)
5. Add a `<NhapLieuButton>` component (named export, in same file or `src/components/SectionHeader.tsx`) that renders the trigger button with glass pill styling: `glass pill, teal border, glow on hover` per design system. For T13 the button just toggles a local state. Wiring into Section happens here as well — extend Section.tsx to include a section header row containing the button (label "Nhập liệu" with diacritics).
6. When modal opens, render placeholder `<div>Grid goes here (T14)</div>` inside children for now. T14 fills it.
7. Tests `tests/modal.smoke.test.tsx`:
   - Render Modal closed → no content visible
   - Render with open=true → title + children visible
   - Click X → onOpenChange called with false
   - Press Esc → onOpenChange called with false (use `userEvent.keyboard('{Escape}')`)
   - Verify overlay backdrop element is present in DOM with `backdrop-blur` class
8. Wire `<NhapLieuButton>` into Section header in `Section.tsx`. The button toggles a local `useState<boolean>("editorOpen")` and renders `<Modal open={editorOpen} onOpenChange={setEditorOpen} title={"Nhập liệu " + modeName}>...</Modal>`. `modeName` is the localized mode name: daily → "ngày", weekly → "tuần", monthly → "tháng".
9. Run tests + typecheck — green
10. Commit: `T13: add Modal shell + Nhập liệu trigger button`
11. Request review

## Post-conditions
- `src/components/Modal.tsx` exports `Modal` and (in same file or sibling) `NhapLieuButton`
- Modal opens via the button click and closes via X, Esc, or backdrop click
- Dashboard content visibly blurs behind the modal overlay
- Title shows correct Vietnamese with diacritics
- All smoke tests pass

## Files in scope
- src/components/Modal.tsx (create)
- src/components/Section.tsx (modify — add section header with NhapLieuButton)
- tests/modal.smoke.test.tsx (create)

## Out of scope
- DataTable inside modal (T14)
- Cell validation (T14)
- CRUD wiring (T15)
- Save toast (T15)

## Success criteria
- Modal shell is fully functional and styled
- All close paths work (X / Esc / backdrop)
- Section header now includes the Nhập liệu button
- Dashboard blurs behind modal

## Notes
shadcn's Dialog has built-in focus trap, body scroll lock, and Esc handler. Use it as the base — do not reimplement these. Just override the visual surface to match the glass design system. Use Tailwind's arbitrary-value syntax to bypass shadcn's default opacity/blur if needed.
