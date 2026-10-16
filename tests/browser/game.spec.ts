import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { SLOTS, TOTAL_SEGMENTS } from '../../src/model';
import { pairVoice, patternSignature } from '../../src/sound-signature';

async function monitorAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const probe = { contexts: [] as AudioContext[], tones: 0, pitches: [] as number[] };
    (window as any).audioProbe = probe;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); probe.contexts.push(this); }
      createOscillator() {
        probe.tones++;
        const oscillator = super.createOscillator();
        const setFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (pitch, time) => { probe.pitches.push(pitch); return setFrequency(pitch, time); };
        return oscillator;
      }
    };
  });
}

async function placeBase(page: Page, base: string, position: 0 | 1): Promise<void> {
  await page.locator(`[data-base=${base}]`).click();
  await page.locator(`[data-side=${['A', 'T'].includes(base) ? 'at' : 'cg'}][data-position="${position}"]`).click();
}

test('ordered side shooters fire, reject mismatches, and restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await monitorAudio(page);
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#pause').click();
  await page.locator('#directions').click();
  await expect(page.locator('#directions-dialog')).toBeVisible();
  await expect(page.locator('#directions-dialog')).toContainText(`${TOTAL_SEGMENTS} quadra-chromes`);
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
  await expect(page.locator('#notice')).toContainText(/click an empty quadra-chrome chain/i);
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
  const pitches = await page.evaluate(() => (window as any).audioProbe.pitches as number[]);
  for (const pair of ['AT', 'TA', 'CG', 'GC'] as const) expect(pitches).toContain(pairVoice(pair).frequency);
  expect(pitches).toContain(patternSignature(['AT', 'TA', 'CG', 'GC']).frequency);
  await expect(page.locator('.dna-row').first()).toHaveAttribute('data-state', 'complete');
  await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(['AT', 'TA', 'CG', 'GC']);
  await expect(page.locator('.dna-row').nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#adaptations')).toContainText('AT · TA · CG · GC');
  await expect(page.locator('#progress')).toHaveText(`2 / ${TOTAL_SEGMENTS}`);
  await page.locator('#restart').click();
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon.png', fullPage: true });
  expect(errors).toEqual([]);
});

