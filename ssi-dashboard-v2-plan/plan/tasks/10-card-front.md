# T10 — Card front face (status aura + hover + headline)

## Purpose
Build the front face of the product card: glass surface, status-tinted aura glow (subtle, not overpowering), trend emoji + product name + verb badge in header, big headline value with delta below, then pinned (important) sub-metrics list. Hover lifts the card. This task does NOT include the back face or flip animation — those are T11.

## Pre-conditions
- T04, T05 merged (compute + extractors available, so we can pass real `ProductCard` data in)
- T02 merged (Tailwind + shadcn ready)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T10-card-front`
2. Create `src/components/Card.tsx` exporting `Card` (named). Props:
   ```ts
   type CardProps = {
     product: ProductCard;
     onFlip?: () => void; // T11 wires this; for T10 it's optional/no-op
   };
   ```
3. Compute status from `product.verb`:
   - starts with `"tăng"` → `up`
   - starts with `"giảm"` → `down`
   - else → `flat`
   Helper function in same file or `src/lib/status.ts` (your call — keep it small).
4. Visual structure (Tailwind):
   - Outer: `relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 transition-all duration-200 hover:-translate-y-1`
   - Aura glow: an absolutely positioned pseudo-layer (`::before` or sibling div) with `bg-gradient-to-br` from a status-tinted color (e.g., `from-status-up/15` for up, `from-status-down/15` for down) that is `blur-3xl` and sits at `inset-0 -z-10`. Keep glow intensity SUBTLE — opacity 0.15-0.22 max. Hover increases to ~0.3.
   - Inner highlight: `box-shadow inset 0 1px 0 rgba(255,255,255,0.05)`
5. Header row: trend emoji (left), product name in font-semibold, verb badge on right (small pill, status-colored bg + text)
6. Hero stat block (centered or left-aligned per design):
   - `headline_label` in muted-color small caps
   - `headline_value` in JetBrains Mono, 4xl, status-tinted
   - `headline_delta` in JetBrains Mono, sm, status-color
7. Pinned metrics list: render only `sub_metrics.filter(m => m.important && m.value !== "N/A")`. Each row is a 3-col grid: label / value / delta. Delta colored by `up`/`down`/`flat`, with INVERSE flag flipping color when `m.inverse === true`.
8. The card click handler is wired to `onFlip` callback (no-op fallback) for forward compatibility.
9. Card must declare a status data attribute: `data-status={status}` for testing and future styling.
10. Test `tests/card.test.tsx`:
    - Render with a mock ProductCard with verb `"tăng mạnh"` → assert `data-status="up"` and aura class includes `status-up`
    - Render with verb `"giảm"` → assert `data-status="down"`
    - Render with `inverse: true` on a sub-metric → if delta starts with `"+"` the color class is `down` (inverse flips it)
    - Render with all sub_metrics having `important: false` → no metric rows visible (the back face will show them; T11)
    - Snapshot or DOM test for headline value showing `fmt`-formatted text
11. Run tests + typecheck — green
12. Commit: `T10: add Card front face with status aura + hover lift`
13. Request review

## Post-conditions
- `src/components/Card.tsx` exports `Card` component matching the props above
- Cards render with glass + aura + correct status coloring
- Hover triggers translateY(-4px) + glow brighten
- Inverse flag flips delta color correctly on the front-face pinned metrics
- All Vietnamese label content from `ProductCard.sub_metrics[].label` and `headline_label` renders with correct diacritics
- 5+ test cases pass
- No back face, no flip — those come in T11

## Files in scope
- src/components/Card.tsx (create)
- src/lib/status.ts (create — small helper, or inline in Card.tsx)
- tests/card.test.tsx (create)

## Out of scope
- Card back face (T11)
- 3D flip animation (T11)
- Section / grid layout (T12)
- Count-up animation (T12)

## Success criteria
- Card visually matches design tokens (glass + aura tint)
- Hover behavior works in dev preview
- Inverse flag respected
- All tests green

## Notes
The "subtle, not overpowering" aura was a specific user request — err on the side of LESS opacity. If the aura looks like a neon sign, dial it back. The reference is Apple's Stocks app card style: present but quiet. Glow opacity values in the design tokens are upper bounds, not targets.
