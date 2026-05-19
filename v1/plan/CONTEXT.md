# Shared Context — SSI Dashboard Pivot

> Executor: read this FIRST before any task file.

## 4 Coding Principles (MUST FOLLOW)
1. **Think Before Coding** — state assumptions, surface tradeoffs, ask if unclear. STOP and write to `log.md` if a precondition is unmet or scope is ambiguous.
2. **Simplicity First** — minimum code, no speculative features, no abstractions for single-use code.
3. **Surgical Changes** — touch only what each task scope allows; do not "improve" adjacent code.
4. **Goal-Driven Execution** — every task has testable post-conditions. Loop until they pass.

## Project Structure (target end-state)
```
ssi-dashboard/                        ← new git repo root
├── .gitignore
├── README.md
├── public/                           ← Cloudflare Pages serves this folder
│   ├── index.html                    ← single-page dashboard
│   ├── assets/
│   │   ├── tabulator.min.js          ← v6.3.x bundled locally
│   │   ├── tabulator.min.css
│   │   └── supabase.min.js           ← v2.x UMD bundle
│   └── js/
│       ├── config.js                 ← Supabase URL + anon key (gitignored OR public)
│       ├── compute.js                ← ported Python utilities
│       ├── extractors.js             ← 6 product_data_* ports
│       ├── render.js                 ← card rendering
│       ├── grid.js                   ← Tabulator integration
│       └── main.js                   ← entry point, glues everything
├── supabase_schema.sql               ← run once in Supabase SQL Editor
├── tests/
│   ├── compute.test.html             ← browser-runnable tests
│   └── ...
└── deprecated/                        ← old code, kept for reference
    ├── report.py
    ├── export_pdf.ps1
    ├── MAINTENANCE.md
    ├── requirements-dev.txt
    └── assets/
        ├── sortable.min.js
        └── apexcharts.min.js
```

## Naming Conventions
- **Files:** `kebab-case.html`, `camelCase.js` for JS modules.
- **Functions:** `camelCase` in JS (e.g., `computeDelta`, `detectTrend`).
- **CSS classes:** `kebab-case`, keep existing names from `report.py` HTML output (`.product-card`, `.metric-row`, `.up`, `.down`, `.flat`, `.verb-badge`, etc.).
- **Supabase columns:** `snake_case` matching schema in `supabase_schema.sql`.
- **JS variables for products:** `hose`, `margin`, `phaisinh`, `scash`, `sfund`, `momoi` (matches Python keys).
- **Git branch names:** `feat/<task-number>-<short-name>` (e.g. `feat/04-dashboard-skeleton`).

## Key Architecture Patterns

### Data flow
```
Supabase (3 tables)
   │
   ├─ on page load → fetch last 22 rows from each table
   │      → store in window.STATE = { daily: [...], weekly: [...], monthly: [...] }
   │
   ├─ for each mode → run extractors → run renderCard() → inject into DOM
   │
   └─ on input grid save → upsert row → re-fetch that mode's rows → re-render that section
```

### Compute layer (port from Python)
- All Python helpers in `report.py` ported to `js/compute.js`. Function names match Python, just `camelCase`.
- `clean(v)` → `clean(v)`: handle nulls, Excel error codes (< -2_000_000_000), date objects.
- `fmt(v, unit)` → `fmt(v, unit)`: format `%`, `tỷ`, `KH`, `HĐ`, `tài khoản`. % multiplies decimal × 100.
- `diff(today, prev, unit)` → returns `{verb, prep, valStr, deltaStr, pctDelta}`.
- `detectTrend(colName, rows)` → returns emoji `📈 / 📉 / 🔴 / ""` per logic in MASTER `Pending Task 1`.
- `isManhDelta(today, prev, history, cfg)` → MAD-based robust z-score. Match Python output exactly.
- `serialToDate(serial)` → only relevant if Excel serials are stored. Supabase stores ISO date strings, so this is mostly N/A.

### Product extractors (port from Python)
- One function per product: `productDataHose(today, prev, rows)` → returns dict identical to Python's.
- Add `group` field where applicable (M+ items, D+ items).
- Add `inverse: true` to `KH cancel D+` (column `kh_cancel_dplus`).

### Card render (port from Python)
- `renderCard(product, rank)` returns HTML string.
- Pinned section = `important: true` metrics.
- Collapsible details section = `important: false` metrics.
- Inside details, group metrics by `group` field. Render group label + indented metrics.
- Metrics with no `group` render flat below grouped sections.
- Color class: `inverse: true` flips `+` → `down`, `-` → `up`.

