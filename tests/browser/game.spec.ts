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
  if (position === 0) await page.locator(`[data-pair=${({ A: 'AT', T: 'TA', C: 'CG', G: 'GC' } as Record<string, string>)[base]}]`).click();
}

test('ordered pairs fire, directions pause, and restart clears progress', async ({ page }) => {
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
  await expect(page.locator('[data-pair=AT]')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Back to game' }).click();
  await expect(page.locator('#directions-dialog')).not.toBeVisible();
  await expect(page.locator('#pause')).toHaveText('Pause');
  await placeBase(page, 'A', 0);
  await placeBase(page, 'T', 1);
  await page.waitForTimeout(2200);
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#notice')).toContainText(/click a chain/i);
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
    await page.keyboard.press('g'); await page.keyboard.press('4');
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
    await page.keyboard.press('a'); await page.keyboard.press(String(filledSlot + 1));
    await expect(page.locator('#score')).toHaveText('100');
    const pairs = Array(4).fill('--'); pairs[filledSlot] = 'AT';
    await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(pairs);
    await expect(page.locator('#notice')).toContainText(`empty chain ${missingSlot + 1} of the quadra-chrome reached the bottom`, { timeout: 60000 });
    await expect(page.locator('#pause')).toBeDisabled();
    await expect(page.locator('[data-pair=AT]')).toBeDisabled();
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator('#progress')).toHaveText(`1 / ${TOTAL_SEGMENTS}`);
    await expect(page.locator('.dna-row').first().locator('.dna-pair')).toHaveText(pairs);
    await page.keyboard.press('c'); await page.keyboard.press('2');
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
  await page.keyboard.press('a');
  await page.keyboard.press('1');
  await expect(page.locator('#score')).toHaveText('100');
  expect(await page.evaluate(() => (window as any).audioProbe.tones)).toBeGreaterThan(before);
  expect(await page.evaluate(() => (window as any).audioProbe.pitches)).toContain(pairVoice('AT').frequency);
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => (window as any).audioProbe.contexts[0].state)).toBe('suspended');
  const muted = await page.evaluate(() => (window as any).audioProbe.tones);
  await page.keyboard.press('c');
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
    await page.keyboard.press('a');
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
  expect(JSON.parse(saved).mutationVersion).toBe(5);
  await page.locator('#restart').click();
  await page.locator('#load').setInputFiles({ name: 'random-mutations.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.locator('#mutations li')).toHaveText(traits);
  const placements = Array.from({ length: 24 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'mutations.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })) });
  await expect(page.locator('#mutation-count')).toHaveText('24');
  await expect(page.locator('#mutations li')).toHaveCount(24);
  await page.screenshot({ path: '/tmp/mutagon-evolved.png', fullPage: true });
});

test('laptop viewports keep the field, pair letters, and controls aligned', async ({ page }) => {
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
    for (const pair of ['TA', 'AT', 'CG', 'GC']) {
      const button = page.locator(`[data-pair=${pair}]`);
      const bounds = (await button.boundingBox())!;
      for (const letter of await button.locator('.pair-letters > span').all()) {
        const box = (await letter.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(bounds.x);
        expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width);
        expect(await letter.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2);
      }
    }
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
  await page.keyboard.press('a'); await page.keyboard.press('1');
  await expect(page.locator('#mutation-count')).toHaveText('1');
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#restart')!.click();
    document.querySelector<HTMLButtonElement>('#pause')!.click();
  });
  await expect(page.locator('#mutation-count')).toHaveText('0');
  expect((await page.screenshot({ clip })).equals(fresh)).toBe(true);
  await page.screenshot({ path: '/tmp/mutagon-fresh-blob.png' });
});

