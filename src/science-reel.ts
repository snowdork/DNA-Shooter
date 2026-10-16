const dna = 'https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet';
const chromosomes = 'https://www.genome.gov/genetics-glossary/Chromosome';
const glossary = 'https://www.genome.gov/genetics-glossary/';
const mutation = 'https://www.genome.gov/genetics-glossary/Mutation';

// Short, independently readable facts; the game-specific note distinguishes fiction from biology.
const facts = [
  ['PAIR POWER', 'A is adenine and T is thymine: they pair across the two DNA strands.', dna, '#ffd47b', 'Trebuchet MS, sans-serif'],
  ['PERFECT PARTNERS', 'C is cytosine and G is guanine: they form the other DNA base pair.', dna, '#87e9ff', 'Georgia, serif'],
  ['BILLIONS OF LETTERS', 'One human chromosome set carries roughly 3 billion DNA base pairs.', `${glossary}Base-Pair`, '#f5c98a', 'Helvetica, sans-serif'],
  ['TWISTED LADDER', 'DNA has two winding strands that form a shape called a double helix.', dna, '#e6a7ff', 'Verdana, sans-serif'],
  ['A LONG LITTLE MOLECULE', 'Uncoiled DNA from a typical human body cell would stretch about 2 meters.', chromosomes, '#a5e8c3', 'Book Antiqua, serif'],
  ['SWEET SCIENCE', 'Alternating sugar and phosphate groups form the sides of the DNA ladder.', dna, '#a7f3a0', 'Courier New, monospace'],
  ['GENE COUNT', 'Humans have approximately 20,000 genes that code for proteins.', `${glossary}Gene`, '#a4d5ff', 'Lucida Console, monospace'],
  ['ORDER MATTERS', 'The sequence of bases along a DNA strand carries biological instructions.', dna, '#ffaaa0', 'Tahoma, sans-serif'],
  ['PAIR PUZZLE', 'The partner bases opposite A-C-G-T are T-G-C-A in matching positions.', dna, '#e9d09c', 'Geneva, sans-serif'],
  ['COPY THAT', 'During DNA copying, each original strand is a template for a new complementary strand.', dna, '#bfcaff', 'Palatino Linotype, Palatino, serif'],
  ['46 IN PAIRS', 'Most human body cells with a nucleus have 46 chromosomes, arranged in 23 pairs.', `${glossary}Diploid`, '#d8b5ff', 'Didot, serif'],
  ['TINY INSTRUCTIONS', 'Many genes carry instructions for making proteins that help cells do their jobs.', dna, '#ffe69b', 'Arial, sans-serif'],
  ['SMALL CODING SHARE', 'Only about 1.5% of the human genome directly codes for proteins.', `${glossary}Gene`, '#ffc3a1', 'Monaco, monospace'],
  ['MESSAGE RECEIVED', 'Cells can copy DNA instructions into messenger RNA before building a protein.', dna, '#7ef0d9', 'Times New Roman, serif'],
  ['RNA HAS A U', 'RNA uses uracil, written U, where DNA uses thymine, written T.', `${glossary}Uracil`, '#f6bde4', 'Optima, sans-serif'],
  ['THREE AT A TIME', 'A codon is a three-base unit that specifies an amino acid or a stop signal.', `${glossary}Codon`, '#b0eddf', 'Baskerville, serif'],
  ['64 POSSIBILITIES', 'The standard genetic code has 64 codons: 61 specify amino acids and 3 signal stop.', `${glossary}Codon`, '#ffe0a8', 'Ubuntu, sans-serif'],
  ['PACKING GENIUS', 'Chromosomes package long DNA molecules with proteins so they fit inside cells.', chromosomes, '#f4b1d8', 'Lucida Sans Unicode, sans-serif'],
  ['TINY SPOOLS', 'DNA wraps around histone proteins, helping organize and compact chromosomes.', `${glossary}histone`, '#9fe8b9', 'Candara, sans-serif'],
  ['COUNT ON IT', 'Fruit flies have four pairs of chromosomes, while dogs have thirty-nine pairs.', chromosomes, '#cbeea0', 'Cambria, serif'],
  ['STRAWBERRY SURPRISE', 'Common cultivated strawberries have eight chromosome sets, totaling 56 chromosomes.', `${glossary}Diploid`, '#ffc0cf', 'Franklin Gothic Medium, sans-serif'],
  ['POWERHOUSE DNA', 'Mitochondria contain their own small, circular DNA genome.', `${glossary}Mitochondrial-DNA`, '#c5c9ff', 'Century Schoolbook, serif'],
  ['SMALL BUT MIGHTY', 'The human mitochondrial genome contains 37 genes.', 'https://www.genome.gov/27558842/researchers-examine-diseasecausing-mutations-in-mitochondrial-genomes', '#e6e59e', 'Arial Narrow, sans-serif'],
  ['HALF A SET', 'Human eggs and sperm normally carry 23 chromosomes each, rather than 23 pairs.', `${glossary}Meiosis`, '#99e4ff', 'Noto Serif, serif'],
  ['DIVIDE AND SHARE', 'Meiosis reduces chromosome sets, producing cells used in sexual reproduction.', `${glossary}Meiosis`, '#dcbbeb', 'Noto Sans, sans-serif'],
  ['GENETIC SHUFFLE', 'Crossing over exchanges DNA between matching chromosomes during meiosis, creating new allele combinations.', `${glossary}Crossing-Over`, '#bedda4', 'DejaVu Sans Mono, monospace'],
  ['VERSIONS OF A GENE', 'Different versions of a gene are called alleles.', `${glossary}Allele`, '#f5d6bb', 'DejaVu Serif, serif'],
  ['MORE THAN GENES', 'Observable traits are called a phenotype and can be influenced by genes and the environment.', `${glossary}Phenotype`, '#e0c2ff', 'Segoe UI, sans-serif'],
  ['MANY GENES TOGETHER', 'Polygenic traits, such as human height, are influenced by multiple genes.', `${glossary}Polygenic-Trait`, '#c9e8ff', 'DejaVu Sans, sans-serif'],
  ['ON AND OFF', 'Epigenetic marks can change gene activity without changing the DNA letter sequence.', `${glossary}Epigenetics`, '#f1bc9d', 'Liberation Serif, serif'],
  ['SMALL CHANGE', 'A mutation is a change in a DNA sequence, sometimes caused by a copying error.', mutation, '#ffbc7f', 'Consolas, monospace'],
  ['LETTER SWAP', 'A substitution replaces one DNA nucleotide with another.', `${glossary}Substitution`, '#bce8ce', 'Liberation Mono, monospace'],
  ['EXTRA LETTERS', 'An insertion adds one or more nucleotides to a DNA sequence.', `${glossary}Insertion`, '#d6c3fa', 'Liberation Sans, sans-serif'],
  ['MISSING LETTERS', 'A deletion removes one or more nucleotides from a DNA sequence.', `${glossary}Deletion`, '#f4dfad', 'Constantia, serif'],
  ['REPAIR CREW', 'Cells have molecular repair machinery that can fix many changes to their DNA.', mutation, '#9cceff', 'Garamond, serif'],
  ['WHAT GETS INHERITED', 'Mutations in eggs or sperm can reach offspring; changes confined to body cells are not inherited that way.', mutation, '#a6f2e4', 'Corbel, sans-serif'],
  ['READING DNA', 'DNA sequencing reveals the order of bases in a DNA molecule.', 'https://www.genome.gov/about-genomics/fact-sheets/DNA-Sequencing-Fact-Sheet', '#efc6f3', 'Rockwell, serif'],
  ['LAB COPIER', 'PCR can make millions to billions of copies of a chosen DNA segment for study.', `${glossary}Polymerase-Chain-Reaction-PCR`, '#d2eaaa', 'Bahnschrift, sans-serif'],
  ['A GLOBAL PROJECT', 'The international Human Genome Project ran from 1990 to 2003.', 'https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genome-project', '#b6ddf5', 'Charter, serif'],
  ['SCIENCE + IMAGINATION', 'Mutagon grows instant tusks and tentacles for fun; real DNA changes do not instantly create new animal parts.', mutation, '#b8ffd0', 'system-ui, sans-serif'],
] as const;

