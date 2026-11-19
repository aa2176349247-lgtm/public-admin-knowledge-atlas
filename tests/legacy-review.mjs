import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const research=JSON.parse(fs.readFileSync('content/research.json','utf8'));
const reviews=JSON.parse(fs.readFileSync('content/legacy-reviews.json','utf8')).entries;
const c=vm.createContext({});
vm.runInContext(['data','micro-data','deep-data','expansion-data'].map(name=>fs.readFileSync(`dist/${name}.js`,'utf8')).join('\n')+';this.data={MICRO_POINTS,DEEP_NOTES};',c);
const fields=['body','example','interpretation','mechanism','caseAnalysis','limits','exam'];
const expansionIds=new Set(JSON.parse(fs.readFileSync('content/expansion.json','utf8')).map(p=>p.id));
for(const [id,lesson] of Object.entries(research.lessons)){
  if(lesson.fullVerified&&!expansionIds.has(id)) assert(reviews[id],`${id}: missing legacy review`);
}
for(const [id,review] of Object.entries(reviews)){
  const p=c.data.MICRO_POINTS.find(point=>point.id===id);
  assert(p&&!expansionIds.has(id),`${id}: expected a legacy point`);
  assert(research.lessons[id]?.fullVerified,`${id}: status mismatch`);
  assert.equal(research.lessons[id].verifiedAt,review.reviewedAt);
  assert(review.scope&&review.changes&&review.sources.length);
  for(const source of review.sources) assert(research.sources[source]&&research.lessons[id].sourceIds.includes(source),`${id}: missing source ${source}`);
  const content={body:p.body,example:p.example,...c.data.DEEP_NOTES[id]};
  assert.deepEqual(Object.keys(review.fieldHashes).sort(),[...fields].sort());
  for(const field of fields){
    assert(review.evidence[field],`${id}.${field}: missing evidence`);
    assert.equal(crypto.createHash('sha256').update(content[field]).digest('hex'),review.fieldHashes[field],`${id}.${field}: text changed since review`);
  }
}
console.log(`PASS: ${Object.keys(reviews).length} legacy reviews have sources, seven field explanations and matching text hashes.`);
