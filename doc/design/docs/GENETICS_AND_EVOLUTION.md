## Latest paired-shot interaction — 2026-10-15
Click two complementary letters (A–T or C–G) to highlight and gently flash them; click an empty chain target to lock it, then click again to fire one linked pair. Letter selection and target locking never fire. Reset selection after firing; reduced motion uses steady highlights. A–C is a mismatch, not a valid pair. The chain starts on the left and slowly travels right, with at most four paired-rung targets visible. A run has 20 four-pair segments (80 placements). Each completed segment’s ordered pattern selects a distinct fictional adaptation rule; individual hits advance pair progress. Completed segments give way to the next segment entering from the left. Creature development remains a fictional creative model. GAMEPLAY_AND_UI.md is the current interaction authority.

## Initial mode revision — 2026-10-15
The initial prototype now follows the four-launcher imaginative creation mode in GAMEPLAY_AND_UI.md. An empty moving chain is filled with A/T/C/G, and completed segment patterns develop a green blob into a fictional creature. Keep this seeded sequence-to-art creation model separate from the real genetics/population model described below. No arbitrary base-to-animal transformation is presented as measured science. The prior fruit-fly experiment remains a possible separate future experience.

# Science rules and simulation proposal

## Non-negotiable distinctions
- DNA is made of bases A, T, C, G. In a standard DNA duplex, A pairs with T; C with G.
- Genes and regulatory regions are *parts* of chromosomes, not equivalent to entire chromosomes.
- Mutation introduces variation, but mutation itself is not a conscious or goal-directed path to success.
- DNA damage is not equivalent to a fixed heritable DNA mutation. Damage can be repaired or kill a cell.
- Most new variants have little detectable effect in many contexts; biological effects depend on where, how, and in which environment a change occurs.
- A beneficial effect in one environment may be irrelevant or harmful in another.
- Evolution is change in heritable characteristics/allele frequencies across generations in a population. Individuals develop and respond to environments but do not evolve as a species within one lifetime.
- In diploid organisms, two homologous chromosome copies and inheritance of alleles matter. Model meiosis/recombination only to the level scientifically justified by MVP.
- Somatic mutations differ from germline/heritable mutations; don't let shots to arbitrary somatic cells automatically pass to future generations.
- Complex traits are commonly influenced by multiple loci and environmental factors. A single arbitrary base substitution does not grant a guaranteed complex ability.
- Selection is not the only evolutionary force: include drift, mutation, migration/gene flow (later), and recombination.
- Speciation takes isolation/divergence plus reproductive isolation evidence in the model; lineage branching visualization alone is not speciation.

## Reference organism
*Drosophila melanogaster* (fruit fly); four chromosome pairs in the typical diploid complement (three autosome pairs plus a sex chromosome pair). The small fourth chromosome should not be ignored. Sex chromosomes and recombination rules require explicit treatment in later simulation detail. Use current FlyBase/Ensembl release identifiers and reference assembly identifiers consistently; do not silently mix coordinates from releases.

## Three levels of data
### 1. Reference genome (real)
Use a frozen, verifiable species reference with chromosome name, coordinate space, and assembly/release. In MVP, ingest only small curated sequence windows; do not ship a downloaded whole genome by default.
### 2. Curated genetics content (scientifically annotated)
Each teaching trait entry needs: organism/taxon, locus or region, gene and source identifiers, allele/variant, molecular mechanism (where known), environmental context, relevant phenotype, evidence URL, assessment date, confidence, and known limitations. Examples to investigate: pigmentation (white/other eye-color loci) and documented wing-development mutations. Validate before using in a shipped simulation.
### 3. Simplified simulation model (explicit assumptions)
Mapping from a tiny set of states/alleles into probability distributions for traits, inheritance, viability, reproduction, and environment-specific fitness. Every probability and parameter must be labeled an illustrative model assumption unless sourced quantitatively.

## Minimal simulation data concepts
- **GenomeReference**: species ID, assembly, chromosome IDs, loci, reference sequence windows, source metadata.
- **Variant**: locus, ancestral and changed sequence, mutation class, molecular consequences, origin, hereditary status, timestamp/generation.
- **Genotype**: diploid alleles at modeled loci, with parent-of-origin where relevant.
- **Organism**: genotype, traits, sex/reproduction state, age, generation, survival, ancestry IDs.
- **TraitModel**: input loci, dominance/epistasis/polygenic assumptions, environmental modifiers, phenotype probabilities, evidence.
- **Environment**: ecological conditions, resource availability, predator intensity and fitness weights.
- **Population**: cohort/individuals, allele frequency distribution, population size and lineage metadata.
- **Experiment**: deterministic PRNG seed, engine/science-data versions, initial conditions, player event log, sampled outcomes, saved snapshots.

## Mutation model
1. Identify targeted DNA window and hit mechanism.
2. If radiation-like: sample type/severity of DNA damage under **declared design assumptions**. Model whether repair restores, misrepairs, or leaves a relevant variant; optionally terminate an unviable attempt.
3. If editing-like: target a base or restricted region and determine success/outcome under a documented fictional game rule.
4. For fixed changes, record substitution, insertion, deletion, repeat/copy number, or regulatory change only where implemented and scientifically coherent.
5. Look up curated variant consequences. For an unannotated variant, show "effect unknown" (or a neutral illustrative abstraction), *never invent a precise creature change*.
6. Separate unviable/lethal changes, no observable effect, environment-dependent fitness effect, and model uncertainty.
7. Pass heritable variants into a diploid genotype pool only via a defined germline/inheritance abstraction.

## Reproduction and natural selection
- Begin with small diploid populations, distinct parent pairs/gametes or a transparently simplified sampling rule.
- At each generation, account for survival and differential reproductive success; allele frequency shifts probabilistically.
- Genetic drift can eliminate even favorable variants when populations are small.
- Provide configurable environment parameters and reproducible seed.
- Keep population cap and ecological carrying capacity to prevent runaway performance.
- Show charts for size, allele counts/frequencies, fitness distribution, and trait prevalence.
- Avoid conflating genetic diversity with universal evolutionary progress.

## Calibration/testing
- Fixed random seed + same inputs => identical state and replay.
- In no-mutation, no-selection and no-migration setting, allele frequencies vary by drift in finite populations and should not be artificially forced toward a chosen trait.
- Neutral alleles can be lost or fixed due to chance; advantageous alleles need not always win.
- With survival set to zero for all individuals, extinction must be possible.
- Inheritance checks for modeled diploid cross probabilities, sex-related traits, and gamete validity.
- Distinguish chromosome physical imagery and computational sequence windows.
- Define limits of biological inference clearly in game UI.

## What is NOT being claimed
A molecular shooter is not an accurate cell-scale radiation apparatus, nor a method for performing real genetic edits. A gene-to-appearance prediction engine for arbitrary animal genomes cannot be supplied simply by sequence lookup. Fictional scenarios must be identified as speculative.
