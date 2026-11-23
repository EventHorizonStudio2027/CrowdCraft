import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('all inline application scripts parse as JavaScript',()=>{
  const scripts=[...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)];
  assert.ok(scripts.length>=5,'expected the studio application scripts');
  scripts.forEach((match,index)=>assert.doesNotThrow(()=>new vm.Script(match[1],{filename:'inline-'+index+'.js'})));
});

test('preview remains isolated from studio origin and storage',()=>{
  const preview=html.match(/<iframe\\b[^>]*id="preview"[^>]*>/i)?.[0];
  assert.ok(preview,'preview iframe missing');
  assert.match(preview,/sandbox="allow-scripts"/);
  assert.doesNotMatch(preview,/allow-same-origin|allow-top-navigation|allow-popups/);
  assert.match(html,/connect-src \\'none\\'/);
});

test('editor, preview and project library controls exist',()=>{
  for(const id of ['source','preview','project-name','project-save','project-list','project-backup','project-import']){
    assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
  }
});

test('local project saving and preview update are implemented',()=>{
  assert.match(html,/localStorage\\.setItem/);
  assert.match(html,/frame\\.srcdoc\\s*=/);
  assert.match(html,/function save\\(/);
  assert.match(html,/function render\\(/);
});

test('collaboration controls are described as local, not remote synchronization',()=>{
  assert.match(html,/crowd-proposals-v1/);
  assert.match(html,/proposal-import/);
  assert.match(html,/proposal-export/);
});
