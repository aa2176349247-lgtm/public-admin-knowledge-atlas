const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist'),research=JSON.parse(fs.readFileSync('content/research.json','utf8'));
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url);
  const old={status:'weak',note:'目录改版之前的原有笔记',updatedAt:'2026-11-01'};
  await page.evaluate(old=>localStorage.setItem('public-admin-atlas-progress-v1',JSON.stringify({version:2,records:{debt:old},microRecords:{'public-interest-1':{status:'weak',starred:true}}})),old);
  const ids=['performance-1','performance-2','performance-3','compensation-1','compensation-2','compensation-3','politics-state-government','politics-democracy-representation'];
  for(const id of ids){
   const lesson=research.lessons[id],section=lesson.sections.find(s=>s.table);
   await page.goto(url+'/#point='+id+'&section='+section.id);await page.waitForFunction(id=>document.activeElement.id==='research-'+id,section.id);
   assert.equal(await page.locator('.research-quiz details').count(),4);assert.equal(await page.locator('.research-table-wrap tbody tr').count(),section.table.rows.length);assert.equal(await page.locator('.research-source-list li').count(),lesson.sourceIds.length);assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');assert.equal(await page.locator('#readerContents').evaluate(e=>e.open),false);
   for(const width of [390,768,1280]){await page.setViewportSize({width,height:950});assert(await page.locator('#readerContent').evaluate(e=>e.scrollWidth<=e.clientWidth+1),id+': '+width+' content overflow');assert(await page.locator('.research-table-wrap').evaluate(e=>e.scrollWidth>=e.clientWidth&&e.getBoundingClientRect().right<=document.getElementById('readerContent').getBoundingClientRect().right),id+': contained table');}
   await page.locator('#readerContent').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await page.locator('#readerContentsButton').isVisible());await page.locator('#readerContentsButton').click();
   assert.equal(await page.evaluate(()=>document.activeElement.parentElement.id),'readerContents');assert(await page.locator('#readerContents').evaluate(e=>e.open));assert.equal(await page.locator('#readerContents [data-reader-anchor]').count(),7);assert.equal(await page.locator('#readerContents [data-research-anchor]').count(),lesson.sections.length+3);
   await page.locator('#readerContents [data-reader-anchor="exam"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-exam');
   await page.locator('#readerContentsButton').click();await page.locator('#readerContents [data-research-anchor="study-quiz"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'research-study-quiz');assert.match(page.url(),/section=study-quiz/);
   await page.locator('.research-quiz details').first().locator('summary').click();assert(await page.locator('.research-quiz details').first().locator('p').isVisible());
   await page.locator('#readerContentsButton').click();await page.locator('#readerContents [data-research-anchor="study-sources"]').click();await page.reload();await page.waitForFunction(()=>document.activeElement.id==='research-study-sources');
   await page.evaluate(id=>location.hash='point='+id+'&section=study-connections',id);await page.waitForFunction(()=>document.activeElement.id==='research-study-connections');
  }
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:950});await page.locator('#readerContentsButton').click();assert(await page.locator('#readerContent').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await page.locator('#readerContentsButton').evaluate(e=>{const a=e.getBoundingClientRect(),b=document.getElementById('closeReader').getBoundingClientRect();return a.right<=b.left&&a.width>=40;}));
   if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`directory-${width}.png`)});}
  }
  await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.locator('#readerStatus [data-star]').click();assert(await page.locator('#readerContents').evaluate(e=>e.open));await page.keyboard.press('Escape');
  await page.locator('.nav-item[data-page="path"]').click();const route=page.locator('[data-route="political-foundations"]');assert.equal(await route.locator('.path-step').count(),5);await page.locator('[data-path-scroll="political-foundations"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'route-heading-political-foundations');
  await page.reload();assert.deepEqual(await page.evaluate(()=>records.debt),old);assert.equal(await page.evaluate(()=>microState('public-interest-1').status),'weak');assert.equal(await page.evaluate(()=>microState('politics-democracy-representation').status),'mastered');assert.equal(await page.evaluate(()=>microState('politics-democracy-representation').starred),true);
  const pendingPage=await browser.newPage();
  pendingPage.on('pageerror',error=>errors.push(error.message));
  try{
   await pendingPage.route(/\/research-data\.js(?:\?.*)?$/,route=>route.fulfill({
    contentType:'text/javascript',
    body:fs.readFileSync(path.join(root,'research-data.js'),'utf8')+'\n;delete RESEARCH.lessons["rule-law-1"];'
   }));
   await pendingPage.goto(url+'/#point=rule-law-1');
   await pendingPage.locator('#readerContentsButton').click();
   assert.equal(await pendingPage.locator('#readerContents [data-reader-anchor]').count(),7);
   assert.equal(await pendingPage.locator('#readerContents [data-research-anchor]').count(),0);
   assert.match(await pendingPage.locator('.research-status').innerText(),/尚未逐条核验/);
   await pendingPage.locator('#readerContents [data-reader-anchor="definition"]').click();
   assert.equal(await pendingPage.evaluate(()=>document.activeElement.id),'reader-definition');
  }finally{await pendingPage.close();}
  for(const [id,source] of [['accountability-1','Bovens'],['accountability-2','Jensen'],['accountability-3','Thompson'],['ethics-1','Conflict of Interest'],['ethics-3','Openness']]){
   await page.goto(url+'/#point='+id+'&section=comparison');
   await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
   assert.equal(await page.locator('.research-table-wrap tbody tr').count(),3);
   assert.equal(await page.locator('.research-quiz details').count(),4);
   assert.match(await page.locator('.research-source-list').innerText(),new RegExp(source));
   assert.equal(await page.locator('[data-reader-relation]').count(),4);
   assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');
  }
  await page.goto(url+'/#point=accountability-1&section=study-connections');
  await page.waitForFunction(()=>document.activeElement.id==='research-study-connections');
  const answer=page.locator('.research-quiz details').first();
  await answer.locator('summary').click();
  const link=page.locator('[data-reader-relation][data-read-point="accountability-2"]');
  await link.focus();
  const previousScroll=await page.locator('#readerContent').evaluate(panel=>panel.scrollTop);
  assert.match(await link.getAttribute('aria-describedby'),/reader-relation/);
  assert.match(await link.locator('..').innerText(),/授权、信息和激励/);
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#readerTitle').innerText(),/委托—代理/);
  assert.match(await page.locator('#readerTrailBack').getAttribute('aria-label'),/控制、监督与问责/);
  const linkAgain=page.locator('[data-reader-relation][data-read-point="accountability-1"]');
  await linkAgain.click();
  assert.match(await page.locator('#readerTitle').innerText(),/控制、监督与问责/);
  await page.locator('#readerTrailBack').click();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.readPoint),'accountability-1');
  await page.locator('#readerTrailBack').click();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.readPoint),'accountability-2');
  assert.match(page.url(),/point=accountability-1&section=study-connections/);
  assert(await answer.evaluate(element=>element.open));
  assert(Math.abs(await page.locator('#readerContent').evaluate(panel=>panel.scrollTop)-previousScroll)<=2);
  assert.equal(await page.locator('#readerTrailBack').count(),0);
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:900});await link.scrollIntoViewIfNeeded();
   assert(await page.locator('#readerContent').evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1));
   if(process.env.ATLAS_AUDIT_ARTIFACTS)await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`connections-${width}.png`)});
  }
  await page.setViewportSize({width:320,height:844});await link.click();
  assert(await page.locator('.reader-topbar').evaluate(bar=>bar.scrollWidth<=bar.clientWidth));
  if(process.env.ATLAS_AUDIT_ARTIFACTS)await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,'reader-trail-320.png')});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('pointReader').open);
  await page.locator('.nav-item[data-page="path"]').click();
  const integrity=page.locator('[data-route="accountability-integrity"]');
  assert.equal(await integrity.locator('.path-step').count(),5);
  await integrity.locator('.path-start').click();assert.match(await page.locator('#readerTitle').innerText(),/委托—代理/);
  assert.equal(await page.locator('#readerTrailBack').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: reviewed lessons, complete directory, pending boundaries, two routes, reading trail scroll/focus/hash/quiz restoration, old records and 320/390/768/1280px layouts.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
