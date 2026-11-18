'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
test('studio has a single executable script with valid JavaScript',()=>{
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new vm.Script(scripts[0],{filename:'studio-inline.js'}));
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
