# Supabase-Style Design Tokens

## Color
- `canvas`: `#ffffff`
- `canvas-soft`: `#fafafa`
- `canvas-night`: `#1c1c1c`
- `canvas-night-soft`: `#202020`
- `ink`: `#171717`
- `ink-secondary`: `#212121`
- `ink-mute`: `#707070`
- `ink-faint`: `#b2b2b2`
- `hairline`: `#dfdfdf`
- `hairline-strong`: `#c7c7c7`
- `primary`: `#3ecf8e`
- `primary-deep`: `#24b47e`
- `on-primary`: `#171717`
- `on-dark`: `#ffffff`

## Typography
- Display and UI: Inter locally bundled through `@fontsource/inter`.
- Display weight: `500`, with tight tracking on large headings where used.
- Body weight: `400`.
- Control labels: `14px`, weight `500`.
- Mono: `ui-monospace`, Menlo, Monaco, Consolas for numbers and code-like values.

## Shape And Surface
- Buttons and inputs: `6px` radius.
- Compact cards: `8px` radius.
- Modals and large panels: `12-16px` radius.
- Default surfaces are white with 1px grey hairlines.
- Primary emerald is reserved for filled calls to action and scarce accents.
- Dark `canvas-night` is reserved for code-like or featured inverted surfaces.

## Motion And Background
- No atmospheric dark animated paths.
- Background may use a nearly invisible light hairline grid.
- Focus rings use emerald at low opacity.
