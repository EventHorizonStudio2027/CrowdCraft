'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('browser studio workflow: editor, snippets, project recovery and viewport', async () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const server = http.createServer((req, res) => {
    if (req.url === '/assets/logo.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end(fs.readFileSync('assets/logo.svg'));
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.locator('[data-view="studio"]').click();
    const editor = page.locator('#source');
    assert.ok((await editor.inputValue()).length > 0, 'starter loads');
    await page.locator('[data-snippet]').first().click();
    const source = await editor.inputValue();
    assert.ok(source.includes('\n'), 'inserted snippet contains real line breaks');
    assert.ok(!source.includes('\\n  '), 'snippet does not contain literal newline escapes');
    await page.locator('#editor-find').fill('section');
    assert.match(await page.locator('#find-status').innerText(), /match/);
    await page.locator('[data-width="390px"]').click();
    assert.equal(await page.locator('#preview').evaluate(el => el.style.width), '390px');
    await page.locator('#snapshot-save').click();
    assert.match(await page.locator('#snapshot-status').innerText(), /saved/i);
    await page.locator('[data-view="projects"]').click();
    await page.locator('#project-name').fill('Browser test project');
    await page.locator('#project-save').click();
    assert.match(await page.locator('#project-list').innerText(), /Browser test project/);
    await page.locator('[data-view="studio"]').click();
    await editor.fill('<!doctype html><title>Changed</title><h1>Changed</h1>');
    await page.locator('[data-view="projects"]').click();
    await page.locator('#project-list button').first().click();
    assert.equal(await editor.inputValue(), source);
    await page.locator('[data-view="studio"]').click();
    await page.locator('#editor-focus').click();
    assert.equal(await page.locator('#editor-focus').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, [], 'no page errors');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
