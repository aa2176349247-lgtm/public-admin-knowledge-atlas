const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);await page.emulateMedia({reducedMotion:'reduce'});
  const core={status:'weak',note:'思想史新增前保留的旧笔记',updatedAt:'2026-11-01'};await page.evaluate(core=>localStorage.setItem('public-admin-atlas-progress-v1',JSON.stringify({version:2,records:{debt:core},microRecords:{'public-interest-1':{status:'weak',starred:true}}})),core);await page.reload();await page.locator('.nav-item[data-page="library"]').click();await page.locator('.study-tree>summary').click();assert.equal(await page.locator('.tree-module').count(),6);assert.equal(await page.locator('.tree-topic').count(),36);assert.equal(await page.locator('.tree-topic [data-read-point]').count(),215);assert.equal(await page.locator('.tree-module-total').evaluateAll(a=>a.reduce((n,e)=>n+parseInt(e.textContent),0)),215);
  const mod=page.locator('[data-tree-module="admin"]'),topic=page.locator('[data-tree-topic="paradigms"]');await mod.locator(':scope>summary').click();await topic.locator(':scope>summary').click();assert.equal(await topic.locator('[data-read-point]').count(),9);assert.match(await topic.locator('[data-tree-progress]').innerText(),/0 \/ 9/);
  for(const width of [390,768,1280]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: catalogue overflow`);await topic.scrollIntoViewIfNeeded();assert(await topic.evaluate(e=>e.scrollWidth<=e.clientWidth));if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`catalogue-${width}.png`)});}}
  await page.setViewportSize({width:390,height:844});const taylor='history-taylor-scientific';await page.locator('#tree-read-'+taylor).focus();await page.keyboard.press('Enter');assert.match(await page.locator('#readerTitle').innerText(),/泰勒/);assert.equal(await page.locator('.research-table-wrap tbody tr').count(),4);assert.equal(await page.locator('.research-quiz details').count(),4);assert.match(await page.locator('.research-source-list').innerText(),/National Humanities Center/);assert.equal(await page.evaluate(()=>microState('history-taylor-scientific').status),'unstarted');await page.locator('#readerStatus [data-star]').click();await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='tree-read-history-taylor-scientific');assert(await mod.evaluate(e=>e.open));assert(await topic.evaluate(e=>e.open));assert.match(await topic.locator('[data-tree-progress]').innerText(),/1 \/ 9/);assert.match(await page.locator('[data-tree-state="'+taylor+'"]').innerText(),/已熟悉/);
  const backup={app:'public-admin-atlas',version:2,records:{},microRecords:{'history-taylor-scientific':{status:'weak',starred:true},'history-gulick-urwick':{status:'mastered',starred:true}}};page.once('dialog',d=>d.accept());await page.locator('#importFile').setInputFiles({name:'history-progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>microState('history-gulick-urwick').status==='mastered');assert.match(await page.locator('[data-tree-state="'+taylor+'"]').innerText(),/需巩固/);assert.match(await page.locator('[data-tree-state="history-gulick-urwick"]').innerText(),/已熟悉/);assert.match(await topic.locator('[data-tree-progress]').innerText(),/1 \/ 9/);assert(await topic.evaluate(e=>e.open));assert.equal(await page.locator('[data-library-verified]').innerText(),'215');
  for(const [query,ids] of [
    ['scientific management',[taylor]],
    ['POSDCORB',['history-gulick-urwick','history-simon-administrative-proverbs']],
    ['Mary Parker Follett',['history-follett-integration']]
  ]){
    await page.locator('#microSearch').fill(query);
    const found=await page.locator('#microGrid .micro-card').evaluateAll(cards=>cards.map(card=>card.dataset.card));
    assert.deepEqual(found.sort(),ids.sort(),query);
  }
  for(const [id,source] of [
    ['history-simon-administrative-proverbs','The Proverbs of Administration'],
    ['social-policy-eligibility-takeup','Modernising Access to Social Protection'],
    ['finance-tax-incidence','Elasticity and Pricing'],
    ['evaluation-cost-benefit-effectiveness','The Green Book']
  ]){
    await page.goto(url+'/#point='+id+'&section=comparison');
    await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
    assert.equal(await page.locator('.research-table-wrap tbody tr').count(),3);
    assert.equal(await page.locator('.research-quiz details').count(),4);
    assert((await page.locator('.research-source-list').innerText()).includes(source),id);
  }
  for(const [id,section,rows,source]of [[taylor,'responsibilities',4,'Library of Congress'],['history-gulick-urwick','functions',7,'Urwick'],['history-follett-integration','integration',4,'1930']]){await page.goto(url+'/#point='+id+'&section='+section);await page.waitForFunction(section=>document.activeElement.id==='research-'+section,section);assert.equal(await page.locator('.research-table-wrap tbody tr').count(),rows);assert.match(await page.locator('.research-source-list').innerText(),new RegExp(source));assert.equal(await page.locator('.research-quiz details').count(),4);await page.locator('.research-quiz details').first().locator('summary').click();assert(await page.locator('.research-quiz details').first().locator('p').isVisible());}
  for(const [id,sourceTitle] of [
   ['history-confucius-virtue-ritual','论语'],['history-mencius-livelihood','孟子'],['history-hanfeizi-name-performance','韩非子'],
   ['bureaucracy-2','Max Weber'],['bureaucracy-3','Merton'],['paradigms-1','Wilson'],['value-fact-3','INTOSAI']
  ]){
   await page.goto(url+'/#point='+id+'&section=comparison');
   await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
   assert.equal(await page.locator('.research-table-wrap tbody tr').count(),3);
   assert.equal(await page.locator('.research-quiz details').count(),4);
   assert.match(await page.locator('.research-source-list').innerText(),new RegExp(sourceTitle));
   assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');
   for(const width of [390,768,1280]){
    await page.setViewportSize({width,height:844});
    assert(await page.locator('#readerContent').evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1),id+' '+width);
   }
  }
  await page.keyboard.press('Escape');await page.locator('.nav-item[data-page="library"]').click();
  await page.locator('#microSearch').fill('形名参同');
  assert.equal(await page.locator('#microGrid [data-card]').getAttribute('data-card'),'history-hanfeizi-name-performance');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1')));assert.deepEqual(stored.records.debt,core);assert.equal(stored.microRecords['public-interest-1'].status,'weak');assert.equal(stored.microRecords[taylor].starred,true);assert.equal(stored.microRecords[taylor].status,'weak');assert.equal(stored.microRecords['history-gulick-urwick'].status,'mastered');assert.deepEqual(errors,[]);
  console.log('PASS: 215-point catalogue, ten history and administration lessons, chapters, sources, quizzes, search, stable study records and 390/768/1280px layouts.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
