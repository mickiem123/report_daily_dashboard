# T01 — Bootstrap agent protocol files

## Purpose
Duplicate the agent protocol so all agent runtimes (Claude Code, Cursor, OpenAI agents, etc.) read the same rules. This is the first task on the integration branch and must complete before any other work.

## Pre-conditions
- Repo is checked out at the integration branch `feat/v2-react-rewrite`
- `/CLAUDE.md` exists at repo root (planner authored)
- `/plan/log.md` exists with this task as Status=`pending`

## Steps
1. Verify you are on a fresh branch from `feat/v2-react-rewrite`: `feature/T01-bootstrap-protocol`
2. Copy `/CLAUDE.md` to `/AGENTS.md` (identical content)
3. Copy `/CLAUDE.md` to `/.cursorrules` (identical content)
4. Verify all 3 files exist
5. Verify all 3 have identical content (e.g., `sha256sum CLAUDE.md AGENTS.md .cursorrules` — hashes match)
6. Stage and commit: `git add CLAUDE.md AGENTS.md .cursorrules && git commit -m "T01: bootstrap agent protocol files"`
7. Request review per Review Protocol in `/CLAUDE.md`

## Post-conditions
- `/CLAUDE.md`, `/AGENTS.md`, `/.cursorrules` all exist at repo root
- All 3 files byte-identical to `/CLAUDE.md`
- A commit exists on `feature/T01-bootstrap-protocol` branch with message `T01: bootstrap agent protocol files`
- After review approval, merged to `feat/v2-react-rewrite` with `--no-ff`

## Files in scope
- /CLAUDE.md (read only — already exists)
- /AGENTS.md (create)
- /.cursorrules (create)

## Out of scope
- Any source code, scaffold, or dependency changes — those start at T02

## Success criteria
- All 3 files exist with matching content
- Commit pushed to task branch
- Ready for review and merge to `feat/v2-react-rewrite`

## Notes
This is the only task that creates protocol files. After T01 merges, every subsequent agent in any runtime auto-reads the protocol on repo open.
