import test from 'node:test';
import assert from 'node:assert/strict';
import { Creation, Controls, patternId } from '../src/model.ts';

test('all 20 segments complete once and replay exactly', () => {
  const creation = new Creation(42);
  for (let segment = 0; segment < 20; segment++) {
    for (const slot of [3, 1, 0, 2]) {
      assert.equal(creation.place(slot, slot % 2 ? 'CG' : 'AT'), true);
      if (slot !== 2) assert.equal(creation.place(slot, 'TA'), false);
    }
  }
  assert.equal(creation.done, true);
  assert.equal(creation.score, 16000);
  assert.equal(creation.adaptations.length, 20);
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
