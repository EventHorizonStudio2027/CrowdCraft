# Active issues — focused functional MVP

Completed changes are archived in README.md development notes and Git history. Renumber unresolved priorities from 1 here; GitHub issue IDs remain permanent.

1. **Real browser interaction verification:** start, edit, preview, save, reload, named library, import and export must be tested end-to-end in Chromium and WebKit.
2. **Project persistence and recovery:** verify storage failure, tab close during edit, corrupt library data, and import/export round-trip.
3. **Preview isolation and interaction correctness:** test sandboxed iframe, interactive game input/win-loss, error handling and user-visible feedback.
4. **Live collaboration:** real Showrunner authorization, contributor submissions and shared state need a backend; local proposal queue is not multiplayer.
5. **Real AI and release readiness:** provider selection, server-side credentials, automated browser tests and Pages publication checks remain open.

## Latest functional reliability batch — 2026-11-23
- Editor reset now uses the tracked save path rather than leaving stale unsaved state.
- Saved-project library rejects invalid timestamp values during load/import.
- Restoring a saved project uses one explicit warning when it would replace a different editor draft.
- Browser-based regression tests and published deployment are still unverified; source changes are not equivalent to passing live tests.

## Latest iteration — 2026-11-23
- Editor now flushes pending changes when the page is hidden or unloaded (verify in browser).
- HTML export now reports success in the editor status and save indicator.
- The final UI polish commit is recorded separately.
- Source commits are confirmed; no browser end-to-end test or production deployment verification was performed in this iteration.
