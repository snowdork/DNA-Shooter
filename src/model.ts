/** Pure creation rules. No renderer, browser globals or biological phenotype claims. */
export const BASES = ['A', 'T', 'C', 'G'] as const;
export type Base = typeof BASES[number];
export type Pair = `${Base}${Base}`;
export const PAIRS = ['AT', 'TA', 'CG', 'GC'] as const;
/** Adjustable quadra-chrome goal; also controls the DNA pattern HUD's entry count. */
export const TOTAL_SEGMENTS = 10;
export const SLOTS = 4;
export const MODEL_VERSION = 1;
export const COMPLEMENT: Record<Base, Base> = { A: 'T', T: 'A', C: 'G', G: 'C' };
/** Every chain in a quadra-chrome must be paired before it reaches the exit. */
export function missedChain(pattern: readonly (Pair | null)[], chainY: readonly number[], exitY: number): number | null {
  const slot = pattern.findIndex((pair, index) => !pair && chainY[index] >= exitY);
  return slot < 0 ? null : slot;
}
export interface Placement { segment: number; slot: number; pair: Pair }
export interface Adaptation { id: number; name: string; pattern: Pair[] }
type MutationVersion = 1 | 2 | 3;
export interface Save { version: number; seed: number; mutationVersion?: MutationVersion; placements: Placement[] }

export function isPair(value: unknown): value is Pair {
  return typeof value === 'string' && PAIRS.includes(value as typeof PAIRS[number]);
}
export function patternId(pattern: readonly Pair[]): number {
  if (pattern.length !== SLOTS || !pattern.every(isPair)) throw new Error('Four complementary pairs required.');
  return pattern.reduce((id, pair) => id * 4 + PAIRS.indexOf(pair as typeof PAIRS[number]), 0);
}
const FORMS = ['Crest', 'Frill', 'Tendrils', 'Fins', 'Spots', 'Antennae', 'Scales', 'Petals'];
const QUALITIES = ['Luminous', 'Prismatic', 'Velvet', 'Coral', 'Spiral', 'Opal', 'Ripple', 'Starlit'];
export function adaptation(pattern: Pair[]): Adaptation {
  const id = patternId(pattern);
  return { id, pattern: [...pattern], name: `${QUALITIES[(id >> 3) % 8]} ${FORMS[id % 8]} · ${id.toString(16).toUpperCase().padStart(2, '0')}` };
}

export const TRAITS = ['eyes', 'legs', 'bands', 'tail', 'antennae', 'tongue', 'gills', 'wings', 'horns', 'tentacles', 'scales', 'spots', 'sparks', 'tusks', 'snozzle', 'paws', 'ears', 'whiskers', 'fins', 'beak', 'claws', 'plumes'] as const;
export type Trait = typeof TRAITS[number];
export interface Mutation { id: number; kind: Trait; color: string; name: string; variant: number; pair: Pair; segment: number; slot: number }
const PIGMENTS = [
  { name: 'Emerald', color: '#78ff76' }, { name: 'Cobalt', color: '#64a8ff' },
  { name: 'Rose', color: '#ff7ec4' }, { name: 'Amber', color: '#ffc75f' },
  { name: 'Violet', color: '#c098ff' }, { name: 'Turquoise', color: '#6fffe2' },
];
/** Mix independent draws from the saved seed and hit history, so reloads keep every mutation. */
function randomWord(value: number): number {
  value = Math.imul(value ^ value >>> 16, 0x21f0aaad);
  value = Math.imul(value ^ value >>> 15, 0x735a2d97);
  return (value ^ value >>> 15) >>> 0;
}
function mutation(index: number, placement: Placement, seed: number, mutationVersion: MutationVersion): Mutation {
  const orientation = PAIRS.indexOf(placement.pair as typeof PAIRS[number]);
  let kindIndex: number, pigmentIndex: number, variant: number;
  if (mutationVersion === 3) {
    const draw = randomWord(seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(placement.slot + 1, 0x85ebca6b) ^ Math.imul(orientation + 1, 0xc2b2ae35));
    kindIndex = draw % TRAITS.length;
    pigmentIndex = randomWord(draw ^ 0xa511e9b3) % PIGMENTS.length;
    variant = randomWord(draw ^ 0x63d83595);
  } else {
    const traitCount = mutationVersion === 1 ? 12 : TRAITS.length;
    kindIndex = (index + orientation * 3) % traitCount;
    pigmentIndex = (kindIndex + Math.floor(index / traitCount) + orientation) % PIGMENTS.length;
    variant = (seed + index * 17 + placement.slot * 7 + orientation * 11) >>> 0;
  }
  const kind = TRAITS[kindIndex];
  const pigment = PIGMENTS[pigmentIndex];
  return { id: index + 1, kind, color: pigment.color, name: `${pigment.name} ${kind} · ${String(index + 1).padStart(3, '0')}`, variant, pair: placement.pair, segment: placement.segment, slot: placement.slot };
}

