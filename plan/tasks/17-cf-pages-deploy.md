# T17 — New Cloudflare Pages project + deploy verification

## Purpose
Create a new Cloudflare Pages project for v2, connect it to the `feat/v2-react-rewrite` branch, configure build settings for Vite, set required env vars, and verify the preview URL serves the v2 app correctly. The legacy v1 project stays running on `main` until DNS swap (out of scope for this task).

## Pre-conditions
- T15, T16 merged (full v2 functionality on integration branch)
- Cloudflare account access available (user-side action; executor confirms via dashboard or wrangler CLI)
- Supabase env vars known (already used in v1 — reuse)

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T17-cf-pages-deploy`
2. Verify `package.json` build script is `vite build` and outputs to `dist/`. If not, fix.
3. Create or update repo-root `README.md` with:
   - Project description (1 paragraph)
   - Local dev steps: clone, `npm install`, copy `.env.example` to `.env`, `npm run dev`
   - Build steps: `npm run build`
   - Deployment notes (where the v2 site lives, how to swap DNS later)
4. Create or update `.env.example` if missing — confirm the 3 env vars from T06 are listed.
5. Create a Cloudflare Pages config note in `docs/deploy.md`:
   - Project name suggestion: `ssi-dashboard-v2` (or similar)
   - Production branch: `feat/v2-react-rewrite`
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: 20 (set via `.nvmrc` or CF dashboard)
   - Env vars to set in CF dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WRITE_PASSWORD`
6. Add `.nvmrc` at repo root with `20` to pin Node version.
7. The actual CF Pages project creation is a manual step the user performs (or executor performs via the Cloudflare MCP if available). Document the step-by-step in `docs/deploy.md`:
   - Log into CF dashboard → Workers & Pages → Create → Pages → Connect to git
   - Select repo, set production branch to `feat/v2-react-rewrite`
   - Set build command, output, Node version, env vars
   - Save and trigger first build
8. After first deployment succeeds, capture the preview URL (e.g., `ssi-dashboard-v2.pages.dev`) and write it into the log.md decisions section.
9. Smoke verification:
   - HTTP GET the preview URL → status 200
   - Hero landing renders → confirm by visual check
   - Type password `123` → dashboard appears with cards
   - Confirm legacy site at `report-daily-dashboard-git.pages.dev` (or wherever v1 lives) still serves vanilla v1 unchanged
10. If the executor cannot directly create the CF project (no MCP, no auth), set `Status: blocked`, `Esc: Y`, and write clear instructions to the user in log.md so they can do the manual setup. Resume by re-checking deployment after user confirms.
11. Commit any documentation/config changes: `T17: add deploy docs + Node pin`
12. Request review

## Post-conditions
- `README.md` exists with dev + build + deploy info
- `docs/deploy.md` exists with CF Pages setup steps
- `.nvmrc` exists with Node 20
- New CF Pages project deployed successfully (or blocked-and-documented if user-action required)
- Preview URL returns 200 and shows v2 hero
- Legacy v1 site still alive on its old URL
- Decisions log in log.md updated with the new preview URL

## Files in scope
- README.md (create or modify)
- docs/deploy.md (create)
- .nvmrc (create)
- .env.example (verify / modify)

## Out of scope
- DNS swap from old URL to new — planner handles separately after VERIFY passes
- Custom domain configuration
- Tearing down or modifying the legacy CF Pages project

## Success criteria
- v2 preview URL is live and reachable
- Legacy v1 URL is still live and unchanged
- Documentation is sufficient for the user to repeat the deploy on their own
- All env vars correctly set in CF dashboard

## Notes
This task crosses the cloud-infra boundary, so it can stall if the executor lacks credentials or the Cloudflare MCP. That's fine — the planner-defined fallback is to document the manual steps clearly in `docs/deploy.md` and block the task with `Esc: Y` so the user sees it and acts. Do NOT mock or skip the verification step; without a real preview URL we cannot complete VERIFY.md.
