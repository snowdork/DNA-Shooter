import { test, expect, type Page } from '@playwright/test';

async function placeBase(page: Page, base: string, position: 0 | 1): Promise<void> {
  await page.locator(`[data-base=${base}]`).click();
  await page.locator(`[data-side=${['A', 'T'].includes(base) ? 'at' : 'cg'}][data-position="${position}"]`).click();
}

test('ordered side shooters fire, reject mismatches, and restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  await page.locator('#directions').click();
  await expect(page.locator('#directions-dialog')).toBeVisible();
  await expect(page.locator('#pause')).toHaveText('Resume creating');
  await page.keyboard.press('a');
  await expect(page.locator('[data-base=A]')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Back to game' }).click();
  await expect(page.locator('#directions-dialog')).not.toBeVisible();
  await expect(page.locator('#pause')).toHaveText('Pause');
  await placeBase(page, 'A', 0);
  await page.locator('[data-base=C]').click();
  await page.locator('[data-side=at][data-position="1"]').click();
  await expect(page.locator('#notice')).toContainText('Use A or T');
  await placeBase(page, 'T', 1);
  await page.waitForTimeout(2200);
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#notice')).toContainText(/click an empty chromosome rung/i);
  const canvas = await page.locator('#field canvas').boundingBox();
  await page.mouse.click(canvas!.x + canvas!.width * 300 / 1280, canvas!.y + canvas!.height * 150 / 650);
  await expect(page.locator('#score')).toHaveText('100');
  await placeBase(page, 'T', 0);
  await placeBase(page, 'A', 1);
  await page.keyboard.press('2');
  await expect(page.locator('#score')).toHaveText('200');
  await placeBase(page, 'C', 0);
  await placeBase(page, 'G', 1);
  await page.keyboard.press('3');
  await expect(page.locator('#score')).toHaveText('300');
  await placeBase(page, 'G', 0);
  await placeBase(page, 'C', 1);
  await page.keyboard.press('4');
  await expect(page.locator('#score')).toHaveText('800');
  await expect(page.locator('#adaptations')).toContainText('AT · TA · CG · GC');
  await expect(page.locator('#progress')).toHaveText('2 / 30');
  await page.locator('#restart').click();
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('restore and complete chromosome 30, then export', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  const initial = await page.locator('canvas').screenshot();
  const placements = Array.from({ length: 119 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'creation.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })) });
  await expect(page.locator('#count')).toHaveText('29');
  await expect(page.locator('#score')).toHaveText('23,500');
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(false);
  await page.locator('#motion').check();
  await page.locator('#pause').click();
  await page.keyboard.press('t');
  await page.keyboard.press('a');
  await page.keyboard.press('4');
  await expect(page.locator('#score')).toHaveText('24,000');
  await expect(page.locator('#count')).toHaveText('30');
  await expect(page.locator('#notice')).toContainText('complete');
  await expect(page.locator('#pause')).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  expect((await download).suggestedFilename()).toBe('dna-creation.json');
  await page.locator('#restart').click();
  await page.locator('#pause').click();
  await page.locator('#load').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.locator('#notice')).toContainText('Could not load');
  await expect(page.locator('#score')).toHaveText('0');
});

test('only an empty chromosome ends the run; linked pairs survive recirculation', async ({ page }) => {
  test.setTimeout(100000);
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  await expect(page.locator('#notice')).toContainText('Containment failed', { timeout: 45000 });
  await expect(page.locator('#pause')).toBeDisabled();
  await expect(page.locator('[data-base=A]')).toBeDisabled();
  await page.keyboard.press('a'); await page.keyboard.press('t');
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('#restart').click();
  await expect(page.locator('#pause')).toBeEnabled();
  await page.keyboard.press('a'); await page.keyboard.press('t');
  await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('100');
  await expect(page.locator('#notice')).toContainText('Linked chromosome preserved', { timeout: 45000 });
  await expect(page.locator('#pause')).toBeEnabled();
  await expect(page.locator('#score')).toHaveText('100');
  await expect(page.locator('#progress')).toHaveText('1 / 30');
  for (const slot of ['2', '3', '4']) {
    await page.keyboard.press('c'); await page.keyboard.press('g'); await page.keyboard.press(slot);
    await expect(page.locator('#score')).toHaveText(slot === '4' ? '800' : String(Number(slot) * 100));
  }
  await expect(page.locator('#progress')).toHaveText('2 / 30');
});

test('sound starts with play, responds to shots, and silences on mute and pause', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const probe = { contexts: [] as AudioContext[], tones: 0 };
    (window as any).audioProbe = probe;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); probe.contexts.push(this); }
      createOscillator() { probe.tones++; return super.createOscillator(); }
    };
  });
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  expect(await page.evaluate(() => (window as any).audioProbe.contexts.length)).toBe(0);
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0]?.state)).toBe('running');
  const before = await page.evaluate(() => (window as any).audioProbe.tones);
  await page.keyboard.press('a'); await page.keyboard.press('t');
  await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('100');
  expect(await page.evaluate(() => (window as any).audioProbe.tones)).toBeGreaterThan(before);
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0].state)).toBe('suspended');
  const muted = await page.evaluate(() => (window as any).audioProbe.tones);
  await page.keyboard.press('c'); await page.keyboard.press('g');
  await page.keyboard.press('2');
  await expect(page.locator('#score')).toHaveText('200');
  expect(await page.evaluate(() => (window as any).audioProbe.tones)).toBe(muted);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0].state)).toBe('running');
  await page.locator('#pause').click();
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0].state)).toBe('suspended');
  await page.locator('#sound').click(); await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0].state)).toBe('suspended');
  expect(await page.evaluate(() => (window as any).audioProbe.contexts.length)).toBe(1);
  expect(errors).toEqual([]);
});

