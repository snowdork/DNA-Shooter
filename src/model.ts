/** Pure creation rules. No renderer, browser globals or biological phenotype claims. */
export const BASES = ['A', 'T', 'C', 'G'] as const;
export type Base = typeof BASES[number];
export type Pair = `${Base}${Base}`;
export const PAIRS = ['AT', 'TA', 'CG', 'GC'] as const;
export const TOTAL_SEGMENTS = 20;
export const SLOTS = 4;
export const MODEL_VERSION = 1;
export const COMPLEMENT: Record<Base, Base> = { A: 'T', T: 'A', C: 'G', G: 'C' };
export interface Placement { segment: number; slot: number; pair: Pair }
export interface Adaptation { id: number; name: string; pattern: Pair[] }
export interface Save { version: number; seed: number; placements: Placement[] }

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

export class Creation {
  readonly seed: number;
  placements: Placement[] = [];
  segments: (Pair | null)[][] = Array.from({ length: TOTAL_SEGMENTS }, () => Array(SLOTS).fill(null));
  adaptations: Adaptation[] = [];
  constructor(seed = 314159) { this.seed = seed >>> 0; }
  get completed(): number { return this.adaptations.length; }
  get done(): boolean { return this.completed === TOTAL_SEGMENTS; }
  get active(): number { return Math.min(this.completed, TOTAL_SEGMENTS - 1); }
  get filled(): number { return this.segments[this.active].filter(Boolean).length; }
  get score(): number { return this.placements.length * 100 + this.completed * 400; }
  place(slot: number, pair: Pair): boolean {
    if (this.done || !Number.isInteger(slot) || slot < 0 || slot >= SLOTS || !isPair(pair) || this.segments[this.active][slot]) return false;
    const segment = this.active;
    this.segments[segment][slot] = pair;
    this.placements.push({ segment, slot, pair });
    if (this.segments[segment].every(Boolean)) this.adaptations.push(adaptation(this.segments[segment] as Pair[]));
    return true;
  }
  save(): Save { return { version: MODEL_VERSION, seed: this.seed, placements: this.placements.map(p => ({ ...p })) }; }
  static restore(input: unknown): Creation {
    if (!input || typeof input !== 'object') throw new Error('Invalid creation file.');
    const s = input as Save;
    if (s.version !== MODEL_VERSION || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff || !Array.isArray(s.placements) || s.placements.length > 80) throw new Error('Unsupported creation file.');
    const creation = new Creation(s.seed);
    for (const p of s.placements) {
      if (!p || p.segment !== creation.active || !creation.place(p.slot, p.pair)) throw new Error('Invalid placement history.');
    }
    return creation;
  }
}

export type Interaction = 'first' | 'complement' | 'pair' | 'locked' | 'flight';
export class Controls {
  selected: Base[] = [];
  target: number | null = null;
  queued = false;
  flight: { slot: number; pair: Pair } | null = null;
  get pair(): Pair | null { return this.selected.length === 2 ? this.selected.join('') as Pair : null; }
  get state(): Interaction { return this.flight ? 'flight' : this.target !== null ? 'locked' : this.pair ? 'pair' : this.selected.length ? 'complement' : 'first'; }
  choose(base: Base): string {
    if (this.flight) return 'Pair in flight…';
    this.target = null; this.queued = false;
    if (this.selected.length !== 1) this.selected = [base];
    else if (this.selected[0] === base) this.selected = [];
    else if (COMPLEMENT[this.selected[0]] === base) this.selected.push(base);
    else return `${this.selected[0]} pairs with ${COMPLEMENT[this.selected[0]]}. Try its complement.`;
    return this.pair ? 'Pair ready. Click an empty rung to lock it.' : this.selected.length ? `Now choose ${COMPLEMENT[base]} to complete the pair.` : 'Choose your first letter.';
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
    this.selected = []; this.target = null; this.queued = false;
    return true;
  }
  cancel(): void { this.selected = []; this.target = null; this.queued = false; this.flight = null; }
  cancelLock(): void { this.target = null; this.queued = false; }
}
