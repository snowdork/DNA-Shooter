# Local verification — 16 October 2026

Reviewed branch: `DNA-1`. Existing Vite 6.4.4 dependency changes were preserved. No gameplay changes were required by the checks below.

## Environment and results

- Node.js 18.19.1, npm 9.2.0; installed dependencies match the package manifest and lockfile versions.
- `npm test`: passed the model test entry point, covering placement rules, invalid histories, mutations, replay compatibility, controls, musical signatures, and missed-chain deadlines.
- `npm run build`: passed TypeScript checking, Vite production bundling, and precompression.
- Development-mode browser smoke: canvas loaded, A/T keyboard pair fired, impact awarded 100 points, and no page errors occurred.
- Production browser suite: **19 passed in 2.6 minutes**, including ordered pairing, bad-drop rejection, drag and touch interactions, pause, restart, sound, mutations, save/load, final victory, missed-chain game over, DNA tracking, and desktop resizing.
- Generated HTML's local asset references exist. Every generated gzip copy decompresses to its original asset.
- Relative links in README and the user, admin, and VPS guides resolve. `git diff --check` passed.

The development smoke used port 5175; the production browser suite used port 4174. Servers were temporary and stopped after the checks. Browser tests used the installed Chromium executable through `CHROMIUM_PATH`. The default Playwright browser revision was missing; on a fresh machine, install the expected browser with `npx playwright install chromium`.

## Deployment assessment

The application produces static assets in `dist/` and needs no application server or database. The [admin guide](ADMIN_GUIDE.md), [VPS runbook](VPS_DEPLOYMENT.md), and [Nginx example](../deploy/nginx.conf) describe deployment, caching, HTTPS, updates, and rollback.

Nginx is not installed in this workspace, and no VPS was accessed or deployed. Validate Nginx configuration, DNS, firewall access, TLS renewal, file permissions, MIME types, compression, and caching on the target server before launch. The Nginx example needs the real hostname and an HTTPS configuration.

The engine chunk still produces Vite's size warning (about 1.68 MB raw / 380 KB gzip). The build succeeds; the separate hashed chunk permits browser caching. Full Firefox, Safari, and phone-layout certification was not performed. Use a supported Node LTS release for new build environments and rerun `npm run verify` there; this session used the existing Node 18 installation.
