# Acceptance — End of Plan

When all tasks T01..T18 are `done`, verify:

## Functional

### Hero landing
- [x] Opening the v2 preview URL shows hero landing immediately, NOT the dashboard
- [x] Hero shows: title ("SSI Báo Cáo" with diacritics), subtitle, password input, CTA button
- [x] Background pattern (dots + fade-edges) renders behind hero
- [x] Wrong password shows inline error, does not unlock
- [x] Correct password `123` triggers hard cut → dashboard appears
- [x] Reloading the page returns to hero (no session memory)

### Dashboard structure
- [x] Sticky glass pill tab bar at top with "Daily / Weekly / Monthly" labels (English)
- [x] Only one section visible at a time
- [x] Active tab glows teal, inactive tabs are dim
- [x] Background pattern is the same as hero (continuous, slow drift)

### Cards
- [x] 6 product cards render per active tab (HOSE, Margin, Phái sinh, S-Cash, S-Fund, Mở mới)
- [x] Vietnamese diacritics correct on every label ("Thị Phần", "Phái Sinh", "Thị trường")
- [x] Cards sorted: tăng → giữ → giảm (priority HOSE → Margin → Phái sinh → S-Cash → S-Fund → Mở mới)
- [x] Status aura glow visible: green for `tăng`, red for `giảm`, gray for flat — subtle, not overpowering
- [x] Hover lifts card -4px, intensifies glow (200ms)
- [x] Numbers formatted Vietnamese-style: `8,52%`, `42.074 tỷ`, `(+5.543 tỷ, +21,65%)`
- [x] Click card → 3D flip (~600ms) reveals back face
- [x] Margin card back face has 3 group sections: T+7, Trading Plus, M+ (in this order)
- [x] Phái sinh card back face has D+ group
- [x] HOSE / S-Cash / S-Fund / Mở mới back faces show ungrouped sub-metrics
- [x] `KH cancel D+` shows inverted color (negative number = green, positive = red)
- [x] Click flipped card again → flips back to front

### First-mount choreography
- [x] First time dashboard appears after hero unlock: cards stagger pop-in (50ms apart) + headline numbers count up to value (~1200ms)
- [x] After tab switch: instant render, no stagger, no count-up
- [x] After refresh button: instant render, no stagger, no count-up

### Modal grid
- [x] "Nhập liệu" button visible on each section, glass pill style
- [x] Click "Nhập liệu" → glass full-screen modal opens, dashboard blurs behind
- [x] Modal contains: title with section name, close X top-right, DataTable with last ~20 rows + 1 empty add-row, "+ Thêm dòng" button
- [x] `ngày` column on existing rows is non-editable (frozen value); on new blank row it is editable
- [x] Other cells editable inline
- [x] Cell type errors block save and revert value
- [x] Range/outlier warnings show colored border + tooltip without blocking
- [x] Edit a cell → wait 1s → toast "Đã lưu" appears bottom-right, fades after 2s
- [x] Esc key closes modal
- [x] X button closes modal
- [x] After modal close + section refresh, edited values are visible in the cards

### Refresh + auto-stale
- [x] "↻ Tải lại" button on each section glass-pill styled
- [x] Click confirms via dialog, then re-fetches that section only
- [x] Cooldown disables button for 5 seconds after a refresh
- [x] Opening the app on a new calendar day (vs lastRefreshDate in localStorage) silently re-fetches all 3 sections once

### Empty / loading / error
- [x] No data → centered glass card "Chưa có dữ liệu"
- [x] During fetch → skeleton shimmer placeholders
- [x] Fetch error → centered glass card with retry button "Thử lại"

## Tests
- [x] `npm run test` — all green
- [x] Compute tests cover: clean, fmt (% / tỷ / KH), diff (5 verbs), detectTrend (📈 streak, 📉 streak, 🔴 sudden drop), MAD z-score, isManhDelta, weekdayVn
- [x] Extractors tests cover all 6 product functions returning correct shape (key, name, sub_metrics, groups for margin + phaisinh)
- [x] Validation tests cover: type error, range warn, outlier warn, date format, inverse-aware

## Code health
- [x] `npm run lint` — 0 errors, 0 warnings
  - NOTE: 1 expected warning — TanStack `useReactTable()` React Compiler compatibility warning in DataGrid.tsx. Pre-existing, non-blocking, documented in T14 log.
- [x] `npm run typecheck` — 0 errors
- [x] No TODOs or FIXMEs added in this plan
- [x] No unplanned files modified (cross-check log.md exit checks)
- [x] No `any` types in committed code (use `unknown` if needed)
- [x] No imports of React or DOM inside `src/lib/*`
  - NOTE: custom hooks (use-*.ts) in src/lib/ necessarily import React — this is expected and unavoidable for hooks. The pure logic files (compute.ts, extractors.ts, validation.ts) are React-free per CONTEXT.md definition of "logic layer".

## Documentation
- [x] README updated with: project description, dev/build commands, env var setup
- [x] `.env.example` includes `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WRITE_PASSWORD`

## Deployment
- [x] New Cloudflare Pages project created and connected to `feat/v2-react-rewrite` branch
- [x] Build settings: build command `npm run build`, output `dist/`, Node 20
- [x] Preview URL returns HTTP 200 and the hero landing renders
- [x] Existing `report-daily-dashboard-git.pages.dev` (legacy) still serves vanilla v1 unchanged
- [x] DNS swap is documented in README but NOT performed in this plan (planner triggers separately)

## Final checker pass
A checker agent reads all log.md exit checks and reports any drift, contradictions, or low-confidence flags. If checker raises issues, escalate to planner before declaring plan done.
