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
  await page.locator('#source').fill('<!doctype html><html><body><p id="inspected-paragraph" title="Before edit">Before edit</p></body></html>');
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await page.locator('#inspector-value').fill('After edit');
  await page.locator('#preview-refresh').click();
  await expect(page.locator('#preview-refresh')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#inspector-value')).toHaveValue('After edit');
  await page.locator('#inspector-apply').click();
  await expect(page.locator('#source')).toHaveValue(/After edit/);
  const paragraph = page.frameLocator('#preview').locator('#inspected-paragraph');
  await expect(paragraph).toHaveText('After edit');
  await expect(paragraph).toHaveAttribute('title', 'Before edit');
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
  await expect(page.locator('#project-name')).toHaveValue('Restore regression');
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

test('empty project library shows one clear message',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await expect(page.locator('#project-list .library-empty')).toHaveCount(1);
  await page.locator('#project-filter').fill('not-yet-saved');
  await expect(page.locator('#project-list .library-empty')).toHaveCount(0);
  await expect(page.locator('#project-no-results')).toBeVisible();
});

test('saving before the preview debounce preserves the live update', async ({ page }) => {
  await page.goto('/');
  const source = page.locator('#source');
  const updated = '<h1>Saved and rendered</h1>';
  await source.evaluate((editor, value) => {
    editor.value = value;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
  }, updated);
  await expect(page.locator('#save-indicator')).toContainText('Saved locally');
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Saved and rendered');
});

test('style edits preserve data attributes and original text entities', async ({ page }) => {
  await page.goto('/');
  const source = page.locator('#source');
  const original = `<p data-style="color: orange" title='style="never change"'>A &#38; B</p>`;
  await source.fill(original);
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await page.locator('#inspector-color').fill('#18c9e8');
  await page.locator('#inspector-apply').click();
  await expect(source).toHaveValue(original.replace('>A', ' style="color: #18c9e8">A'));
  const paragraph = page.frameLocator('#preview').locator('p');
  await expect(paragraph).toHaveCSS('color', 'rgb(24, 201, 232)');
  await expect(paragraph).toHaveText('A & B');
  await page.locator('#inspector-undo').click();
  await expect(source).toHaveValue(original);
});

test('saving preserves the active project name for subsequent updates',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('<h1>Version one</h1>');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Named working project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-name')).toHaveValue('Named working project');
  await page.locator('.navitem[data-view="studio"]').click();
  await page.locator('#source').fill('<h1>Version two</h1>');
  await page.locator('.navitem[data-view="projects"]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#project-save').click();
  await expect(page.locator('.project-entry')).toHaveCount(1);
  await expect(page.locator('#project-status')).toContainText('Updated Named working project');
});

test('empty source cannot be saved as a project',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Empty project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-status')).toContainText('Nothing to save yet');
  await expect(page.locator('.project-entry')).toHaveCount(0);
});

test('inspector keeps quoted CSS and existing large font sizes when changing color', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source').fill('<p style="--caption: &quot;one;two&quot;; font-size: 120px">Styled heading</p>');
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await page.locator('#inspector-color').fill('#18c9e8');
  await page.locator('#inspector-apply').click();
  const paragraph = page.frameLocator('#preview').locator('p');
  await expect(paragraph).toHaveCSS('color', 'rgb(24, 201, 232)');
  await expect(paragraph).toHaveCSS('font-size', '120px');
  expect(await paragraph.evaluate(element => element.style.getPropertyValue('--caption').trim())).toBe('"one;two"');
});

test('saving a project clears stale search and reveals the saved entry',async({page})=>{
  await page.goto('/');
  await page.locator('#source').fill('<h1>Search recovery</h1>');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-filter').fill('unrelated-filter');
  await page.locator('#project-name').fill('Search recovery project');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-filter')).toHaveValue('');
  await expect(page.locator('.project-entry')).toContainText('Search recovery project');
});

