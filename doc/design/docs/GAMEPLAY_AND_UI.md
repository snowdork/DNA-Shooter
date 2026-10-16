# Gameplay, interface and art direction

## Primary creation screen — revised direction, 2026-10-15
This user-directed mode supersedes the three-station battle layout: four A/T/C/G launchers fill an initially empty moving chain, while a green blob develops into a unique fictional life form above. This is **Imaginative Evolution**, an arcade creation model rather than a prediction of real gene-to-trait effects. The older repair/science battle design below is retained only as a possible separate future mode.

### Screen composition
| Band | Starting height | Contents |
|---|---:|---|
| Title | 7% | DNA SHOOTER, Imaginative Evolution, pause/settings |
| Creature | 25% | Large green blob/created creature; small starting-blob comparison |
| Chain | 38% | Horizontal moving chain, initially black empty middle links, colored filled slots and upward shots |
| Launchers | 22% | Four closely grouped A, T, C, G launchers at bottom center, partly submerged in green muck |
| HUD | 8% | Score, segment 01/20, filled pairs 0/4, accuracy, selected pair |

```text
+---------------------------------------------------------------+
| DNA SHOOTER       IMAGINATIVE EVOLUTION                 PAUSE |
|                                                               |
| STARTING BLOB         [ YOUR GROWING UNIQUE LIFE FORM ]         |
|                                                               |
|  ->  [A–T]--------[ / ]--------[ / ]--------[ / ]  ->           |
|       filled colors       black empty middle links             |
|                       ^                                       |
|                    aimed shot                                 |
|                 [ A ][ T ][ C ][ G ]                 |
| ~~~~~~~~~~~~~~~~ GREEN MUCK ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| SCORE 01250  SEGMENT 01/20  PAIRS 1/4  PAIR READY A–T             |
+---------------------------------------------------------------+
```

### Four launchers and click sequence
- Cluster all four launchers close together at the **bottom middle**, directly beneath the chain. Start with the group occupying approximately the central 44–50% of the screen width, with small equal gaps and open green muck to either side. Preserve separate clickable plates and enough barrel clearance to aim across the chain.
- Exactly four launchers, ordered **A, T, C, G**, each with one large centered letter, distinct color and shape. Launcher plates show **letters only**, with no 1/2/3/4 badges or tool names.
- Give each launcher a different readable font: **A** angular futuristic stencil in amber; **T** bold slab serif in magenta; **C** smooth rounded lettering in cyan; **G** squared segmented digital lettering in violet. These are visual font directions, not selected font packages. Preserve clear letter recognition at small sizes; source licensed fonts before implementation.
- The latest rendered reference is [game-field-v5.png](../../images/game-field-v5.png). It shows paired firing and centered launchers; its back-and-forth arrow and chain-length HUD are superseded by the left-to-right, 20-segment rules below. A later image revision should show one-way travel and segment progress. Previous concept images are historical iterations.
- **Click 1:** choose the first letter launcher. It highlights and gently pulses.
- **Click 2:** choose its complementary launcher: A then T, T then A, C then G, or G then C. Both selected letters highlight and flash gently; the HUD shows the oriented pair and “Choose a target.” Neither letter click fires.
- **Click 3:** click an empty paired-rung target in the active chain segment. This **locks the target without firing**. Outline the selected rung and show “Target locked — click again to fire.” The lock follows that rung’s identity as the chain moves, rather than a fixed screen coordinate. Both selected cannons visibly rotate toward it before shooting.
- **Click 4:** a separate subsequent click in the playfield requests firing the ready pair into the locked rung; it launches only after both selected cannons are aimed. Both launchers contribute to one linked projectile and one atomic placement. Clicking a different empty rung retargets without firing; clicking a launcher starts a new pair selection. HUD/menu clicks never fire.
- Real complementary pairing is A–T and C–G. A–C is a mismatch: show “A pairs with T; C pairs with G,” retain the first letter and let the player choose again. Do not silently substitute a base or spend a shot.
- The target-selection click must be released before a new press can fire; never reuse the same click, pointer-up event or held mouse button for both actions. This is two separate target/fire clicks, not a timed double-click gesture.
- Clicking the first selected letter again clears selection. Escape cancels a target lock first; with no lock it pauses. Changing the selected pair clears the lock.
- After firing, clear the pair and lock so the next shot follows the same four-click sequence. Mark the target as pending during flight; block duplicate shots at pending or occupied rungs. Record placement and score only on a successful impact.
- Without a ready pair, chain clicks give a selection hint. An occupied rung cannot be selected. If a target becomes unavailable or the active segment changes, clear the lock and require a new target selection; never fire at a stale target.
- Keyboard alternatives: 1/2/3/4 chooses A/T/C/G; arrows move target focus; first Space locks the focused empty rung, a later Space fires. Require separate key presses. Shortcuts belong in help, not on launcher plates.

