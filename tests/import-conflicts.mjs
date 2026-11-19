import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const line=fs.readFileSync('dist/app.js','utf8').split('\n').find(s=>s.startsWith("$('importBtn').addEventListener"));
assert(line);
async function run({overlap=false,accept=true,failSave=false}) {
  const listeners={}, notices=[];
  const ctx={records:{a:{note:'原笔记'}},microRecords:{x:{starred:true}},storageAvailable:true,
    $:id=>({addEventListener:(event,fn)=>{listeners[id+event]=fn;}}),
    parseStudyBackup:data=>data,confirm:()=>accept,
    save:()=>{ctx.storageAvailable=!failSave;},toast:s=>notices.push(s),
    updateStats(){},renderGraph(){},renderDetail(){},renderReview(){},renderPaths(){},renderLibrary(){},renderMicroReview(){}};
  vm.runInNewContext(line,ctx);
  const data=overlap?{records:{a:{note:'备份笔记'}},microRecords:{x:{starred:false}}}:{records:{b:{note:'新笔记'}},microRecords:{y:{starred:true}}};
  const input={files:[{size:10,text:async()=>JSON.stringify(data)}],value:'chosen'};
  await listeners.importFilechange({target:input});
  assert.equal(input.value,'');
  return {ctx,notices};
}
let r=await run({overlap:true,accept:false}); assert.equal(r.ctx.records.a.note,'原笔记'); assert.equal(r.ctx.microRecords.x.starred,true);
r=await run({overlap:true}); assert.equal(r.ctx.records.a.note,'备份笔记'); assert.equal(r.ctx.microRecords.x.starred,false);
r=await run({}); assert.equal(r.ctx.records.a.note,'原笔记'); assert.equal(r.ctx.records.b.note,'新笔记');
r=await run({failSave:true}); assert(!r.notices.some(s=>s.startsWith('已导入')));
console.log('PASS: backup conflict cancellation, overwrite, merge and failed-save messaging');
