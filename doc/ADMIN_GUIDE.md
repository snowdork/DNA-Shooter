# DNA Shooter admin guide

This guide covers the current four-launcher creation prototype. See the [user guide](USER_GUIDE.md) for playing instructions or the [README](../README.md) for a quick start.

## Hosting model

Development uses TypeScript, Phaser, Vite, and Node.js. Production contains HTML, JavaScript, CSS, a favicon, and compressed copies of those files. The VPS serves static assets; rendering and game state run in each visitor's browser.

There is no admin login, game server, database, server-side player account, leaderboard, or autosave service. Exported creation files are the player's backups. The prototype requires no application secrets or environment variables for hosting.

## Local setup and addresses

Install Node.js and npm. `package.json` declares Node **18.19 or newer** as the minimum; use a maintained release for new installations. Run commands from the repository root. The current workspace is `/home/snowdork/dev/DNA-Shooter`; use your clone's actual path on another computer.

```sh
cd /home/snowdork/dev/DNA-Shooter
node --version
npm --version
npm ci
npm run dev
```

Keep the terminal open and visit **http://127.0.0.1:5173/**, then click **Start creating**. If that port is occupied, Vite may select another: use the address printed in the terminal. Stop the server with **Ctrl+C**.

| Mode | Command | Default local address |
|---|---|---|
| Development | `npm run dev` | `http://127.0.0.1:5173/` |
| Build preview | `npm run preview` after building | `http://127.0.0.1:4173/` |
| Browser tests | `npm run test:browser` after building | Tests start and stop their own server at `http://127.0.0.1:4174/`. |

Both manual servers bind to `127.0.0.1`; their addresses work only on the computer running the server. The public game address is your configured VPS domain. No public address is configured in this repository.

To require a specific development port instead of falling back:

```sh
npm run dev -- --port 5173 --strictPort
```

Open the game through the HTTP server rather than opening `index.html` directly. Source files require Vite, and production module files need a web server.

## Build and verify

Install from the lockfile after checking out a release or changing dependencies. Build on your development machine or CI; Node.js is not needed on a VPS that only serves the resulting files.

```sh
npm ci
npm test
npm run build
```

The build runs the TypeScript check, writes `dist/`, and creates `.gz` copies of compressible HTML, CSS, JavaScript, and SVG files where compression saves space. Keep originals and compressed copies together. Change source and rebuild instead of editing generated files.

Run the browser tests against that build:

```sh
npx playwright install chromium
npm run test:browser
```

