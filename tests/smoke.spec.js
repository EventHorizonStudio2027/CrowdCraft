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
  await expect(page.frameLocator('#preview').locator('p')).toHaveCount(2);
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-pick').click();
  await page.frameLocator('#preview').locator('p').nth(1).click();
  await expect(page.locator('#inspector-target')).not.toHaveValue('');
  await expect(page.locator('#inspector-picked')).toContainText('Repeated text');
  await expect(page.locator('#inspector-picked')).toHaveAttribute('data-selected','true');
  await page.locator('#inspector-value').fill('Edited second paragraph');
  await page.locator('#inspector-apply').click();
  await expect(page.frameLocator('#preview').locator('p')).toHaveText(['Repeated text', 'Edited second paragraph']);
  await page.locator('#inspector-undo').click();
  await expect(page.frameLocator('#preview').locator('p')).toHaveText(['Repeated text', 'Repeated text']);
});

test('project search filters saved library entries',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Searchable smoke project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-list')).toContainText('Searchable smoke project');
  await page.locator('#project-filter').fill('no-matching-project');
  await expect(page.locator('#project-no-results')).toBeVisible();
  await page.locator('#project-filter').fill('Searchable smoke');
  await expect(page.locator('#project-list')).toContainText('Searchable smoke project');
});

test('editor reset requires confirmation and cancel preserves work',async({page})=>{
  await page.goto('/');
  const marker='Unsaved draft '+Date.now();
  await page.locator('#source').fill('<h1>'+marker+'</h1>');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#reset').click();
  await expect(page.locator('#source')).toHaveValue(new RegExp(marker));
});

test('preview updates after source edit',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('<h1>First preview</h1>');
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('First preview');
  await page.locator('#source').fill('<h1>Updated preview</h1>');
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Updated preview');
});

test('visual inspector edits source and undo restores it',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('<!doctype html><html><body><p id="inspected-paragraph">Before edit</p></body></html>');
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await page.locator('#inspector-value').fill('After edit');
  await page.locator('#preview-refresh').click();
  await expect(page.locator('#preview-refresh')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#inspector-value')).toHaveValue('After edit');
  await page.locator('#inspector-apply').click();
  await expect(page.locator('#source')).toHaveValue(/After edit/);
  await expect(page.frameLocator('#preview').locator('#inspected-paragraph')).toHaveText('After edit');
  await page.locator('#inspector-undo').click();
  await expect(page.locator('#source')).toHaveValue(/Before edit/);
});

test('project library search hides nonmatching project cards',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Unique library project');
  await page.locator('#project-save').click();
  await page.locator('#project-filter').fill('missing-unique-term');
  await expect(page.locator('.project-entry:visible')).toHaveCount(0);
  await expect(page.locator('#project-no-results')).toBeVisible();
});

test('saved project restores its exact source after editing',async({page})=>{
  await page.goto('/');
  const original='<h1>Restorable project</h1><p>Keep this content</p>';
  await page.locator('#source').fill(original);
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Restore regression');
  await page.locator('#project-save').click();
  await page.locator('.navitem[data-view="studio"]').click();
  await page.locator('#source').fill('<h1>Temporary replacement</h1>');
  await page.locator('.navitem[data-view="projects"]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('.project-entry').filter({hasText:'Restore regression'}).getByRole('button',{name:'Restore'}).click();
  await expect(page.locator('#source')).toHaveValue(original);
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Restorable project');
});

test('library export downloads JSON backup',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#project-backup').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
