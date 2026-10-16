import test from 'node:test';
import assert from 'node:assert/strict';
import { Creation, Controls, patternId, TRAITS, missedChain } from '../src/model.ts';
import { PAIRS, SLOTS, TOTAL_SEGMENTS } from '../src/model.ts';
import { pairVoice, patternSignature } from '../src/sound-signature.ts';
import { animateCreature, creatureMotion } from '../src/motion.ts';
import { creatureState } from '../src/creature-state.ts';

test('all configured quadra-chromes complete once and replay exactly', () => {
  const creation = new Creation(42);
  for (let segment = 0; segment < TOTAL_SEGMENTS; segment++) {
    for (const slot of [3, 1, 0, 2]) {
      assert.equal(creation.place(slot, slot % 2 ? 'CG' : 'AT'), true);
      if (slot !== 2) assert.equal(creation.place(slot, 'TA'), false);
    }
  }
  assert.equal(creation.done, true);
  assert.equal(creation.score, TOTAL_SEGMENTS * (SLOTS * 100 + 400));
  assert.equal(creation.adaptations.length, TOTAL_SEGMENTS);
  assert.equal(creation.place(0, 'AT'), false);
  const restored = Creation.restore(JSON.parse(JSON.stringify(creation.save())));
  assert.deepEqual(restored, creation);
  assert.equal(creation.adaptations[0].id, patternId(['AT', 'CG', 'AT', 'CG']));
});
test('reject invalid pairs and malformed replay history', () => {
  assert.equal(new Creation().place(0, 'AA' as never), false);
  assert.throws(() => Creation.restore({ version: 1, seed: 42, placements: [{ segment: 1, slot: 0, pair: 'AT' }] }));
});
test('selection, target lock, queued aiming and atomic launch are separate', () => {
  const controls = new Controls();
  controls.choose('A'); controls.choose('C');
  assert.deepEqual(controls.selected, ['A']);
  controls.choose('T');
  assert.equal(controls.click(2, () => true), 'locked');
  assert.equal(controls.launch(true), false);
  assert.equal(controls.click(2, () => true), 'queued');
  assert.equal(controls.launch(false), false);
  assert.equal(controls.launch(true), true);
  assert.deepEqual(controls.flight, { slot: 2, pair: 'AT' });
  assert.deepEqual(controls.selected, []);
  assert.equal(controls.launch(true), false);
});
test('cancelling lock clears queued shot', () => {
  const controls = new Controls(); controls.choose('C'); controls.choose('G');
  controls.click(0, () => true); controls.click(null, () => true); controls.cancelLock();
  assert.equal(controls.launch(true), false);
  assert.equal(controls.click(1, () => false), 'none');
  for (const slot of [-1, 4, 0.5, NaN]) assert.equal(controls.click(slot, () => true), 'none');
});

test('ordered pairs create distinct mutation patterns', () => {
  const first = new Creation(); const reversed = new Creation();
  for (let slot = 0; slot < 4; slot++) { first.place(slot, 'AT'); reversed.place(slot, 'TA'); }
  assert.notEqual(first.adaptations[0].id, reversed.adaptations[0].id);
  assert.notEqual(patternId(['CG', 'AT', 'TA', 'GC']), patternId(['GC', 'AT', 'TA', 'CG']));
});

test('every successful hit adds a persistent mutation, including before chromosome completion', () => {
  const creation = new Creation(42);
  creation.place(2, 'AT');
  assert.equal(creation.completed, 0);
  assert.equal(creation.mutations.length, 1);
  assert.ok(TRAITS.includes(creation.mutations[0].kind));
  creation.place(0, 'AT'); creation.place(1, 'AT');
  assert.deepEqual(creation.mutations.map(m => m.id), [1, 2, 3]);
  assert.equal(creation.place(1, 'CG'), false);
  assert.equal(creation.mutations.length, 3);
  assert.deepEqual(Creation.restore(creation.save()).mutations, creation.mutations);
  const reversed = new Creation(42); reversed.place(2, 'TA');
  assert.notDeepEqual(reversed.mutations[0], creation.mutations[0]);
});

test('a landed pair marks one chain; a fresh quadra-chrome starts empty', () => {
  const creation = new Creation();
  assert.equal(creation.linked, false);
  assert.equal(creation.place(0, 'AA' as never), false);
  assert.equal(creation.linked, false);
  creation.place(2, 'CG');
  assert.equal(creation.linked, true);
  assert.equal(Creation.restore(creation.save()).linked, true);
  for (const slot of [0, 1, 3]) creation.place(slot, 'AT');
  assert.equal(creation.completed, 1);
  assert.equal(creation.linked, false);
});

