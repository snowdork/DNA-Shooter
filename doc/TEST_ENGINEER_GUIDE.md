# Test engineer guide

This guide covers the current Mutagon game. Start with the [project overview](README.md), [user guide](USER_GUIDE.md), and [admin guide](ADMIN_GUIDE.md). Documents under `design/` describe historical intentions and future features; use the running implementation and this guide for current acceptance testing.

## Environment and setup

Run commands from the repository root, one level above this directory. Use Node.js 18.19 or newer; prefer a maintained Node LTS version for new environments.

```sh
npm ci
npx playwright install chromium
```

If Chromium reports missing system libraries, install the required Playwright browser dependencies for your operating system. A managed or restricted environment may require administrator assistance. To use an existing compatible Chromium executable, set `CHROMIUM_PATH` to its absolute path when running browser tests.

## Automated checks

| Command | Purpose |
| --- | --- |
| `npm test` | Deterministic model, mutation, replay, motion, anatomy cache, pairing, scoring, and deadline checks. |
| `npm run typecheck` | TypeScript validation for application sources. |
| `npm run build` | Typecheck, production bundling, and gzip artifact generation into `dist/`. |
| `npm run test:browser` | Playwright integration tests against an already built production bundle. |
| `npm run verify` | Model tests, production build, then the browser suite. |

Recommended release check:

```sh
npm run verify
```

Example with an existing browser:

```sh
CHROMIUM_PATH=/absolute/path/to/chromium npm run verify
```

Playwright starts and stops its own preview server at `http://127.0.0.1:4174`. Port 4174 must be available; the configuration deliberately rejects reuse of an unrelated server. Build before running browser tests independently, since they serve `dist/`, not the TypeScript source. Local development uses `npm run dev` and normally port 5173.

To isolate a failure after building:

```sh
npm run test:browser -- --grep 'ready-made characters'
npm run test:browser -- --grep 'touch pair dragging'
npm run test:browser -- --headed
```

The suite currently has 19 model tests and 15 Chromium browser cases. Treat these as a dated baseline, not permanent totals. Game-over tests intentionally wait for a chain deadline; allow several minutes for the entire browser suite.

## Coverage map

| Area | Automated coverage | Additional manual review |
| --- | --- | --- |
| Pair controls | Click selection, ordered firing, direct dragging, touch dragging, Esc clearing | Invalid and occupied drops, rapid switching, pointer cancellation |
| Progression | Scores, four-chain completion, celebration, master-chain arrival, final victory, empty-chain failure | Clear feedback at normal speed and after repeated restarts |
| Creature | Mutation history, seeded replay, legacy catalogs, visible changes, pause stability, anatomy caching | Recognizable animal/human parts and alien organs; excessive overlaps |
| Layout | Six desktop/laptop sizes, canvas alignment, pair-letter overflow | Phone layouts, browser zoom, operating-system scaling |
| Audio | Start, shot tones, pattern signature, mute, pause | Volume balance, headphones, browser autoplay behavior |
| Save/load | Export, restore, invalid files, completed paused specimens | File chooser cancellation, malformed/oversized files, cross-session replay |
| Accessibility | Keyboard firing and selection, reduced-motion completion path | Focus order, screen reader announcements, contrast, touch target comfort |

## Manual acceptance pass