### Cannon rotation and aiming
- Rotate the two selected barrels around visible turret pivots when a target is locked. Each cannon aims from its own position toward the same moving rung; do not give both barrels an identical angle when their positions differ.
- Track the locked target as the chain travels. Show “Aiming…” during rotation and “Ready — click to fire” when both barrels align. Idle cannons remain at rest. Base plates and A/T/C/G letters stay upright and stationary.
- The firing click is still required: aiming never shoots automatically. If that click arrives before alignment, queue **one** shot request and release it when both barrels align. Ignore extra firing clicks while queued or in flight; no additional click is needed solely because of the rotation animation.
- Fire the two base contributions together, with projectiles visibly leaving the aimed muzzles and joining as one pair. Recoil follows firing, then the barrels settle; no projectile appears before rotation has completed.
- Changing the pair, retargeting, cancelling, pausing or losing the target cancels a queued request so it cannot produce an unexpected later shot. Resume requires a fresh firing click. Clear selection after launch as specified above.
- Use a short responsive rotation rather than a long mandatory animation. Reduced motion uses immediate functional aiming and removes decorative swing/recoil; the select–lock–fire sequence remains the same.

### Interaction states
`Choose first letter → Choose complement → Pair ready → Target locked / cannons aiming → Ready to fire → Pair in flight → Choose first letter`

Show the next required action beside the pair indicator. Gentle flashing is local to selected letters, never full-screen or rapid strobing; reduced-motion mode uses a steady bright outline instead. Target lock, pair readiness and in-flight status also have text/icon indicators.

### Moving chain, pairing and growth
- Show **at most four large rung targets** at once; a complete active segment contains exactly four. Each target has two connected base halves, one on each backbone. An empty rung has two black interiors with clear outlines; a placed pair joins them into one readable rung.
- The chain starts at the **left-hand side** and slowly travels **left to right** across the middle band. This replaces back-and-forth motion. Introduce the four active rungs from the left without exposing extra segments or more than four targets. Keep readable movement and bounded decorative wiggle; reduced motion removes wiggle while retaining slow predictable travel.
- A successful linked-pair impact fills exactly one empty rung, appends the ordered pair to the creation history, increases filled-pair progress by one and scores once. Show immediate hit feedback; commit the segment’s creature adaptation only after all four pairs are placed.
- Both A–T and C–G are valid in a fresh rung; there is no hidden target sequence. First selection defines the first displayed strand; its complement defines the other. Record orientation for deterministic replay.
- A run contains **20 segments**, each with **four paired rungs**: 80 successful pair placements total. Only the active segment is targetable. After its four rungs are filled, show its pattern and adaptation, archive it, then bring the next segment in from the left. Completed chain growth remains inspectable without adding simultaneous targets. Segment size follows the earlier four-element design.
- Occupied rungs cannot be overwritten or scored repeatedly. Misses leave the chain and creature unchanged. Initial forgiving retry proposal: pause forward travel before an incomplete segment exits the right edge, keeping its remaining slots aimable until complete. Do not reverse direction, lose a required segment or apply an adaptation for an incomplete pattern. Tune travel speed and edge-hold timing through playtesting.
- Decorative wiggle and hit detection share target positions; upright labels and bright outlines take precedence over realistic molecular scale.
- Pair firing and chain extension are arcade assembly metaphors, not literal DNA synthesis or mutation mechanisms. Complementary pairing is real; creature transformations remain fictional.

### Blob-to-life-form creation
- Every run starts from a charming luminous **green blob**, with no preselected fruit fly. Each completed four-pair segment produces a cumulative adaptation based on its pattern. Individual hits give immediate progress feedback.
- A completed pattern may change body contour, surface pattern, coloration, appendages or sensory features through a bounded procedural art system. Preserve continuity and silhouette readability as the creature becomes more elaborate.
- Each completed pattern should produce a distinct adaptation rule, but the visual transformation catalog remains a game-design task. Any examples are fictional art rules, not biological mappings such as “A creates an eye.”
- Build the result from the ordered sequence and creation seed. The same seed and placement sequence produce the same creature; different sequences can produce varied wonderful forms without promising mathematical uniqueness.
- Show “Pair placed — 3/4” while filling. On completion, show “Segment complete — new adaptation” with a before/after pulse on the creature. Avoid flashing or motion that obscures the next target.
- After segment 20 is completed, present the finished life form, all 20 patterns and their adaptations, seed, replay and new-creation controls. The four-visible-target aiming limit always applies.
- Use “adaptation” and “mutation” as fictional creation language in this mode, with a concise visible note: **Creative model — real DNA changes do not predict these transformations.** Real populations evolve across generations; this screen is an imaginative construction game.

