# Decisions, constraints and questions

## Working decisions to confirm during repo audit
| Item | Recommended starting decision | Reason |
|---|---|---|
| Workspace | `$HOME/dev/DNA-shooter` | user-specified local development folder |
| Git | existing remote repo; `main` base, feature branch per implementation milestone | safe reviews and rollback; don't force switch |
| Editor | VS Code with Codex extension, terminal CLI optional | direct repo context and readable diff review |
| Language | TypeScript | typed model and browser ecosystem |
| Game engine | Phaser 4 rather than Phaser 3 for fresh build | currently maintained 2D engine and newer effects |
| Bundler | Vite if repository is greenfield | browser dev efficiency |
| Biology engine | independent, deterministic domain module | scientific tests and replayability |
| Species | *Drosophila melanogaster* | documented genome and tractable traits |
| Save mode | local first | avoid backend before proving game loop |
| Deployment | browser static initially | lower operations and easy sharing |
| Visual style | modern-80s neon | distinct and suited to sci-fi molecular action |

## Explicit boundaries
- The first Codex chat is **planning only**; obtain a separate instruction before generating code.
- No claiming inherited change from any body-cell DNA shot without a game rule that connects it to a gamete/offspring.
- Don't claim mutation odds or genotype->phenotype mappings are scientifically measured if they are not.
- Don't call every branch a new species; speciation requires a carefully modeled criterion.
- Real genome references are metadata/data; they are not a complete predictive physics/phenotype simulator.
- No proprietary brand imagery or copyrighted game assets reused without authorization.

## Questions to resolve after viewing actual code
1. Is the project repository blank, or is there an existing Node/Vite/React/Phaser setup?
2. Does user want Codex edits on `main` directly or to start feature branches from `main`?
3. Which input style matters first: keyboard, mouse aim, or gamepad?
4. Will the first tutorial present fruit-fly sex chromosomes or simplify to an autosomal window?
5. Which single curated trait/allele can be supported robustly by FlyBase sources?
6. Is gameplay progression based on missions, open-ended research, or a hybrid?
7. Should replay be deterministic at the game-shot level or only scientific outcome level?
8. Which license will the repository and original art assets use?

## Risks
- **Scientific overclaim**: arbitrary base edits cannot reliably predict appearance — use annotated windows and explicit unknown outcomes.
- **Scope creep**: species catalog and simulated whole genomes too early — prove one fly-based loop.
- **Engine coupling**: evolution rules hidden in Phaser scenes — keep simulation separate and pure.
- **Performance**: large population x VFX x genome — restrict domain state and use compact traits.
- **Novelty vs depth**: shooter becomes a mini-game unrelated to simulation — feedback must show a real event path.
- **Git accidents**: existing branches/uncommitted changes — inspect before branch operations and no automatic overwrites.

## Screen direction — 2026-10-15
- User-directed composition: title bar, upper rendered animal, middle horizontal colorful DNA with active wiggle, lower shooter/healer/mutator stations in green muck, bottom scoring HUD.
- Supersedes the vertical helix/free-moving craft proposal. GAMEPLAY_AND_UI.md contains the wireframe, proportions and interaction design.
- Proposed controls: one selected station, pointer or keyboard aim, upward firing. Validate switching speed, wave comfort and target readability in the prototype.
- M1 presents the full composition with shooter active; M2 enables healer/mutator; M3 introduces sourced trait rendering.
- The animal represents supported modeled traits; pending events and offspring previews are labeled explicitly.

## Superseding creation decision — 2026-10-15
- Four launchers A/T/C/G replace shooter/healer/mutator for the initial mode.
- Click launcher to activate, mouse aim, subsequent playfield click fires. Moving chain approaches with empty black middle links; successful placements fill it.
- Start from a green blob; every successful placement causes a cumulative fictional creature adaptation.
- Explicit user direction overrides the earlier fruit-fly-first MVP constraints for this creative mode. Keep scientific claims separate.
- Earlier prototype proposals (superseded by the four-slot decision below): 24 slots, any base accepted in an empty slot, persistent selection, looping missed links, deterministic seeded creature art.
- Next visual review: four-launcher concept with partly filled chain and blob-derived creature; no code yet.

