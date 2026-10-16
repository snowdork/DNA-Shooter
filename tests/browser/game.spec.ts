import { test, expect } from '@playwright/test';

test('idle rendering stops; pair locking, queue cancellation, and restart work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    (window as any).visibleDraws = 0;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: any[]) {
      if (this.canvas.isConnected) (window as any).visibleDraws++;
      return original.apply(this, args as any);
    };
  });
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  await page.waitForTimeout(200);
  const idle = await page.evaluate(() => (window as any).visibleDraws);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).visibleDraws)).toBe(idle);
  await page.locator('#pause').click();
  await page.locator('[data-base=A]').click();
  await page.locator('[data-base=C]').click();
  await expect(page.locator('#notice')).toContainText('A pairs with T');
  await page.locator('[data-base=T]').click();
  await page.keyboard.press('1');
  await page.waitForTimeout(600);
  await expect(page.locator('#score')).toHaveText('0');
  // Queue then pause in the same task, before any frame can launch the shot.
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    document.querySelector<HTMLButtonElement>('#pause')!.click();
  });
  await page.locator('#pause').click();
  await page.waitForTimeout(600);
  await expect(page.locator('#score')).toHaveText('0');
  await page.keyboard.press('Enter');
  await expect(page.locator('#score')).toHaveText('100');
  expect(await page.evaluate(() => (window as any).visibleDraws)).toBeGreaterThan(idle);
  await page.locator('#restart').click();
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('#pause').click();
  await page.waitForTimeout(100);
  const paused = await page.evaluate(() => (window as any).visibleDraws);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).visibleDraws)).toBe(paused);
  expect(errors).toEqual([]);
});

test('restore and complete the final segment, export, and render a paused load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#field canvas')).toBeVisible();
  const initial = await page.locator('canvas').screenshot();
  const placements = Array.from({ length: 79 }, (_, i) => ({ segment: Math.floor(i / 4), slot: i % 4, pair: 'AT' }));
  await page.locator('#load').setInputFiles({
    name: 'creation.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, seed: 42, placements })),
  });
  await expect(page.locator('#count')).toHaveText('19');
  await expect(page.locator('#score')).toHaveText('15,500');
  const loaded = await page.locator('canvas').screenshot();
  expect(loaded.equals(initial)).toBe(false);
  await page.locator('#motion').check();
  await page.locator('#pause').click();
  await page.locator('[data-base=A]').click();
  await page.locator('[data-base=T]').click();
  await page.keyboard.press('4');
  await page.keyboard.press('Enter');
  await expect(page.locator('#score')).toHaveText('16,000');
  await expect(page.locator('#count')).toHaveText('20');
  await expect(page.locator('#notice')).toContainText('complete');
  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  expect((await download).suggestedFilename()).toBe('dna-creation.json');
  await page.locator('#restart').click();
  await page.locator('#pause').click();
  const reset = await page.locator('canvas').screenshot();
  expect(reset.equals(loaded)).toBe(false);
  await page.locator('#load').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await expect(page.locator('#notice')).toContainText('Could not load');
  await expect(page.locator('#score')).toHaveText('0');
});
