# T11 — Card back face + 3D flip (groups M+/T+7/Trading Plus/D+)

## Purpose
Add the back face of the card showing all sub-metrics organized into groups (Margin: T+7, Trading Plus, M+; Phái sinh: D+; others: ungrouped flat list). Wire 3D Y-axis flip animation triggered by clicking the card. Click anywhere on the back face flips back to front.

## Pre-conditions
- T10 merged (front face exists)
- Extractors (T05) emit correct `group` values in sub_metrics

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T11-card-flip`
2. Create `src/components/CardBack.tsx` exporting `CardBack` (named). Props:
   ```ts
   type CardBackProps = { product: ProductCard };
   ```
3. CardBack visual structure:
   - Header: small text `<product.name> · Chi tiết` and a hint `(nhấn để quay lại)`
   - For each unique `group` value in `product.sub_metrics`, render a `<section>` with:
     - Group label (uppercase, tracked, accent-teal text, e.g., `M+`, `T+7`, `Trading Plus`, `D+`)
     - Sub-metrics in that group as 3-col grid rows (label / value / delta)
   - Then render ungrouped sub-metrics (`!m.group`) as a flat list at the bottom (no section header)
   - Group order for Margin: `T+7`, `Trading Plus`, `M+` (T05 extractors guarantee this order in the array; preserve insertion order using a `Map` or a `seen` set)
4. Same glass + aura styling as front face, but flipped (rotated). The container styling lives in `Card.tsx`; `CardBack.tsx` just owns content.
5. In `Card.tsx`, refactor to a flip wrapper:
   - Add `useState<boolean>("flipped")` local state
   - Outer wrapper: `relative` with `style={{ perspective: "1200px" }}`
   - Inner flipper: `relative h-full w-full transition-transform duration-[600ms] [transform-style:preserve-3d]`, applies `rotate-y-180` class when flipped
   - Front face: existing T10 content, wrapped with `[backface-visibility:hidden]`
   - Back face: `<CardBack product={product} />` wrapped with `[backface-visibility:hidden] [transform:rotateY(180deg)]` so it shows when flipped
   - Click handler on the inner flipper toggles flipped state
6. Add a `rotate-y-180` Tailwind utility (Tailwind v3 needs a custom utility; add via `@layer utilities` in globals.css OR via the `tailwindcss-3d` plugin if listed in T02 deps — if not, add a custom plugin or inline `style={{ transform: ... }}`)
7. Inverse flag still applies on back face delta colors (same rule as front).
8. Tests `tests/card-flip.test.tsx`:
   - Render a Card with a margin product → click → assert back face content visible (group labels "T+7", "Trading Plus", "M+")
   - Click again → front face visible
   - For phaisinh product → assert "D+" group section + KH cancel D+ row has inverse-flipped color when delta is positive
   - For HOSE product (no groups) → back face renders flat metric list, no group headers
9. Verify motion: in dev preview, click card and confirm 3D flip is smooth, ~600ms, both faces invisible at edge-on (`backface-visibility: hidden`)
10. Reduced motion: respect `prefers-reduced-motion: reduce` — when set, swap content instantly without 3D rotation. Use a `@media` rule or a `useReducedMotion` helper.
11. Run tests + typecheck — green
12. Commit: `T11: add Card back face with groups + 3D flip animation`
13. Request review

## Post-conditions
- Click on Card → flips to back face → click again → flips to front
- Margin card back face shows 3 group sections in order: T+7, Trading Plus, M+
- Phái sinh back face shows D+ group with KH hủy D+ inverse-colored
- HOSE / S-Cash / S-Fund / Mở mới back faces show ungrouped metric list
- Animation duration ~600ms with smooth ease
- `prefers-reduced-motion: reduce` swaps instantly
- 6+ test cases pass

## Files in scope
- src/components/Card.tsx (modify — add flip wrapper + state)
- src/components/CardBack.tsx (create)
- src/styles/globals.css (modify if custom utilities needed for 3D)
- tests/card-flip.test.tsx (create)

## Out of scope
- Section / multi-card layout (T12)
- Mount animation (T12)
- Edit / data flow

## Success criteria
- 3D flip works in dev with no layout shift before/after
- Group ordering correct
- Inverse flag on back face works
- Reduced motion respected

## Notes
Tailwind 3 doesn't include 3D utility classes by default. Two acceptable approaches: (1) add a custom plugin in `tailwind.config.ts` that defines `rotate-y-180`, `preserve-3d`, `backface-hidden`, `perspective-{n}` utilities; (2) use inline `style={{ transform: ..., transformStyle: ..., backfaceVisibility: ... }}` for the flipper element. Approach 2 is simpler and follows P2; choose it unless multiple components will need 3D, which they will not.