1. Open a fresh game. Confirm **CHROMOGON** and **MUTAGON** labels, no descriptions below them, and no A + T / C + G headings above the pair characters. TA and AT appear on the left; CG and GC appear on the right. All four have legible letters and distinct appearances.
2. Start the experiment. Click each pair, then a different empty chain. Confirm first letter UP, second DOWN, 100 points per landed pair, and 400 extra when the fourth chain completes (800 total for one full set).
3. Drag a pair onto an empty chain. Confirm target highlighting, one shot, correct order, and removal of the drag ghost. Drop outside a chain and onto an occupied chain: neither should add points or overwrite a pair; a valid selected pair should remain available when no shot fires.
4. Use A / T / C / G to select AT / TA / CG / GC, then 1–4 to fire at the corresponding chain. Esc clears selection; Space pauses/resumes. Repeat using touch on a real device where available.
5. Open Directions during play. The game pauses, gameplay shortcuts do not operate behind the dialog, and closing it resumes an already running experiment. Confirm pause, restart, switching tabs, and returning do not release an unexpected shot.
6. Let an empty chain reach the bottom. Confirm game over even when other chains are filled. Pair controls stop firing and Restart resets score, mutation history, and DNA patterns.
7. Complete a quadra-chrome. Confirm celebration, downward travel, matching DNA Patterns row feedback, and arrival of the next set. Pause during celebration and resume. Finish ten sets and confirm the completed experiment can be exported and restarted.
8. Watch several mutations and restart with fresh games. Look for human hands, ears and noses; antlers, shells, feathers and eye stalks; and pulsing alien hearts and glowing light sacs. These are random, so a single run need not contain every part. Anatomy must stay visible and reasonably attached; no blank canvas, disappearing specimen, or unreadable layering. Reduced motion should steady decorative effects while chains continue their gameplay movement.
9. Export and reload a partially completed creation. Confirm identical mutations, DNA pattern, score, and paused restoration. Repeat with a completed save and supported older mutation catalogs. New exports use mutation catalog 5; catalogs 1–4 remain supported. Invalid files must not replace the current creation.
10. Test sound on/off, pause/resume, the science reel pause button, hover/focus pause, and reduced-motion sideways scrolling. Confirm source links work when network access is available.

For desktop layout review, use 1366×768, 1536×864, 1920×1080, 2560×1440, 2560×1080, and 1280×1024. Also review a narrow phone viewport, portrait/landscape orientation changes, and 200% browser zoom manually. Check letter clipping, control overlap, scrolling, and canvas alignment.

## Performance review

Compare the same production build configuration, browser, viewport, seed/save, sound setting, and motion setting. Profile a fresh blob, a mature 40-mutation creature, repeated restarts, paused play, and repeated resizing. Record hardware and browser version alongside measurements.

Use browser performance tools to inspect frame times and long tasks during active play. While paused, the game loop and pair-character animations should stop; the independently controlled science reel may continue. Check heap snapshots after repeated restart/load cycles for retained canvases, listeners, or drag ghosts. Avoid setting a frame-rate pass threshold without an agreed target device and measured baseline.

The current build has a separately cached Phaser engine chunk of about 1.68 MB raw / 380 KB gzip and emits Vite's chunk-size warning. That warning alone is not a failed build. Check network transfer sizes and caching on the actual host; local preview does not certify production compression or cache headers.

## Failure investigation and reporting

- **Missing browser executable:** install the expected Chromium revision or supply `CHROMIUM_PATH`; record which browser actually ran.
- **Preview server fails:** check port 4174 availability and local server permissions. Do not mistake an infrastructure failure for an application assertion failure.
- **Stale UI:** rebuild `dist/` before browser testing, reload, and check the served asset hashes.
- **Browser artifacts:** inspect `test-results/` for available failure context. Some tests also write screenshots to `/tmp/mutagon*.png`; those are temporary artifacts and may be overwritten.
- **Missing screenshots or traces:** rerun the failing test with `--screenshot=only-on-failure --trace=retain-on-failure`, then attach relevant artifacts.

For each defect, record the commit or working-tree revision, environment/browser/device, viewport and zoom, reproducible steps, expected versus actual result, frequency, console errors, and relevant screenshot or trace. Attach an exported creation and its seed/mutation version when the defect depends on anatomy or replay. Identify whether it occurs in the production build, development mode, or both.

## Verification baseline and limits

On 17 October 2026, the cleanup pass passed all 19 model tests, all 15 Chromium browser cases, the production build, and whitespace checks. Chromium was supplied through `CHROMIUM_PATH`. This is local verification, not deployment certification or a frame-rate benchmark. Firefox, Safari, real phones, screen readers, and production-host behavior require separate validation. The [verification report](VERIFICATION.md) also contains an earlier dated snapshot; its old UI descriptions and test counts are historical.
