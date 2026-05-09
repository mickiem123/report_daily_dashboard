# Cloudflare Pages — Deploy Guide

## v2 project (current)

- **Project name:** `ssi-dashboard-v2`
- **Live URL:** https://ssi-dashboard-v2.pages.dev
- **Deploy method:** Direct upload via `wrangler pages deploy dist`
- **Build command:** `npm run build`
- **Output dir:** `dist/`
- **Node version:** 20 (pinned via `.nvmrc`)

### Re-deploy manually

```bash
npm run build
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=b502de4463b7a7ae1d1051ee3048833d \
  npx wrangler pages deploy dist --project-name ssi-dashboard-v2
```

### Set up git-connected CI (optional upgrade)

1. dash.cloudflare.com → Workers & Pages → `ssi-dashboard-v2` → Settings → Builds & Deployments
2. Connect GitHub → repo `mickiem123/report_daily_dashboard`
3. Production branch: `feat/v2-react-rewrite`
4. Build command: `npm run build` · Output: `dist` · Node: `20`
5. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WRITE_PASSWORD`

## v1 legacy project (do not touch until DNS swap)

- **Project name:** `report-daily-dashboard-git`
- **Live URL:** https://report-daily-dashboard-git.pages.dev
- Branch: `main`

## DNS swap (planner action — after VERIFY passes)

1. Confirm v2 passes full VERIFY.md
2. In CF dashboard → `ssi-dashboard-v2` → Custom Domains → add production domain
3. Update DNS records to point at v2
4. Verify old URL still resolves (CF keeps old project alive)
5. Archive or delete `report-daily-dashboard-git` after 2-week soak period

## Environment variables required

| Variable | Where to get |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon public key |
| `VITE_WRITE_PASSWORD` | Set to `123` or change as needed |
