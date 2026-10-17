# Local verification — 16 October 2026

Reviewed branch: `DNA-1`. Updated after the developmental gameplay improvements: staged Mutagon growth, coherent body plans, ready-made draggable pairs, flipping, hydrogen-bond cues, and paused-render repair. Vite remains 6.4.4.

## Environment and results

- Node.js 18.19.1, npm 9.2.0; installed dependencies match the package manifest and lockfile versions.
- `npm test`: **17 named model tests passed**, covering placement rules, invalid histories, mutations, replay compatibility, controls, musical signatures, and missed-chain deadlines.
- `npm run build`: passed TypeScript checking, Vite production bundling, and precompression.
- Development-mode browser smoke: canvas loaded, A/T keyboard pair fired, impact awarded 100 points, and no page errors occurred.
- Production browser suite: **21 passed in 2.9 minutes**, including existing gameplay checks, direct pair tiles, flipping, and completed-specimen visibility through paused loads and viewport refreshes.
- Generated HTML's local asset references exist. Every generated gzip copy decompresses to its original asset.
- Relative links in README and the user, admin, VPS, and research guides resolve. `git diff --check` passed.

The development smoke used port 5175; the production browser suite used port 4174. Test servers were temporary and stopped after the checks; development preview was restarted on port 5173. Browser tests used the installed Chromium executable through `CHROMIUM_PATH`. The default Playwright browser revision was missing; on a fresh machine, install the expected browser with `npx playwright install chromium`.

## Deployment assessment

The application produces static assets in `dist/` and needs no application server or database. The [admin guide](ADMIN_GUIDE.md), [VPS runbook](VPS_DEPLOYMENT.md), and [Nginx example](../deploy/nginx.conf) describe deployment, caching, HTTPS, updates, and rollback.

Nginx is not installed in this workspace, and no VPS was accessed or deployed. Validate Nginx configuration, DNS, firewall access, TLS renewal, file permissions, MIME types, compression, and caching on the target server before launch. The Nginx example needs the real hostname and an HTTPS configuration.

The engine chunk still produces Vite's size warning (about 1.68 MB raw / 380 KB gzip). The build succeeds; the separate hashed chunk permits browser caching. Full Firefox, Safari, and phone-layout certification was not performed. Use a supported Node LTS release for new build environments and rerun `npm run verify` there; this session used the existing Node 18 installation.

## Gameplay update notes

New runs use mutation rules version 4; rules versions 1–3 still replay their original histories. Visual review covered the clean starting blob and mature Tidepool, Woodland, and Canopy specimens. A paused-canvas clearing issue exposed during inspection was repaired, including repainting when the display refreshes without a change to its logical dimensions.

`npm test` now invokes the test entry point directly so Node's test runner reports the individual named checks on the existing Node 18 installation, rather than only the containing file. Sources and game simplifications are documented in [research notes](RESEARCH_AND_GAMEPLAY.md).