test('the fresh blob wiggles and every landed mutation changes its motion', () => {
  const creation = new Creation();
  assert.notDeepEqual(creatureMotion([], .2), creatureMotion([], .8));
  let previousTempo = creatureMotion([], .7).tempo;
  for (let i = 0; i < TOTAL_SEGMENTS * SLOTS; i++) {
    creation.place(i % 4, 'AT');
    const motion = creatureMotion(creation.mutations, .7);
    assert.notEqual(motion.tempo, previousTempo);
    previousTempo = motion.tempo;
    assert.ok(Math.abs(motion.drift) <= 7);
    assert.ok(Math.abs(motion.bob) <= 12);
    assert.ok(motion.scaleX > .9 && motion.scaleX < 1.1);
    const still = creatureMotion(creation.mutations, .7, true);
    assert.deepEqual(still, creatureMotion(creation.mutations, 12, true));
    assert.equal(still.scaleX, 1); assert.equal(still.scaleY, 1);
  }
  assert.deepEqual(creatureMotion(Creation.restore(creation.save()).mutations, 1), creatureMotion(creation.mutations, 1));
  assert.equal(new Creation().mutations.length, 0);
  assert.equal(creatureMotion([], 0).name, 'Primordial wiggle');
});

test('creature drawing preserves the latest four of each trait and the previous motion on every hit', () => {
  for (const version of [1, 2, 3] as const) {
    const creation = new Creation(42, version);
    for (let index = 0; index < TOTAL_SEGMENTS * SLOTS; index++) {
      const previous = creatureMotion(creation.mutations, .7);
      creation.place(index % 4, 'AT');
      const state = creatureState(creation.mutations);
      assert.deepEqual(animateCreature(state.previousMotion, .7), previous);
      const drawn = [...state.appendages, ...state.surface, ...state.eyes, ...state.tongues, ...state.face].sort((a, b) => a.id - b.id);
      const expected = creation.mutations.filter((m, i, history) => history.slice(i + 1).filter(next => next.kind === m.kind).length < 4);
      assert.deepEqual(drawn, expected);
      for (const mutation of state.surface) {
        assert.equal(state.lanes.get(mutation), creation.mutations.filter(m => m.kind === mutation.kind && m.id < mutation.id).length % 4);
      }
    }
    const restored = Creation.restore(creation.save());
    assert.deepEqual(creatureState(restored.mutations), creatureState(creation.mutations));
    assert.deepEqual(creatureState(new Creation().mutations).appendages, []);
  }
});

test('preview holders accept explicit ordered complementary bases and reject invalid drops', () => {
  const controls = new Controls();
  controls.setBase('C', 1);
  assert.deepEqual(controls.slots, [null, 'C']);
  assert.equal(controls.pair, null);
  assert.equal(controls.click(0, () => true), 'none');
  assert.match(controls.setBase('C', 0), /C pairs with G/);
  assert.deepEqual(controls.slots, [null, 'C']);
  controls.setBase('G', 0); assert.equal(controls.pair, 'GC');
  controls.cancel();
  controls.setBase('G', 0);
  assert.match(controls.setBase('T', 1), /G pairs with C/);
  assert.deepEqual(controls.selected, ['G']);
  controls.setBase('C', 1); assert.equal(controls.pair, 'GC');
  controls.click(0, () => true); controls.click(0, () => true);
  controls.setBase('G', 0);
  assert.equal(controls.queued, false); assert.equal(controls.target, null);
  assert.match(controls.setBase('C', 0), /C pairs with G/);
  assert.equal(controls.pair, 'GC');
  controls.cancel(); controls.setBase('C', 0);
  assert.deepEqual(controls.selected, ['C']);
  controls.setBase('G', 1); assert.equal(controls.pair, 'CG');
  controls.click(0, () => true); controls.click(0, () => true); controls.launch(true);
  controls.setBase('A', 0);
  assert.equal(controls.flight?.pair, 'CG'); assert.deepEqual(controls.selected, []);
});

test('legacy saves keep both their original and expanded sequential mutation catalogs', () => {
  const creation = new Creation(42, 2);
  for (let i = 0; i < TRAITS.length; i++) creation.place(i % 4, 'AT');
  assert.deepEqual(creation.mutations.map(m => m.kind), [...TRAITS]);
  assert.equal(creation.mutations[12].kind, 'sparks');
  assert.equal(creation.mutations[13].kind, 'tusks');
  assert.equal(creation.mutations[14].kind, 'snozzle');
  assert.deepEqual(Creation.restore(creation.save()).mutations, creation.mutations);
  const legacy = Creation.restore({ version: 1, seed: 42, placements: creation.placements });
  assert.equal(legacy.mutationVersion, 1);
  assert.equal(legacy.mutations[12].kind, 'eyes');
  assert.deepEqual(Creation.restore(legacy.save()).mutations, legacy.mutations);
  assert.throws(() => Creation.restore({ ...creation.save(), mutationVersion: 4 }));
});

