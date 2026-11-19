const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);await page.locator('.nav-item[data-page="path"]').click();assert.equal(await page.locator('.guided-path').count(),23);assert.equal(await page.locator('.path-step').count(),206);
  for(const width of [390,768,1280]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: overflow`);if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`paths-${width}.png`)});}}
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-path-scroll="organization"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'route-heading-organization');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'route-organization-start');
  const route=page.locator('[data-route="organization"]');assert.match(await route.locator('.path-personal-progress').innerText(),/0 \/ 7/);await route.locator('.path-start').click();assert.equal(await page.locator('#readerTitle').innerText(),'有限理性与完全理性');await page.keyboard.press('Escape');assert.match(await route.locator('.path-personal-progress').innerText(),/0 \/ 7/,'opening is not mastery');
  await route.locator('.path-framework>summary').click();await page.locator('#route-organization-step-2').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#readerTitle').innerText(),'管理幅度与管理层次');assert.equal(await page.locator('.research-table-wrap tbody tr').count(),4);assert.match(await page.locator('.research-source-list').innerText(),/Jacobsen/);
  await page.locator('#readerStatus [data-micro-status="weak"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='route-organization-step-2');assert.equal(await route.locator('.path-start').getAttribute('data-read-point'),'org-structure-1');assert(await route.locator('.path-framework').evaluate(el=>el.open));
  await route.locator('.path-start').click();await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='route-organization-start');assert.match(await route.locator('.path-personal-progress').innerText(),/1 \/ 7/);assert.equal(await route.locator('.path-start').getAttribute('data-read-point'),'bounded-rationality-1');
  await page.reload();await page.locator('.nav-item[data-page="path"]').click();assert.match(await route.locator('.path-personal-progress').innerText(),/1 \/ 7/);await route.locator('.path-framework>summary').click();await route.locator('[data-jump="org-structure"]').click();assert(await page.locator('#mapPage').isVisible());assert.equal(await page.evaluate(()=>selected),'org-structure');
  await page.goto(url+'/#route=agenda-to-choice');
  await page.waitForFunction(()=>document.activeElement.id==='route-heading-agenda-to-choice');
  const agenda=page.locator('[data-route="agenda-to-choice"]');
  const ids=['policy-problem-1','policy-problem-3','policy-problem-2','policy-decision-1','policy-decision-2','policy-decision-3'];
  assert.deepEqual(await agenda.locator('[data-path-step]').evaluateAll(steps=>steps.map(step=>step.dataset.pathStep)),ids);
  const routeLink=page.locator('[data-path-scroll="agenda-to-choice"]');
  assert.equal(await routeLink.getAttribute('href'),'#route=agenda-to-choice');
  assert.equal(await routeLink.getAttribute('aria-current'),'true');
  const sourceTitles=['Problem Definition','The Politics of Agenda-Building','Agendas, Alternatives','Rational Decision-Making','The Science of','A Garbage Can Model'];
  for(const [index,id] of ids.entries()){
   const start=page.locator('#route-agenda-to-choice-step-'+index);
   await start.click();
   assert.match(page.url(),new RegExp('#point='+id+'$'));
   assert((await page.locator('.research-source-list').innerText()).includes(sourceTitles[index]));
   if(index!==3){
    assert.equal(await page.locator('.research-table-wrap tbody tr').count(),index===5?4:3);
    assert.equal(await page.locator('.research-quiz details').count(),4);
   }
   await page.keyboard.press('Escape');
   await page.waitForFunction(i=>document.activeElement.id==='route-agenda-to-choice-step-'+i&&location.hash==='#route=agenda-to-choice',index);
  }
  assert.match(await agenda.locator('.path-personal-progress').innerText(),/0 \/ 6/);
  await page.locator('[data-path-scroll="policy-implementation-change"]').click();
  const policy=page.locator('[data-route="policy-implementation-change"]');
  const policyPoints=['policy-tools-2','policy-tools-3','implementation-2','policy-implementation-smith-edwards','policy-implementation-conditions-and-coordination','policy-implementation-adaptation-and-cycle','implementation-3','policy-implementation-games-and-handoffs','policy-implementation-chapter-case-practice','policy-change-1','policy-change-advocacy-coalitions','policy-change-diffusion-mechanisms','policy-change-2','policy-change-3','policy-termination-forms-decomposition'];
  assert.deepEqual(await policy.locator('[data-path-step]').evaluateAll(steps=>steps.map(step=>step.dataset.pathStep)),policyPoints);
  assert.equal(await page.locator('[data-path-scroll="policy-implementation-change"]').getAttribute('aria-current'),'true');
  for(const [index,id] of policyPoints.entries()){
   await page.locator('#route-policy-implementation-change-step-'+index).click();
   assert.equal(new URL(page.url()).hash,'#point='+id);
   assert(await page.locator('.research-table-wrap tbody tr').count()>=3);
   assert.equal(await page.locator('.research-quiz details').count(),({'policy-change-3':6,'policy-termination-forms-decomposition':3})[id]??4);
   assert(await page.locator('.research-source-list a').count()>0);
   await page.keyboard.press('Escape');
   await page.waitForFunction(i=>document.activeElement.id==='route-policy-implementation-change-step-'+i&&location.hash==='#route=policy-implementation-change',index);
  }
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:900});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+': route page width');
   await page.locator('#pathChooser').scrollIntoViewIfNeeded();
   assert(await page.locator('#pathChooser').evaluate(el=>el.scrollWidth<=el.clientWidth),width+': route chooser width');
   if(process.env.ATLAS_AUDIT_ARTIFACTS)await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`route-chooser-${width}.png`)});
  }
  await agenda.locator('.path-start').click();
  await page.evaluate(()=>location.hash='route=organization');
  await page.waitForFunction(()=>!document.querySelector('#pointReader').open&&document.activeElement.id==='route-heading-organization');
  assert.equal(await page.locator('[data-path-scroll="organization"]').getAttribute('aria-current'),'true');
  await page.locator('.nav-item[data-page="map"]').click();
  assert.equal(new URL(page.url()).hash,'#page=map');
  await page.evaluate(()=>location.hash='node=policy-problem');
  await page.waitForFunction(()=>document.activeElement.id==='topicReadingTitle');
  const mapLink=page.locator('[data-open-topic-route="agenda-to-choice"]');
  assert.equal(await mapLink.getAttribute('href'),'#route=agenda-to-choice');
  await mapLink.click();
  await page.waitForFunction(()=>document.activeElement.id==='route-heading-agenda-to-choice');
  await page.reload();
  await page.waitForFunction(()=>document.activeElement.id==='route-heading-agenda-to-choice');
  assert.deepEqual(errors,[]);console.log('PASS: direct reading-route links and focus, five reviewed lessons, path progress, map navigation, and 320/390/768/1280px layouts');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
