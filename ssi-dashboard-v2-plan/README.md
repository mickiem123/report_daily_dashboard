# SSI Báo Cáo — v2

Live dashboard nội bộ SSI. Hiển thị chỉ số kinh doanh theo ngày, tuần, tháng cho 6 sản phẩm: HOSE, Margin, Phái Sinh, S-Cash, S-Fund, Mở mới. Được xây dựng với React 18 + TypeScript + Tailwind + shadcn/ui, kết nối Supabase, deploy trên Cloudflare Pages.

## Local dev

```bash
git clone https://github.com/mickiem123/report_daily_dashboard.git
cd report_daily_dashboard
git checkout feat/v2-react-rewrite
npm install
cp .env.example .env        # fill in real values
npm run dev                 # http://localhost:5173
```

## Build

```bash
npm run build               # output → dist/
npm run preview             # preview built bundle locally
```

## Tests / lint / typecheck

```bash
npm run test
npm run lint
npm run typecheck
```

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `VITE_WRITE_PASSWORD` | Shared password to unlock the dashboard (default: `123`) |

## Deployment

v2 lives at **https://ssi-dashboard-v2.pages.dev** (Cloudflare Pages, direct upload).

v1 legacy stays at https://report-daily-dashboard-git.pages.dev until DNS swap.

See `docs/deploy.md` for full Cloudflare Pages setup and DNS swap instructions.