test('random mutations vary with the seed, cover every trait, and replay exactly', () => {
  const kinds = new Set<string>(), colors = new Set<string>();
  const first = new Creation(42), same = new Creation(42), different = new Creation(43);
  const samples = Array.from({ length: 8 }, (_, seed) => new Creation(seed));
  for (let i = 0; i < TOTAL_SEGMENTS * SLOTS; i++) {
    for (const creation of [first, same, different, ...samples]) creation.place(i % 4, 'AT');
    for (const creation of samples) { kinds.add(creation.mutations[i].kind); colors.add(creation.mutations[i].color); }
  }
  assert.equal(first.mutationVersion, 3);
  assert.equal(kinds.size, TRAITS.length);
  assert.equal(colors.size, 6);
  assert.deepEqual(first.mutations, same.mutations);
  assert.notDeepEqual(first.mutations.map(m => [m.kind, m.color]), different.mutations.map(m => [m.kind, m.color]));
  assert.notDeepEqual(first.mutations.slice(0, TRAITS.length).map(m => m.kind), [...TRAITS]);
  assert.deepEqual(Creation.restore(JSON.parse(JSON.stringify(first.save()))), first);
  const alternate = new Creation(42); alternate.place(0, 'TA');
  assert.notDeepEqual(alternate.mutations[0], first.mutations[0]);
});

test('new games draw fresh seeds while explicit seeds remain repeatable', t => {
  let next = .25;
  t.mock.method(Math, 'random', () => next);
  const first = new Creation(); next = .75; const second = new Creation();
  assert.equal(first.seed, 0x40000000); assert.equal(second.seed, 0xc0000000);
  assert.equal(new Creation(42).seed, 42);
  first.place(0, 'AT'); second.place(0, 'AT');
  assert.notDeepEqual(first.mutations, second.mutations);
});

test('deselecting one base preserves the other and cancels a queued shot', () => {
  const controls = new Controls(); controls.setBase('G', 0); controls.setBase('C', 1);
  controls.click(0, () => true); controls.click(0, () => true);
  assert.equal(controls.deselect('G'), true);
  assert.deepEqual(controls.slots, [null, 'C']);
  assert.equal(controls.pair, null); assert.equal(controls.launch(true), false);
  assert.equal(controls.deselect('T'), false);
  assert.equal(controls.deselect('C'), true);
  assert.deepEqual(controls.selected, []);
});

test('every DNA pattern has a stable, unique musical signature in a usable pitch range', () => {
  assert.equal(new Set(PAIRS.map(pair => pairVoice(pair).frequency)).size, PAIRS.length);
  const signatures = [];
  for (const a of PAIRS) for (const b of PAIRS) for (const c of PAIRS) for (const d of PAIRS) {
    const pattern = [a, b, c, d];
    const signature = patternSignature(pattern);
    assert.deepEqual(signature, patternSignature([...pattern]));
    assert(signature.frequency >= 130 && signature.frequency <= 1050);
    assert.equal(signature.motif.length, 4);
    signatures.push(signature);
  }
  assert.equal(new Set(signatures.map(signature => signature.frequency)).size, 256);
  assert.equal(new Set(signatures.map(signature => signature.motif.join(','))).size, 256);
  assert.notDeepEqual(patternSignature(['AT', 'TA', 'CG', 'GC']), patternSignature(['GC', 'CG', 'TA', 'AT']));
  assert.throws(() => pairVoice('AA'));
  assert.throws(() => patternSignature(['AT', 'GC']));
});


test('each empty chain has its own bottom deadline, regardless of other filled chains', () => {
  const bottom = [316, 404, 492, 580];
  assert.equal(missedChain([null, null, null, null], bottom.map(y => y - .001), 580), null);
  assert.equal(missedChain([null, null, null, null], bottom, 580), 3);
  assert.equal(missedChain(['AT', null, null, null], bottom, 580), 3);
  assert.equal(missedChain([null, null, null, 'CG'], bottom, 580), null);
  assert.equal(missedChain([null, null, null, 'CG'], bottom.map(y => y + 88), 580), 2);
  assert.equal(missedChain([null, 'AT', 'TA', 'CG'], bottom.map(y => y + 264), 580), 0);
  assert.equal(missedChain(['AT', 'TA', 'CG', 'GC'], bottom.map(y => y + 500), 580), null);
});
