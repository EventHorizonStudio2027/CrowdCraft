# Active issues — focused functional MVP

Completed work is archived below and in Git history. Outstanding priorities restart at #1.

1. **Run and fix browser regression suite** — new Chromium/WebKit Actions tests must be verified green.
2. **Expand save/recovery coverage** — corrupt storage, quota failures, import/export round trips.
3. **Verify sandbox preview interaction** — real game input, outcomes and error feedback.
4. **Implement shared collaboration** — Showrunner authorization and synchronized contributors need a backend.
5. **AI provider and deployment readiness** — secure model integration and published Pages verification.

## Completed this iteration — 2026-11-23
- Added Playwright regression tests for editing, preview interaction, autosave, reload, named project restore, export and reset.
- Added Chromium/WebKit CI workflow. Execution and pass status are not verified.
- Prior editor reset, timestamp validation and confirmation fixes remain committed.
- Separate final design refinement follows.
