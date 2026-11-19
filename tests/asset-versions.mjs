import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const html=fs.readFileSync('dist/index.html','utf8');
const assets=['styles.css','data.js','micro-data.js','deep-data.js','expansion-data.js','app.js','enrichment.js','reader.js','research-data.js','research-ui.js','relations.js','navigation.js'];
for(const asset of assets){
  const bytes=fs.readFileSync(`dist/${asset}`);
  assert(!bytes.includes(Buffer.from('\r\n')),`${asset}: normalize line endings by rerunning the package script`);
  const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
  assert(html.includes(`${asset}?v=${hash}`),`${asset}: missing or stale asset version; rerun scripts/package-codex-source.py`);
}
const css=fs.readFileSync('dist/styles.css','utf8');
const fonts=['fonts/atlas-sans.woff2','fonts/atlas-serif.woff2'];
for(const asset of fonts){
  const bytes=fs.readFileSync(`dist/${asset}`);
  assert.equal(bytes.subarray(0,4).toString('ascii'),'wOF2',`${asset}: WOFF2 signature`);
  const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
  assert(css.includes(`${asset}?v=${hash}`),`${asset}: missing or stale font version`);
}
console.log(`PASS: ${assets.length} page assets and ${fonts.length} fonts match the packaged file contents.`);
