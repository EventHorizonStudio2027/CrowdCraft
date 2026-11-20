# CrowdCraft

Collaborative game-building studio.

## Development status

Early-stage browser prototype. Real AI generation, livestream integration, accounts, and multiplayer synchronization are not implemented yet.

## Local development

Open `index.html` in a modern browser. No API keys required.

## Security

Never commit API keys, tokens, or credentials. Generated previews must run in an isolated environment.

## Roadmap

1. Browser editor and interactive previews
2. Project files, version history and recovery
3. Controlled AI patch/review pipeline
4. Authenticated collaboration, proposals and voting
5. Livestream integrations and deployment

## Current phase: Focused Functional MVP (2026-11-20)

**Definition of done:** A new user can start, create a playable browser game, preview/use it, save it, reopen it, and export/share it without a dead-end control. The full flow must pass real browser end-to-end tests, including Safari/WebKit, not just Chromium. A successful deployment alone is not proof.

### Only the core workflows
1. **Start:** Choose a working starter project and give it a name.
2. **Create:** Edit source and use deterministic templates immediately; add real AI-assisted generation only behind a working, server-side authenticated provider integration with safe review before applying changes. Never expose keys in client HTML.
3. **Run:** Play the result and verify actual input, update and win/lose behavior in a sandboxed preview.
4. **Keep:** Save, reopen, version/undo, and export the finished project with explicit success/error feedback. Start with honest local storage; cloud sync is a later milestone.
5. **Collaborate (next milestone):** Share a session, collect suggestions, approve/reject changes and synchronize them. Livestream platform integration comes after this works.

### Remove or clearly disable distractions
Hide or label dashboard vanity metrics, Community, AI, publishing, cloud sync, livestream and multiplayer actions that are not connected to real services. No clickable control may silently do nothing. The first screen must offer an obvious, working Create/Continue path.

### Release gates
- Manual click-through of every visible primary action; keyboard and mobile checks.
- Automated Chromium + WebKit/Safari-compatible end-to-end journeys for create, run, save, reload and export.
- Verify live GitHub Pages URL, asset loading, console errors and actual deployed revision.
- Explicitly distinguish **implemented**, **tested**, **deployed** and **blocked** in each update.
- Do not add decorative features while the core journey is broken.

### External dependencies and escalation
Real AI requires a chosen model provider, server-side secret storage and a hosted API; collaborative sessions require a backend, persistence and identity/session rules; livestream participation requires platform integration and OAuth. Surface user-required account/billing/authorization actions immediately, but build and test all independent work first.
