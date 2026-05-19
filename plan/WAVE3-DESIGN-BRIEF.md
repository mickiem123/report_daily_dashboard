# Wave 3 UI/UX Design Brief

## Objective
Build a premium, calm, dark glassmorphism dashboard experience for SSI reporting. The UI must feel operational and high-signal, not marketing-like. Every design decision should improve scan speed, clarity, and trust for daily repeated use.

## Design Intent
- Tone: professional, focused, data-first.
- Mood: modern and polished, but restrained.
- Visual energy: subtle motion and glow, never flashy.
- Density: compact enough for work, with clear grouping and whitespace.

## Audience
- Internal business users reviewing daily/weekly/monthly performance quickly.
- They need immediate visual status, not decorative storytelling.

## Core Visual Language
- Background: deep dark teal (`--bg-base`) with ambient dots drift from `BgPattern`.
- Surfaces: translucent glass (`bg-white/5`, border `white/10`, blur).
- Accent: teal primary (`--accent-teal`) with emerald/cyan support.
- Status colors:
  - Up: `--status-up`
  - Down: `--status-down`
  - Flat: `--status-flat`
- Typography:
  - Body/display: Be Vietnam Pro
  - Numeric emphasis: JetBrains Mono
- Vietnamese diacritics: mandatory in all labels and messages.

## Interaction Principles
- Fast, deterministic interactions:
  - Tab switching: instant.
  - Hero unlock: hard cut.
- Motion usage:
  - Hover lift: short, subtle.
  - Card flip: clear 3D transition, readable at all times.
  - First mount choreography: one-time delight only; no repeated animation noise.
- Accessibility:
  - Keyboard-first tab and form behavior.
  - Visible focus rings.
  - Reduced-motion mode disables non-essential animation.

## Component-Specific Expectations (Wave 3)
1. Hero (`T08`)
- Full viewport, centered composition.
- Strong title hierarchy: `SSI Báo Cáo`.
- Glass panel only around form area, not the whole page.
- Inline error messaging: concise, Vietnamese, high contrast.

2. Layout + Tabs (`T09`)
- Sticky glass pill tab bar near top.
- Labels in English: `Daily`, `Weekly`, `Monthly`.
- Active state must be clearly visible with teal tint/glow.
- Inactive state muted but legible.

3. Card Front (`T10`)
- Hierarchy: product identity -> headline value -> delta -> key metrics.
- Status aura glow is subtle, not neon.
- Pinned metrics are concise and easy to scan.
- Inverse metric color logic must remain visually consistent.

4. Card Back + Flip (`T11`)
- Grouped details must be explicit and readable:
  - Margin: `T+7`, `Trading Plus`, `M+`
  - Phái sinh: `D+`
- Flip must not cause layout shift.
- Click front/back toggles predictably.

5. Section + States (`T12`)
- Clear states:
  - Loading: skeleton
  - Empty: "Chưa có dữ liệu"
  - Error: retry affordance
  - Populated: 6 cards in stable order
- First-render choreography once per page lifetime only.

## UX Quality Bar (Acceptance)
- A user can identify current mode, status direction, and top deltas in under 5 seconds.
- No visual ambiguity between up/down/flat states.
- No overcrowded card content or clipping on common desktop sizes.
- All interactive controls have clear hover/focus/active feedback.
- `npm run test` and `npm run typecheck` pass with no UI state regressions.

## Anti-Patterns to Avoid
- Over-bright glow or heavy blur that reduces readability.
- Generic template look (unstyled defaults, weak hierarchy).
- Inconsistent wording/language style across components.
- Animated transitions on tab change.
- Decorative elements that compete with metrics.

## Handoff Rule for UI Agents
Before implementation, the agent must validate each UI task (`T08`-`T12`) against this brief and `plan/tasks/*.md`. If a visual choice conflicts with task contract, task contract wins and the deviation is logged in `plan/log.md`.
