const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname==='/'?'index.html':new URL(req.url,'http://local').pathname);fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const view of ['map','library','review','path']){
   const link=page.locator(`.nav-item[data-page="${view}"]`);
   await link.click();
   assert(await page.locator('#'+view+'Page').isVisible());
   assert.equal(await link.getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.main-nav [aria-current=page]').count(),1);
   await page.evaluate(()=>document.fonts.ready);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/${view}: horizontal overflow`);
  }
  if(width<=960)assert(await page.locator('.sidebar').evaluate(el=>Math.abs(el.getBoundingClientRect().bottom-innerHeight)<1));
 }
 await page.goto(url+'/#page=library&tab=textbooks');
 await page.locator('#textbookArea').waitFor();
 assert.equal(await page.locator('.textbook-chapter').count(),31);
 for(const width of [320,768,1440]){
  await page.setViewportSize({width,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/textbooks: horizontal overflow`);
 }
 const chapter=page.locator('.textbook-chapter').filter({hasText:'政策过程中的分析方法'});
 await chapter.locator('summary').click();
 const entry=chapter.locator('[data-read-point]').first();
 await entry.focus();
 await page.keyboard.press('Enter');
 await page.locator('#pointReader').waitFor();
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.activeElement.closest('#textbookIndex [data-read-point]'));
 assert.match(page.url(),/#page=library&tab=textbooks$/);
 await chapter.locator('[data-path-scroll]').click();
 assert.match(page.url(),/#route=policy-appraisal-under-uncertainty$/);
 await page.goBack();
 await page.locator('#textbookArea').waitFor();
 await page.goto(url+'/#page=library&tab=reading');
 await page.waitForFunction(()=>!document.querySelector('#readingArea').hidden);
 await page.locator('[data-library-tab="compare"]').click();
 assert.match(page.url(),/#page=library&tab=compare$/);
 await page.reload();
 assert(await page.locator('#compareArea').isVisible());
 await page.goBack();
 await page.waitForFunction(()=>!document.querySelector('#readingArea').hidden);
 await page.locator('.nav-item[data-page="map"]').click();
 await page.locator('.map-sections a[data-page-section="pointRelationsTitle"]').click();
 assert.match(page.url(),/#page=map&at=pointRelationsTitle$/);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'pointRelationsTitle');
 assert(await page.locator('#pointRelationsTitle').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom));
 await page.keyboard.press('Control+k');
 await page.waitForFunction(()=>document.activeElement.id==='quickFindInput');
 await page.locator('#quickFindInput').fill('不存在的查询abc123');
 assert.match(await page.locator('#quickFindCount').innerText(),/没有匹配/);
 await page.locator('#quickFindInput').fill('多源流与政策窗口');
 await page.keyboard.press('ArrowDown');
 assert.match(await page.evaluate(()=>document.activeElement.innerText),/多源流与政策窗口/);
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('#pointReader').open);
 assert.equal(await page.locator('#readerTitle').innerText(),'多源流与政策窗口');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.activeElement.id==='quickFindBtn'&&location.hash.includes('at=pointRelationsTitle'));
 await page.locator('#quickFindBtn').click();
 await page.locator('#quickFindInput').fill('从问题建构到政策选择');
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.activeElement.id==='route-heading-agenda-to-choice');
 assert.match(page.url(),/#route=agenda-to-choice$/);
 await page.goBack();
 await page.waitForFunction(()=>document.activeElement.id==='pointRelationsTitle');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobileHelpBtn').click();
 assert(await page.locator('#helpDialog').isVisible());
 await page.keyboard.press('Escape');
 await page.goto(`http://127.0.0.1:${server.address().port}/#point=hr-planning-2`);await page.locator('.reader-sidebar [data-reader-anchor="exam"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-exam');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
 await page.locator('#readerStatus [data-star]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.star),'hr-planning-2','reader star loses keyboard focus');
 await page.locator('#readerStatus [data-micro-status="weak"]').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>document.activeElement.dataset.microStatus),'weak','reader status loses keyboard focus');
 await page.locator('.reader-guide-directory>summary').focus();await page.keyboard.press('Enter');const section=await page.locator('.reader-guide [data-research-anchor]').first().getAttribute('data-research-anchor');await page.locator('.reader-guide [data-research-anchor]').first().focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'research-'+section);
 await page.reload();await page.waitForFunction(id=>document.activeElement.id===id,'research-'+section);assert.equal(await page.evaluate(()=>document.activeElement.id),'research-'+section);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#pointReader').isVisible(),false);
 await page.locator('.nav-item[data-page="library"]').click();const card=page.locator('#microGrid .micro-card').first(),point=await card.getAttribute('data-card');await card.locator('[data-star]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.dataset.star),point,'library star loses keyboard focus');
 await page.locator('#microGrid [data-read-point]').first().focus();await page.keyboard.press('Enter');await page.locator('#readerStatus [data-star]').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');await page.waitForFunction(id=>document.activeElement.dataset.readPoint===id,point,{timeout:5000});assert.equal(await page.evaluate(()=>document.activeElement.dataset.readPoint),point,'close reader does not return focus to its opener');
 await page.locator('#microStatusFilter').selectOption('starred');await page.locator('#microGrid [data-star]').first().focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'microStatusFilter','removed card needs a reachable focus target');
 if(process.env.ATLAS_AUDIT_ARTIFACTS){const dir=process.env.ATLAS_AUDIT_ARTIFACTS;fs.mkdirSync(dir,{recursive:true});await page.setViewportSize({width:768,height:1024});await page.goto(`http://127.0.0.1:${server.address().port}/#point=hr-planning-2`);await page.screenshot({path:path.join(dir,'tablet-reader.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'mobile-reader.png')});}
 assert.deepEqual(errors,[]);console.log('PASS: labelled responsive navigation, page and tab history, map anchors, quick search, mobile help, and reader keyboard navigation.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
