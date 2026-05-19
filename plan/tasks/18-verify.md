# T18 — VERIFY end-to-end

## Purpose
Run the full acceptance checklist in `/plan/VERIFY.md` against the live v2 preview URL and the local test suite. Capture the result for the planner. This is the gate that confirms v2 is ready for DNS swap.

## Pre-conditions
- T01–T17 are all merged to `feat/v2-react-rewrite` with `Status: done`
- v2 preview URL is live (from T17)
- Local repo is on `feat/v2-react-rewrite` branch with all latest commits

## Steps
1. Branch from `feat/v2-react-rewrite` to `feature/T18-verify`
2. Open `/plan/VERIFY.md`. For every checkbox, walk through the verification:
   - **Functional sections** — open the preview URL in a real browser. Click through hero unlock → tabs → cards → flip → modal → edit → save toast → close modal → refresh → verify each behavior. Tick each box if it passes.
   - **Tests** — run `npm run test` locally on a clean clone. Tick the box if all green. Capture the count of passing tests in your log entry.
   - **Code health** — run `npm run lint` and `npm run typecheck`. Tick boxes if 0 errors / 0 warnings.
   - **Documentation** — visually inspect README and `.env.example`.
   - **Deployment** — confirm preview URL returns 200 and hero renders; confirm legacy URL still works.
3. For each FAIL, do NOT fix in this task. Instead:
   - Document the failure in log.md with: which item, what was expected, what was observed, screenshot or DOM snippet if relevant
   - Set `Status: blocked` on T18 with `Esc: Y`
   - Continue verifying other items so the planner has a complete picture, not stop on first failure
4. If ALL items pass:
   - Write a final summary in log.md decisions section: "VERIFY passed at <timestamp>. v2 ready for DNS swap. Planner action required."
   - Set `Status: done`
   - Do NOT trigger DNS swap — that's a planner-only action AFTER the user has reviewed
5. Commit the VERIFY pass with edits to `/plan/VERIFY.md` (turning checkboxes from `[ ]` into `[x]`):
   - `git add plan/VERIFY.md && git commit -m "T18: verify pass — all acceptance items confirmed"`
   - Push to `feature/T18-verify` and merge into `feat/v2-react-rewrite` after review
6. Request review (a reviewer agent re-reads VERIFY.md + the log.md exit checks and confirms no drift)

## Post-conditions
- `/plan/VERIFY.md` has every checkbox either checked (passed) or annotated with FAIL details in adjacent log.md entry
- log.md decisions section documents pass/fail summary
- If pass: planner is notified and DNS swap can proceed (out of scope for executor)
- If fail: planner is notified with full failure list; planner spawns fix-tasks as needed (out of scope for this plan)

## Files in scope
- /plan/VERIFY.md (modify — tick checkboxes)
- /plan/log.md (append-only entries per the protocol)

## Out of scope
- Fixing failures discovered during VERIFY — those are new tasks the planner creates
- DNS swap to point production traffic at v2
- Tearing down legacy v1 deployment

## Success criteria
- Every VERIFY.md item is touched (checked or annotated)
- A clear pass/fail summary is in log.md decisions section
- Either: full pass with timestamp + planner notification, OR clear blockers list with `Esc: Y`

## Notes
This task is intentionally not allowed to fix anything. P3 (Surgical Changes) — VERIFY checks, it does not patch. If the verification reveals issues, the user/planner triggers a follow-up plan or batch of fix-tasks. Resist the temptation to "just fix this one quick thing" — that breaks the audit trail and conflates verification with implementation.