### Pattern-to-adaptation contract
- A segment pattern is the ordered list of its four oriented pairs, in chain order rather than hit order. A–T, T–A, C–G and G–C distinguish the displayed first strand. Example: `A–T / C–G / T–A / G–C`.
- Distinct patterns select distinct fictional adaptation rules; the same pattern repeats its rule, applied consistently to the existing creature. Different seeds may alter styling, but the pattern’s rule identity remains stable within a model version.
- Do not promise that all 20 segments always have different patterns: players may repeat a choice. Repeated-rule art must stack or evolve visibly without destroying readability. The exact rule catalog and repeat behavior must be designed before implementation.
- Record segment index, four ordered pairs, adaptation rule ID, seed and creation-model version. Apply each completed segment exactly once so retries/replay cannot duplicate adaptations.
- HUD separates **segment progress** (`01/20`), **pair progress** (`3/4`) and the ready firing pair. Completion means 20 segments and 20 applied adaptation steps, not four pairs total.

### Motion and accessibility
Keep the title and HUD stable. Reduced motion removes decorative wiggle, muck bubbles, creature wobble and screen shake while preserving slow predictable target travel. Pause freezes the chain and projectiles. Use letters/shapes alongside color and verify readability at 1280 × 720 and 960 × 540.

## Earlier science battle tools — separate future-mode reference
| Weapon | Core action | Biological interpretation |
|---|---|---|
| Proton Blaster | fast, cheap, imprecise; causes damage/repair event | stylized proton radiation causes probabilistic damage; cannot make controlled substitutions |
| Base Editor | limited charges; highlights intended base | a simplified precise editing metaphor; simulated correctness not laboratory performance |
| Repair Beam | protects DNA integrity | a representation of cellular DNA repair pathways, not a real externally targeted healing ray |
| Duplication Cannon (later) | creates copy of a selected region | gene duplication abstraction; can have complex consequences |
| Recombination Pulse (later) | redistributes alleles between inherited chromosomes | meiotic recombination metaphor; not mutational 'upgrade' |
| Regulation Pulse (later) | changes gene-expression setting | regulatory abstraction that needs a defined model |

A chromosome is a selectable large DNA structure; it is not a projectile or consumable ammo.

## HIT -> EVENT -> RESULT
1. Player hit triggers target-specific event and visual feedback.
2. Damage can be repaired with no persistent variant or resolve to a mutation in a modeled genotype; target and tool matter.
3. Mutation has a defined locus, source, affected allele, and provenance.
4. If modeled as heritable, it can reach offspring. Somatic events cannot simply be inherited in the ordinary way.
5. Phenotype model determines optional trait consequences, with uncertainty.
6. World simulation decides fitness under current habitat, then population-level reproduction/selection/drift unfold.
7. Research log explains outcome, including cases with no detectable effect.

## Three screens
### Shooter layout
Use the five-band composition above; animal, DNA and stations share the battle screen.
### Evolution Lab
Left: zoomable DNA segment and locus. Center: fruit-fly preview with before/after annotations. Right: evidence/confidence, variant type, inherited/somatic status, phenotype probability, comparison to founder.
### Living World
Top: climate, predator and food indicators. Center: small 2D environment with many flies and visual trait variants. Bottom: allele frequency chart, population count, generation slider, lineage branches and replay/rewind.

## Scoring
- Arcade score: target accuracy, survival, energy conservation, chain reactions, tactical tool use.
- Science score: discoveries, saved high-quality evidence, successful replicated experiments and accurately explained neutral events.
- Ecosystem score: persistence, diversity, resilience, and reaching scientific mission challenges. No universal objective to maximize mutations or produce genetically 'perfect' creatures.
- Unlock cosmetic ships and additional lab tools separately from trait fitness.

## Readability and accessibility
- A/T/C/G labels plus shapes; never distinguish bases solely by hue.
- High contrast, scalable type, safe color combinations, subtitles for sound cues.
- Reduced motion, photosensitivity setting for particle flashes, adjustable game speed, pause and replay.
- Accessible glossary for codon, chromosome, mutation, allele, fitness, drift, recombination.

## Art direction
Dark near-black backdrop; radiant cyan/magenta strands; green highlights for stable/repair events; orange for high-energy hazard; indigo/purple atmospherics. An 80s arcade aesthetic with modern typography and crisp scientific overlays. Glows enhance but do not obscure hitboxes or labels.

## Future boss encounter candidates
Radiation burst: requires survival and strategic repair. Replication fork: timing-based target selection. Chromosome duplication: a dramatic decision with potentially major biological effects. All labeled as stylized fictional action based on real biological vocabulary.
