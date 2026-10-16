# Paste the following into your first Codex chat

We are starting **DNA Evolution / DNA Shooter** in the current Git repository under `$HOME/dev/DNA-shooter`. This workspace contains planning docs created from an earlier game-design and biology-research discussion.

**Do not write code yet. Do not install dependencies, change files, run migrations, commit, or push. This first session is a read-only repository review and detailed implementation plan.**

1. Confirm the working directory, Git status/current branch and remote configuration. Do not switch branches automatically; I intend to base development on `main` but may have other branches already.
2. Read `AGENTS.md`, `START_HERE.md`, and all files in `docs/`.
3. Inspect existing repository files, package manifests, tools and frameworks. Do not assume this repo is empty.
4. Evaluate TypeScript + Phaser **4** (not Phaser 3), using the current project structure if compatible. Separate the graphics layer from the pure deterministic genetics/population simulator. Identify any version or build risks.
5. Produce: (a) architecture proposal; (b) proposed source folder tree; (c) scene/state diagram; (d) planned data entities, events, and reproducibility fields; (e) MVP scientific simplifications/verification requirements; (f) a six-milestone backlog; (g) precise acceptance criteria for milestone 1; (h) risks and questions where facts are missing.
6. Explain how the arcade DNA shots resolve into damage, repair, possible heritable variants, trait effects, and changes in a small population. Keep the simulation conceptually accurate without claiming we can predict whole-organism phenotypes from arbitrary base changes.
7. Define an extremely small first playable vertical slice: moving player craft, scrolling/rotating stylized DNA, visible A/T/C/G targets, shooting, collisions, feedback, and an event log. Demonstrate fun and responsiveness before a full genetics engine.
8. Suggest the exact first implementation task to ask you next, with tests and manual verification steps.

**Output a concise but concrete plan. Ask for implementation approval at the end.**
