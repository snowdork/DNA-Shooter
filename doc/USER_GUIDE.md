# Mutagon user guide

Mutagon is a DNA shooting game: complete 10 quadra-chromes while a caged green blob transforms into an unpredictable creature. Each quadra-chrome is one set of four complementary base-pair chains.

## Start locally

Run `npm ci` on first setup, then `npm run dev` and open the local URL printed by Vite (normally http://127.0.0.1:5173). Click **Start experiment**.

## Play

Compact side shooters leave more room for the wider DNA canal. The playfield fills the available screen width and height, with no fixed aspect-ratio bands or desktop width cap. The DNA canal and Mutagon chamber expand with the window, while the organism, text, and shooters keep their proportions. Artwork is redrawn at the current canvas size for clarity. The header and controls stay above the fold on laptop screens; mutation history is below the game. A **DNA Patterns** ticker sits to Mutagon’s right with 10 rows of letter patterns, one per quadra-chrome, without visible numbers. Each row shows its four pairs in chain order, updating only when a shot lands. Empty pairs show --, the current row is outlined, and completed rows turn green. Hover a row for its full letter pattern. Loading rebuilds the ticker; restarting clears it. The canal and Mutagon chamber align near the top of the playfield. Matching labels beneath them show the canal’s paired-chain count, gameplay feedback, the mutation count, and the organism’s motion. Longer feedback can be read by hovering over it. Mutagon appears larger in a softly lit chamber with thin translucent bars.

The **DNA Dispatch** reel below the playfield scrolls 40 short genetics facts, figures, vocabulary notes, and a base-pair puzzle, each with its own color and font. Learn about base pairing, genome size, chromosome counts, codons, RNA, inheritance, epigenetics, DNA changes, sequencing, PCR, and genome science history while building your creature. Number notes include human and strawberry chromosome counts and the mitochondrial gene count. Hover over the facts, focus the reel, or use **Pause reel** to stop it for reading. Each fact links to its NHGRI source. With **Reduced motion**, the reel stays still and can be scrolled sideways. Mutagon’s instant animal-part changes are identified as imaginative game mechanics.

Use **Directions** beside the logo to open the play guide. It pauses an active run and resumes it when closed. Score and chromosome progress sit beside the Mutagon logo; sound, motion, and save controls sit below the field.

Build **AT, TA, CG, or GC** in the preview holders. Drag bases into UP and DOWN, or click a base and then click its destination holder. Either holder can be filled first. Clicking a base alone only picks it up. Once both holders contain a matching pair, a pulsing green slime frame surrounds the preview and empty chromosome chains glow green: drag the completed pair onto a chain or click a chain to populate it. Drag from the green frame, READY button, or either filled holder; the preview keeps UP above DOWN. An empty chain highlights when it can accept the drop. Dropping outside the canal or onto an occupied chain preserves your pair. The ready frame clears when fired, undone, or paused. Reduced motion keeps the green frame steady. Wait for the shot to land before building another pair. A wrong complement is rejected.

Each quadra-chrome approaches from above and feeds into the oozy DNA canal, then streams slowly toward the bottom. It keeps its four chains and placed pairs without resetting or looping back. Fill each chain before it reaches the exit: **any empty chain touching the bottom ends the game**, even if other chains are filled. Filled chains can leave safely. A launched shot must land before its target reaches the exit; it does not freeze the stream or extend the deadline. Fill all four pairs to advance, then the completed set pauses to shake, glimmer, and throw off sparks before drifting down to the master chain. The matching DNA Patterns row glows as it joins. Only then does the next quadra-chrome enter; the final set celebrates before the victory screen appears. Reduced motion replaces the shake and sparks with a steady completion halo. Use Restart after game over. The stream gradually speeds up. Pink and blue strands gently sway and ripple; Reduced motion stops their decorative wiggle. Completing quadra-chrome 10 wins.

Each side is a pairing station with a chromosome-style preview above its fixed, side-by-side bases: A/T on the left and C/G on the right. Drag a base into the green UP holder, then its complement into the red DOWN holder. Alternatively, click a base and then click the UP or DOWN holder to place it. Clicking bases alone does not fill either holder. Either holder can be filled first. Once both contain a complementary pair, drag the ready pair onto an empty chain or click that chain to populate it. The × button clears that side’s pending selection. A launched shot finishes before the preview can be reset. The base in the **green ↑ UP** holder appears on top of the rung; the **red ↓ DOWN** base appears below, regardless of which slot was filled first. Labels stay highlighted until the shot lands, and clear on cancellation. The small HUD between each pair of shooters shows the selected order. The station gets a bright outline as soon as a base is picked. A red × marks a picked base so its unmarked partner is easy to spot. Click a picked base again to deselect it; clicking an assigned base or its filled holder removes just that base. Empty holders show a grey outline and a - placeholder. Filled holders use their UP/DOWN color. Drag a filled holder back into its own shooter tray, or click it, to undo just that placement; dropping elsewhere preserves it. The outline remains while either base is selected and disappears when the side is empty. × clears the whole station preview. Each shooter has its own fixed illustrated shape; its barrel turns toward the selected rung. `AT` and `TA` encode different mutation patterns, as do `CG` and `GC`. Every new game starts with a smaller, plain green glob that jiggles and squashes like soft jelly, then grows as mutations land. A fresh random seed gives each run a different mix of traits and colors. Every landed pair changes its movement rhythm and adds a randomly chosen, named, colored mutation immediately, including eyes, legs, body bands, tails, antennae, tongues, gills, wings, horns, sucker-covered tentacles, scales, spots, sparks, tusks, snozzle trunks, paws, ears, whiskers, fins, beaks, claws, and feather plumes. New traits briefly grow and glow. Legs add alternating steps, wings flutter, tails sway, gills pulse, tongues flick, and eyes look around. Sparks add electric jitter; animal parts bring pouncing, scuttling, swimming, snuffling, and feather-fluttering motion. The cage shows the current motion style. Reduced motion keeps the creature still. Repeated traits develop colored variants; the latest four of each type remain visible. Four pairs also add a chromosome pattern. Tails, tongues, extra eyes, tendrils, fins, and colors develop as you play. These traits are fictional.

## Controls

| Control | Action |
| --- | --- |
| A / T / C / G | Select the complementary bases in order; then click an empty rung to fire. |
| 1 / 2 / 3 / 4 | Fire the selected pair at that rung, counting from the top. |
| Escape | Clear selection and pending shot. |
| Space | Pause or resume. |
| Restart | Immediately discard progress and start a fresh experiment. |

The game pauses when its tab is hidden. Base selection is disabled while paused, during chromosome transitions, and after the run ends. Reduced motion removes decorative movement and makes aiming immediate; stream movement and deadlines remain.

Each pair earns 100 points, and each completed chromosome adds 400. A finished run contains 40 pairs, 10 adaptations, and 8,000 points. Expand **Your mutations** to see every hit’s trait, color, pair order, chromosome, and rung, followed by completed four-pair patterns.

## Sound

Sound starts with the experiment: gently drifting rumble, filtered gas, soft bubbles, and occasional tremors form the lab background. Wet slime shots and growth pulses have a short chamber echo. AT, TA, CG, and GC each have a distinct note and tone color. Each completed chromosome plays its four pair notes in chain order, followed by a stable signature chime unique to that full pattern; the same pattern always makes the same phrase and resolving pitch. Background sounds stay softer than these experiment cues. The final chromosome’s signature plays before the victory fanfare. Use **Sound on / Sound off** to mute or restore audio. Pausing or hiding the tab silences it and clears pending effects and echoes so old shots do not replay on resume. Audio is generated locally in the browser.

## Save and load

**Export creation** downloads `dna-creation.json`. **Load creation** restores an export paused, rebuilding the organism from its placement history. New exports record the seed and mutation rules so the exact random traits, colors, and variants return when reloaded. New games randomly draw from all 22 traits; repeats can develop different colors and shapes. Older exports retain their original 12-trait or 22-trait sequential rules. The version 1 format accepts older partial exports too; the new goal is 10 quadra-chromes. Exports with more than 40 placed pairs exceed this shorter run and cannot be loaded. Files must be at most 32 KiB. Invalid imports leave current progress intact.

Exports preserve landed pairs, not stream position, game-over status, selection, or shots in flight. Loading grants a fresh chromosome timer. There is no autosave; export before closing or restarting if you want to keep progress.

## Creature inspiration

The fictional creature draws on [axolotl external gills](https://www.nhm.ac.uk/discover/axolotls-amphibians-that-never-grow-up.html) and [cephalopod tentacles and color displays](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/cephalopods). Complementary base pairing is real; these pattern-to-trait rules are imaginative game mechanics.

## Opening the production build in Firefox

Open the build through a local web server. Double-clicking `dist/index.html` opens a `file://` address, which blocks JavaScript modules in Firefox. From the project folder, run `npm run preview`, keep the terminal open, and visit the printed URL (normally http://127.0.0.1:4173/). Run `npm run build` first after changing the game.

## Quadra-chrome goal configuration

`TOTAL_SEGMENTS` in `src/model.ts` is the single adjustable quadra-chrome goal, currently **10**. It sets the number of model chromosomes, DNA ticker entries, progress totals, Directions goal, and victory message. Change that constant to adjust the run length and rebuild.
