const { test, expect } = require('@playwright/test');

test('core studio workflow: edit, preview, autosave, reload, library restore and export', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-view="studio"]').first().click();
  const source = page.locator('#source');
  const project = '<!doctype html><html><body><button id="counter" onclick="this.textContent=String(Number(this.textContent)+1)">0</button></body></html>';
  await source.fill(project);
  await expect(page.locator('#save-indicator')).toContainText('Saved locally', { timeout: 10000 });
  const preview = page.frameLocator('#preview');
  await expect(preview.locator('#counter')).toHaveText('0');
  await preview.locator('#counter').click();
  await expect(preview.locator('#counter')).toHaveText('1');
  await page.reload();
  await page.locator('[data-view="studio"]').first().click();
  await expect(page.locator('#source')).toHaveValue(project);
  await page.locator('[data-view="projects"]').first().click();
  await page.locator('#project-name').fill('Regression Project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-list')).toContainText('Regression Project');
  await page.locator('[data-view="studio"]').first().click();
  await page.locator('#source').fill('<h1>Temporary draft</h1>');
  await page.locator('[data-view="projects"]').first().click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Restore' }).first().click();
  await expect(page.locator('#source')).toHaveValue(project);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.html$/);
});

test('empty named project and reset are recoverable', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-view="studio"]').first().click();
  await page.locator('#source').fill('<h1>Temporary</h1>');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#reset').click();
  await expect(page.locator('#source')).toHaveValue(/<!doctype html>/i);
  await expect(page.locator('#save-indicator')).toContainText('Saved locally', { timeout: 10000 });
});