## Launcher lettering and image reference — 2026-10-15
- Launcher plates display only A, T, C, G, centered; remove all numeric badges.
- Use four distinct readable type styles: angular stencil A, slab-serif T, rounded C, segmented geometric G. Retain amber/magenta/cyan/violet launcher colors.
- Numeric keyboard shortcuts may remain in help; they are not part of launcher artwork.
- Current concept: [game-field-v3.png](../../images/game-field-v3.png). This supersedes v1/v2 as the screen art reference; implementation has not started.

## Centered launchers and four-element chain — 2026-10-15
- User-directed revision: group the four A/T/C/G launchers closely at bottom center so players can select, aim and shoot toward the chain from one compact area.
- Show only four large chain elements at once, widely spaced; empty elements have black interiors and visible outlines. This replaces the earlier dense chain concept.
- Initial round: four placements; any future extended session must preserve the four-visible-target limit.
- Current screen reference: [game-field-v4.png](../../images/game-field-v4.png), superseding v3. Keep previous images as historical iterations.

## Paired launchers and chain growth — 2026-10-15
- Two complementary launchers must be chosen before firing: A–T or C–G, in either selection order. The user's A–C example would be a mismatch under ordinary complementary DNA pairing; the design follows the requested realistic pairing goal.
- Show both selections and launch a linked pair with one atomic impact. Invalid pairs do not fire or change the creature.
- Chain moves back and forth; four visible elements are paired rungs, not four single bases.
- Growing chain replaces the earlier four-placement end-of-run proposal. Proposed progression archives each completed segment and reveals the next four targets. Finish conditions remain open.
- Current reference: [game-field-v5.png](../../images/game-field-v5.png). Earlier image references above are historical.

## Twenty-segment run and one-way entry — 2026-10-15
- Latest user direction supersedes back-and-forth motion: chain begins at the left-hand side and moves slowly across to the right.
- Run length is 20 segments. Following the four-element target layout, each segment contains four paired rungs: 80 placements total, at most four targets visible.
- A completed segment’s ordered pattern selects its adaptation rule. Individual hits show progress; segment completion applies one lasting adaptation. Twenty completed segments finish the life form.
- Distinct patterns get distinct fictional rules; repeated patterns may repeat/evolve the same rule. Rule catalog and repeat visuals are still open design work.
- Proposed forgiving behavior: hold an incomplete segment near the right edge until filled. Travel speed and transition timing need playtesting.
- v5 remains the latest rendered image but its back-and-forth arrow and HUD require a future visual revision. Current gameplay text is authoritative.

## Explicit select, target, fire rule — 2026-10-15
- User-directed four-click sequence: first letter, complementary second letter, chain target, then another click to fire.
- Selected letters highlight and gently flash; reduced motion replaces flashing with a steady highlight.
- Clicking a target only locks it. A separate later playfield click fires; no timed double-click requirement. The lock follows the moving rung by ID.
- Initial supporting rules: clicking a different empty rung retargets; choosing a letter clears the lock; firing clears selection for the next shot. Pending/occupied rungs cannot receive duplicate shots.
- Target lock cancels if its segment is replaced. Preserve the existing 20-segment run and four-visible-target limit.

## Rotate before firing — 2026-10-15
- Both selected cannons rotate toward and track the locked chain target before shooting; bases and letter plates stay fixed.
- Preserve the separate firing click. Initial supporting rule: an early firing click queues one request until both cannons align; aiming alone never fires.
- Cancel queued fire on pair change, retarget, pause or target loss. Reduced motion aims immediately without decorative swing/recoil.
- Prototype rotation speed and readiness feedback for responsive play. This changes the design specification only, not application code or the existing image.
