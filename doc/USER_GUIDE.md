# Mutagon user guide

Mutagon is a DNA shooting game: complete 30 chromosomes while a caged green blob transforms into an unpredictable creature. Each chromosome has four complementary base-pair rungs.

## Start locally

Run `npm ci` on first setup, then `npm run dev` and open the local URL printed by Vite (normally http://127.0.0.1:5173). Click **Start experiment**.

## Play

Compact side shooters leave more room for the wider DNA canal. The playfield fits the available viewport and expands up to 1920 pixels wide. The header and controls stay above the fold on laptop screens; mutation history is below the game. Mutagon appears larger in a softly lit chamber with thin translucent bars.

Use **Directions** beside the logo to open the play guide. It pauses an active run and resumes it when closed. Score and chromosome progress sit beside the Mutagon logo; sound, motion, and save controls sit below the field.

Build **AT, TA, CG, or GC** in the preview holders. Drag bases into UP and DOWN, or click a base and then click its destination holder. Either holder can be filled first. Clicking a base alone only picks it up. Once both holders contain a matching pair, empty chromosome chains glow green: click one to populate it. Wait for the shot to land before building another pair. A wrong complement is rejected.

Each empty chromosome approaches from above and feeds into the oozy DNA canal, then streams slowly toward the bottom. Link at least one pair before it reaches the exit: only a completely empty chromosome ends the run. A linked chromosome returns to the top with its pairs preserved, so you can finish the remaining rungs. Fill all four to advance. The stream gradually speeds up. Pink and blue strands gently sway and ripple; Reduced motion stops their decorative wiggle. Completing chromosome 30 wins.

Each side is a pairing station with a chromosome-style preview above its fixed, side-by-side bases: A/T on the left and C/G on the right. Drag a base into the green UP holder, then its complement into the red DOWN holder. Alternatively, click a base and then click the UP or DOWN holder to place it. Clicking bases alone does not fill either holder. Either holder can be filled first. Once both contain a complementary pair, click an empty chain in the chromosome to populate it. The × button clears that side’s pending selection. A launched shot finishes before the preview can be reset. The base in the **green ↑ UP** holder appears on top of the rung; the **red ↓ DOWN** base appears below, regardless of which slot was filled first. Labels stay highlighted until the shot lands, and clear on cancellation. The small HUD between each pair of shooters shows the selected order. The station gets a bright outline as soon as a base is picked. Click a picked base again to deselect it; clicking an assigned base or its filled holder removes just that base. Empty holders show a grey outline and a - placeholder. Filled holders use their UP/DOWN color. Drag a filled holder back into its own shooter tray, or click it, to undo just that placement; dropping elsewhere preserves it. The outline remains while either base is selected and disappears when the side is empty. × clears the whole station preview. Each shooter has its own fixed illustrated shape; its barrel turns toward the selected rung. `AT` and `TA` encode different mutation patterns, as do `CG` and `GC`. Every new game starts with a plain green blob that gently squashes and wiggles. Every landed pair changes its movement rhythm and adds a named, colored mutation immediately, including green eyes, blue legs, body bands, tails, antennae, tongues, gills, wings, horns, sucker-covered tentacles, scales, spots, sparks, tusks, snozzle trunks, paws, ears, whiskers, fins, beaks, claws, and feather plumes. New traits briefly grow and glow. Legs add alternating steps, wings flutter, tails sway, gills pulse, tongues flick, and eyes look around. Sparks add electric jitter; animal parts bring pouncing, scuttling, swimming, snuffling, and feather-fluttering motion. The cage shows the current motion style. Reduced motion keeps the creature still. Repeated traits develop colored variants; the latest four of each type remain visible. Four pairs also add a chromosome pattern. Tails, tongues, extra eyes, tendrils, fins, and colors develop as you play. These traits are fictional.

## Controls

| Control | Action |
| --- | --- |
| A / T / C / G | Select the complementary bases in order; then click an empty rung to fire. |
| 1 / 2 / 3 / 4 | Fire the selected pair at that rung, counting from the top. |
| Escape | Clear selection and pending shot. |
| Space | Pause or resume. |
| Restart | Immediately discard progress and start a fresh experiment. |

The game pauses when its tab is hidden. Base selection is disabled while paused, during chromosome transitions, and after the run ends. Reduced motion removes decorative movement and makes aiming immediate; stream movement and deadlines remain.

Each pair earns 100 points, and each completed chromosome adds 400. A finished run contains 120 pairs, 30 adaptations, and 24,000 points. Expand **Your mutations** to see every hit’s trait, color, pair order, chromosome, and rung, followed by completed four-pair patterns.

## Sound

Sound starts with the experiment: bubbling gases and low primordial rumble accompany wet slime shots, growth pulses, chromosome tremors, and the ending. Use **Sound on / Sound off** to mute or restore audio. Pausing or hiding the tab silences it. Audio is generated locally in the browser.

## Save and load

**Export creation** downloads `dna-creation.json`. **Load creation** restores an export paused, rebuilding the organism from its placement history. New exports record the mutation catalog so traits remain consistent when reloaded. Older exports retain their original 12-trait catalog; new games use all 22 traits. The version 1 format accepts older partial exports too; the new goal is 30 chromosomes. Files must be at most 32 KiB. Invalid imports leave current progress intact.

Exports preserve landed pairs, not stream position, game-over status, selection, or shots in flight. Loading grants a fresh chromosome timer. There is no autosave; export before closing or restarting if you want to keep progress.

## Creature inspiration

The fictional creature draws on [axolotl external gills](https://www.nhm.ac.uk/discover/axolotls-amphibians-that-never-grow-up.html) and [cephalopod tentacles and color displays](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/cephalopods). Complementary base pairing is real; these pattern-to-trait rules are imaginative game mechanics.

## Opening the production build in Firefox

Open the build through a local web server. Double-clicking `dist/index.html` opens a `file://` address, which blocks JavaScript modules in Firefox. From the project folder, run `npm run preview`, keep the terminal open, and visit the printed URL (normally http://127.0.0.1:4173/). Run `npm run build` first after changing the game.
