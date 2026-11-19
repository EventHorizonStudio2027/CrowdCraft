'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
test('studio inline scripts compile as valid JavaScript',()=>{
 assert.equal(scripts.length,9);
 for(const [i,script] of scripts.entries())assert.doesNotThrow(()=>new vm.Script(script,{filename:'studio-inline-'+i+'.js'}));
});
test('studio uses isolated preview and restrictive content security policy',()=>{
 assert.match(html,/<iframe[^>]*sandbox="allow-scripts"/);
 assert.match(html,/Content-Security-Policy/);
 for(const directive of ["default-src","connect-src","form-action","base-uri"])assert.ok(html.includes(directive),directive);
 assert.doesNotMatch(html,/<iframe[^>]*allow-same-origin/);
});
test('starter template parses and contains valid executable scripts',()=>{
 const match=scripts[0].match(/const starter=("(?:\\.|[^"\\])*");let timer;/);
 assert.ok(match,'starter JSON literal not found');
 const starter=JSON.parse(match[1]);
 assert.match(starter,/<!doctype html>/i);
 const inner=[...starter.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(inner.length>0,'starter should be interactive');
 for(const m of inner)assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'starter.js'}));
});
test('editing, local persistence, keyboard save and export remain wired',()=>{
 for(const token of ['source.addEventListener("input"','localStorage.setItem','localStorage.getItem','e.metaKey||e.ctrlKey','new Blob([source.value]'])assert.ok(scripts[0].includes(token),token);
});

test('local project library has save, restore, backup and safe text rendering',()=>{assert.match(html,/id="project-save"/);assert.match(html,/id="project-import"/);assert.match(html,/id="project-list"/);assert.match(html,/crowd-library-v1/);assert.match(scripts[2],/title\.textContent=p\.name/);assert.match(scripts[2],/new Set\(x\.map\(p=>p\.id\)\)/);});

test('studio viewport controls and accessible editor feedback exist',()=>{assert.match(html,/data-width="390px"/);assert.match(html,/data-width="768px"/);assert.match(html,/id="editor-metrics"/);assert.match(html,/id="preview-refresh"/);assert.match(scripts[3],/setRangeText/);assert.match(scripts[3],/aria-pressed/);});

test('version history has bounded snapshots and restore controls',()=>{assert.match(html,/id="snapshot-save"/);assert.match(html,/id="snapshot-list"/);assert.match(scripts[4],/maxCount=15,maxBytes=8000000/);assert.match(scripts[4],/stopImmediatePropagation/);assert.match(scripts[4],/editor\.dispatchEvent/);assert.match(scripts[4],/localStorage\.setItem/);});

test('editor find replace and HTML diagnostics are wired',()=>{assert.match(html,/id="editor-find"/);assert.match(html,/id="editor-replace-all"/);assert.match(html,/id="diagnostics-status"/);assert.match(scripts[5],/DOMParser/);assert.match(scripts[5],/setRangeText/);assert.match(scripts[5],/editor\.dispatchEvent/);});

test('creation snippets and focus mode are available',()=>{assert.match(html,/class="snippet-bar"/);assert.match(html,/id="editor-focus"/);assert.match(scripts[6],/setRangeText/);assert.match(scripts[6],/String\.fromCharCode\(92,110\)/);assert.match(scripts[6],/studio-focused/);assert.match(scripts[6],/dispatchEvent/);});

test('document outline supports source navigation and filters',()=>{assert.match(html,/id="outline-list"/);assert.match(html,/data-filter="structure"/);assert.match(html,/data-filter="assets"/);assert.match(scripts[7],/setSelectionRange/);assert.match(scripts[7],/aria-pressed/);assert.match(scripts[7],/replaceChildren/);});

test('project library filter and sort are connected',()=>{assert.match(html,/id="project-filter"/);assert.match(html,/id="project-sort"/);assert.match(html,/id="project-count"/);assert.match(scripts[2],/article\.dataset\.updated=p\.updated/);assert.match(scripts[8],/MutationObserver/);assert.match(scripts[8],/insertBefore/);});

test('restore navigation, focus escape, and library empty state are wired',()=>{assert.match(html,/id="project-no-results"/);assert.match(html,/class="library-hint"/);assert.match(scripts[2],/source\.focus\(\)/);assert.match(scripts[6],/e\.key==='Escape'/);assert.match(scripts[8],/project-no-results/);});