test('open inspector fits the studio at a narrow mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.locator('#text-inspector summary').click();
  await expect(page.locator('.inspector-actions')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('project library synchronizes saved projects across tabs',async({context})=>{
  const first=await context.newPage();
  const second=await context.newPage();
  await first.goto('/');
  await second.goto('/');
  await first.locator('.navitem[data-view="projects"]').click();
  await second.locator('.navitem[data-view="projects"]').click();
  await first.locator('#project-name').fill('Cross tab project');
  await first.locator('#project-save').click();
  await expect(second.locator('#project-list')).toContainText('Cross tab project');
  await expect(second.locator('#project-status')).toContainText('synchronized');
  await first.close();
  await second.close();
});

test('stale project library write cannot overwrite newer browser storage',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.evaluate(()=>{
    const key=location.pathname.toLowerCase().includes('crowdcode')?'crowdcode-library-v1':'crowdcraft-library-v1';
    if(!key)throw new Error('Project library storage key not found');
    localStorage.setItem(key,JSON.stringify([{id:'external-1',name:'Saved by another tab',html:'<h1>Safe</h1>',updated:new Date().toISOString()}]));
  });
  await page.locator('#project-name').fill('Stale write attempt');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-status')).toContainText('changed in another tab');
  await expect(page.locator('#project-list')).toContainText('Saved by another tab');
  await expect(page.locator('#project-list')).not.toContainText('Stale write attempt');
});

test('inspector can fill empty text and preserve angle brackets in attributes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source').fill(`<p title="3 > 2"> </p>`);
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption({ label: 'P · Empty text · line 1' });
  await page.locator('#inspector-value').fill('New label');
  await page.locator('#inspector-apply').click();
  const paragraph = page.frameLocator('#preview').locator('p');
  await expect(paragraph).toHaveText('New label');
  await expect(paragraph).toHaveAttribute('title', '3 > 2');
  await page.locator('#inspector-undo').click();
  await expect(page.locator('#inspector-target')).toHaveValue('0');
});

test('inspector reads real style declarations without reading quoted CSS as properties', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source').fill(`<p style="--test: 'note; font-size: 55px'; font-weight: 400; font-weight: 700">Title</p>`);
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await expect(page.locator('#inspector-size')).toHaveValue('18');
  await expect(page.locator('#inspector-weight')).toHaveValue('700');
});

test('unchanged saved project remains discoverable after filtered repeat save',async({page})=>{
  await page.goto('/');
  await page.locator('.navitem[data-view="projects"]').click();
  await page.locator('#project-name').fill('Repeat save');
  await page.locator('#project-save').click();
  await page.locator('#project-filter').fill('unrelated-search');
  await page.locator('#project-save').click();
  await expect(page.locator('#project-filter')).toHaveValue('');
  await expect(page.locator('#project-name')).toHaveValue('Repeat save');
  await expect(page.locator('#project-list')).toContainText('Repeat save');
  await expect(page.locator('#project-status')).toContainText('Already saved');
});

test('editor warns when another tab changes the same draft',async({context})=>{
  const first=await context.newPage();
  const second=await context.newPage();
  await first.goto('/');
  await second.goto('/');
  await first.locator('#source').fill('<h1>Other tab edit</h1>');
  await expect(first.locator('#save-indicator')).toContainText('Saved locally');
  await expect(second.locator('#save-indicator')).toContainText('Another tab changed this draft');
  await first.close();
  await second.close();
});

test('inspector edits commented important styles and clears the last declaration', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source').fill('<style>p {color: red !important}</style><p style="/* old */ color: #002200 !important">Title</p><p style="text-align: center">Other</p>');
  await page.locator('#text-inspector summary').click();
  await page.locator('#inspector-refresh').click();
  await page.locator('#inspector-target').selectOption('0');
  await expect(page.locator('#inspector-color')).toHaveValue('#002200');
  await page.locator('#inspector-color').fill('#18c9e8');
  await page.locator('#inspector-apply').click();
  const preview = page.frameLocator('#preview');
  await expect(preview.locator('p').first()).toHaveCSS('color', 'rgb(24, 201, 232)');
  await page.locator('#inspector-target').selectOption('1');
  await page.locator('#inspector-align').selectOption('');
  await page.locator('#inspector-apply').click();
  await expect(preview.locator('p').nth(1)).not.toHaveAttribute('style', '');
  await expect(page.locator('#source')).toHaveValue(/<p>Other<\/p>/);
});

test('stale editor cannot overwrite another tabs saved draft',async({context})=>{
  const first=await context.newPage();
  const second=await context.newPage();
  await first.goto('/');
  await second.goto('/');
  await first.locator('#source').fill('<h1>Newer draft</h1>');
  await expect(first.locator('#save-indicator')).toContainText('Saved locally');
  await second.locator('#source').fill('<h1>Stale draft</h1>');
  await expect(second.locator('#save-indicator')).toContainText('Save paused');
  const key=await first.evaluate(()=>Object.keys(localStorage).find(k=>k.endsWith('-editor')));
  expect(await first.evaluate(key=>localStorage.getItem(key),key)).toBe('<h1>Newer draft</h1>');
  await first.close();
  await second.close();
});
