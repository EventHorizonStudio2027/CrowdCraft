'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
test('studio inline scripts compile as valid JavaScript',()=>{
 assert.equal(scripts.length,16);
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

test('visual builder has safe replacement confirmation and editable controls',()=>{assert.match(html,/id="visual-builder"/);assert.match(html,/id="builder-generate"/);assert.match(html,/id="builder-color"/);assert.match(scripts[9],/confirm\(/);assert.match(scripts[9],/dispatchEvent/);assert.match(scripts[9],/replaceAll\('&','&amp;'\)/);});

test('command palette and save state are wired',()=>{assert.match(html,/id="command-dialog"/);assert.match(html,/id="command-search"/);assert.match(html,/id="save-indicator"/);assert.match(scripts[10],/showModal\(\)/);assert.match(scripts[10],/metaKey\|\|e.ctrlKey/);assert.match(scripts[0],/clearTimeout\(timer\);source.value=starter/);});

test('preview pause, manual refresh and viewport preference are connected',()=>{assert.match(html,/id="preview-pause"/);assert.match(html,/id="preview-state"/);assert.match(scripts[0],/__previewPaused/);assert.match(scripts[3],/viewportKey/);assert.match(scripts[3],/__previewForce=true/);assert.match(scripts[3],/render\(\)/);});

test('generation can be reversed and preview has expanded and copy actions',()=>{assert.match(html,/id="builder-undo"/);assert.match(html,/id="preview-expand"/);assert.match(html,/id="preview-copy"/);assert.match(scripts[9],/previous=source.value/);assert.match(scripts[9],/undo.disabled=false/);assert.match(scripts[11],/preview-expanded/);assert.match(scripts[11],/navigator.clipboard.writeText/);});

test('source navigation and indentation controls are connected',()=>{for(const id of ['editor-line','editor-go-line','editor-indent','editor-outdent','editor-selection'])assert.ok(html.includes('id="'+id+'"'),id);assert.match(scripts[12],/setSelectionRange/);assert.match(scripts[12],/editor\.scrollTop/);assert.match(scripts[12],/e\.shiftKey/);assert.match(scripts[3],/e\.shiftKey/);});

test('visual text inspector limits edits to simple elements and protects newer source',()=>{for(const id of ['text-inspector','inspector-target','inspector-value','inspector-apply','inspector-refresh','inspector-status'])assert.ok(html.includes('id="'+id+'"'),id);assert.match(scripts[13],/editor.value!==scanned/);assert.match(scripts[13],/setRangeText/);assert.match(scripts[13],/replaceAll\('&','&amp;'\)/);assert.match(scripts[13],/entries.length>=120/);});

test('sandboxed preview text picking only trusts its own frame',()=>{assert.match(html,/id="inspector-pick"/);assert.match(scripts[0],/crowd-text-pick/);assert.match(scripts[13],/event.source!==preview.contentWindow/);assert.match(scripts[13],/picking=false/);assert.match(scripts[13],/matches.length>1/);});

test('text picker ignores embedded code and supports Escape dismissal',()=>{assert.match(scripts[13],/const masked=html.replace/);assert.match(scripts[13],/script\|style\|template/);assert.match(scripts[13],/e.key==='Escape'&&picking/);});

test('preview click interception is opt-in and does not affect normal gameplay',()=>{assert.match(scripts[0],/pickEnabled=false/);assert.match(scripts[0],/if\(!pickEnabled\)return/);assert.match(scripts[0],/e.preventDefault\(\)/);assert.match(scripts[13],/preview.addEventListener\('load'/);assert.match(scripts[13],/crowd-pick-mode/);});

test('official brand treatment is wired to app shell and feature icons',()=>{assert.match(html,/assets\/brand-wordmark\.svg/);assert.match(html,/class="brand-showcase"/);assert.match(html,/class="header-wordmark"/);assert.match(html,/class="feature-icon"/);assert.match(html,/prefers-reduced-motion/);assert.match(html,/<symbol id="/);});

test('studio exposes source link and accessible visual selection feedback',()=>{assert.match(html,/class="source-link"/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/data-crowd-picked/);assert.match(scripts[0],/crowd-highlight-text/);assert.match(scripts[13],/crowd-highlight-text/);assert.doesNotMatch(scripts[9],/confirm\('Restore the source from before the last generation\?'\)/);});

test('visual properties preserve unchanged styles and validate inputs',()=>{assert.match(html,/id="inspector-color"/);assert.match(html,/id="inspector-size"/);assert.match(scripts[13],/initialColor=color.value/);assert.match(scripts[13],/colorChanged\|\|sizeChanged/);assert.match(scripts[13],/Number.isInteger\(px\)/);assert.match(scripts[13],/editor.setRangeText/);});

test('properties panel exposes responsive alignment and typography controls',()=>{for(const id of ['inspector-color','inspector-size','inspector-align','inspector-weight'])assert.match(html,new RegExp('id="'+id+'"'));assert.match(scripts[13],/alignChanged/);assert.match(scripts[13],/weightChanged/);assert.match(scripts[13],/initialAlign/);assert.match(scripts[13],/initialWeight/);assert.match(html,/inspector-fields input\[type=color\]/);});

test('background styling and reset controls are wired into the visual inspector',()=>{assert.match(html,/id="inspector-background"/);assert.match(html,/id="inspector-reset"/);assert.match(scripts[13],/backgroundChanged/);assert.match(scripts[13],/initialBackground/);assert.match(scripts[13],/inspector-reset'\)\.addEventListener/);});

test('visual inspector provides bounded previous next element navigation',()=>{assert.match(html,/id="inspector-prev"/);assert.match(html,/id="inspector-next"/);assert.match(html,/id="inspector-count"/);assert.match(scripts[13],/previous\.addEventListener\('click'/);assert.match(scripts[13],/next\.addEventListener\('click'/);});

test('visual inspector exposes undo and protects against stale source restoration',()=>{assert.match(html,/id="inspector-undo"/);assert.match(scripts[13],/undoSource=editor\.value/);assert.match(scripts[13],/internalEdit/);assert.match(scripts[13],/inspector-undo'\)\.addEventListener/);});

test('preview picking refuses ambiguous duplicate occurrence and selection chip stays accessible',()=>{assert.match(html,/class="inspector-selection-chip" aria-live="polite"/);assert.match(scripts[13],/data\.occurrence\)\?data\.occurrence:-1/);assert.match(scripts[13],/preview\.addEventListener\('load'/);});

test('preview picking cancels on source edits and exposes active state',()=>{assert.match(scripts[13],/!internalEdit&&picking&&editor\.value!==scanned/);assert.match(scripts[13],/Preview picking stopped because the source changed/);assert.match(html,/\.inspector-actions #inspector-pick\[aria-pressed="true"\]/);});

test('preview picker retains complete text and selected chip has an active state',()=>{assert.doesNotMatch(scripts[0],/text:el\.textContent\.slice\(0,400\)/);assert.match(scripts[0],/text:el\.textContent,occurrence:/);assert.match(scripts[13],/dataset\.selected=String/);assert.match(html,/inspector-selection-chip\[data-selected="true"\]/);});

test('sandbox preview picker validates message origin and exposes a visible selection mode',()=>{assert.match(scripts[13],/event\.origin!==\x27null\x27/);assert.match(html,/Selection mode · Click text to edit/);assert.match(html,/\.preview-pick-banner:not\(\[hidden\]\)/);});

test('inspector source-line tooltip and reset remain synchronized',()=>{assert.match(scripts[13],/Source line /);assert.match(scripts[13],/\.title='No element selected'/);assert.match(scripts[13],/dataset\.selected=String/);});

test('browser validation and Pages deployment use a supported pinned Linux runner',()=>{
 for(const path of ['.github/workflows/validate.yml','.github/workflows/pages.yml']){
  const workflow=fs.readFileSync(path,'utf8');
  assert.match(workflow,/runs-on:\s*ubuntu-24\.04/,path);
  assert.doesNotMatch(workflow,/runs-on:\s*ubuntu-latest/,path);
  assert.match(workflow,/playwright install --with-deps chromium/,path);
 }
});
test('visual inspector exposes accessible focus and reduced motion',()=>{
 assert.match(html,/id="studio-inspector-polish"/);
 assert.match(html,/#text-inspector:focus-within/);
 assert.match(html,/#text-inspector button:focus-visible/);
 assert.match(html,/prefers-reduced-motion:reduce/);
});

test('sandbox picker announces readiness after refresh and retains selection styling',()=>{
 assert.match(html,/crowd-preview-ready/);
 assert.match(html,/event\.data\?\.type==='crowd-preview-ready'/);
 assert.match(html,/postMessage\(\{type:'crowd-pick-mode',enabled:picking\}/);
 assert.match(html,/box-shadow:0 0 0 6px rgba\(0,229,255,\.12\)/);
});

test('duplicate inspector options show occurrence and source line',()=>{
 assert.match(html,/repeated element /);
 assert.match(html,/\['\+repeated\+'\/'\+total\+'\]/);
 assert.match(html,/option\.title='Source line '/);
});

test('preview picker bridge keeps selection CSS outside executable JavaScript',()=>{
 assert.match(html,/const pickBridge='<meta http-equiv="Content-Security-Policy"/);
 assert.match(html,/!important\}<\/style><script>var pickEnabled=false/);
 assert.doesNotMatch(html,/<script><style>\[data-crowd-picked\]/);
});

test('preview picker bridge is installed before page content can be clicked',()=>{
 assert.ok(html.includes('const previewDocument='));
 assert.ok(html.includes("source.value.replace(/<\\/head\\s*>/i,pickBridge+'</head>')"));
 assert.ok(html.includes("source.value.replace(/<body\\b[^>]*>/i,match=>match+pickBridge)"));
 assert.ok(html.includes("'<head>'+pickBridge+'</head>'+source.value"));
 assert.ok(html.includes('frame.srcdoc=previewDocument'));
});

test('preview selection bridge validates parent messages and identifies repeated elements',()=>{
 assert.ok(html.includes('if(e.source!==parent)return'));
 assert.ok(html.includes('parent.postMessage({type:"crowd-preview-ready"}'));
 assert.ok(html.includes('occurrence:Array.from(document.querySelectorAll(el.tagName.toLowerCase()))'));
 assert.ok(html.includes("event.origin==='null'"));
});
test('inspector responsive layout retains accessible selected state',()=>{
 assert.ok(html.includes('id="inspector-layout-refinement"'));
 assert.ok(html.includes('id="inspector-selection-polish"'));
 assert.ok(html.includes('data-selected="true"'));
});

test('preview security policy is installed in the head before page scripts execute',()=>{
 assert.ok(html.includes("const pickBridge='<meta http-equiv=\"Content-Security-Policy\""));
 assert.ok(html.includes("default-src \\\'none\\\'; script-src \\\'unsafe-inline\\\'; style-src \\\'unsafe-inline\\\'"));
 assert.ok(html.includes("source.value.replace(/<\\/head\\s*>/i,pickBridge+'</head>')"));
 assert.ok(html.includes('frame.srcdoc=previewDocument'));
 assert.doesNotMatch(html,/frame\\.srcdoc=policy\\+previewDocument/);
});

test('picker mode re-arms on iframe load and hidden banner remains hidden',()=>{
 assert.ok(html.includes("preview.addEventListener('load',()=>{document.getElementById('preview-refresh').removeAttribute('aria-busy');if(picking)"));
 assert.ok(html.includes("type:'crowd-pick-mode',enabled:true"));
 assert.ok(html.includes('#preview-pick-banner[hidden]{display:none!important}'));
});

test('manual refresh cancels pending autosave rerender before replacing iframe',()=>{
 assert.ok(html.includes("document.getElementById('preview-refresh').addEventListener('click',()=>{document.getElementById('preview-refresh').setAttribute('aria-busy','true');clearTimeout(timer);save();window.__previewForce=true;"));
});

// Regression: drafts must survive navigation before the 350ms debounce completes.
test('pending edits are flushed before page hide and document visibility loss',()=>{
 assert.match(scripts[0],/function flushDraft\(\)/);
 assert.match(scripts[0],/window\.addEventListener\("pagehide",flushDraft\)/);
 assert.match(scripts[0],/document\.addEventListener\("visibilitychange"/);
 assert.match(scripts[0],/document\.visibilityState==="hidden"/);
 assert.match(scripts[0],/draftDirty=false;render\(\)/);
});
test('export and reset preserve the latest pending draft',()=>{
 assert.match(scripts[0],/flushDraft\(\);const url=URL\.createObjectURL/);
 assert.match(scripts[0],/if\(!flushDraft\(\)&&!confirm\(/);
});

test('critical queue actions provide accessible feedback and reliable exports',()=>{
 for(const id of ['proposal-feedback','project-status','preview-utility-status']){
  assert.match(html,new RegExp('id="'+id+'"[^>]*role="status"'),'Status announcements must be accessible: '+id);
 }
 assert.match(html,/setTimeout\(\(\)=>URL\.revokeObjectURL\(url\),60000\);feedback\.textContent='Exported '/,'Queue export should retain its download URL long enough for browser handoff');
 assert.match(html,/id="crowd-interaction-polish"/,'Interaction polish should be present');
 assert.match(html,/button:focus-visible/,'Keyboard focus must remain visible');
});

test('failed local saves keep dirty drafts and warn before unloading',()=>{
 assert.match(scripts[0],/if\(ok\)draftDirty=false/);
 assert.match(scripts[0],/window\.addEventListener\("beforeunload"/);
 assert.match(scripts[0],/e\.preventDefault\(\);e\.returnValue=""/);
});
test('reset requires explicit confirmation when storage is unavailable',()=>{
 assert.match(scripts[0],/Reset anyway\? Export your work first/);
 assert.match(scripts[0],/if\(!flushDraft\(\)&&!confirm\(/);
});
