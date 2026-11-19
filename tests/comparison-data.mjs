import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const r=JSON.parse(fs.readFileSync('content/research.json','utf8')),c=vm.createContext({});vm.runInContext(['data','micro-data','deep-data','expansion-data'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('\n')+';this.data={COMPARISONS,MICRO_POINTS};',c);
const ids=new Set(c.data.MICRO_POINTS.map(p=>p.id)),tables=c.data.COMPARISONS;
assert.equal(tables.length,12);assert.equal(new Set(tables.map(t=>t.id)).size,12);assert.equal(Object.keys(r.comparisonReviews).length,12);
assert.deepEqual(Object.keys(r.comparisonGuides).sort(),Array.from(tables,t=>t.id).sort());
for(const table of tables){assert(r.comparisonGuides[table.id].length);for(const id of r.comparisonGuides[table.id])assert(ids.has(id),id);const review=r.comparisonReviews[table.id];if(review){assert(review.scope&&review.reviewedAt);assert(review.sourceIds.length);for(const id of review.sourceIds)assert(r.sources[id]?.readScope,id);assert.equal(crypto.createHash('sha256').update(JSON.stringify(table)).digest('hex'),review.contentHash,`${table.id}: changed since review`);}}
assert(r.comparisonReviews['performance-loop']);assert(!tables.find(t=>t.id==='policy-output').rows[0][1].includes('活动'));
console.log('PASS: twelve stable comparisons, precise point links, twelve scoped reviews with exact hashes and activity/output distinction.');