for (const reduced of [false, true]) {
  test(`completed quadra-chrome celebrates, pauses, then joins the master chain${reduced ? ' with reduced motion' : ''}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
    await page.locator('#motion').setChecked(reduced);
    const placements = ['AT', 'TA', 'CG'].map((pair, slot) => ({ segment: 0, slot, pair }));
    await page.locator('#load').setInputFiles({ name: 'celebration.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, mutationVersion: 2, placements })) });
    await page.locator('#pause').click();
    await page.waitForTimeout(1800); // Bring all four pairs into view before the last shot.
    await page.keyboard.press('g'); await page.keyboard.press('c'); await page.keyboard.press('4');
    await expect(page.locator('#score')).toHaveText('800');
    await page.locator('#pause').click();
    await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'celebrating');
    const row = page.locator('.dna-row').first();
    await expect(row).toHaveAttribute('data-completion', 'celebrating');
    await expect(row.locator('.dna-pair')).toHaveText(['AT', 'TA', 'CG', 'GC']);
    expect(await row.evaluate(element => getComputedStyle(element).animationName)).toBe(reduced ? 'none' : 'master-glimmer');
    const frozen = await page.locator('#field canvas').screenshot();
    await page.waitForTimeout(1200);
    expect((await page.locator('#field canvas').screenshot()).equals(frozen)).toBe(true);
    await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'celebrating');
    await page.screenshot({ path: `/tmp/mutagon-celebration${reduced ? '-reduced' : ''}.png` });
    await page.locator('#pause').click();
    await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'drifting');
    await expect(row).toHaveAttribute('data-completion', 'drifting');
    await expect(page.locator('#notice')).toContainText('drifting down to the master chain');
    await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'idle');
    await expect(row).toHaveAttribute('data-completion', 'linked');
    await expect(row.locator('.dna-pair')).toHaveText(['AT', 'TA', 'CG', 'GC']);
    await expect(page.locator('.dna-row').nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#notice')).toContainText('New quadra-chrome approaching');
    await page.locator('#restart').click();
    await expect(page.locator('.dna-row[data-completion=linked]')).toHaveCount(0);
    await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'idle');
    expect(errors).toEqual([]);
  });
}

test('restore and complete the final quadra-chrome, then export', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  const initial = await page.locator('canvas').screenshot();
  const placements = Array.from({ length: TOTAL_SEGMENTS * SLOTS - 1 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'creation.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })) });
  await expect(page.locator('#count')).toHaveText(String(TOTAL_SEGMENTS - 1));
  await expect(page.locator('.dna-row[data-state=complete]')).toHaveCount(TOTAL_SEGMENTS - 1);
  await expect(page.locator('.dna-row').last().locator('.dna-pair')).toHaveText(['AT', 'AT', 'AT', '--']);
  await expect(page.locator('#score')).toHaveText(((TOTAL_SEGMENTS - 1) * 800 + (SLOTS - 1) * 100).toLocaleString('en-US'));
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(false);
  await page.locator('#motion').check();
  await page.locator('#pause').click();
  await page.keyboard.press('t');
  await page.keyboard.press('a');
  await page.keyboard.press('4');
  await expect(page.locator('#score')).toHaveText((TOTAL_SEGMENTS * 800).toLocaleString('en-US'));
  await expect(page.locator('#count')).toHaveText(String(TOTAL_SEGMENTS));
  await expect(page.locator('.dna-row[data-state=complete]')).toHaveCount(TOTAL_SEGMENTS);
  await expect(page.locator('.dna-row[aria-current]')).toHaveCount(0);
  await expect(page.locator('#dna-completed')).toHaveText('COMPLETE');
  await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'celebrating');
  // Directions can pause and resume even the final celebration before the victory screen.
  await page.locator('#directions').click();
  await expect(page.locator('#pause')).toHaveText('Resume creating');
  await page.getByRole('button', { name: 'Back to game' }).click();
  await expect(page.locator('.game-area')).toHaveAttribute('data-completion-phase', 'idle');
  await expect(page.locator('.dna-row').last()).toHaveAttribute('data-completion', 'linked');
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

for (const [filledSlot, missingSlot] of [[0, 3], [3, 2]] as const) {
  test(`an empty chain ends the quadra-chrome even with chain ${filledSlot + 1} already filled`, async ({ page }) => {
    test.setTimeout(75000);
    await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
    await page.locator('#motion').check(); await page.locator('#sound').click();
    await page.locator('#pause').click();
    await page.keyboard.press('a'); await page.keyboard.press('t'); await page.keyboard.press(String(filledSlot + 1));
    await expect(page.locator('#score')).toHaveText('100');
    const pairs = Array(4).fill('--'); pairs[filledSlot] = 'AT';
    await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(pairs);
    await expect(page.locator('#notice')).toContainText(`empty chain ${missingSlot + 1} of the quadra-chrome reached the bottom`, { timeout: 60000 });
    await expect(page.locator('#pause')).toBeDisabled();
    await expect(page.locator('[data-base=A]')).toBeDisabled();
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator('#progress')).toHaveText(`1 / ${TOTAL_SEGMENTS}`);
    await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(pairs);
    await page.keyboard.press('c'); await page.keyboard.press('g'); await page.keyboard.press('2');
    await expect(page.locator('#score')).toHaveText('100');
    await page.locator('#restart').click();
    await expect(page.locator('#pause')).toBeEnabled();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(Array(4).fill('--'));
  });
}

test('sound starts with play, responds to shots, and silences on mute and pause', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await monitorAudio(page);
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
  expect(await page.evaluate(() => (window as any).audioProbe.pitches)).toContain(pairVoice('AT').frequency);
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
  await expect(page.locator('#order-cg')).toHaveAttribute('data-ready', 'false');
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
  const traits: string[] = [];
  for (const slot of ['1', '2', '3']) {
    await page.keyboard.press('a'); await page.keyboard.press('t');
    await page.keyboard.press(slot);
    await expect(page.locator('#mutation-count')).toHaveText(slot);
    const trait = (await page.locator('#mutations li').last().textContent())!;
    traits.push(trait);
    await expect(page.locator('#notice')).toContainText(trait.split(' — ')[0]);
    await expect(page.locator('#count')).toHaveText('0');
    const currentSpecimen = await page.screenshot({ clip: specimenClip });
    expect(currentSpecimen.equals(previousSpecimen)).toBe(false);
    previousSpecimen = currentSpecimen;
  }
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-live.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download'); await page.locator('#save').click();
  const saved = await readFile((await (await downloadPromise).path())!, 'utf8');
  expect(JSON.parse(saved).mutationVersion).toBe(3);
  await page.locator('#restart').click();
  await page.locator('#load').setInputFiles({ name: 'random-mutations.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.locator('#mutations li')).toHaveText(traits);
  const placements = Array.from({ length: 24 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'mutations.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })) });
  await expect(page.locator('#mutation-count')).toHaveText('24');
  await expect(page.locator('#mutations li')).toHaveCount(24);
  await page.screenshot({ path: '/tmp/mutagon-evolved.png', fullPage: true });
});

test('laptop viewports keep the enlarged field, controls, and shooter hit areas aligned', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await expect.poll(async () => {
    const canvas = (await page.locator('#field canvas').boundingBox())!;
    const stage = (await page.locator('.game-area').boundingBox())!;
    return Math.abs(canvas.width - stage.width) + Math.abs(canvas.height - stage.height);
  }).toBeLessThan(3);
  await page.locator('#motion').check();
  for (const [width, height] of [[1366, 768], [1536, 864], [1920, 1080], [2560, 1440], [2560, 1080], [1280, 1024]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => {
      const tools = (await page.locator('.game-tools').boundingBox())!;
      return tools.y + tools.height;
    }).toBeLessThanOrEqual(height);
    await expect.poll(async () => {
      const canvas = (await page.locator('#field canvas').boundingBox())!;
      const stage = (await page.locator('.game-area').boundingBox())!;
      const grid = (await page.locator('.game-stage').boundingBox())!;
      const field = (await page.locator('.field-wrap').boundingBox())!;
      return Math.abs(canvas.width - stage.width) + Math.abs(canvas.height - stage.height)
        + Math.abs(grid.width - (field.width - 2)) + Math.abs(grid.height - (field.height - 2));
    }).toBeLessThan(3);
    const tracker = (await page.locator('.dna-tracker').boundingBox())!;
    const canvasArea = (await page.locator('.game-area').boundingBox())!;
    expect(tracker.x).toBeGreaterThan(canvasArea.x + canvasArea.width);
    expect(await page.locator('.dna-log').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
    const shooter = (await page.locator('[data-base=A]').boundingBox())!;
    expect(Math.abs(shooter.width - shooter.height)).toBeLessThan(1);
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
  await expect(page.locator('#order-cg')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#order-at')).toHaveAttribute('data-ready', 'false');
  expect(await page.locator('#order-cg').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  await page.locator('#motion').uncheck();
  expect(await page.locator('#order-cg').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('pair-ready-glow');
  await page.screenshot({ path: '/tmp/mutagon-ready-slime.png' });
  await page.locator('#pause').click();
  await expect(page.locator('#order-cg')).toHaveAttribute('data-ready', 'false');
  await page.locator('#pause').click();
  await expect(page.locator('#order-cg')).toHaveAttribute('data-ready', 'true');
  await page.locator('#motion').check();
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
  await expect(page.locator('#order-cg')).toHaveAttribute('data-ready', 'false');
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
  await expect(page.locator('#notice')).toContainText('New quadra-chrome approaching');
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

test('ready pairs drag into empty chains, preserve order, and survive invalid or occupied drops', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check();
  for (const [width, height, side, pair, holder] of [[1366, 768, 'at', 'AT', false], [2560, 1080, 'cg', 'GC', true]] as const) {
    await page.setViewportSize({ width, height }); await page.locator('#restart').click();
    const started = Date.now();
    await page.waitForTimeout(2200);
    await placeBase(page, pair[0], 0); await placeBase(page, pair[1], 1);
    const source = page.locator(holder ? `[data-side=${side}][data-position="0"]` : `#order-${side} .pair-state`);
    const canvas = (await page.locator('#field canvas').boundingBox())!;
    const drop = async (x: number, y: number, valid: boolean) => {
      const bounds = (await source.boundingBox())!;
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down();
      // Follow the slow stream instead of assuming the same rung stays at a fixed screen coordinate.
      const streamOffset = Math.max(0, (Date.now() - started) / 1000 - 290 / 170) * 6;
      await page.mouse.move(canvas.x + canvas.width * x / 1280, canvas.y + canvas.height * (y + (x === 380 ? streamOffset : 0)) / 650, { steps: 12 });
      await expect(page.locator('.pair-drag')).toHaveText(await page.locator(`#order-${side} .slot-letter`).allTextContents().then(letters => letters.join('')));
      await expect(page.locator('.pair-drag')).toHaveAttribute('data-valid', String(valid));
      if (valid) await page.screenshot({ path: `/tmp/mutagon-pair-drop-${side}.png` });
      await page.mouse.up();
      await expect(page.locator('.base-drag')).toHaveCount(0);
    };
    await drop(1010, 330, false);
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator(`#order-${side}`)).toHaveAttribute('data-ready', 'true');
    await drop(380, 130, true);
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator('#mutations')).toContainText(pair);
    await expect(page.locator(`#order-${side} .slot-letter`)).toHaveText(['-', '-']);
    await placeBase(page, pair[1], 0); await placeBase(page, pair[0], 1);
    await drop(380, 130, false);
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator(`#order-${side}`)).toHaveAttribute('data-ready', 'true');
    await drop(380, 218, true);
    await expect(page.locator('#score')).toHaveText('200');
    await expect(page.locator('#mutations')).toContainText(pair[1] + pair[0]);
  }
  expect(errors).toEqual([]);
});

