import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=name=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const nodes=new Map();
const context={location:{hash:''},localStorage:{getItem:()=>null},captureNode:id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:''});return nodes.get(id);}};
vm.createContext(context);
const app=read('app.js'),enrich=read('enrichment.js'),reader=read('reader.js');
const code=[read('data.js'),read('micro-data.js'),read('deep-data.js'),read('expansion-data.js'),
'const $=captureNode;const nodeById=Object.fromEntries(NODES.map(n=>[n.id,n]));const moduleById=Object.fromEntries(MODULES.map(m=>[m.id,m]));const statusLabels={unstarted:"未开始",learning:"学习中",mastered:"已掌握",weak:"需巩固"};const ICONS={maximize:"test-maximize"};const icon=name=>"<svg>"+(ICONS[name]||"")+"</svg>";const escapeHTML=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\u0022/g,"&quot;").replace(/\u0027/g,"&#39;");',
app.slice(app.indexOf('function validateRecords('),app.indexOf('let activeModule=')),
enrich.slice(0,enrich.indexOf("document.addEventListener('click'")),
reader.slice(0,reader.indexOf("$('pointReader').addEventListener")),
 'this.points=MICRO_POINTS;this.notes=DEEP_NOTES;'].join('\n');
vm.runInContext(code,context);
for(const p of context.points){vm.runInContext('readerPointId='+JSON.stringify(p.id)+';renderReader();this.related=readerRelatedPoints(readerPointId);',context);const html=nodes.get('pointReader').innerHTML;assert(html.includes(p.title),p.id);assert.equal((html.match(/class="reader-section"/g)||[]).length,7,p.id);for(const field of Object.values(context.notes[p.id]))assert(html.includes(field.replace(/&/g,'&amp;')),p.id+' missing explanation');assert(!html.includes('undefined'),p.id);assert(html.includes('data-reader-parent="'+p.node+'"'),p.id);assert(context.related.every(q=>q.node===p.node&&q.id!==p.id),p.id+' has an unexplained cross-topic recommendation');}
vm.runInContext('readerPointId=MICRO_POINTS[0].id;renderReader();',context);assert(nodes.get('pointReader').innerHTML.includes('data-reader-step="-1" disabled'));
vm.runInContext('readerPointId=MICRO_POINTS.at(-1).id;renderReader();',context);assert(nodes.get('pointReader').innerHTML.includes('data-reader-step="1" disabled'));
console.log('PASS: all '+context.points.length+' readers render their own explanation, seven sections, valid parent links, correct first/last navigation.');