### Page layout
3 stacked sections: `<section id="daily">`, `<section id="weekly">`, `<section id="monthly">`.
Each section:
- Header bar: title (e.g., "Báo cáo ngày") + section-level buttons (Refresh, Input).
- Cards container: grid of product cards (sorted via Python's tang/giu/giam logic).
- Hidden input grid (Tabulator container), revealed by Input button click.

### Refresh
- Manual: button → `confirm("Tải lại dữ liệu? (Có thể mất vài giây)")` → `confirm` true → re-fetch + re-render that section.
- Auto-daily: on page load check `localStorage.lastRefreshDate`. If different from today's date → auto-refresh once silently.
- Debounce: ignore button clicks within 5 seconds of previous refresh.

### Input grid (Tabulator)
- Hidden by default. "Nhập liệu" button toggles visibility.
- On first toggle: prompt password (`prompt("Nhập mật khẩu:")`). Match against `123`. Store success in `sessionStorage.canEdit = "1"`.
- Once authed: grid editable. All 43 columns visible. Frozen header row. Frozen first data column (`ngay`).
- Last row = empty new-entry row at bottom.
- 20 history rows visible above empty row.
- Auto-save on cell blur (debounced 1s) → upsert by `ngay`.
- Add row button: appends new empty row.
- Delete row button per row: `confirm("Xóa dòng dd-mm-yyyy?")` → DELETE.
- After save: re-fetch + re-render that section's cards.

### Validation (per cell)
On cell edit, run validators. Add CSS class `.cell-warn` if flagged. Tooltip via `title` attribute explains why. Does NOT block save (warn only).
- **Type:** if column expects number and value is non-numeric → flag (block save in this case).
- **Range:** percentage cols must be between 0 and 1 (decimal). Flag if outside.
- **Outlier:** z-score vs last 20 rows of same column. If `|z| > 3` → flag.
- **Negative where impossible:** `slkh_*`, `tong_du_no_margin`, `so_du_*`, etc. cannot be < 0 → flag.

### Sorting cards
Same as Python:
- Bucket by `verb`: `tăng` / `giữ nguyên mức` / `giảm`.
- Order: `tang` first → `giu` → `giam`.
- Within bucket, preserve fixed priority: HOSE → Margin → Phái sinh → SCASH → SFUND → Mở mới.

## Existing Code Reference

### `deprecated/report.py` — source of truth for all logic ports
- Lines ~150-180: `clean()`, `fmt()` — utility helpers
- Lines ~180-250: `diff()`, `detect_trend()`, anomaly detection
- Lines ~400-1100: 6 `product_data_*()` functions
- Lines ~1450-1600: `render_card()` — current HTML output structure
- Lines ~1100-1400: `_html_shell()` — base HTML + CSS to mirror

### Existing CSS classes (preserve)
```
.up { color: #5fc992 }     /* green */
.down { color: #ff6363 }   /* red */
.flat { color: #6a6b6c }   /* gray */
.product-card, .verb-badge, .hero-delta, .metric-delta,
.metric-row, .group-label, .details
```

### Existing CSS variables (preserve)
```
--bg-app, --bg-surface, --accent-blue, --accent-green,
--accent-red, --accent-yellow, --status-up, --status-down
```

Default theme: `dark`. Toggle persists to `localStorage.theme`.

## Environment & Config

### `.env.example` (committed)
```
SUPABASE_URL=https://YOURPROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
WRITE_PASSWORD=123
```

### `public/js/config.js` (committed — anon key is safe to expose)
```js
window.SUPABASE_URL = "https://YOURPROJECT.supabase.co";
window.SUPABASE_ANON_KEY = "eyJ...";
window.WRITE_PASSWORD = "123";
```
> Anon key is intentionally public (Supabase design). RLS policies enforce read-only by default. Write actions are gated by JS prompt only.

### Build / test commands
- No build step. Open `public/index.html` directly in browser.
- Tests: open `tests/compute.test.html` in browser → see assertions in console + on-page output.
- Local serve (optional): `python -m http.server 8000 -d public/` → `http://localhost:8000`.

## Communication Protocol
- `log.md` is the live channel. Update it as work progresses.
- Task files are read-only. Never modify.
- Status flow: pending → executing → review → done (or blocked / failed).
- **Workflow:** for each task, executor creates branch `feat/NN-name`, commits work, pushes to GitHub, opens PR. Cloudflare Pages auto-builds preview. Reviewer checks preview URL. Merge to `main` on green.
- **Block protocol:** if executor needs user manual action (Supabase paste, GitHub auth, Cloudflare connect), set status `blocked`, Esc=Y, write clear instructions in log.md task entry.

## Executor Skills Available
test-driven-development, systematic-debugging, executing-plans,
subagent-driven-development, dispatching-parallel-agents, using-git-worktrees,
finishing-a-development-branch, requesting-code-review, context7

## References
- Tabulator docs: https://tabulator.info/docs/6.3 (fetch via context7 before T10)
- Supabase JS client: https://supabase.com/docs/reference/javascript/introduction (fetch via context7 before T04)
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/ (fetch before T03)
- Original Python tool reference: see `deprecated/report.py` and `deprecated/MAINTENANCE.md` (after T01).