test('shooters stay fixed while explicitly placed labels follow the UP and DOWN slots', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  const g = page.locator('[data-base=G]'), c = page.locator('[data-base=C]');
  const originalG = await g.boundingBox(), originalC = await c.boundingBox();
  await g.click();
  await expect(page.locator('#order-cg .slot-letter').first()).toHaveText('-');
  await expect(g.locator('.position-label')).toHaveText('PLACE');
  await g.click();
  await expect(g).toHaveAttribute('aria-pressed', 'false');
  await placeBase(page, 'G', 1);
  await expect(page.locator('#order-cg .pair-state')).toHaveText('PICK UP');
  await placeBase(page, 'C', 0);
  await expect(c.locator('.position-label')).toHaveText('↑ UP');
  await expect(g.locator('.position-label')).toHaveText('↓ DOWN');
  expect(await g.boundingBox()).toEqual(originalG); expect(await c.boundingBox()).toEqual(originalC);
  await page.keyboard.press('1'); await expect(page.locator('#score')).toHaveText('100');
  await expect(g.locator('.position-label')).toBeHidden();
  await placeBase(page, 'G', 0); await placeBase(page, 'C', 1);
  await page.keyboard.press('2'); await expect(page.locator('#score')).toHaveText('200');
  await placeBase(page, 'T', 0);
  await expect(page.locator('[data-base=T] .position-label')).toHaveText('↑ UP');
  expect((await page.locator('[data-base=T]').boundingBox())!.y).toBe((await page.locator('[data-base=A]').boundingBox())!.y);
  await page.locator('#motion').check(); await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-order.png', fullPage: true });
});

test('each landed pair immediately mutates the organism and restores its trait history', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check();
  await page.locator('#pause').click();
  const bounds = (await page.locator('#field canvas').boundingBox())!;
  const specimenClip = { x: bounds.x + bounds.width * 870 / 1280, y: bounds.y + bounds.height * 220 / 650, width: bounds.width * 300 / 1280, height: bounds.height * 240 / 650 };
  let previousSpecimen = await page.screenshot({ clip: specimenClip });
  for (const [slot, name] of [['1', 'Emerald eyes'], ['2', 'Cobalt legs'], ['3', 'Rose bands']]) {
    await page.keyboard.press('a'); await page.keyboard.press('t');
    await page.keyboard.press(slot);
    await expect(page.locator('#notice')).toContainText(name);
    await expect(page.locator('#mutation-count')).toHaveText(slot);
    await expect(page.locator('#count')).toHaveText('0');
    const currentSpecimen = await page.screenshot({ clip: specimenClip });
    expect(currentSpecimen.equals(previousSpecimen)).toBe(false);
    previousSpecimen = currentSpecimen;
  }
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-live.png', fullPage: true });
  const placements = Array.from({ length: 24 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'mutations.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })) });
  await expect(page.locator('#mutation-count')).toHaveText('24');
  await expect(page.locator('#mutations li')).toHaveCount(24);
  await page.screenshot({ path: '/tmp/mutagon-evolved.png', fullPage: true });
});

test('laptop viewports keep the enlarged field, controls, and shooter hit areas aligned', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await expect.poll(async () => {
    const canvas = (await page.locator('#field canvas').boundingBox())!;
    const stage = (await page.locator('.game-stage').boundingBox())!;
    return Math.abs(canvas.width - stage.width) + Math.abs(canvas.height - stage.height);
  }).toBeLessThan(3);
  await page.locator('#motion').check();
  for (const [width, height] of [[1366, 768], [1536, 864], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => {
      const tools = (await page.locator('.game-tools').boundingBox())!;
      return tools.y + tools.height;
    }).toBeLessThanOrEqual(height);
    await expect.poll(async () => {
      const canvas = (await page.locator('#field canvas').boundingBox())!;
      const stage = (await page.locator('.game-stage').boundingBox())!;
      return Math.abs(canvas.width - stage.width) + Math.abs(canvas.height - stage.height);
    }).toBeLessThan(3);
    expect((await page.locator('.field-wrap').boundingBox())!.width).toBeGreaterThan(width * .95);
    await page.locator('#restart').click();
    await page.waitForTimeout(2200);
    await placeBase(page, 'A', 0); await placeBase(page, 'T', 1);
    const canvas = (await page.locator('#field canvas').boundingBox())!;
    await page.mouse.click(canvas.x + canvas.width * 380 / 1280, canvas.y + canvas.height * 150 / 650);
    await expect(page.locator('#score')).toHaveText('100');
    await page.locator('#pause').click();
    await page.screenshot({ path: `/tmp/mutagon-${width}.png` });
  }
});

