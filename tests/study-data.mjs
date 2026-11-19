import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const data=fs.readFileSync(new URL('../dist/data.js',import.meta.url),'utf8');
const micro=fs.readFileSync(new URL('../dist/micro-data.js',import.meta.url),'utf8');
const deep=fs.readFileSync(new URL('../dist/deep-data.js',import.meta.url),'utf8');
const expansion=fs.readFileSync(new URL('../dist/expansion-data.js',import.meta.url),'utf8');
const enrich=fs.readFileSync(new URL('../dist/enrichment.js',import.meta.url),'utf8');
const context={localStorage:{getItem:()=>JSON.stringify({version:1,records:{'debt':{status:'weak',note:'旧版笔记',updatedAt:''}}})}};
vm.createContext(context);
const validateCore=app.slice(app.indexOf('function validateRecords('),app.indexOf("let activeModule="));
const functions=enrich.slice(0,enrich.indexOf("document.addEventListener('click'"));
vm.runInContext(data+'\n'+micro+'\n'+deep+'\n'+expansion+'\nconst nodeById=Object.fromEntries(NODES.map(n=>[n.id,n]));const statusLabels={unstarted:"未开始",learning:"学习中",mastered:"已掌握",weak:"需巩固"};\n'+validateCore+'\n'+functions+'\nthis.api={NODES,MODULES,MICRO_POINTS,DEEP_NOTES,NODE_READING_INDEX,COMPARISONS,EXAM_GUIDES,READING_LINKS,MICRO_BY_NODE,parseStudyBackup,validateMicroRecords,normalizeStudySearch};',context);
const a=context.api,ids=new Set(a.NODES.map(n=>n.id));
assert.equal(new Set(a.MICRO_POINTS.map(p=>p.id)).size,a.MICRO_POINTS.length);assert(a.MICRO_POINTS.some(p=>p.id==='history-wilson-1887'));
for(const n of a.NODES){for(let i=1;i<=3;i++)assert(a.MICRO_POINTS.some(p=>p.id===n.id+'-'+i));assert.equal(a.EXAM_GUIDES[n.id].length,3);for(const id of [...n.pre,...n.related])assert(ids.has(id));}
for(const p of a.MICRO_POINTS){assert(ids.has(p.node));assert(['概念','理论','易混','应用'].includes(p.type));assert(p.title&&p.body.length>=30&&p.example.length>=10);}
assert.equal(a.COMPARISONS.length,12);for(const c of a.COMPARISONS){c.nodes.forEach(id=>assert(ids.has(id)));assert(c.rows.length>=3);assert(c.rows.every(r=>r.length===3));}
assert(a.READING_LINKS.every(r=>new URL(r.url).protocol==='https:'));
const old=a.parseStudyBackup({app:'public-admin-atlas',version:1,records:{debt:{status:'weak',note:'旧版笔记',updatedAt:'2026-01-01'}}});assert.equal(old.records.debt.note,'旧版笔记');assert.equal(Object.keys(old.microRecords).length,0);
const current={app:'public-admin-atlas',version:2,records:old.records,microRecords:{'public-interest-1':{status:'mastered',starred:true,updatedAt:'2026-01-01'}}};const roundtrip=a.parseStudyBackup(JSON.parse(JSON.stringify(current)));assert.equal(roundtrip.records.debt.status,'weak');assert.equal(roundtrip.microRecords['public-interest-1'].starred,true);assert.equal(roundtrip.microRecords['public-interest-1'].status,'mastered');
const expanded=a.parseStudyBackup({...current,microRecords:{...current.microRecords,'history-wilson-1887':{status:'weak',starred:true,updatedAt:'2026-11-03'}}});assert.equal(expanded.microRecords['public-interest-1'].status,'mastered');assert.equal(expanded.microRecords['history-wilson-1887'].status,'weak');
const landBackup=a.parseStudyBackup({...current,microRecords:{...current.microRecords,'finance-land-revenue':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(landBackup.microRecords['finance-land-revenue'].status,'weak');assert.equal(landBackup.microRecords['public-interest-1'].status,'mastered');
const debtBackup=a.parseStudyBackup({...current,microRecords:{...landBackup.microRecords,'finance-local-government-debt':{status:'mastered',starred:true,updatedAt:'2026-11-04'}}});assert.equal(debtBackup.microRecords['finance-local-government-debt'].status,'mastered');assert.equal(debtBackup.microRecords['finance-land-revenue'].status,'weak');assert.equal(debtBackup.records.debt.note,'旧版笔记');
const soeBackup=a.parseStudyBackup({...current,microRecords:{...debtBackup.microRecords,'soe-reform-governance':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(soeBackup.microRecords['soe-reform-governance'].status,'weak');assert.equal(soeBackup.microRecords['finance-local-government-debt'].status,'mastered');assert.equal(soeBackup.records.debt.note,'旧版笔记');
const remedyBackup=a.parseStudyBackup({...current,microRecords:{...soeBackup.microRecords,'admin-remedies-review-litigation':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(remedyBackup.microRecords['admin-remedies-review-litigation'].status,'weak');assert.equal(remedyBackup.microRecords['soe-reform-governance'].status,'weak');assert.equal(remedyBackup.records.debt.note,'旧版笔记');
const ecologyBackup=a.parseStudyBackup({...current,microRecords:{...remedyBackup.microRecords,'admin-ecology-riggs':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(ecologyBackup.microRecords['admin-ecology-riggs'].status,'weak');assert.equal(ecologyBackup.microRecords['admin-remedies-review-litigation'].status,'weak');assert.equal(ecologyBackup.records.debt.note,'旧版笔记');
const ethicsBackup=a.parseStudyBackup({...current,microRecords:{...ecologyBackup.microRecords,'research-ethics-participants':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(ethicsBackup.microRecords['research-ethics-participants'].status,'weak');assert.equal(ethicsBackup.microRecords['admin-ecology-riggs'].status,'weak');assert.equal(ethicsBackup.records.debt.note,'旧版笔记');
const methodsBackup=a.parseStudyBackup({...current,microRecords:{...ethicsBackup.microRecords,'methods-qualitative-quantitative':{status:'weak',starred:true,updatedAt:'2026-11-04'}}});assert.equal(methodsBackup.microRecords['methods-qualitative-quantitative'].status,'weak');assert.equal(methodsBackup.microRecords['research-ethics-participants'].status,'weak');assert.equal(methodsBackup.records.debt.note,'旧版笔记');
assert.throws(()=>a.parseStudyBackup({...current,microRecords:{'public-interest-1':{status:'invalid',starred:true}}}));assert.throws(()=>a.parseStudyBackup({...current,microRecords:[]}));assert.throws(()=>a.parseStudyBackup({...current,version:99}));assert.throws(()=>a.parseStudyBackup({...current,records:{debt:{status:'__proto__',note:''}}}));
const historyIds=['history-taylor-scientific','history-gulick-urwick','history-follett-integration'];
const historyBackup=a.parseStudyBackup({...current,microRecords:{...current.microRecords,...Object.fromEntries(historyIds.map(id=>[id,{status:'weak',starred:true,updatedAt:'2026-11-18'}]))}});
for(const id of historyIds){assert(a.MICRO_POINTS.some(p=>p.id===id));assert.equal(historyBackup.microRecords[id].status,'weak');assert.equal(historyBackup.microRecords[id].starred,true);}
assert.equal(historyBackup.records.debt.note,'旧版笔记');assert.equal(historyBackup.microRecords['public-interest-1'].status,'mastered');
const leadershipIds=['leadership-traits-behavior-context','leadership-decision-participation'];
const leadershipBackup=a.parseStudyBackup({...current,microRecords:{...historyBackup.microRecords,...Object.fromEntries(leadershipIds.map(id=>[id,{status:'weak',starred:true,updatedAt:'2026-11-18'}]))}});
for(const id of leadershipIds){assert(a.MICRO_POINTS.some(p=>p.id===id));assert.equal(leadershipBackup.microRecords[id].status,'weak');assert.equal(leadershipBackup.microRecords[id].starred,true);}
assert.equal(leadershipBackup.records.debt.note,'旧版笔记');assert.equal(leadershipBackup.microRecords['history-taylor-scientific'].status,'weak');
assert.equal(a.normalizeStudySearch('三 E'),a.normalizeStudySearch('三E'));
console.log('PASS: '+a.MICRO_POINTS.length+' points / 36 nodes / 6 modules; old IDs preserved; v1/v2 backups, expanded-point roundtrip, invalid-backup rejection, normalized search.');

assert.equal(Object.keys(a.DEEP_NOTES).length,a.MICRO_POINTS.length);
const allParagraphs=[];
for(const p of a.MICRO_POINTS){const d=a.DEEP_NOTES[p.id];assert(d,p.id);assert.equal(Object.keys(d).length,5);assert(Object.values(d).every(t=>typeof t==='string'&&t.length>=28),p.id);assert(Object.values(d).join('').length>=240,p.id);allParagraphs.push(...Object.values(d));}
assert.equal(new Set(allParagraphs).size,a.MICRO_POINTS.length*5,'Detailed paragraphs must be individually written.');
for(const n of a.NODES){assert(a.NODE_READING_INDEX[n.id].length);a.NODE_READING_INDEX[n.id].forEach(i=>assert(a.READING_LINKS[i],n.id+' invalid reading index'));}
assert.equal(a.READING_LINKS.length,14);
assert(a.DEEP_NOTES['policy-change-3'].limits.includes('沉没成本'));
console.log('PASS: all '+a.MICRO_POINTS.length+' detailed explanations, distinct paragraphs, complete topic reading links.');
