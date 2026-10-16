# Trusted research and implementation references

## Scientific primary/reference resources
- **National Human Genome Research Institute (NHGRI) Genetics Glossary** — https://www.genome.gov/genetics-glossary — authoritative definitions for chromosomes, DNA, genes, mutations, heritability and mechanisms.
- **MedlinePlus Genetics, gene variant effects** — https://medlineplus.gov/genetics/understanding/mutationsanddisorders/neutralmutations/ — most variants have no observable impact on health/development; beneficial variants are uncommon. Do not translate the page into a numerical chance-per-shot.
- **Ensembl Drosophila reference** — https://www.ensembl.org/Drosophila_melanogaster/Info/Index — species reference sequence, release metadata and chromosome organization. The Ensembl interface/release may change; record the exact assembly and annotation release actually used.
- **FlyBase** — https://flybase.org/ — curated fruit fly gene, allele, variant, phenotype and genome annotation research. Check gene-to-trait examples individually.
- **FlyBase reference genome directories** — https://www.flybase.org/genomes/Drosophila_melanogaster/ — downloadable release-specific reference material; avoid mixing coordinate systems.
- **OpenStax Biology 2e** — https://openstax.org/details/books/biology-2e — background population genetics and natural selection; use as educational overview, not a primary source for detailed variant effects.
- **PhET Natural Selection** — https://phet.colorado.edu/en/simulations/natural-selection — educational UX reference for environment-driven population selection, not a model that can be copied wholesale.

## Engineering references
- **Phaser 4 release history** — https://phaser.io/download/phaser4 — Phaser 4 reached stable release in April 2026; version 4.2.1 listed July 2026.
- **Phaser 4 architecture/migration overview** — https://phaser.io/news/2026/05/phaser-3-vs-phaser-4 — the new renderer/filter architecture is relevant to neon effects and performance.
- **OpenAI Codex IDE setup** — https://developers.openai.com/codex/ide/
- **OpenAI Codex AGENTS.md** — https://developers.openai.com/codex/guides/agents-md/ — project-level Codex guidance.

## Scientific verification tasks before coding traits
1. Select an explicit *D. melanogaster* reference assembly and annotation release; freeze names/coordinates.
2. Locate one simple, cited allele/trait with a reliable phenotype effect; avoid implying a single gene always determines a complex phenotype.
3. Record sex-dependence, background and environment modifiers where relevant.
4. Build short reference sequence windows with accurate complementary strand labels.
5. Record evidence, confidence, data/license conditions and retrieval dates in content records.
6. Map scientific consequences to gameplay with an explicit simplified model; publish assumptions to players.
7. Review claims against primary/authoritative sources before labeling them "real science".

## Important warning
No universal percentages such as '70% neutral, 25% harmful, 5% helpful' have been established for this game. Those may appear in a UI concept as placeholder illustration but **must never** be presented as real biological probabilities or installed as default science constants without meaningful justification.

## Screen-design research — reviewed 2026-10-15
- **RCSB PDB-101, DNA** — https://pdb101.rcsb.org/motm/23 and https://pdb101.rcsb.org/motm/jmol/?id=23 — references for original helix/backbone and complementary-pair visuals. Game wave motion and colors are presentation choices, not molecular dynamics. No reference artwork is copied.
- **FlyBase Tools Overview** — https://wiki.flybase.org/wiki/FlyBase%3ATools_Overview — phenotype information is associated with allele records; research a specific allele before implementing animal trait changes. This does not establish a shipped gene-to-trait mapping.
- **W3C WAI, Understanding SC 2.3.3** — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions — guidance on disabling nonessential interaction-triggered motion. Reduced continuous DNA/scenery motion is an additional project design choice, not a claim of complete WCAG conformance.
- Screen proportions, station selection mechanics, palette and muck scenery are original design proposals following the user's direction, not scientific findings.

## DNA-chain image inspiration and pairing — 2026-10-15
- User supplied a Google Images search for “dna chain”; the search page could not be fetched directly. A separate image search and authoritative reference pages were reviewed instead. Search results are discovery aids, not licenses or scientific evidence.
- **NHGRI Base Pair** — https://www.genome.gov/genetics-glossary/Base-Pair — reference diagram and explanation of complementary bases forming ladder rungs. Design takeaway: each target needs two joined halves connected to opposing backbones. Ordinary complementary pairs are A–T and C–G; A–C must not be represented as a valid canonical pair.
- **RCSB PDB-101 DNA Paper Model** — https://pdb101-east.rcsb.org/learn/paper-models/dna — twisted-ladder and assembled-segment inspiration. Design takeaway: show a rung being completed, then preserve it in the growing sequence.
- **RCSB paper nucleic-acid teaching models** — https://pdb101.rcsb.org/learn/paper-models/paper-nucleic-acid-models-for-hands-on-education — modular strand/nucleotide teaching reference. The page licenses those materials CC BY 4.0 with author attribution; no source art has been copied into the game concept.
- Original art direction: two continuous luminous backbones, only four oversized paired-rung targets, black empty halves, upright letters and a shared pair projectile. Sparse spacing and back-and-forth motion are arcade usability choices, not physical DNA geometry or synthesis.
- The 2013 paper-template PDF returned HTTP 403 during direct retrieval; do not claim its artwork was inspected in detail.