test('a fresh blob wiggles, pause freezes it, and restart restores its original form', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').uncheck();
  const bounds = (await page.locator('#field canvas').boundingBox())!;
  const clip = { x: bounds.x + bounds.width * 900 / 1280, y: bounds.y + bounds.height * 220 / 650, width: bounds.width * 220 / 1280, height: bounds.height * 230 / 650 };
  const fresh = await page.screenshot({ clip });
  await page.locator('#pause').click();
  await page.waitForTimeout(500);
  expect((await page.screenshot({ clip })).equals(fresh)).toBe(false);
  await page.locator('#pause').click();
  const paused = await page.screenshot({ clip });
  await page.waitForTimeout(250);
  expect((await page.screenshot({ clip })).equals(paused)).toBe(true);
  await page.locator('#pause').click();
  await page.keyboard.press('a'); await page.keyboard.press('t'); await page.keyboard.press('1');
  await expect(page.locator('#mutation-count')).toHaveText('1');
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#restart')!.click();
    document.querySelector<HTMLButtonElement>('#pause')!.click();
  });
  await expect(page.locator('#mutation-count')).toHaveText('0');
  expect((await page.screenshot({ clip })).equals(fresh)).toBe(true);
  await page.screenshot({ path: '/tmp/mutagon-fresh-blob.png' });
});

