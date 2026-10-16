import type { Mutation } from './model';

export interface CreatureMotion {
  name: string; tempo: number; drift: number; bob: number; tilt: number;
  shear: number; scaleX: number; scaleY: number; gaze: number;
}
const MOVES: Record<Mutation['kind'], string> = {
  eyes: 'Curious wobble', legs: 'Bouncy steps', bands: 'Rhythmic pulse', tail: 'Tail-led sway',
  antennae: 'Twitchy jiggle', tongue: 'Slurping wiggle', gills: 'Breathing ripple', wings: 'Fluttering bounce',
  horns: 'Nodding rock', tentacles: 'Rolling squirm', scales: 'Shivering shimmy', spots: 'Jelly jiggle',
  sparks: 'Electric jitter', tusks: 'Heavy head swing', snozzle: 'Snuffling bob', paws: 'Pouncing bounce',
  ears: 'Listening twitch', whiskers: 'Sniffing shimmy', fins: 'Swimming sway', beak: 'Pecking nod',
  claws: 'Scuttling steps', plumes: 'Feathery flutter',
};

/** A fresh blob has a gentle baseline. Every landed mutation reshapes its rhythm. */
export function creatureMotion(mutations: readonly Mutation[], time: number, reduced = false): CreatureMotion {
  const latest = mutations.at(-1);
  const signature = mutations.reduce((hash, m) => (Math.imul(hash, 31) + m.variant + m.id) >>> 0, 17);
  const tempo = latest ? 1.8 + signature % 401 / 200 + mutations.length * .007 : 1.65;
  const name = latest ? MOVES[latest.kind] : 'Primordial wiggle';
  const still = { name, tempo, drift: 0, bob: 0, tilt: 0, shear: 0, scaleX: 1, scaleY: 1, gaze: 0 };
  if (reduced) return still;
  const phase = latest ? (signature % 628) / 100 : 0;
  const beat = time * tempo + phase;
  const has = (kind: Mutation['kind']) => mutations.some(m => m.kind === kind);
  const legLift = (has('legs') || has('paws') || has('claws')) ? Math.abs(Math.sin(beat * 1.35)) * -6 : 0;
  const wingLift = (has('wings') || has('plumes')) ? Math.sin(beat * 2.1) * 3 : 0;
  const squash = Math.sin(beat * (has('bands') ? 1.8 : 1.1)) * (has('gills') ? .055 : .035);
  return {
    name, tempo,
    drift: Math.sin(beat) * (has('tail') || has('fins') ? 6.2 : 3.5) + (has('sparks') ? Math.sin(beat * 8) * .6 : 0),
    bob: Math.sin(beat * .8) * 2.5 + legLift + wingLift,
    tilt: Math.sin(beat * (has('horns') || has('tusks') || has('beak') ? .7 : 1)) * (has('tail') ? .045 : .027),
    shear: Math.sin(beat * 1.4) * (has('tentacles') ? .045 : .018),
    scaleX: 1 + squash, scaleY: 1 - squash * .8,
    gaze: has('eyes') ? Math.sin(beat * .6) * 3 : 0,
  };
}
