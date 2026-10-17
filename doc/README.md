# DNA Shooter

A TypeScript + Phaser browser game: click or drag ready-made DNA pairs to fill the vertical Chromogon stream. Each quadra-chrome is a set of four pairs that streams down without looping back. Fill every chain before it reaches the bottom: any empty chain at the exit ends the game. Complete 10 quadra-chromes to win. Every pair transforms your caged Mutagon. Complementary base pairing is real; creature adaptations are imaginative biology.

## Start and play locally

Requires Node.js and npm. The package declares Node **18.19 or newer** as its minimum; use a maintained Node release for a new setup.

```sh
cd /home/snowdork/dev/DNA-Shooter
npm ci
npm run dev
```

Run `npm ci` on first setup or after dependency changes. Keep the terminal open and visit **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**, then click **Start experiment**. If Vite prints a different port, use its printed URL. Press **Ctrl+C** in the terminal to stop the local server. On another computer, use your clone's actual path.

Choose TA or AT on the left, or CG or GC on the right. Click a pair character and then an empty chain, or drag the character directly onto the chain. The first letter goes UP and the second goes DOWN. A / T / C / G select AT / TA / CG / GC; 1–4 fire at a chain. Each shot needs a fresh pair. New specimens randomly mix animal anatomy, human parts, and imaginary alien organs.

## Guides

- [User guide](USER_GUIDE.md): mouse and keyboard controls, scoring, adaptations, pause/restart, export/load, and troubleshooting.
- [Admin guide](ADMIN_GUIDE.md): setup, local addresses, tests, production builds, VPS/Nginx hosting, caching, updates, rollback, and troubleshooting.
- [VPS deployment runbook](VPS_DEPLOYMENT.md): server preparation, release upload, HTTPS, cutover, and rollback.
- [Nginx example](../deploy/nginx.conf): a dedicated virtual host to adapt to your VPS and HTTPS setup.
- [Research and gameplay notes](RESEARCH_AND_GAMEPLAY.md): DNA sources, staged growth, and the boundary between science and game rules.
- [Test engineer guide](TEST_ENGINEER_GUIDE.md): automated checks, manual acceptance tests, regression coverage, and defect reporting.
- [Verification report](VERIFICATION.md): local checks, environment, and deployment limits.

## Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local development at `http://127.0.0.1:5173/` by default. |
| `npm test` | Creation-model and interaction-rule tests. |
| `npm run verify` | Run model tests, rebuild, and test the fresh production build in Chromium. |
| `npm run typecheck` | Check application TypeScript. |
| `npm run build` | Typecheck, build `dist/`, and generate compressed `.gz` assets. |
| `npm run preview` | Preview the build locally at `http://127.0.0.1:4173/` by default. |
| `npm run test:browser` | Test the existing production build using local port `4174`; requires Chromium. |

Production hosting serves the **contents of `dist/`** as static files. The game needs no server-side Node process or database. See the admin guide before deploying.

Documents under `doc/design/` retain design history and future plans. The user and admin guides describe the current playable prototype.

## Opening the production build in Firefox

Open the build through a local web server. Double-clicking `dist/index.html` opens a `file://` address, which blocks JavaScript modules in Firefox. From the project folder, run `npm run preview`, keep the terminal open, and visit the printed URL (normally http://127.0.0.1:4173/). Run `npm run build` first after changing the game.
