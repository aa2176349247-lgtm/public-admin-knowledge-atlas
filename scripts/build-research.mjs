import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('content/research.json','utf8'));
fs.writeFileSync('dist/research-data.js','const RESEARCH = '+JSON.stringify(data,null,2)+';\n');
