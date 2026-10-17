# DNA research and gameplay design

Research reviewed 16 October 2026. Mutagon teaches complementary pairing through an imaginary creature-building game. Its anatomy rules are invented and are not a genetic prediction model.

## What the science supports

- DNA is made of two strands with sugar–phosphate backbones. Complementary bases pair across them: A with T and C with G. Base sequence carries information, and each strand can provide a template during copying. [NHGRI DNA fact sheet](https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet).
- A–T pairs form two hydrogen bonds and C–G pairs form three. The game shows these bond counts without giving one pair a higher score. This is a simplified symbol, not an atomic drawing or a calculation of DNA stability. [RCSB PDB structural illustration](https://pdb101.rcsb.org/sci-art/geis-archive/gallery/geis-0542-b-dna).
- Gene regulation controls the timing, location, and amount of gene expression. This inspired separating tissue, sensing, body-plan, and specialization stages in the game. Those stages and their thresholds are design choices. [NHGRI gene regulation](https://www.genome.gov/genetics-glossary/Gene-Regulation).
- Development involves cell proliferation, specialization, interactions, and movement. It builds coordinated tissues and organs rather than adding unrelated finished animal parts at each DNA change. This inspired fewer overlapping structures, gradual growth, and compatible trait groups. [Molecular Biology of the Cell, developmental overview](https://www.ncbi.nlm.nih.gov/books/NBK21046/).
- Many traits involve multiple genes, often with environmental influences. An isolated AT or GC pair does not specify an eye, wing, or habitat. [NHGRI polygenic traits](https://www.genome.gov/genetics-glossary/Polygenic-Trait).

## Implemented design

New runs use mutation rules version 4. The saved seed establishes a Tidepool, Woodland, or Canopy body plan and a related pigment palette. The first four placements affect tissue markings; sensory traits follow, then compatible locomotor and specialized structures. Pair order and placement still influence the deterministic choices within each stage. The fifth placement establishes eyes and the ninth establishes the plan's main locomotor structure. Growth continues over the whole run, instead of reaching its full scale near the beginning.

Repeated traits update the visible structure of that type. Every growth step remains in the history and export. Older saves retain their original mutation catalogs. The creature renderer uses softer body shading, a membrane rim, smaller eyes, and fewer overlapping appendages to keep the specimen legible.

Ready-made AT, TA, CG, and GC tiles expose the direct drag interaction. Clicking a tile prepares the holders; dragging it prepares and aims the pair in one gesture. The flip control reverses holder order. Manual construction remains available for learning the complement rule. Invalid drops preserve the selection, and occupied chains reject replacement. All paths use the same scoring, flight, deadline, and save rules.

## Explicit game simplifications

- A quadra-chrome is a four-pair game unit. It is not a real chromosome, gene, or codon.
- UP and DOWN are screen positions. They do not represent the chemical 5′ and 3′ directions of DNA strands.
- Correctly adding a complementary pair is called a mutation in the existing game interface, but biological mutation means a change in DNA sequence; ordinary complementary DNA synthesis is not inherently a mutation.
- Instant creature growth, the three body plans, their trait pools, and fixed growth thresholds are fictional. They do not imply that development repeats an evolutionary ladder or that real species have interchangeable parts.
- The countdown, score, and victory condition are game mechanics. Real DNA copying and development do not follow these rules.

## Verification

Model coverage checks staged trait availability, coherent locomotor traits, limited pigment variation, deterministic replay, one expressed structure per trait, and versions 1–3 save compatibility. Browser coverage checks pair tiles, flipping, direct dragging, existing holder and touch interactions, full completion, and visibility of completed specimens restored while paused.
