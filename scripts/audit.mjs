import fs from 'node:fs';
import vm from 'node:vm';
const c=vm.createContext({});
vm.runInContext(['data','micro-data','deep-data','expansion-data'].map(x=>fs.readFileSync('dist/'+x+'.js','utf8')).join('\n')+';this.result={nodes:NODES.map(n=>[n.id,n.m,n.name]),points:MICRO_POINTS.map(p=>({id:p.id,node:p.node,title:p.title}))};',c);
console.log(JSON.stringify(c.result,null,2));