test('side stations preview dragged pairs, reject bad drops, clear, and fire manually', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  const up = page.locator('[data-side=cg][data-position="0"]');
  const down = page.locator('[data-side=cg][data-position="1"]');
  const g = page.locator('[data-base=G]'), c = page.locator('[data-base=C]');
  await expect(up).toBeDisabled();
  await page.locator('#motion').check(); await page.locator('#pause').click();
  await c.dragTo(down);
  await expect(down.locator('.slot-letter')).toHaveText('C');
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('[data-clear=cg]').click();
  await g.dragTo(up);
  await expect(up.locator('.slot-letter')).toHaveText('G');
  await page.locator('[data-base=A]').dragTo(down);
  await expect(page.locator('#notice')).toContainText('Use C or G');
  await g.dragTo(down);
  await expect(page.locator('#notice')).toContainText('G pairs with C');
  await expect(down.locator('.slot-letter')).toHaveText('-');
  await c.dragTo(down);
  await expect(page.locator('#order-cg .pair-state')).toHaveText('READY');
  await expect(down.locator('.slot-letter')).toHaveText('C');
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('[data-clear=cg]').click();
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(down.locator('.slot-letter')).toHaveText('-');
  await placeBase(page, 'A', 0);
  await page.locator('[data-clear=cg]').click();
  await expect(page.locator('#order-at .slot-letter').first()).toHaveText('A');
  await page.locator('[data-clear=at]').click();
  await g.dragTo(up); await c.dragTo(down);
  await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('100');
  await expect(page.locator('#mutations')).toContainText('GC');
  await c.click(); await up.click(); await g.click(); await down.click();
  await expect(up.locator('.slot-letter')).toHaveText('C');
  await expect(down.locator('.slot-letter')).toHaveText('G');
  await expect(page.locator('#order-cg .pair-state')).toHaveText('READY');
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-stations.png' });
  await expect(page.locator('.base-drag')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('sparks, tusks, and snozzle grow on hits and the full animal catalog restores', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check();
  const placements = Array.from({ length: 3 }, (_, i) => ({ segment: 0, slot: i, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'animal-start.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, mutationVersion: 2, placements })) });
  await page.locator('#pause').click();
  await page.keyboard.press('g'); await page.keyboard.press('c'); await page.keyboard.press('4');
  await expect(page.locator('#notice')).toContainText('sparks');
  await expect(page.locator('#mutation-count')).toHaveText('4');
  await expect(page.locator('#notice')).toContainText('Empty chromosome approaching');
  for (const [slot, trait] of [['1', 'tusks'], ['2', 'snozzle']]) {
    await page.keyboard.press('g'); await page.keyboard.press('c'); await page.keyboard.press(slot);
    await expect(page.locator('#notice')).toContainText(trait);
  }
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-tusks-snozzle.png' });
  const all = Array.from({ length: 22 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'animal-catalog.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, mutationVersion: 2, placements: all })) });
  await expect(page.locator('#mutation-count')).toHaveText('22');
  for (const trait of ['sparks', 'tusks', 'snozzle', 'paws', 'ears', 'whiskers', 'fins', 'beak', 'claws', 'plumes']) await expect(page.locator('#mutations')).toContainText(trait);
  await page.screenshot({ path: '/tmp/mutagon-animal-catalog.png' });
  expect(errors).toEqual([]);
});

test('clicking a base requires a slot click and a complete pair before populating a chain', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check(); await page.locator('#pause').click();
  const up = page.locator('[data-side=cg][data-position="0"]');
  const down = page.locator('[data-side=cg][data-position="1"]');
  await page.locator('[data-base=G]').click();
  await page.locator('[data-base=C]').click();
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(down.locator('.slot-letter')).toHaveText('-');
  await page.keyboard.press('1'); await expect(page.locator('#score')).toHaveText('0');
  await down.click();
  await expect(down.locator('.slot-letter')).toHaveText('C');
  await expect(page.locator('#order-cg .pair-state')).toHaveText('PICK UP');
  await page.keyboard.press('1'); await expect(page.locator('#score')).toHaveText('0');
  await page.locator('[data-base=G]').click(); await up.click();
  await expect(up.locator('.slot-letter')).toHaveText('G');
  await expect(page.locator('#order-cg .pair-state')).toHaveText('READY');
  await expect(page.locator('#score')).toHaveText('0');
  await page.waitForTimeout(2200);
  const canvas = (await page.locator('#field canvas').boundingBox())!;
  await page.mouse.click(canvas.x + canvas.width * 380 / 1280, canvas.y + canvas.height * 150 / 650);
  await expect(page.locator('#score')).toHaveText('100');
  await expect(page.locator('#mutations')).toContainText('GC');
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(down.locator('.slot-letter')).toHaveText('-');
});

test('station outline starts on the first pick and stays until both bases are deselected', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  const station = page.locator('.station-cg');
  const g = page.locator('[data-base=G]'), c = page.locator('[data-base=C]');
  await expect(station).toHaveAttribute('data-active', 'false');
  await g.click(); await expect(station).toHaveAttribute('data-active', 'true');
  await expect(page.locator('.station-at')).toHaveAttribute('data-active', 'false');
  await g.click(); await expect(station).toHaveAttribute('data-active', 'false');
  await placeBase(page, 'G', 0); await placeBase(page, 'C', 1);
  await expect(station).toHaveAttribute('data-active', 'true');
  await g.click();
  await expect(page.locator('#order-cg .slot-letter').first()).toHaveText('-');
  await expect(page.locator('#order-cg .slot-letter').last()).toHaveText('C');
  await expect(station).toHaveAttribute('data-active', 'true');
  await c.click(); await expect(station).toHaveAttribute('data-active', 'false');
  await placeBase(page, 'C', 1);
  await page.locator('[data-side=cg][data-position="1"]').click();
  await expect(station).toHaveAttribute('data-active', 'false');
  await expect(page.locator('#score')).toHaveText('0');
});

test('filled holders undo by click or drag back and invalid return drops preserve the pair', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  const up = page.locator('[data-side=cg][data-position="0"]');
  const down = page.locator('[data-side=cg][data-position="1"]');
  const station = page.locator('.station-cg');
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(down.locator('.slot-letter')).toHaveText('-');
  await placeBase(page, 'G', 0); await placeBase(page, 'C', 1);
  await up.dragTo(page.locator('[data-base=A]'));
  await expect(up.locator('.slot-letter')).toHaveText('G');
  await expect(down.locator('.slot-letter')).toHaveText('C');
  await up.dragTo(page.locator('[data-base=G]'));
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(down.locator('.slot-letter')).toHaveText('C');
  await expect(station).toHaveAttribute('data-active', 'true');
  await down.dragTo(page.locator('[data-base=C]'));
  await expect(down.locator('.slot-letter')).toHaveText('-');
  await expect(station).toHaveAttribute('data-active', 'false');
  await placeBase(page, 'G', 0); await up.click();
  await expect(up.locator('.slot-letter')).toHaveText('-');
  await expect(station).toHaveAttribute('data-active', 'false');
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('.base-drag')).toHaveCount(0);
  await expect(page.locator('[data-return-hover]')).toHaveCount(0);
  await page.screenshot({ path: '/tmp/mutagon-empty-holders.png' });
});
