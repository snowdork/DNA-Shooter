import { PAIRS, patternId, type Pair } from './model';

const VOICES = [
  { frequency: 261.625565, type: 'triangle', duration: .5 },
  { frequency: 311.126984, type: 'sine', duration: .62 },
  { frequency: 391.995436, type: 'triangle', duration: .46 },
  { frequency: 466.163762, type: 'sine', duration: .56 },
] as const;

/** Ordered complementary pairs have distinct, repeatable musical identities. */
export function pairVoice(pair: Pair) {
  const index = PAIRS.indexOf(pair as typeof PAIRS[number]);
  if (index < 0) throw new Error('A complementary pair is required.');
  return VOICES[index];
}

export function patternSignature(pattern: readonly Pair[]) {
  const id = patternId(pattern);
  return {
    id,
    motif: pattern.map(pair => pairVoice(pair).frequency),
    // Unique resolving pitches across three octaves, with an ordered motif to distinguish neighbors.
    frequency: 130.812783 * 2 ** (id * 3 / 255),
  };
}