Playwright requires its browser binaries and their operating system libraries. See [Playwright's browser installation documentation](https://playwright.dev/docs/browsers) if installation or launch fails. To use an already installed compatible Chromium, provide its executable path:

```sh
CHROMIUM_PATH=/absolute/path/to/chromium npm run test:browser
```

The test server uses strict port `4174`; stop any other process using it before testing. Rebuild after application changes so browser tests use the current code. Tests cover pairing, locking, queued-shot cancellation, idle rendering, restart, restored state, final completion, export, and invalid imports.

For a manual check, run `npm run preview`, open its printed URL, and verify:

1. A then C gives a pairing hint without firing.
2. A then T followed by an empty-rung click locks without firing. A later click fires one pair and awards 100 points.
3. Four placements complete one segment, award a 400-point bonus, and add one adaptation. A new segment starts from the left after a short transition.
4. Pause freezes the chain and projectiles. A queued, unlaunched shot is cancelled and needs a fresh fire action after resuming.
5. Export, restart, and load restore progress and creature appearance. Loading leaves play paused.
6. Keyboard controls, reduced motion, and resizing remain usable. A full run has 80 placements, 20 adaptations, and 16,000 points.

## Deploy to a VPS

Use Nginx or your existing static web server. Vite's [deployment guide](https://vite.dev/guide/static-deploy.html) describes static deployment of `dist/` and identifies preview as a local tool, not a production server.

The supplied [Nginx example](../deploy/nginx.conf) expects:

| Setting | Value to adapt |
|---|---|
| Public hostname | `dna.example.com` — a placeholder, not a deployed address. |
| Web root | `/var/www/dna-shooter/current` |
| Suggested release storage | `/var/www/dna-shooter/releases/<release-id>/` |
| Compression | `gzip_static on` with generated `.gz` files. |
| Hashed assets | `/assets/` cached for one year with `immutable`. |
| HTML and unversioned files | Revalidate with `Cache-Control: no-cache`. |

1. Create a uniquely named release directory on the VPS. Upload the **contents of `dist/`**, including `assets/`, `index.html`, `favicon.svg`, and generated `.gz` files, into it. The repository and `node_modules/` are not the web root.
2. For an update, copy the previous release's hashed assets into the new release's `assets/` directory without replacing the new build's files. This keeps older HTML responses' asset references available. Keep the previous release directory for rollback.
3. Ensure the web-server user can read the files and traverse their directories. Point a `current` symlink at the complete release directory. For updates, create a temporary symlink beside `current` and rename it over the existing symlink atomically. Complete the upload before switching so visitors never see a partial build; if `current` is a real directory, arrange the symlink layout before using this approach.
4. Adapt `server_name` and `root`, then install the example using your server's virtual-host configuration convention. It listens on HTTP port 80; integrate its locations into your existing HTTPS configuration and configure the domain's DNS for the VPS.
5. Validate configuration before reloading. On a systemd-based VPS, run `sudo nginx -t`, then **only if it succeeds**, `sudo systemctl reload nginx`. A later file-only release switch does not require reloading when the configured root stays the same.

The example requires the [Nginx gzip static module](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html), which serves precompressed files. Inspect `nginx -V` for `--with-http_gzip_static_module`. If absent, remove `gzip_static on` and configure ordinary gzip compression in your web server. Keep `Vary: Accept-Encoding` so caches handle compressed and uncompressed responses correctly.

For a subdirectory such as `/dna-shooter/`, use a trailing slash in the public URL and adapt the root mapping and cache location to `/dna-shooter/assets/`. Vite uses relative asset URLs (`base: './'`). There is no client-side router; missing assets should return 404, not the game's HTML.

This guide and example do not mean the site has been deployed. Validate the Nginx configuration on the target VPS.

## Check the public site

Replace the hostname and asset name below with your real domain and a filename from the deployed `assets/` directory:

```sh
curl -I https://your-domain.example/
curl -I -H 'Accept-Encoding: gzip' https://your-domain.example/assets/phaser-REPLACE_WITH_BUILD_HASH.js
curl -I https://your-domain.example/assets/does-not-exist.js
```

Expected results:

- The page returns 200 and `Cache-Control: no-cache`.
- An existing hashed asset returns 200 and `Cache-Control: public, max-age=31536000, immutable`. With gzip enabled and its compressed copy present, it also returns `Content-Encoding: gzip` and `Vary: Accept-Encoding`.
- A missing asset returns 404.

Open the HTTPS URL, complete a segment, check export/load, and confirm the browser console has no application errors. Share this public URL with players; `127.0.0.1` always refers to their own computer.

## Updates, rollback, and backups

For each update, install from the lockfile, run the checks, build and upload a complete new release, retain old hashed assets, and switch `current`. Recheck the page and asset headers afterward.

To roll back, point `current` back to the previous complete release. Preserve newer hashed assets needed by already delivered HTML while doing so. Recheck the public URL. Avoid replacing individual generated JavaScript files: HTML, hashed chunks, and compressed copies belong to the same build.

Keep release archives, the source revision and lockfile used for each build, and VPS virtual-host/TLS configuration. There is no server-side player progress to back up. Tell players to export before restarting or refreshing; live progress exists only in browser memory.

Creation exports currently use model version **1** and contain the seed and ordered placements. The loader validates the history and accepts files up to **32,768 bytes (32 KiB)**. Selection, locks, in-flight shots, animation time, and settings are not saved. Preserve version compatibility when changing creation rules; unsupported files are rejected rather than migrated automatically.

## Performance and troubleshooting

The renderer caches the background and helix, reuses target coordinates, limits animation to 60 frames per second, and sleeps while paused or after completion feedback. Hidden tabs pause and cancel queued shots. The adaptation list updates when its contents change. These reduce browser work; the VPS serves static files.

Phaser is a separately hashed engine chunk. Its first download remains roughly 380 KB compressed; repeat visits and game-code updates can reuse the cached engine. The build currently reports a large-chunk warning for Phaser; that warning alone is not a failed build.

| Symptom | Check |
|---|---|
| Local page will not connect | Keep `npm run dev` running, use its printed URL, and browse on the same computer. |
| Blank page after deployment | Browser console/network panel, module MIME types, upload layout, root mapping, and asset 404s. |
| Old page or missing chunks after an update | HTML revalidation, proxy/CDN cache rules, and old hashed assets retained across releases. |
| JavaScript downloads uncompressed | `.gz` files, gzip static module availability, and the request's `Accept-Encoding` header. |
| Nginx reports an unknown `gzip_static` directive | Use a build with the module or remove the directive and configure ordinary compression. |
| Browser tests cannot launch | Install the browser and its system dependencies, or verify `CHROMIUM_PATH`. |
| Test server cannot start | Free local port `4174`; the test configuration uses strict binding. |
| Browser tests show old behavior | Run `npm run build` before rerunning them. |
| Player cannot load an export | Check the 32 KiB limit, model version 1, valid JSON, and placement history. Invalid imports leave the current creation intact. |
| Export has less progress than expected | Only completed impacts are saved; wait for a shot to land before exporting. |

Client errors appear in the browser console. HTTP requests and errors appear in your web server's configured logs; there is no separate game-service log. Documents under `doc/design/` include future modes and are not the operational feature list.
