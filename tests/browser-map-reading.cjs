const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);await page.emulateMedia({reducedMotion:'reduce'});
  const issues=await page.evaluate(()=>{const bad=[];for(const n of NODES){selectNode(n.id);const root=document.querySelector('.topic-reading-guide'),ids=[...root.querySelectorAll('.topic-reading-choices [data-read-point]')].map(b=>b.dataset.readPoint);if(JSON.stringify(ids)!==JSON.stringify(MICRO_BY_NODE[n.id].map(p=>p.id)))bad.push(n.id);if(document.querySelectorAll('#topicReadingTitle').length!==1)bad.push(n.id+': repeated heading');if(root.querySelector('.topic-reading-start').dataset.readPoint!==(MICRO_BY_NODE[n.id].find(p=>RESEARCH.lessons[p.id]?.fullVerified)||MICRO_BY_NODE[n.id][0]).id)bad.push(n.id+': initial choice');}return bad;});assert.deepEqual(issues,[]);
  const core={status:'learning',note:'组织激励的原有笔记',updatedAt:'2026-11-01T00:00:00Z'};await page.evaluate(core=>localStorage.setItem('public-admin-atlas-progress-v1',JSON.stringify({version:2,records:{motivation:core},microRecords:{'motivation-1':{status:'mastered',starred:false},'motivation-2':{status:'weak',starred:false},'motivation-3':{status:'unstarted',starred:true}}})),core);await page.reload();
  await page.locator('.graph-node[data-node="motivation"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>selected),'motivation');assert.equal(await page.evaluate(()=>document.activeElement.id),'topicReadingTitle','graph selection must leave focus at the reading guide');assert.equal(await page.locator('#topic-start-motivation').getAttribute('data-read-point'),'motivation-2');assert.match(await page.locator('.topic-reading-progress').innerText(),/个人已熟悉 1 \/ 3/);assert.match(await page.locator('.topic-reading-progress').innerText(),/按范围核验 3 \/ 3/);
  for(const width of [390,768,1280]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: map page overflow`);await page.locator('.topic-reading-guide').scrollIntoViewIfNeeded();assert(await page.locator('.topic-reading-guide').evaluate(el=>el.scrollWidth<=el.clientWidth),`${width}: topic guide overflow`);if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`map-reading-${width}.png`)});}}
  await page.locator('#nodeNote').scrollIntoViewIfNeeded();await page.locator('#nodeNote').focus();assert.equal(await page.locator('#nodeNote').inputValue(),core.note);assert.equal(await page.evaluate(()=>document.activeElement.id),'nodeNote');
  await page.setViewportSize({width:390,height:844});await page.locator('#topic-start-motivation').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#readerTitle').innerText(),'保健因素与激励因素');assert.equal(await page.locator('.research-quiz details').count(),4);assert.equal(await page.locator('.research-table-wrap').count(),1);assert.match(await page.locator('.research-source-list').innerText(),/Wall/);assert.equal(await page.evaluate(()=>microRecords['motivation-2'].status),'weak');await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='topic-start-motivation');assert.equal(await page.locator('#topic-start-motivation').getAttribute('data-read-point'),'motivation-3');
  await page.locator('#topic-read-motivation-1').focus();await page.keyboard.press('Enter');assert.match(await page.locator('.reader-guide').innerText(),/努力到绩效/);assert.match(await page.locator('.research-source-list').innerText(),/APA/);await page.locator('#readerStatus [data-star]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='topic-read-motivation-1');
  await page.locator('#topic-start-motivation').click();assert.match(await page.locator('.research-source-list').innerText(),/Bakker/);assert.equal(await page.locator('.research-quiz details').count(),4);await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.keyboard.press('Escape');assert.match(await page.locator('#topic-start-motivation').innerText(),/全部已熟悉/);assert.equal(await page.locator('#topic-start-motivation').getAttribute('data-read-point'),'motivation-1');
  await page.locator('.topic-reading-library').click();assert(await page.locator('#libraryPage').isVisible());assert.equal(await page.locator('#microGrid .micro-card').count(),3);await page.locator('#microSearch').fill('instrumentality');assert.equal(await page.locator('#microGrid .micro-card').count(),1);assert.equal(await page.locator('#microGrid .micro-card').getAttribute('data-card'),'motivation-1');
  for(const section of ['boundary','process','case','limits']){await page.goto(url+'/#point=contingency-3&section='+section);await page.waitForFunction(id=>document.activeElement.id==='research-'+id,section);assert.equal(await page.locator('.research-table-wrap').count(),1);}
  await page.keyboard.press('Escape');await page.locator('.nav-item[data-page="map"]').click();await page.locator('#searchInput').fill('instrumentality');assert.equal(await page.locator('.graph-node').count(),1);await page.locator('#listView').click();await page.locator('#nodeList [data-node="motivation"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'topicReadingTitle');assert.equal(await page.locator('.topic-reading-choices>li').count(),3);
  await page.reload();const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1')));assert.deepEqual(stored.records.motivation,core);assert.equal(stored.microRecords['motivation-1'].starred,true);assert.equal(stored.microRecords['motivation-2'].status,'mastered');assert.equal(stored.microRecords['motivation-3'].status,'mastered');assert.equal(stored.microRecords['motivation-3'].starred,true);assert.deepEqual(errors,[]);
  await page.evaluate(()=>selectNode('paradigms',true));
  const guide=page.locator('.topic-reading-guide'), list=guide.locator('.topic-reading-list');
  assert.equal(await list.evaluate(element=>element.open),false);
  const featured=guide.locator('.topic-reading-start');
  assert.equal(await featured.getAttribute('data-read-point'),'paradigms-1');
  assert.match(await featured.locator('small').innerText(),/公职专业化/);
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:844});await guide.scrollIntoViewIfNeeded();
   assert(await guide.evaluate(element=>element.scrollWidth<=element.clientWidth),width+': topic guide width');
   if(process.env.ATLAS_AUDIT_ARTIFACTS)await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`thought-guide-${width}.png`)});
  }
  await list.locator('summary').focus();await page.keyboard.press('Enter');
  const confucius=guide.locator('#topic-read-history-confucius-virtue-ritual');
  await confucius.focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('#readerTitle').innerText(),/德礼/);
  await page.locator('#readerStatus [data-micro-status="weak"]').click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement.id==='topic-read-history-confucius-virtue-ritual');
  assert(await list.evaluate(element=>element.open));
  assert.equal(await featured.getAttribute('data-read-point'),'history-confucius-virtue-ritual');
  const route=guide.locator('[data-open-topic-route="administrative-thought"]');
  await route.focus();await page.keyboard.press('Enter');
  assert(await page.locator('#pathPage').isVisible());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'route-heading-administrative-thought');
  assert.equal(await page.locator('[data-route="administrative-thought"] .path-step').count(),5);
  for(const [id,rows,source] of [
   ['decentralization-1',3,'Making Decentralisation Work'],['decentralization-2',3,'基层应急管理能力'],
   ['decentralization-3',3,'履行职责事项清单'],['public-value-1',3,'On Creating Public Value'],
   ['public-value-2',3,'Serving Citizens'],['public-value-3',4,'Delivering better public administrative services']
  ]){
   await page.goto(url+'/#point='+id+'&section=comparison');
   await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
   assert.equal(await page.locator('.research-table-wrap tbody tr').count(),rows);
   assert.equal(await page.locator('.research-quiz details').count(),4);
   assert((await page.locator('.research-source-list').innerText()).toLowerCase().includes(source.toLowerCase()),id+': source');
   assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');
  }
  await page.goto(url+'/#point=public-value-1');
  const parentLink=page.locator('.reader-subtitle .map-node-link');
  assert.equal(await parentLink.getAttribute('href'),'#node=public-value');
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:844});
   assert(await page.locator('.reader-article-header').evaluate(element=>element.scrollWidth<=element.clientWidth+1),`${width}: reader header overflow`);
   if(process.env.ATLAS_AUDIT_ARTIFACTS){
    await parentLink.scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`point-node-link-${width}.png`)});
   }
  }
  await parentLink.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('#pointReader').open&&document.activeElement.id==='topicReadingTitle');
  assert.equal(await page.evaluate(()=>selected),'public-value');
  assert.match(page.url(),/#node=public-value$/);
  await page.locator('#topic-start-public-value').click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement.id==='topic-start-public-value');
  assert.match(page.url(),/#node=public-value$/);
  await page.locator('#topic-start-public-value').click();
  await page.locator('[data-reader-parent]').click();
  await page.waitForFunction(()=>document.activeElement.id==='topicReadingTitle');
  assert.match(page.url(),/#node=public-value$/);
  await page.evaluate(()=>location.hash='node=decentralization');
  await page.waitForFunction(()=>selected==='decentralization'&&document.activeElement.id==='topicReadingTitle');
  await page.reload();
  await page.waitForFunction(()=>selected==='decentralization'&&document.activeElement.id==='topicReadingTitle');
  assert.equal(await guide.locator('.map-node-link').getAttribute('href'),'#node=decentralization');
  await guide.locator('[data-open-topic-route="local-governance-value"]').click();
  assert.equal(await page.locator('[data-route="local-governance-value"] .path-step').count(),6);
  assert.equal(new URL(page.url()).hash,'#route=local-governance-value');
  await page.goto(url+'/#node=constructor');await page.reload();
  assert(await guide.isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: 36 guides, responsive layouts, precise map links and focus return, six reviewed lessons and the local-governance route.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
