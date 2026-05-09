# Acceptance — End of Plan

When all tasks T01..T18 are `done`, verify:

## Functional

### Hero landing
- [ ] Opening the v2 preview URL shows hero landing immediately, NOT the dashboard
- [ ] Hero shows: title ("SSI Báo Cáo" with diacritics), subtitle, password input, CTA button
- [ ] Background pattern (dots + fade-edges) renders behind hero
- [ ] Wrong password shows inline error, does not unlock
- [ ] Correct password `123` triggers hard cut → dashboard appears
- [ ] Reloading the page returns to hero (no session memory)

### Dashboard structure
- [ ] Sticky glass pill tab bar at top with "Daily / Weekly / Monthly" labels (English)
- [ ] Only one section visible at a time
- [ ] Active tab glows teal, inactive tabs are dim
- [ ] Background pattern is the same as hero (continuous, slow drift)

### Cards
- [ ] 6 product cards render per active tab (HOSE, Margin, Phái sinh, S-Cash, S-Fund, Mở mới)
- [ ] Vietnamese diacritics correct on every label ("Thị Phần", "Phái Sinh", "Thị trường")
- [ ] Cards sorted: tăng → giữ → giảm (priority HOSE → Margin → Phái sinh → S-Cash → S-Fund → Mở mới)
- [ ] Status aura glow visible: green for `tăng`, red for `giảm`, gray for flat — subtle, not overpowering
- [ ] Hover lifts card -4px, intensifies glow (200ms)
- [ ] Numbers formatted Vietnamese-style: `8,52%`, `42.074 tỷ`, `(+5.543 tỷ, +21,65%)`
- [ ] Click card → 3D flip (~600ms) reveals back face
- [ ] Margin card back face has 3 group sections: T+7, Trading Plus, M+ (in this order)
- [ ] Phái sinh card back face has D+ group
- [ ] HOSE / S-Cash / S-Fund / Mở mới back faces show ungrouped sub-metrics
- [ ] `KH cancel D+` shows inverted color (negative number = green, positive = red)
- [ ] Click flipped card again → flips back to front

### First-mount choreography
- [ ] First time dashboard appears after hero unlock: cards stagger pop-in (50ms apart) + headline numbers count up to value (~1200ms)
- [ ] After tab switch: instant render, no stagger, no count-up
- [ ] After refresh button: instant render, no stagger, no count-up

### Modal grid
- [ ] "Nhập liệu" button visible on each section, glass pill style
- [ ] Click "Nhập liệu" → glass full-screen modal opens, dashboard blurs behind
- [ ] Modal contains: title with section name, close X top-right, DataTable with last ~20 rows + 1 empty add-row, "+ Thêm dòng" button
- [ ] `ngày` column on existing rows is non-editable (frozen value); on new blank row it is editable
- [ ] Other cells editable inline
- [ ] Cell type errors block save and revert value
- [ ] Range/outlier warnings show colored border + tooltip without blocking
- [ ] Edit a cell → wait 1s → toast "Đã lưu" appears bottom-right, fades after 2s
- [ ] Esc key closes modal
- [ ] X button closes modal
- [ ] After modal close + section refresh, edited values are visible in the cards

### Refresh + auto-stale
- [ ] "↻ Tải lại" button on each section glass-pill styled
- [ ] Click confirms via dialog, then re-fetches that section only
- [ ] Cooldown disables button for 5 seconds after a refresh
- [ ] Opening the app on a new calendar day (vs lastRefreshDate in localStorage) silently re-fetches all 3 sections once

### Empty / loading / error
- [ ] No data → centered glass card "Chưa có dữ liệu"
- [ ] During fetch → skeleton shimmer placeholders
- [ ] Fetch error → centered glass card with retry button "Thử lại"

## Tests
- [ ] `npm run test` — all green
- [ ] Compute tests cover: clean, fmt (% / tỷ / KH), diff (5 verbs), detectTrend (📈 streak, 📉 streak, 🔴 sudden drop), MAD z-score, isManhDelta, weekdayVn
- [ ] Extractors tests cover all 6 product functions returning correct shape (key, name, sub_metrics, groups for margin + phaisinh)
- [ ] Validation tests cover: type error, range warn, outlier warn, date format, inverse-aware

## Code health
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run typecheck` — 0 errors
- [ ] No TODOs or FIXMEs added in this plan
- [ ] No unplanned files modified (cross-check log.md exit checks)
- [ ] No `any` types in committed code (use `unknown` if needed)
- [ ] No imports of React or DOM inside `src/lib/*`

## Documentation
- [ ] README updated with: project description, dev/build commands, env var setup
- [ ] `.env.example` includes `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WRITE_PASSWORD`

## Deployment
- [ ] New Cloudflare Pages project created and connected to `feat/v2-react-rewrite` branch
- [ ] Build settings: build command `npm run build`, output `dist/`, Node 20
- [ ] Preview URL returns HTTP 200 and the hero landing renders
- [ ] Existing `report-daily-dashboard-git.pages.dev` (legacy) still serves vanilla v1 unchanged
- [ ] DNS swap is documented in README but NOT performed in this plan (planner triggers separately)

## Final checker pass
A checker agent reads all log.md exit checks and reports any drift, contradictions, or low-confidence flags. If checker raises issues, escalate to planner before declaring plan done.
