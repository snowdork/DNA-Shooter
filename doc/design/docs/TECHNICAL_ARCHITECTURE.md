## Latest paired-shot interaction — 2026-10-15
Click two complementary letters (A–T or C–G) to highlight and gently flash them; click an empty chain target to lock it, then click again to fire one linked pair. Letter selection and target locking never fire. Reset selection after firing; reduced motion uses steady highlights. A–C is a mismatch, not a valid pair. The chain starts on the left and slowly travels right, with at most four paired-rung targets visible. A run has 20 four-pair segments (80 placements). Each completed segment’s ordered pattern selects a distinct fictional adaptation rule; individual hits advance pair progress. Completed segments give way to the next segment entering from the left. Creature development remains a fictional creative model. GAMEPLAY_AND_UI.md is the current interaction authority.

## Initial mode revision — 2026-10-15
The initial prototype now follows the four-launcher imaginative creation mode in GAMEPLAY_AND_UI.md. An empty moving chain is filled with A/T/C/G, and completed segment patterns develop a green blob into a fictional creature. Keep this seeded sequence-to-art creation model separate from the real genetics/population model described below. No arbitrary base-to-animal transformation is presented as measured science. The prior fruit-fly experiment remains a possible separate future experience.

## Creation input contract
Keep explicit interaction states for first-letter selection, complement selection, pair ready, target locked and pair in flight. Target locks reference stable segment/rung IDs rather than screen coordinates. Record separate select-letter, lock-target and fire-pair actions for replay. Consume each press once, clear stale locks on segment transitions, and reserve an in-flight target against duplicate shots. Selection animation belongs to presentation; pairing validation and placement remain deterministic domain rules. Maintain independent pivot/muzzle transforms for each cannon; derive its aim from its own origin and the locked target’s current position. Gate launch until both selected barrels align, keeping at most one queued fire request. Cancel the queue on pause, retarget, pair change or target loss. Keep rendering frame timing out of creation outcomes; replay records the logical pair launch and eventual placement.

# Proposed technical architecture (planning only)

## Greenfield preference (pending repo inspection)
- **UI/build**: TypeScript with Vite; select React only if interface complexity warrants it or it already exists in the repo.
- **2D renderer/game loop**: Phaser 4 (current maintained branch, not Phaser 3 for a new project).
- **Domain simulator**: framework-agnostic pure TypeScript for DNA variant events, genotypes, heritability, phenotype probability, and population selection.
- **Persistence**: IndexedDB/local save for MVP; optionally a Node service and PostgreSQL/Drizzle for accounts, cloud saves, experiments and future sharing.
- **Hosting**: client build can be static; only add server when game features demand it. GitHub Actions CI after minimal project exists.

## Design boundaries
### 1. Presentation / shell
Navigation, buttons, menus, educational overlays, settings, help, and transitions between battle, lab, world, museum.
### 2. Game scene layer
Phaser-owned scene lifecycle, animation, input, collisions, sound and VFX. Emits **high-level intents** (e.g. "player hit locus with proton tool") to application logic; never directly changes DNA arrays inside collision handlers.
### 3. Application orchestration
Converts gameplay intentions into validated science-model inputs; applies energy/level rules; stores events/snapshots; advances generation simulation only after explicit transition.
### 4. Science/model layer
Deterministic domain logic with typed events and explicit seed/state; no direct dependency on Phaser, DOM, network or storage.
### 5. Curated species and trait content
Versioned JSON/structured assets describing sequence windows, loci, traits, evidence, assumptions, labels and tutorials. Use a curated FlyBase/Ensembl slice with provenance, not a full genome.
### 6. Persistence/replay
Local save of initial state, seed, event stream, model/version and stable checkpoints. Replay must remain possible after visual changes.

## Conceptual data flow
```
INPUT -> PHASER SCENE -> ACTION EVENT -> ORCHESTRATOR
                                      |
                                      v
                        SCIENCE / MODEL DECISION
                                      |
                         +------------+-------------+
                         |                          |
                         v                          v
                   EVENT JOURNAL              VIEW MODELS
                         |                          |
                         v                          v
                   SAVE / REPLAY              GAME / LAB / WORLD
```

## Staged folder design — proposal, NOT existing paths
```
src/
  app/                # application startup, navigation, scenes contract
  game/               # Phaser scene code, UI, input, assets and VFX
  simulation/         # DNA, genotype, trait, population, ecology, PRNG
  content/            # curated species, loci, teaching missions
  persistence/        # serialization, local saves, replay
  ui/                 # DOM menu, lab overlays, charts
  tests/              # deterministic model and integration tests
assets/               # original or licensed sound, sprites, fonts
```
Do not create this layout until the actual repository has been inspected and plan approved.

## Deterministic experiment requirements
Each run stores an experiment ID, schema version, scientific model version, species reference version, random seed, initial state, player action order, deterministic decisions/events, environmental timeline, and optional snapshots. Prefer event replay over storing a full new genome every tick. Defend against time-dependent nondeterminism in logic even if Phaser physics/VFX differ across devices.

## First implementation architecture
- Browser-only initial slice uses the five-band composition in GAMEPLAY_AND_UI.md: title, animal, horizontal DNA, stations in muck, and bottom HUD. Show all three stations; enable shooter first and visibly lock healer/mutator until M2. Share target positions between DNA rendering and collisions. Animal view models consume resolved genotype/trait state, never collisions directly.
- Fake/scaffolded **explicitly labeled** genome data for art and input can be used temporarily, but never marketed as real genetics.
- Add verified trait data and mutation engine as second independent milestone.
- Ensure animation time and simulation generations are not locked together.

## Performance/security/accessibility
- Separate fixed-rate science steps from visual frame rate, rendering VFX at device-dependent quality.
- Bound population count, event history and snapshots.
- Never download or execute arbitrary external genome files at runtime without validation.
- Avoid leaking local files or storing API keys in client code.
- Use licenses compatible with shipping for gene data, sprite art and music; link source and version.
- Maintain keyboard and eventual gamepad controls and reduced motion.

## Developer verification once code exists
Repository-specific lint, typecheck, unit tests, deterministic replay test, browser smoke run, accessibility spot check, production build. Do not invent npm script names; inspect package.json first.
