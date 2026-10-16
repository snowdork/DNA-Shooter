# Mutagon user guide

Mutagon is a DNA shooting game: complete 30 chromosomes while a caged green blob transforms into an unpredictable creature. Each chromosome has four complementary base-pair rungs.

## Start locally

Run `npm ci` on first setup, then `npm run dev` and open the local URL printed by Vite (normally http://127.0.0.1:5173). Click **Start experiment**.

## Play

Compact side shooters leave more room for the wider DNA canal. The playfield fits the available viewport and expands up to 1920 pixels wide. The header and controls stay above the fold on laptop screens; mutation history is below the game. Mutagon appears larger in a softly lit chamber with thin translucent bars.

Use **Directions** beside the logo to open the play guide. It pauses an active run and resumes it when closed. Score and chromosome progress sit beside the Mutagon logo; sound, motion, and save controls sit below the field.

Click the side shooters in order: **A then T**, **T then A**, **C then G**, or **G then C**. After selecting the complementary pair, click an empty rung in the chromosome to aim and fire. Selecting the letters alone does not fire. Wait for the shot to land before choosing another pair. A wrong complement keeps your first choice and shows a hint; choosing the same base again clears it.

Each empty chromosome approaches from above and feeds into the oozy DNA canal, then streams slowly toward the bottom. Link at least one pair before it reaches the exit: only a completely empty chromosome ends the run. A linked chromosome returns to the top with its pairs preserved, so you can finish the remaining rungs. Fill all four to advance. The stream gradually speeds up. Pink and blue strands gently sway and ripple; Reduced motion stops their decorative wiggle. Completing chromosome 30 wins.

The shooters remain fixed: A above T on the left, C above G on the right. The first selected letter gets an **green ↑ UP** label and appears on top of the rung; the second gets **red ↓ DOWN** and appears below. Labels stay highlighted until the shot lands, and clear on cancellation. The small HUD between each pair of shooters shows the selected order. Clicking your first letter again clears it and waits for a new selection. Each shooter has its own fixed illustrated shape; its barrel turns toward the selected rung. `AT` and `TA` encode different mutation patterns, as do `CG` and `GC`. Every new game starts with a plain green blob that gently squashes and wiggles. Every landed pair changes its movement rhythm and adds a named, colored mutation immediately, including green eyes, blue legs, body bands, tails, antennae, tongues, gills, wings, horns, tentacles, scales, and spots. New traits briefly grow and glow. Legs add alternating steps, wings flutter, tails sway, gills pulse, tongues flick, and eyes look around. The cage shows the current motion style. Reduced motion keeps the creature still. Repeated traits develop colored variants; the latest four of each type remain visible. Four pairs also add a chromosome pattern. Tails, tongues, extra eyes, tendrils, fins, and colors develop as you play. These traits are fictional.

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

**Export creation** downloads `dna-creation.json`. **Load creation** restores an export paused, rebuilding the organism from its placement history. The version 1 format accepts older partial exports too; the new goal is 30 chromosomes. Files must be at most 32 KiB. Invalid imports leave current progress intact.

Exports preserve landed pairs, not stream position, game-over status, selection, or shots in flight. Loading grants a fresh chromosome timer. There is no autosave; export before closing or restarting if you want to keep progress.

## Creature inspiration

The fictional creature draws on [axolotl external gills](https://www.nhm.ac.uk/discover/axolotls-amphibians-that-never-grow-up.html) and [cephalopod tentacles and color displays](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/cephalopods). Complementary base pairing is real; these pattern-to-trait rules are imaginative game mechanics.

## Opening the production build in Firefox

Open the build through a local web server. Double-clicking `dist/index.html` opens a `file://` address, which blocks JavaScript modules in Firefox. From the project folder, run `npm run preview`, keep the terminal open, and visit the printed URL (normally http://127.0.0.1:4173/). Run `npm run build` first after changing the game.
