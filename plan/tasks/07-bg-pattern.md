# T07 — Background pattern component (dots + fade-edges + drift)

## Purpose
Build the ambient background that sits behind everything (hero + dashboard). Static-looking dots pattern with a radial fade-edges mask and a slow translate-drift animation (1–2px/sec). This is a single self-contained component, no React state.

## Pre-conditions
- T02 is merged (Tailwind + globals.css available)
- Design tokens for `--accent-teal`, `--bg-base` are set in globals.css

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T07-bg-pattern`
2. Create `src/components/BgPattern.tsx` as a named export `BgPattern`. The component:
   - Renders a single `<div>` absolutely positioned to fill its parent (`absolute inset-0 -z-10`)
   - Uses CSS `background-image: radial-gradient(rgba(95,201,178,0.18) 1px, transparent 1px)` for the dot pattern
   - Uses `background-size: 22px 22px`
   - Applies a mask: `mask-image: radial-gradient(ellipse at center, black 40%, transparent 100%)` (Tailwind has `mask` utilities; use them OR raw CSS)
   - Uses CSS `@keyframes drift` translating `background-position` from `0 0` to `220px 220px` over 80–100 seconds linear infinite (gives ~2px/sec drift on the major axis)
   - Accepts no props
3. Add the keyframes to `src/styles/globals.css` under a `@layer utilities` block, keyed `bg-drift`
4. The component must be `position: absolute` so it sits inside any container that has `position: relative`
5. Render `<BgPattern />` once in `src/App.tsx` immediately under the top-level `<div className="relative min-h-screen overflow-hidden">` wrapper — so it's visible everywhere downstream until a task replaces App contents
6. Smoke test: `tests/bg-pattern.smoke.test.tsx` mounts `<BgPattern />` and asserts the rendered element has the expected class names. No animation assertion needed — visual only.
7. Run `npm run dev` and visually confirm the pattern is visible behind the existing scaffold stub
8. Commit: `T07: add BgPattern with dots + fade-edges mask + slow drift`
9. Request review

## Post-conditions
- `src/components/BgPattern.tsx` exports a named React component
- App renders `<BgPattern />` and the pattern is visible in dev preview
- Smoke test passes
- The pattern animates at `prefers-reduced-motion: no-preference`; for `prefers-reduced-motion: reduce` the drift animation is disabled (use a `@media` rule in globals.css)
- No JS animation loop — CSS only

## Files in scope
- src/components/BgPattern.tsx (create)
- src/styles/globals.css (modify — add keyframes + reduced-motion override)
- src/App.tsx (modify — mount BgPattern)
- tests/bg-pattern.smoke.test.tsx (create)

## Out of scope
- Particle network animation
- Multiple variants (dots is the only one needed)
- Color theming via props (color is fixed via CSS var)

## Success criteria
- Pattern visible behind app contents
- Drift animation runs in dev (visually verifiable)
- Reduced motion preference respected
- Smoke test passes

## Notes
The 21dev BgPattern reference component used React props for variants/masks. v2 needs only ONE variant (dots) and ONE mask (fade-edges). Hard-code these — do NOT add prop-driven variants. P2 (Simplicity First). If a future task wants a different variant, that can be added then.
