# DNA Shooter — Complete Codex Handoff Archive

This archive contains the design and planning artifacts from the initial DNA Evolution / DNA Shooter concept discussion, prepared for use with VS Code + Codex.

**Local Git workspace on your computer:** `$HOME/dev/DNA-shooter`  
**Suggested archive location on your computer:** `$HOME/DNA-shooter-handoff.zip`  
**Archive contents:** Markdown project instructions, the first Codex prompt, and science, gameplay, product, and technical planning documents. No gameplay source code, assets, secrets, or dependencies are included.

## Installation on your Linux computer

1. Download `DNA-shooter-handoff.zip` into your browser's download folder.
2. In a terminal, put a copy in your home folder:

   ```bash
   cp "$HOME/Downloads/DNA-shooter-handoff.zip" "$HOME/DNA-shooter-handoff.zip"
   ```

3. Verify the target is your existing Git clone:

   ```bash
   cd "$HOME/dev/DNA-shooter"
   git status -sb
   git remote -v
   ```

4. Inspect the archive, then extract **without overwriting existing files**:

   ```bash
   unzip -l "$HOME/DNA-shooter-handoff.zip"
   unzip -n "$HOME/DNA-shooter-handoff.zip" -d "$HOME/dev/DNA-shooter"
   ```

5. Open VS Code and review changes before committing:

   ```bash
   code "$HOME/dev/DNA-shooter"
   git status --short
   ```

6. Start Codex inside that workspace; ask it to read `AGENTS.md`, `START_HERE.md`, and `CODEX_FIRST_PROMPT.md`. Paste the contents of `CODEX_FIRST_PROMPT.md` into your first Codex chat. That session is **planning only**, not coding.

**Important:** If an `AGENTS.md` or any other file already exists, `unzip -n` will leave it untouched. Review and merge content manually as needed. If your browser saves files to a directory other than `~/Downloads`, adjust the copy path.

## Inventory

- `AGENTS.md` — Codex's standing project guidance.
- `START_HERE.md` — concept, gameplay loop, initial workflow, and document map.
- `CODEX_FIRST_PROMPT.md` — prompt for the first Codex planning session.
- `HANDOFF_README.md` — this transfer and installation guide.
- `docs/PRODUCT_VISION.md` — high-level product goals, audience, and experience.
- `docs/GAMEPLAY_AND_UI.md` — main gameplay, weapon system, and UI layout.
- `docs/GENETICS_AND_EVOLUTION.md` — scientific rules, model limitations, and evolution mechanics.
- `docs/TECHNICAL_ARCHITECTURE.md` — boundaries between game engine, simulation, data, and persistence.
- `docs/ROADMAP.md` — phased delivery plan and acceptance criteria.
- `docs/EXPERIMENT_PLAYTHROUGH.md` — sample end-to-end experiment.
- `docs/SCIENTIFIC_SOURCES.md` — references for source-backed mechanics.
- `docs/DECISIONS_AND_OPEN_QUESTIONS.md` — assumptions, decisions and unresolved design questions.

## Scientific integrity note

DNA damage is distinct from a heritable variant; heritable variants don't guarantee phenotype changes; populations evolve across generations. Project requirements intentionally distinguish biological fact, simulation simplification, arcade metaphor, and speculative evolution.
