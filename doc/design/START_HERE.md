## Latest direction — 2026-10-15
Current screen concept: [game-field-v5.png](../images/game-field-v5.png). Four launchers are grouped closely at bottom center, with letter-only A/T/C/G plates in distinct fonts. The chain starts at the left and slowly moves right, with at most four paired-rung targets visible. Complete 20 segments of four pairs; each completed pattern adds a fictional adaptation. The image’s back-and-forth arrow is awaiting revision.

Start with an imaginative creature-creation shooter: A/T/C/G launchers fill empty black links in a moving horizontal chain. Click two complementary letters (A–T or C–G); they highlight and gently flash. Click a chain target to lock it; both selected cannons rotate and track it. Click again to fire the linked pair once aimed. Each completed segment pattern develops a green blob toward a wonderful fictional life form. See docs/GAMEPLAY_AND_UI.md for the current screen specification; the earlier science-first handoff below is background for a separate future mode. Visual approval precedes code.

# DNA Shooter — Codex handoff

**Project:** DNA Evolution / DNA Shooter  
**Target workspace:** `$HOME/dev/DNA-shooter`  
**Status of this package:** design/research only — no application code included  
**Intended tools:** VS Code, Codex, GitHub, TypeScript, Phaser 4 (subject to repo review)

## Elevator pitch
An exciting 2D arcade shooter with a living DNA double helix as the playfield. Shooter, healer and mutator stations emerge from green muck and fire upward at colorful horizontal DNA, with the modeled animal displayed above. Mutations and DNA repair feed a small, reproducible genetics model; generations of animals face ecological selection. Players explore branching evolutionary histories rather than buying guaranteed biological upgrades.

## The essential loop
1. Choose a real species and a curated DNA window.
2. Play a short arcade mutation/repair encounter.
3. Inspect the DNA event and scientific explanation.
4. See a plausible, sourced or explicitly simplified trait effect (if any).
5. Advance generations through a small ecosystem.
6. Observe allele frequencies, births, deaths, drift, and lineage survival.
7. Save the seed and replay or branch the experiment.

## First release scope
Fruit fly, one chromosome navigation view, small sequence windows, three distinct tools, a few verified/simplified trait models, one ecosystem, transparent reproduction/selection, and deterministic replay. The *entire real genome is not simulated in real time*.

## Document map
- `AGENTS.md` — persistent Codex project rules; loaded by Codex from repo root.
- `CODEX_FIRST_PROMPT.md` — copy its prompt into your first VS Code Codex session.
- `docs/PRODUCT_VISION.md` — audience, pillars, objectives, boundaries.
- `docs/GAMEPLAY_AND_UI.md` — shooter, tools, HUD, modes, player journey, screens.
- `docs/GENETICS_AND_EVOLUTION.md` — scientific model, data and limitations.
- `docs/TECHNICAL_ARCHITECTURE.md` — recommended module boundaries, data and persistence.
- `docs/ROADMAP.md` — staged delivery and testable acceptance criteria.
- `docs/EXPERIMENT_PLAYTHROUGH.md` — representative 10-minute game session.
- `docs/SCIENTIFIC_SOURCES.md` — reference sites and research tasks.
- `docs/DECISIONS_AND_OPEN_QUESTIONS.md` — working decisions and unresolved issues.

## Critical initial workflow
1. Open the **actual Git clone** of the repository in VS Code at `$HOME/dev/DNA-shooter`.
2. Copy the contents of this package into the repository without overwriting existing material.
3. Inspect `git status` and choose whether to work on `main` or a feature branch.
4. Start Codex from the repo root, ensuring its `AGENTS.md` is picked up.
5. Paste `CODEX_FIRST_PROMPT.md` into Codex. Ask for architecture and milestone-1 design **without code changes**.
6. Review/approve the proposal, then ask separately for the smallest runnable vertical slice.

## Visual identity
Neon 1980s arcade science: Electric Cyan `#00FFFF`, Jungle Green `#29AB87`, Neon Magenta `#FF00FF`, Deep Indigo `#4B0082`, Solar Orange `#FF4500`, Blacklight Purple `#BF00FF`, white/black. Science labels must remain readable and UI must not rely only on color.
