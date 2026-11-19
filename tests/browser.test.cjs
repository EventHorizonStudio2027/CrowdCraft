'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('browser studio workflow: editor, snippets, project recovery and viewport', async () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const server = http.createServer((req, res) => {
    if (req.url === '/assets/logo.svg' || req.url === '/assets/brand-wordmark.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end(fs.readFileSync('.' + req.url));
      return;
    }
    if (req.url !== '/') { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto('http://127.0.0.1:' + server.address().port);
    for (const path of ['assets/logo.svg', 'assets/brand-wordmark.svg']) {
      const image = page.locator('img[src="' + path + '"]').first();
      assert.equal(await image.evaluate(el => el.complete && el.naturalWidth > 0), true, path + ' loads as a real image');
    }
    await page.keyboard.press('Control+k');
    assert.equal(await page.locator('#command-dialog').isVisible(), true, 'command palette opens');
    await page.locator('#command-search').fill('Open studio');
    await page.locator('#command-search').press('Enter');
    assert.equal(await page.locator('#studio-view').isVisible(), true, 'command palette navigates');
    const editor = page.locator('#source');
    assert.ok((await editor.inputValue()).length > 0, 'starter loads');
    await editor.fill('alpha\nbeta');
    await page.locator('#editor-line').fill('2');
    await page.locator('#editor-go-line').click();
    assert.match(await page.locator('#editor-selection').innerText(), /Line 2/);
    await editor.fill('alpha\nbeta');
    await editor.evaluate(el => el.setSelectionRange(0,0));
    await page.locator('#editor-indent').click();
    assert.match(await editor.inputValue(), /^  alpha/);
    await page.locator('#editor-outdent').click();
    assert.match(await editor.inputValue(), /^alpha/);
    await page.locator('#reset').click();
    await page.locator('[data-snippet="loop"]').click();
    const source = await editor.inputValue();
    assert.ok(source.includes('\n'), 'inserted snippet contains real line breaks');
    assert.ok(!source.includes('\\n  '), 'snippet does not contain literal newline escapes');
    await page.locator('#editor-find').fill('script');
    assert.match(await page.locator('#find-status').innerText(), /match/);
    await page.locator('#preview-pause').click();
    assert.equal(await page.locator('#preview-pause').getAttribute('aria-pressed'), 'true');
    const pausedHtml = await page.locator('#preview').evaluate(el => el.srcdoc);
    await editor.fill('<!doctype html><title>Paused update</title><p>Paused update</p>');
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#preview').evaluate(el => el.srcdoc), pausedHtml, 'paused preview remains unchanged');
    await page.locator('#preview-refresh').click();
    assert.match(await page.locator('#preview').evaluate(el => el.srcdoc), /Paused update/, 'manual refresh renders latest source');
    await page.locator('#preview-pause').click();
    assert.equal(await page.locator('#preview-pause').getAttribute('aria-pressed'), 'false');
    await editor.fill(source);
    await page.locator('#preview-expand').click();
    assert.equal(await page.locator('#preview-expand').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#preview-expand').getAttribute('aria-expanded'), 'false');
    await page.locator('[data-width="390px"]').click();
    assert.equal(await page.locator('#preview').evaluate(el => el.style.width), '390px');
    await page.locator('#snapshot-save').click();
    assert.match(await page.locator('#snapshot-status').innerText(), /saved/i);
    await page.locator('[data-view="projects"]').click();
    await page.locator('#project-name').fill('Browser test project');
    await page.locator('#project-save').click();
    assert.match(await page.locator('#project-list').innerText(), /Browser test project/);
    await page.locator('#project-filter').fill('not-a-match');
    assert.match(await page.locator('#project-count').innerText(), /0 of 1/);
    await page.locator('#project-filter').fill('Browser test');
    assert.match(await page.locator('#project-count').innerText(), /1 of 1/);
    await page.locator('#project-sort').selectOption('name');
    await page.locator('[data-view="studio"]').click();
    await editor.fill('<!doctype html><title>Changed</title><h1>Changed</h1>');
    await page.locator('[data-view="projects"]').click();
    await page.locator('#project-list button').first().click();
    assert.equal(await page.locator('#studio-view').isVisible(), true, 'restoring a project opens Studio');
    assert.equal(await editor.inputValue(), source);
    await page.locator('[data-view="studio"]').click();
    await page.locator('#editor-focus').click();
    assert.equal(await page.locator('#editor-focus').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#editor-focus').getAttribute('aria-pressed'), 'false', 'Escape exits focus mode');
    await page.locator('#visual-builder summary').click();
    await page.locator('#builder-title').fill('Visual Builder Test');
    const beforeGeneration = await editor.inputValue();
    await page.locator('#builder-generate').click();
    assert.match(await editor.inputValue(), /Visual Builder Test/, 'visual builder generated source');
    await page.locator('#builder-undo').click();
    assert.equal(await editor.inputValue(), beforeGeneration, 'undo restores source before generation');
    await page.locator('#builder-undo').click();
    assert.match(await editor.inputValue(), /Visual Builder Test/, 'undo toggles generated source back');
    assert.match(await page.locator('#builder-status').innerText(), /restored/i);
    await page.waitForTimeout(450);
    const savedDraft = await editor.inputValue();
    await page.reload();
    await page.locator('[data-view="studio"]').click();
    assert.equal(await page.locator('#source').inputValue(), savedDraft, 'autosaved draft survives reload');
    await page.locator('[data-view="projects"]').click();
    assert.match(await page.locator('#project-list').innerText(), /Browser test project/, 'saved library survives reload');
    await page.locator('[data-view="studio"]').click();
    await editor.fill('<!doctype html><h1>Repeated</h1><h1>Repeated</h1>');
    await page.locator('#text-inspector').evaluate(el => el.open = false);
    await page.locator('#text-inspector summary').click();
    await page.locator('#inspector-pick').click();
    await page.locator('#preview-refresh').click();
    await page.frameLocator('#preview').locator('h1').nth(1).click();
    assert.equal(await page.locator('#inspector-target').inputValue(), '1', 'duplicate text selects clicked occurrence');
    assert.equal(await page.frameLocator('#preview').locator('h1').nth(1).getAttribute('data-crowd-picked'), '', 'clicked duplicate receives selection highlight');
    assert.equal(await page.frameLocator('#preview').locator('h1').first().getAttribute('data-crowd-picked'), null, 'other duplicate is not highlighted');
    await page.locator('#inspector-pick').click();
    await page.locator('#text-inspector').evaluate(el => el.open = false);
    await editor.fill('<!doctype html><title>Test</title><h1>Old heading</h1><p>Old paragraph</p>');
    await page.locator('#text-inspector summary').click();
    await page.locator('#inspector-pick').click();
    await page.locator('#preview-refresh').click();
    await page.frameLocator('#preview').locator('h1').click();
    assert.equal(await page.locator('#inspector-target').inputValue(), '0', 'preview click selects heading');
    await page.locator('#inspector-pick').click();
    await page.locator('#inspector-target').selectOption('0');
    await page.locator('#inspector-value').fill('New <safe> & clear');
    await page.locator('#inspector-color').fill('#18c9e8');
    await page.locator('#inspector-size').fill('28');
    await page.locator('#inspector-apply').click();
    assert.match(await editor.inputValue(), /New &lt;safe&gt; &amp; clear/, 'inspector safely updates source text');
    assert.match(await editor.inputValue(), /color: #18c9e8/, 'inspector saves chosen color');
    assert.match(await editor.inputValue(), /font-size: 28px/, 'inspector saves chosen font size');
    await page.locator('#reset').click();
    assert.match(await page.locator('#source').inputValue(), /Quick Notes|Star Catcher/i, 'reset loads starter');
    assert.match(await page.locator('#save-indicator').innerText(), /Saved locally/);
    assert.deepEqual(errors, [], 'no page errors');
  } catch (error) {
    if (page) {
      try { fs.mkdirSync('test-artifacts', { recursive: true }); await page.screenshot({ path: 'test-artifacts/browser-failure.png', fullPage: true }); fs.writeFileSync('test-artifacts/error.txt', String(error.stack || error)); } catch {}
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
