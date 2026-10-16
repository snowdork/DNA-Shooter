import type { Base } from './model';

export const COLORS: Record<Base, string> = { A: '#ffbc4c', T: '#ff6bd9', C: '#45dfff', G: '#b18aff' };
export const SIDE_BASES = { at: ['A', 'T'], cg: ['C', 'G'] } as const;
export type Side = keyof typeof SIDE_BASES;

export function belongsToSide(base: Base, side: Side): boolean {
  return (SIDE_BASES[side] as readonly Base[]).includes(base);
}