test('sparks, tusks, and snozzle grow on hits and the full animal catalog restores', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check();
  const placements = Array.from({ length: 3 }, (_, i) => ({ segment: 0, slot: i, pair: 'AT' }));
  await page.locator('#load').setInputFiles({ name: 'animal-start.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, mutationVersion: 2, placements })) });
  await page.locator('#pause').click();
  await page.keyboard.press('g'); await page.keyboard.press('4');
  await expect(page.locator('#notice')).toContainText('sparks');
  await expect(page.locator('#mutation-count')).toHaveText('4');
  await expect(page.locator('#notice')).toContainText('New quadra-chrome approaching');
  for (const [slot, trait] of [['1', 'tusks'], ['2', 'snozzle']]) {
    await page.keyboard.press('g'); await page.keyboard.press(slot);
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

test.describe('touch pair dragging', () => {
  test.use({ hasTouch: true });
  test('complete characters drop onto a chain with touch', async ({ page }) => {
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
    await drop('[data-pair=CG]');
    await expect(page.locator('#score')).toHaveText('100');
    await expect(page.locator('#mutations')).toContainText('CG');
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
  await page.keyboard.press('g');
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
  await page.keyboard.press('Escape'); await page.keyboard.press('g');
  expect(await page.evaluate(() => (window as any).trackerProbe.changedRows)).toEqual([]);
  await page.keyboard.press('3');
  await expect(page.locator('#score')).toHaveText('100');
  await expect(rows.first().locator('.dna-pair')).toHaveText(['--', '--', 'GC', '--']);
  expect(await page.evaluate(() => [...new Set((window as any).trackerProbe.changedRows)])).toEqual(['1']);
  await page.keyboard.press('t'); await page.keyboard.press('1');
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


test('ready-made characters select, drag directly, and clear safely', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await expect(page.locator('[data-pair=AT]')).toBeDisabled();
  await page.locator('#motion').check(); await page.locator('#pause').click();
  await page.waitForTimeout(2200);
  await page.locator('[data-pair=AT]').click();
  await expect(page.locator('.quick-pair')).toHaveCount(4);
  await expect(page.locator('.preview-slot, [data-base], .flip-pair')).toHaveCount(0);
  await expect(page.locator('[data-pair=AT]')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.click(380 / 1280 * (await page.locator('#field canvas').boundingBox())!.width + (await page.locator('#field canvas').boundingBox())!.x, 238 / 650 * (await page.locator('#field canvas').boundingBox())!.height + (await page.locator('#field canvas').boundingBox())!.y);
  await expect(page.locator('#score')).toHaveText('100');
  const tile = await page.locator('[data-pair=CG]').boundingBox();
  const canvas = (await page.locator('#field canvas').boundingBox())!;
  await page.mouse.move(tile!.x + tile!.width / 2, tile!.y + tile!.height / 2); await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * 380 / 1280, canvas.y + canvas.height * 150 / 650, { steps: 12 });
  await expect(page.locator('.pair-drag')).toHaveText('CG');
  await expect(page.locator('.pair-drag')).toHaveAttribute('data-valid', 'true');
  await page.mouse.up(); await expect(page.locator('#score')).toHaveText('200');
  await expect(page.locator('.dna-row').first().locator('.dna-pair').first()).toHaveText('CG');
  await page.locator('[data-pair=GC]').click();
  await expect(page.locator('[data-pair=GC]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-pair=GC]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#pause').click();
  await expect(page.locator('[data-pair=GC]')).toBeDisabled();
  expect(errors).toEqual([]);
});


test('completed developmental specimens remain visible when restored paused', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#field canvas')).toBeVisible();
  await page.locator('#motion').check();
  const placements = Array.from({ length: TOTAL_SEGMENTS * SLOTS }, (_, i) => ({ segment: Math.floor(i / SLOTS), slot: i % SLOTS, pair: 'AT' }));
  for (const seed of [42, 43, 44]) {
    await page.locator('#load').setInputFiles({ name: 'mature.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, seed, mutationVersion: 4, placements })) });
    await expect(page.locator('#organism-count')).toHaveText('40 MUTATIONS');
    await page.setViewportSize({ width: 1440 + seed % 3 * 20, height: 900 });
    await page.screenshot({ path: `/tmp/mutagon-development-${seed}.png`, fullPage: true });
    await expect.poll(() => page.locator('#field canvas').evaluate(canvas => {
      const c = canvas as HTMLCanvasElement;
      const pixel = c.getContext('2d')!.getImageData(c.width * 1010 / 1280, c.height * 307 / 650, 1, 1).data;
      return pixel[0] + pixel[1] + pixel[2];
    })).toBeGreaterThan(100);
    await expect(page.locator('#pause')).toBeDisabled();
  }
});
