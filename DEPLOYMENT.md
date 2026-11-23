# GitHub Pages deployment check

Both projects serve their website from the root-level `index.html` on `main`.

1. Open **Settings → Pages** for this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** in the branch dropdown and **/(root)** in the folder dropdown, then **Save**.
4. Check **Actions** for the Pages deployment result. If the branch dropdown is empty, check **Code → Branches** and ensure `main` exists, then reload Settings → Pages.
5. Open the published URL shown in Pages settings. A blank site can also mean the deployment failed; inspect its Actions log rather than changing source blindly.

The **Browser regression** workflow is separate from GitHub Pages publishing. It runs the Playwright suite against a local server on push and pull requests. CI is not proof of deployment success.

Local browser testing: `npm install && npx playwright install chromium webkit && npm run test:e2e`.
