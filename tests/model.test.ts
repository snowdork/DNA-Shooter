import test from 'node:test';
import assert from 'node:assert/strict';
import { Creation, Controls, patternId } from '../src/model.ts';
import { creatureMotion } from '../src/motion.ts';

test('all 30 segments complete once and replay exactly', () => {
  const creation = new Creation(42);
  for (let segment = 0; segment < 30; segment++) {
    for (const slot of [3, 1, 0, 2]) {
      assert.equal(creation.place(slot, slot % 2 ? 'CG' : 'AT'), true);
      if (slot !== 2) assert.equal(creation.place(slot, 'TA'), false);
    }
  }
  assert.equal(creation.done, true);
  assert.equal(creation.score, 24000);
  assert.equal(creation.adaptations.length, 30);
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
  assert.equal(creation.mutations[0].kind, 'eyes');
  assert.equal(creation.mutations[0].color, '#78ff76');
  creation.place(0, 'AT'); creation.place(1, 'AT');
  assert.equal(creation.mutations[1].kind, 'legs');
  assert.equal(creation.mutations[1].color, '#64a8ff');
  assert.equal(creation.mutations[2].kind, 'bands');
  assert.equal(creation.place(1, 'CG'), false);
  assert.equal(creation.mutations.length, 3);
  assert.deepEqual(Creation.restore(creation.save()).mutations, creation.mutations);
  const reversed = new Creation(42); reversed.place(2, 'TA');
  assert.notDeepEqual(reversed.mutations[0], creation.mutations[0]);
});

test('a landed pair protects the active chromosome; a fresh chromosome starts empty', () => {
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
  for (let i = 0; i < 120; i++) {
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
