# DNA Shooter — repository instructions for Codex

## Mission
Build **DNA Evolution / DNA Shooter**, a fun, responsive, science-grounded 2D browser arcade shooter connected to a transparent, reproducible population-evolution simulation. This repository holds the game implementation and the canonical planning documents under `docs/`.

## Read first
Before designing or changing code, read:
1. `START_HERE.md`
2. `docs/PRODUCT_VISION.md`
3. `docs/GAMEPLAY_AND_UI.md`
4. `docs/GENETICS_AND_EVOLUTION.md`
5. `docs/TECHNICAL_ARCHITECTURE.md`
6. `docs/ROADMAP.md`
7. `docs/SCIENTIFIC_SOURCES.md`
8. `docs/DECISIONS_AND_OPEN_QUESTIONS.md`

## Collaboration and execution
- **First Codex session is review and planning only. Do not create, modify, move, or delete source files; do not install packages; do not run migrations; do not push or commit.** Report findings and await a separate explicit request to implement a milestone.
- In subsequent explicitly authorized coding sessions, work on one small milestone at a time; state files changed, test commands, findings, and known limitations.
- Never force-push, delete a branch, discard uncommitted work, overwrite established files, or change remotes without user permission.
- Inspect the actual checked-out branch, file structure, and package configuration; don't assume an empty repository or a particular existing stack.
- Prefer maintainable TypeScript and Phaser 4 for a greenfield browser game; reuse existing suitable architecture instead of rewriting it. Confirm package versions before installation.
- Keep the rendering/input loop **independent** of the deterministic genetics and evolutionary simulation. No physics/rendering dependencies inside scientific models.
- Record stochastic inputs with seeds, versions and model parameters for exact experiment replays.
- Provide a minimal playable vertical slice before complex genome/creature systems.
- Avoid false precision and invented data. Every asserted gene-to-trait relationship requires a source, model assumption, or an explicit speculative label.
- Preserve clear separation between: measured science, simplified simulation, arcade metaphor, and fictional/speculative evolution.
- Keep the game fun: responsive movement, readable targets, clear hit feedback, meaningful choices, and fast retry.
- Tests for the genetics core must include inheritance, pairing, variant application, deterministic replay, and population dynamics at simple known edge cases.
- Prefer accessible high-contrast HUD, colorblind-friendly shapes/text, reduced-motion support, remappable controls, and clear educational explanations.

## Scope constraints
- MVP: one species (*Drosophila melanogaster*), one curated trait set, one small ecosystem, one DNA arcade encounter, one complete genetics-to-population loop, local save/replay.
- No first-version multiplayer, whole-genome phenotype prediction, real-world biological experimentation instructions, speculative gene-engineering claims, or fully procedurally generated viable species.
- A proton weapon is an arcade metaphor for radiation-linked DNA damage, not a precision gene-editing technique.
- A chromosome is a DNA structure to select/inspect, not ammunition; player weapons are distinct molecular tools.

## Design authority
These documents express the project's current intentions, not unchangeable truth. Flag open scientific or UX issues rather than silently inventing answers. If instructions conflict, call out the conflict to the user before high-impact changes.
