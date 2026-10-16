## Revised creation prototype priority — 2026-10-15
This replaces the earlier M1–M3 scope for the initial playable experience; the science roadmap below is retained for a separate future mode.
1. Approve the four-launcher screen concept before application code.
2. Build one screen: green blob above, moving empty chain across middle, closely grouped A/T/C/G launchers at bottom center in green muck, title and scoring HUD.
3. Click two complementary letters to highlight and gently flash them, click an empty chain target to lock it without firing, rotate both selected cannons toward the moving target, then use the next click to fire one linked A–T or C–G pair once both barrels align. Reset pair/target selection after firing. Reject mismatches with a brief pairing hint. Successful collision fills exactly one empty slot; occupied slots/misses cannot score or adapt the creature.
4. Each completed four-pair segment triggers its pattern-specific fictional adaptation; individual hits provide progress feedback. Record ordered patterns, rule IDs and seed for replay.
5. Provide pause/restart, keyboard alternatives and reduced motion. Start the chain on the left and move slowly right with at most four large paired-rung targets visible. Complete 20 four-pair segments (80 placements), archiving each pattern and revealing the next segment from the left. Prototype an edge hold for incomplete segments.
Acceptance: all four launchers work; all 20 segments can be completed, each applying its pattern adaptation exactly once, and the result is a visibly developed creature; same seed/sequence reproduces it; letters remain readable; complementary pairing is mandatory; UI clearly labels imaginative biology. Verify separate letter/target/fire clicks, no firing on target selection or held clicks, moving target-lock identity, independent cannon rotation and tracking, one queued shot during aiming, queue cancellation, reduced-motion aiming and selection highlight, moving-slot collisions, pair selection and mismatch rejection, atomic pair impacts, 20-segment completion, pattern ordering independent of hit order, repeated-pattern behavior, segment growth, duplicate-hit handling, restart and production build once code exists.

# Implementation roadmap and milestone acceptance tests

Each milestone should be a separate reviewable task/PR, built on an agreed branch policy. Do not move to the next before showing a runnable, tested result.

## M0 — repo baseline and planning (FIRST CODEX SESSION, NO CODE)
- Identify Git status, branch/remotes, existing stack and tests.
- Recommend final stack and directory layout, note migration risks.
- Convert this plan to a prioritized issue list after user review.
- **Accept:** architecture review, risks, and first coding task delivered; no file/branch changes.

## M1 — playable neon arcade vertical slice
- Rendering surface scales to browser; title bar, upper animal preview, horizontal DNA middle, three lower stations in green muck and bottom scoring HUD; responsive station aiming.
- Animated horizontal double helix with colorful A/T/C/G labels, active bounded wiggle, matching visual/collision positions and reduced motion.
- Fire proton projectiles from the shooter station with hit detection and feedback. Show healer/mutator visibly locked until M2; label animal art illustrative until M3.
- Basic HUD, score, pause/restart, event log, no persistence required initially.
- Demo via dev server on Linux in VS Code.
- **Accept:** run/build commands documented; no runtime errors; clear 60-second play loop; understandable base targets; art can be placeholder.

## M2 — DNA-event model and repair
- Decouple projectile effects from science event processing.
- Model selected sequence windows, strand complement, variation events, source metadata and damage/repair. Enable healer/mutator stations with distinct valid targets, costs and feedback.
- Distinguish repaired damage, mutations, unknown consequence, and unviable events.
- **Accept:** deterministic unit tests for pairing, variants and repair; every successful hit yields replayable event with explanation.

## M3 — fruit fly lab and first trait
- Add fly species metadata, four chromosome pairs and one or two curated annotated windows with named reference assembly/release.
- Display a sourced trait model (e.g. a verified pigmentation-related variant) including uncertainties.
- Add basic lab before/after and explain heritable vs somatic distinctions.
- **Accept:** documented source IDs/URLs and no unsupported mapping from arbitrary hit to phenotype.

## M4 — generations and ecology
- Add small diploid population, reproduction, inheritance and selection, plus drift and extinction.
- Introduce a single environment with variable resources and predators.
- Show cohort, allele frequency and trait chart.
- **Accept:** repeatable seeded generation results, visible selection and stochastic variation, edge-case tests for extinction/drift.

## M5 — full experiment and replay
- Connect shooter, mutation model, lab and world into one 8–12 minute loop.
- Save seed, inputs, event records, simulation snapshots, and replay/rewind.
- Add lessons, discovery achievements, accessibility controls and onboarding.
- **Accept:** same seed/actions produce same outcomes; complete beginner tutorial; separate measured facts from assumptions.

## M6 — optional expansion after MVP review
- Branching lineage museum and isolated populations; new environments and curated species modules.
- Additional weapons, missions, shaders, creatures, mobile controls, leaderboard or backend if demand proven.
- Do not describe lineages as separate species without a deliberate and defended speciation criterion.

## Definition of done, every coding milestone
- Scoped implementation with no unexplained dependencies.
- Tests or manual verification instructions applicable to changes.
- Changes summarized; source and scientific assumptions documented.
- Existing working features preserved; build/lint where scripts exist.
- No uncontrolled Git operations. User reviews before commit or push if the user asked for approval workflow.

## Prioritized first backlog
1. Repo audit and tooling recommendation (read-only).
2. Shooter input/camera/resolution spec.
3. DNA helix prototype with identifiable A/T/C/G targets.
4. Station selection/aim/weapon/collision feedback.
5. Mutation-event log skeleton with typed output.
6. DNA damage/repair model and tests.
7. Scientific content catalog skeleton with provenance fields.
8. First fruit fly genotype/trait lab.
9. Population generation model with drift and fitness.
10. Save/replay integration and side-by-side experiments.
