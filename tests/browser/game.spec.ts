import { test, expect } from '@playwright/test';

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
  await page.locator('[data-base=A]').click();
  await page.locator('[data-base=C]').click();
  await expect(page.locator('#notice')).toContainText('A pairs with T');
  await page.locator('[data-base=T]').click();
  await page.waitForTimeout(2200);
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#notice')).toContainText('click an empty chromosome rung');
  const canvas = await page.locator('#field canvas').boundingBox();
  await page.mouse.click(canvas!.x + canvas!.width * 300 / 1280, canvas!.y + canvas!.height * 150 / 650);
  await expect(page.locator('#score')).toHaveText('100');
  await page.locator('[data-base=T]').click();
  await page.locator('[data-base=A]').click();
  await page.keyboard.press('2');
  await expect(page.locator('#score')).toHaveText('200');
  await page.locator('[data-base=C]').click();
  await page.locator('[data-base=G]').click();
  await page.keyboard.press('3');
  await expect(page.locator('#score')).toHaveText('300');
  await page.locator('[data-base=G]').click();
  await page.locator('[data-base=C]').click();
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

test('shooters stay fixed while position labels and the order HUD follow selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  const g = page.locator('[data-base=G]'), c = page.locator('[data-base=C]');
  const originalG = await g.boundingBox(), originalC = await c.boundingBox();
  await g.click();
  await expect(page.locator('#order-cg .pair-up')).toHaveText('↑ UP G');
  await expect(page.locator('#order-cg .pair-state')).toHaveText('PICK DOWN');
  await expect(g.locator('.position-label')).toHaveText('↑ UP');
  expect(await g.boundingBox()).toEqual(originalG);
  expect(await c.boundingBox()).toEqual(originalC);
  await g.click();
  await expect(page.locator('#order-cg .pair-up')).toHaveText('↑ UP —');
  await expect(page.locator('#order-cg .pair-down')).toHaveText('↓ DOWN —');
  await expect(g).toHaveAttribute('aria-pressed', 'false');
  await expect(g.locator('.position-label')).toBeHidden();
  await expect(page.locator('#score')).toHaveText('0');
  await c.click();
  await expect(page.locator('#order-cg .pair-up')).toHaveText('↑ UP C');
  expect((await c.boundingBox())!.y).toBeLessThan((await g.boundingBox())!.y);
  await g.click();
  await expect(c.locator('.position-label')).toHaveText('↑ UP');
  await expect(g.locator('.position-label')).toHaveText('↓ DOWN');
  expect(await g.boundingBox()).toEqual(originalG);
  expect(await c.boundingBox()).toEqual(originalC);
  await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('100');
  await expect(g.locator('.position-label')).toBeHidden();
  await expect(c.locator('.position-label')).toBeHidden();
  await g.click(); await c.click();
  await page.keyboard.press('2');
  await expect(page.locator('#score')).toHaveText('200');
  await page.locator('[data-base=T]').click();
  await expect(page.locator('#order-at .pair-up')).toHaveText('↑ UP T');
  await expect(page.locator('[data-base=T] .position-label')).toHaveText('↑ UP');
  expect((await page.locator('[data-base=T]').boundingBox())!.y).toBeGreaterThan((await page.locator('[data-base=A]').boundingBox())!.y);
  await page.locator('#motion').check();
  await page.locator('#pause').click();
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
    await page.locator('[data-base=A]').click(); await page.locator('[data-base=T]').click();
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
