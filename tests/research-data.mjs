import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const r=JSON.parse(fs.readFileSync('content/research.json','utf8'));const c=vm.createContext({});vm.runInContext(['data','micro-data','deep-data','expansion-data'].map(x=>fs.readFileSync('dist/'+x+'.js','utf8')).join('\n')+';this.points=MICRO_POINTS;',c);const ids=new Set(c.points.map(p=>p.id));
assert.equal(Object.keys(r.lessons).length,215);for(const [id,l] of Object.entries(r.lessons)){assert(ids.has(id),id);assert(['核心','进阶','拓展'].includes(l.level));assert(l.sections.length>=4&&l.quiz.length>=2);assert.equal(new Set(l.sections.map(s=>s.id)).size,l.sections.length);for(const s of l.sourceIds)assert(r.sources[s],s);for(const s of l.sections){assert(s.paragraphs.every(p=>p.length>30));if(s.table){assert(s.table.caption&&s.table.headers.length>=2);assert(s.table.rows.length);assert(s.table.rows.every(row=>row.length===s.table.headers.length&&row.every(cell=>typeof cell==='string'&&cell.length)));}}for(const edge of l.relations){assert(ids.has(edge.target),edge.target);assert(['前置','组成','对照','争论','应用'].includes(edge.type));assert(edge.why);}}
for(const s of Object.values(r.sources)){assert.equal(new URL(s.url).protocol,'https:');if(s.readUrl)assert.equal(new URL(s.readUrl).protocol,'https:');assert(s.readScope);}
for(const id of ['emergency-cycle-rights','emergency-risk-communication']){assert(r.lessons[id].sourceIds.includes('emergency-law-amendment-2026'),`${id}: missing 2026 emergency law amendment`);assert.equal(r.lessons[id].verifiedAt,'2026-11-11');}
assert.match(r.sources['emergency-law-2024'].readScope,/尚未体现2026/);
const coverage=JSON.parse(fs.readFileSync('KNOWLEDGE_COVERAGE.json','utf8'));assert.equal(coverage.existing.length,ids.size);assert.equal(new Set(coverage.existing.map(p=>p.id)).size,ids.size);assert.equal(coverage.roadmap.length,10);assert.deepEqual(new Set(coverage.existing.map(p=>p.id)),ids);
for(const domain of coverage.roadmap){for(const key of domain.sourceBasis)assert(r.sources[key]);for(const topic of domain.topics)for(const id of topic.existingIds)assert(ids.has(id),id);}
assert(coverage.roadmap.find(d=>d.domain==='政府治理与改革').topics.find(t=>t.title==='社会组织与第三部门').existingIds.includes('governance-third-sector'));
console.log('PASS: research sources, distinct sections, quiz and relation targets, '+ids.size+' coverage IDs and ten domains.');
const routeIds=new Set(r.readingPaths.map(route=>route.id));
assert.deepEqual(r.textbookIndex.map(book=>[book.id,book.chapters.length]),[['policy-analysis',12],['administrative-thought',19]]);
for(const book of r.textbookIndex){
 assert(book.title&&book.source);
 assert.equal(new Set(book.chapters.map(chapter=>chapter.title)).size,book.chapters.length);
 for(const {title,note,links} of book.chapters){
  assert(title&&note&&links.length);
  for(const link of links)assert(link.kind==='compare'||(link.kind==='route'?routeIds.has(link.id):link.kind==='point'&&ids.has(link.id)),`${title}: ${JSON.stringify(link)}`);
 }
}
