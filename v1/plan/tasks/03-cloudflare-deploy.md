# Task 03: Cloudflare Pages connection + git workflow

> Depends on: 01
> Estimated complexity: S
> READ-ONLY — do not modify this file. Report progress in log.md.

## Goal
Connect the new GitHub repo to Cloudflare Pages so that pushes to `main` deploy to the live URL and pushes to feature branches produce automatic preview URLs. Document the team git workflow so all future tasks follow it.

## Success Criteria
- [ ] GitHub repo for `ssi-dashboard` exists and contains the T01 + T02 commits.
- [ ] Cloudflare Pages project is connected to that repo, build output set to `public/`.
- [ ] Pushing to `main` deploys to a Cloudflare Pages URL (either the existing `report-daily.pages.dev` re-pointed, or a fresh `<project>.pages.dev`).
- [ ] Pushing any other branch creates a preview deployment with its own URL.
- [ ] `README.md` has a "Deployment & Git Workflow" section documenting branch naming, PR flow, and how to find preview URLs.
- [ ] A test feature branch was pushed and the preview URL was confirmed working (even if blank — just confirms wiring).

## Contract

### Pre-conditions (verify before starting — STOP if any fail)
- [ ] T01 done (repo exists, has at least 1 commit).
- [ ] User has pushed the repo to GitHub (or executor verifies remote is set).
- [ ] User has a Cloudflare account with Pages access (free tier OK).
- [ ] Cloudflare MCP is connected, OR executor will instruct user manually via dashboard.

### Post-conditions (verify after completing)
- [ ] `https://<project>.pages.dev` resolves (even if currently empty / 404 on `/`, the deployment exists).
- [ ] A feature branch push triggered a preview build visible in Cloudflare Pages dashboard.
- [ ] `README.md` updated.

## Scope (Surgical Changes — Principle 3)
**Files allowed to touch:**
- `README.md` (append "Deployment & Git Workflow" section)
- `.github/` (skip — no Actions needed; Cloudflare builds directly)
- Cloudflare Pages settings (via MCP or user action)

**Files NOT to touch:**
- Anything inside `public/` (T04+).
- Anything inside `deprecated/`.

## Steps

### Step 1: Confirm repo URL on GitHub
If user hasn't pushed yet, block. Append to log.md:
```
USER ACTION REQUIRED — push T01 commit to GitHub first.
```

### Step 2: Connect Cloudflare Pages to repo
Two paths — try MCP first, fall back to manual instructions for the user.

**Path A: via Cloudflare MCP (preferred)**
- Use Cloudflare MCP to create a new Pages project linked to the GitHub repo.
- Set: Build command = (none), Build output directory = `public`, Root directory = `/`.
- Production branch = `main`.

**Path B: manual (user does in browser)**
Append to log.md T03 entry:
```
USER ACTION REQUIRED — Connect Cloudflare Pages:

1. Go to https://dash.cloudflare.com → Workers & Pages → Create → Pages →
   "Connect to Git".
2. Select your GitHub account, then the `ssi-dashboard` repo.
3. Configure:
     - Production branch: main
     - Build command: (LEAVE EMPTY)
     - Build output directory: public
     - Root directory: /
4. Click "Save and Deploy".
5. Once deployed, copy the *.pages.dev URL and paste it into log.md T03 entry.

NOTE: If you want to reuse the existing `report-daily.pages.dev` URL, either:
  (a) Re-point that project at this new repo (Settings → Builds → unlink old, link new), OR
  (b) Delete it and let the new project claim that subdomain.

If neither works, just take whatever new *.pages.dev URL Cloudflare assigns and
update the team bookmark.
```

### Step 3: Verify production deploy
- After connection, push to `main` should auto-deploy.
- Visit the URL. Even though `public/` is empty, Cloudflare returns a directory listing or 404 — that's fine, it confirms the deploy ran.

### Step 4: Verify preview branch flow
- Locally:
  ```bash
  git checkout -b feat/03-cloudflare-test
  echo "test" > public/.cf-test
  git add public/.cf-test
  git commit -m "test: verify preview build"
  git push -u origin feat/03-cloudflare-test
  ```
- Cloudflare Pages dashboard should show a new preview deployment with its own URL within ~1 min.
- Confirm the preview URL works (even if just shows directory listing / 404).
- Clean up:
  ```bash
  git checkout main
  git branch -D feat/03-cloudflare-test
  git push origin --delete feat/03-cloudflare-test
  rm public/.cf-test 2>/dev/null
  ```

### Step 5: Document the workflow in README.md
Append:
```markdown
## Deployment & Git Workflow

- **Production:** `main` branch auto-deploys to https://<project>.pages.dev.
- **Previews:** any other branch auto-deploys to a preview URL on push.
  Find the URL in Cloudflare Pages dashboard or in the GitHub PR check.
- **Branch naming:** `feat/<task-number>-<short-name>` (e.g., `feat/04-dashboard-skeleton`).
- **Workflow per task:**
  1. `git checkout main && git pull`
  2. `git checkout -b feat/NN-name`
  3. work, commit early/often
  4. `git push -u origin feat/NN-name`
  5. Open PR to `main` on GitHub
  6. Verify Cloudflare preview URL works
  7. Reviewer approves → merge → main auto-deploys
- **Hotfixes:** same flow, branch named `fix/<short>` instead.
- **Rollback policy:** fix-forward only. Never revert; commit a new fix on top.
```

### Step 6: Commit & push README change on a feature branch (per workflow)
```bash
git checkout -b feat/03-cloudflare-deploy
git add README.md
git commit -m "docs: cloudflare pages + git workflow"
git push -u origin feat/03-cloudflare-deploy
# Open PR → confirm preview URL → merge to main
```

## Verification
- Visit `https://<project>.pages.dev` → returns a response (200 with directory index, or 404 — both OK at this stage).
- Cloudflare Pages dashboard shows ≥ 1 production deployment + ≥ 1 preview deployment in history.
- README.md contains the new section.

## When to STOP and ASK (Think Before Coding — Principle 1)
- User wants to keep the existing `report-daily.pages.dev` URL but unsure how → ask which path (re-point vs delete vs new URL).
- Cloudflare MCP is unavailable AND user cannot complete manual steps → ask if Vercel is acceptable fallback (per user q44, Cloudflare is the choice — only revisit on hard block).
- Preview branch deploy fails (build error) with empty `public/` → ask before adding placeholder file; may indicate Cloudflare config issue.

## After Completion
Update log.md T03 entry:
- Files changed: `README.md`
- Tests: production URL + preview URL both confirmed reachable
- Unplanned changes: any
- Contradictions with CONTEXT.md: any
- Confidence: HIGH if both URLs confirmed by user
- Set Status = `done` (or `blocked` if waiting on user MCP/manual step)
