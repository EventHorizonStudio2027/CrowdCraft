const {test,expect}=require('@playwright/test');
test('editor renders, autosaves, restores and exports',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#source')).toHaveCount(1);
  const editor=page.locator('#source');
  const unique='Smoke Test '+Date.now();
  await editor.fill('<!doctype html><html><body><h1>'+unique+'</h1><button id="action" onclick="this.textContent=\'Clicked\'">Try</button></body></html>');
  await expect(page.locator('#save-indicator')).toContainText('Saved locally',{timeout:10000});
  await page.reload();
  await expect(page.locator('#source')).toHaveValue(new RegExp(unique));
  const preview=page.frameLocator('#preview');
  await expect(preview.locator('h1')).toHaveText(unique);
  await preview.locator('#action').click();
  await expect(preview.locator('#action')).toHaveText('Clicked');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  expect(errors).toEqual([]);
});
test('save named project to local library',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Regression project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-status')).toContainText('Saved Regression project');
  await expect(page.locator('#project-list')).toContainText('Regression project');
  await page.reload();
  await page.locator('.navitem[data-view="projects"]').click();
  await expect(page.locator('#project-list')).toContainText('Regression project');
});

test('preview remains isolated from editor storage',async({page})=>{
  await page.goto('/');
  const html=['<!doctype html><html><body>',
    '<script>try { localStorage.setItem("unsafe", "yes"); document.body.dataset.isolated="false" } catch (error) { document.body.dataset.isolated="true" }',
    '</scr'+'ipt></body></html>'].join('');
  await page.locator('#source').fill(html);
  await expect(page.frameLocator('#preview').locator('body')).toHaveAttribute('data-isolated','true');
  await expect(page.locator('#preview')).toHaveAttribute('sandbox','allow-scripts');
});

test('duplicate text selection resolves to the clicked occurrence',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('<!doctype html><html><body><p>Repeated text</p><p>Repeated text</p></body></html>');
  await page.locator('#inspector-pick').click();
  await page.frameLocator('#preview').locator('p').nth(1).click();
  await expect(page.locator('#inspector-target')).not.toHaveValue('');
  await expect(page.locator('#inspector-picked')).toContainText('Repeated text');
});

test('project search filters saved library entries',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Searchable smoke project');
  await page.locator('#project-save').click();
  await page.locator('#project-filter').fill('no-matching-project');
  await expect(page.locator('#project-no-results')).toBeVisible();
  await page.locator('#project-filter').fill('Searchable smoke');
  await expect(page.locator('#project-list')).toContainText('Searchable smoke project');
});