test.describe('touch pair dragging', () => {
  test.use({ hasTouch: true });
  test('partial pairs cannot fire and a completed pair drops onto a chain with touch', async ({ page }) => {
    await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
    await page.locator('#motion').check(); await page.locator('#pause').click();
    await page.waitForTimeout(2200);
    const session = await page.context().newCDPSession(page);
    const canvas = (await page.locator('#field canvas').boundingBox())!;
    const drop = async (source: string) => {
      const bounds = (await page.locator(source).boundingBox())!;
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: canvas.x + canvas.width * 380 / 1280, y: canvas.y + canvas.height * 150 / 650 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await placeBase(page, 'C', 0);
    await drop('[data-side=cg][data-position="0"]');
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('[data-side=cg][data-position="0"] .slot-letter')).toHaveText('C');
    await placeBase(page, 'G', 1);
    await drop('#order-cg .pair-state');
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator('#mutations')).toContainText('CG');
    await expect(page.locator('#order-cg .slot-letter')).toHaveText(['-', '-']);
    await expect(page.locator('.base-drag')).toHaveCount(0);
    await session.detach();
  });
});

test('DNA ticker records landed pairs in chain order and resets with a new organism', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  const rows = page.locator('.dna-row');
  await expect(rows).toHaveCount(TOTAL_SEGMENTS);
  await expect(page.locator('.dna-log')).toHaveCSS('grid-template-rows', new RegExp(String.raw`^(?:[\d.]+px\s*){${TOTAL_SEGMENTS}}$`));
  await expect(rows.first()).toHaveAttribute('aria-current', 'step');
  await expect(rows.first().locator('.dna-pair')).toHaveText(Array(SLOTS).fill('--'));
  await expect(rows.last()).toHaveAttribute('data-state', 'pending');
  await page.locator('#motion').check(); await page.locator('#pause').click();
  await page.keyboard.press('g'); await page.keyboard.press('c');
  await expect(rows.first().locator('.dna-pair')).toHaveText(Array(SLOTS).fill('--'));
  // Control changes should not rewrite unchanged pattern rows or restart their animations.
  await page.evaluate(() => {
    const probe = { changedRows: [] as string[] };
    (window as any).trackerProbe = probe;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        const element = record.target instanceof Element ? record.target : record.target.parentElement;
        const row = element?.closest<HTMLElement>('.dna-row');
        if (row) probe.changedRows.push(row.dataset.chromosome!);
      }
    });
    observer.observe(document.querySelector('.dna-log')!, { subtree: true, childList: true, attributes: true, characterData: true });
  });
  await page.keyboard.press('Escape'); await page.keyboard.press('g'); await page.keyboard.press('c');
  expect(await page.evaluate(() => (window as any).trackerProbe.changedRows)).toEqual([]);
  await page.keyboard.press('3');
  await expect(page.locator('#score')).toHaveText('100');
  await expect(rows.first().locator('.dna-pair')).toHaveText(['--', '--', 'GC', '--']);
  expect(await page.evaluate(() => [...new Set((window as any).trackerProbe.changedRows)])).toEqual(['1']);
  await page.keyboard.press('t'); await page.keyboard.press('a'); await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('200');
  await expect(rows.first().locator('.dna-pair')).toHaveText(['TA', '--', 'GC', '--']);
  await expect(page.locator('#dna-completed')).toHaveText('COLLECTING');
  await page.locator('#pause').click();
  await page.screenshot({ path: '/tmp/mutagon-dna-ticker.png' });
  await page.locator('#restart').click();
  await expect(rows.first().locator('.dna-pair')).toHaveText(Array(SLOTS).fill('--'));
  await expect(page.locator('.dna-row[data-state=complete]')).toHaveCount(0);
  await expect(rows.first()).toHaveAttribute('aria-current', 'step');
  expect(errors).toEqual([]);
});
