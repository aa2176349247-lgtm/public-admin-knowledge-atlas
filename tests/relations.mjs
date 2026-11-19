import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=name=>fs.readFileSync('dist/'+name+'.js','utf8');
const source=read('relations');
const core=source.slice(0,source.indexOf('const pointRelationEdges='));
const c=vm.createContext({});
vm.runInContext(['data','micro-data','deep-data','expansion-data','research-data'].map(read).join('\n')+
  '\nconst normalizeStudySearch=value=>String(value).toLowerCase().replace(/\\s+/g,\'\');\n'+core+
  '\nthis.api={edges:buildPointRelations(RESEARCH,MICRO_POINTS),filterPointRelations,POINT_RELATION_TYPES,points:MICRO_POINTS,research:RESEARCH};',c);
const {edges,filterPointRelations,POINT_RELATION_TYPES,points,research}=c.api;
const byId=Object.fromEntries(points.map(p=>[p.id,p]));
const expected=Object.values(research.lessons).reduce((n,l)=>n+l.relations.length,0);
assert.equal(edges.length,expected);
assert.deepEqual(new Set(edges.map(e=>e.type)),new Set(['前置','组成','对照','争论','应用']));
for(const e of edges){assert(byId[e.source]);assert(byId[e.target]);assert(POINT_RELATION_TYPES[e.type].description);assert(e.why);}
const prereq=filterPointRelations(edges,'','前置','emergency-risk-communication',byId,research);
assert(prereq.some(e=>e.source==='emergency-risk-communication'&&e.target==='emergency-cycle-rights'));
assert(prereq.every(e=>e.type==='前置'&&(e.source==='emergency-risk-communication'||e.target==='emergency-risk-communication')));
const alias=filterPointRelations(edges,'woodrow wilson','all','all',byId,research);
assert(alias.some(e=>e.source==='history-wilson-1887'));
assert.equal(filterPointRelations(edges,'','all','a-point-not-present',byId,research).length,0);
assert.equal(filterPointRelations(edges,'no such relation text','all','all',byId,research).length,0);
console.log('PASS: '+edges.length+' editorial links with explanations; valid endpoints, five types, direction, combined filters, alias search and empty results.');