function factItems(): string {
  return facts.map(([label, sentence, source, color, font]) => `<a class="science-fact" href="${source}" target="_blank" rel="noopener noreferrer" style="--fact-color:${color};--fact-font:${font}" title="Read the science at NHGRI"><span class="fact-label">${label}</span>${sentence}</a>`).join('');
}

export function scienceReelMarkup(): string {
  const items = factItems();
  return `<section class="science-reel" aria-label="DNA and genetics fun facts" data-paused="false" data-reduced="false"><span class="reel-label"><span aria-hidden="true">✦</span> DNA DISPATCH</span><div class="reel-window" tabindex="0" role="region" aria-label="Scrolling science facts; hover or focus to pause, or follow a fact to its source"><div class="reel-track"><div class="reel-group">${items}</div><div class="reel-group reel-copy" aria-hidden="true" inert>${items}</div></div></div><button class="reel-toggle" aria-pressed="false" aria-label="Pause science reel">Pause reel</button></section>`;
}

export function mountScienceReel(element: HTMLElement): { setReduced: (value: boolean) => void } {
  const group = element.querySelector<HTMLElement>('.reel-group')!;
  const toggle = element.querySelector<HTMLButtonElement>('.reel-toggle')!;
  const window = element.querySelector<HTMLElement>('.reel-window')!;
  // Constant reading speed across screen sizes and font substitutions; two identical groups loop seamlessly.
  const measure = () => element.style.setProperty('--reel-duration', `${group.getBoundingClientRect().width / 32}s`);
  new ResizeObserver(measure).observe(group);
  document.fonts.ready.then(measure);
  toggle.onclick = () => {
    const paused = element.dataset.paused !== 'true';
    element.dataset.paused = String(paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} science reel`);
    toggle.textContent = paused ? 'Resume reel' : 'Pause reel';
  };
  return {
    setReduced(value) {
      element.dataset.reduced = String(value);
      toggle.hidden = value;
      window.setAttribute('aria-label', value ? 'Science facts; scroll sideways to read, or follow a fact to its source' : 'Scrolling science facts; hover or focus to pause, or follow a fact to its source');
      window.scrollLeft = 0;
    },
  };
}
