import fs from 'node:fs';
import vm from 'node:vm';
const points = JSON.parse(fs.readFileSync('content/expansion.json','utf8'));
const c=vm.createContext({});
vm.runInContext(['data','micro-data'].map(name=>fs.readFileSync('dist/'+name+'.js','utf8')).join('\n')+';this.nodes=NODES;this.points=MICRO_POINTS;',c);
const ids=new Set(c.points.map(p=>p.id)),nodes=new Set(c.nodes.map(n=>n.id));
for(const p of points){
  if(!/^[a-z0-9-]+$/.test(p.id)||ids.has(p.id)||!nodes.has(p.node))throw Error('Invalid or duplicate expanded point: '+p.id);
  if(!p.title||!p.body||!p.example||!['概念','理论','易混','应用'].includes(p.type))throw Error('Missing expanded content: '+p.id);
  for(const k of ['interpretation','mechanism','caseAnalysis','limits','exam'])if(typeof p.deep?.[k]!=='string'||!p.deep[k])throw Error('Missing '+k+' for '+p.id);
  ids.add(p.id);
}
const output = '// Generated from content/expansion.json; existing IDs remain unchanged.\nconst EXPANDED_POINTS='+JSON.stringify(points)+';\nfor(const {deep,...point} of EXPANDED_POINTS){MICRO_POINTS.push(point);DEEP_NOTES[point.id]=deep;}\n';
fs.writeFileSync('dist/expansion-data.js', output);
