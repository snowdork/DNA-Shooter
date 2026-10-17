import type { Mutation, Trait } from './model';

export interface MotionProfile {
  count: number;
  signature: number;
  latest?: Mutation;
  traits: ReadonlySet<Trait>;
}

interface Anatomy {
  appendages: readonly Mutation[];
  surface: readonly Mutation[];
  eyes: readonly Mutation[];
  tongues: readonly Mutation[];
  face: readonly Mutation[];
}

interface CreatureState extends Anatomy {
  current: Anatomy;
  expressed: ReadonlySet<Mutation>;
  motion: MotionProfile;
  previousMotion: MotionProfile;
  lanes: ReadonlyMap<Mutation, number>;
}

const cache = new WeakMap<readonly Mutation[], CreatureState>();
const SURFACE = new Set<Trait>(['bands', 'scales', 'spots']);
const FACE = new Set<Trait>(['tusks', 'snozzle', 'whiskers', 'beak', 'nose', 'heart', 'lightSacs']);

/** Histories grow only on hits. Build their drawing/motion data once, then reuse it each frame. */
export function creatureState(mutations: readonly Mutation[]): CreatureState {
  const cached = cache.get(mutations);
  if (cached?.motion.count === mutations.length && cached.motion.latest === mutations.at(-1)) return cached;

  const traits = new Set<Trait>(), counts = new Map<Trait, number>(), lanes = new Map<Mutation, number>();
  let signature = 17;
  let previousMotion: MotionProfile = { count: 0, signature, traits: new Set() };
  mutations.forEach((mutation, index) => {
    if (index === mutations.length - 1) {
      previousMotion = { count: index, signature, traits: new Set(traits), latest: mutations[index - 1] };
    }
    signature = (Math.imul(signature, 31) + mutation.variant + mutation.id) >>> 0;
    traits.add(mutation.kind);
    const count = counts.get(mutation.kind) ?? 0;
    lanes.set(mutation, count % 4);
    counts.set(mutation.kind, count + 1);
  });

  // Keep the latest four of each trait, retaining their original drawing order.
  const visible: Mutation[] = [], retained = new Map<Trait, number>();
  for (let index = mutations.length - 1; index >= 0; index--) {
    const mutation = mutations[index], count = retained.get(mutation.kind) ?? 0;
    if (count < 4) visible.push(mutation);
    retained.set(mutation.kind, count + 1);
  }
  visible.reverse();
  const expressed = new Set(new Map(mutations.map(m => [m.kind, m])).values());
  const anatomy = groupAnatomy(visible);
  // Modern specimens express only the latest instance of each anatomical trait.
  // Compute these lists after a hit, rather than filtering them on every frame.
  const state: CreatureState = {
    ...anatomy, expressed, current: groupAnatomy(visible.filter(m => expressed.has(m))), lanes,
    motion: { count: mutations.length, signature, latest: mutations.at(-1), traits }, previousMotion,
  };
  cache.set(mutations, state);
  return state;
}

function groupAnatomy(mutations: readonly Mutation[]): Anatomy {
  return {
    appendages: mutations.filter(m => !SURFACE.has(m.kind) && !FACE.has(m.kind) && m.kind !== 'eyes' && m.kind !== 'tongue'),
    surface: mutations.filter(m => SURFACE.has(m.kind)),
    eyes: mutations.filter(m => m.kind === 'eyes'),
    tongues: mutations.filter(m => m.kind === 'tongue'),
    face: mutations.filter(m => FACE.has(m.kind)),
  };
}