export class Creation {
  readonly seed: number;
  readonly mutationVersion: MutationVersion;
  placements: Placement[] = [];
  segments: (Pair | null)[][] = Array.from({ length: TOTAL_SEGMENTS }, () => Array(SLOTS).fill(null));
  adaptations: Adaptation[] = [];
  mutations: Mutation[] = [];
  constructor(seed = Math.floor(Math.random() * 0x100000000), mutationVersion: MutationVersion = 3) {
    this.seed = seed >>> 0;
    this.mutationVersion = mutationVersion;
  }
  get completed(): number { return this.adaptations.length; }
  get done(): boolean { return this.completed === TOTAL_SEGMENTS; }
  get active(): number { return Math.min(this.completed, TOTAL_SEGMENTS - 1); }
  get filled(): number { return this.segments[this.active].filter(Boolean).length; }
  get linked(): boolean { return this.filled > 0; }
  get score(): number { return this.placements.length * 100 + this.completed * 400; }
  place(slot: number, pair: Pair): boolean {
    if (this.done || !Number.isInteger(slot) || slot < 0 || slot >= SLOTS || !isPair(pair) || this.segments[this.active][slot]) return false;
    const segment = this.active;
    this.segments[segment][slot] = pair;
    const placement = { segment, slot, pair };
    this.mutations.push(mutation(this.placements.length, placement, this.seed, this.mutationVersion));
    this.placements.push(placement);
    if (this.segments[segment].every(Boolean)) this.adaptations.push(adaptation(this.segments[segment] as Pair[]));
    return true;
  }
  save(): Save { return { version: MODEL_VERSION, seed: this.seed, mutationVersion: this.mutationVersion, placements: this.placements.map(p => ({ ...p })) }; }
  static restore(input: unknown): Creation {
    if (!input || typeof input !== 'object') throw new Error('Invalid creation file.');
    const s = input as Save;
    if (s.version !== MODEL_VERSION || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff || !Array.isArray(s.placements) || s.placements.length > TOTAL_SEGMENTS * SLOTS) throw new Error('Unsupported creation file.');
    if (s.mutationVersion !== undefined && ![1, 2, 3].includes(s.mutationVersion)) throw new Error('Unsupported mutation catalog.');
    const creation = new Creation(s.seed, s.mutationVersion ?? 1);
    for (const p of s.placements) {
      if (!p || p.segment !== creation.active || !creation.place(p.slot, p.pair)) throw new Error('Invalid placement history.');
    }
    return creation;
  }
}

export type Interaction = 'first' | 'complement' | 'pair' | 'locked' | 'flight';
export class Controls {
  slots: [Base | null, Base | null] = [null, null];
  get selected(): Base[] { return this.slots.filter((base): base is Base => base !== null); }
  target: number | null = null;
  queued = false;
  flight: { slot: number; pair: Pair } | null = null;
  get pair(): Pair | null { return this.slots.every(Boolean) ? this.slots.join('') as Pair : null; }
  get state(): Interaction { return this.flight ? 'flight' : this.target !== null ? 'locked' : this.pair ? 'pair' : this.selected.length ? 'complement' : 'first'; }
  choose(base: Base): string {
    if (this.flight) return 'Pair in flight…';
    this.target = null; this.queued = false;
    const selected = this.selected;
    if (selected.length !== 1) this.slots = [base, null];
    else if (selected[0] === base) this.slots = [null, null];
    else if (COMPLEMENT[selected[0]] === base) this.slots[this.slots[0] ? 1 : 0] = base;
    else return `${selected[0]} pairs with ${COMPLEMENT[selected[0]]}. Try its complement.`;
    return this.pair ? 'Pair ready. Click an empty quadra-chrome chain to fire.' : this.selected.length ? `Now choose ${COMPLEMENT[base]} to complete the pair.` : 'Choose your first letter.';
  }
  setBase(base: Base, position: 0 | 1): string {
    if (this.flight) return 'Pair in flight…';
    const other = this.slots[1 - position];
    if (other && COMPLEMENT[other] !== base) return `${other} pairs with ${COMPLEMENT[other]}. Try its complement.`;
    this.target = null; this.queued = false;
    this.slots[position] = base;
    return this.pair ? 'Pair ready. Click an empty quadra-chrome chain to fire.' : `Now fill ${this.slots[0] ? 'DOWN' : 'UP'} with ${COMPLEMENT[base]}.`;
  }
  deselect(base: Base): boolean {
    if (this.flight) return false;
    const position = this.slots.indexOf(base);
    if (position < 0) return false;
    this.slots[position] = null; this.target = null; this.queued = false;
    return true;
  }
  click(slot: number | null, empty: (slot: number) => boolean): 'none' | 'locked' | 'queued' {
    if (!this.pair || this.flight || this.queued) return 'none';
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS || !empty(slot))) return 'none';
    if (slot !== null && slot !== this.target) { this.target = slot; this.queued = false; return 'locked'; }
    if (this.target !== null) { this.queued = true; return 'queued'; }
    return 'none';
  }
  launch(aligned: boolean): boolean {
    if (!this.queued || !aligned || this.target === null || !this.pair || this.flight) return false;
    this.flight = { slot: this.target, pair: this.pair };
    this.slots = [null, null]; this.target = null; this.queued = false;
    return true;
  }
  cancel(): void { this.slots = [null, null]; this.target = null; this.queued = false; this.flight = null; }
  cancelLock(): void { this.target = null; this.queued = false; }
}
