const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;const file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'/#point=bounded-rationality-1');
  assert.equal(await page.locator('#readerTitle').innerText(),'有限理性与完全理性');assert(await page.locator('.reader-guide').isVisible());assert(Number(await page.locator('.reader-subtitle').getAttribute('data-reading-length'))>1500);
  assert.equal(await page.locator('.research-table-wrap tbody tr').count(),5);assert.equal(await page.locator('.research-table-wrap thead th').count(),3);
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:1000});assert(await page.locator('#readerContent').evaluate(el=>el.scrollWidth<=el.clientWidth),`${width}: reader content overflow`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`reader-${width}.png`)});}
  }
  await page.setViewportSize({width:390,height:844});await page.locator('.reader-guide-directory>summary').click();await page.locator('.reader-guide [data-research-anchor="comparison"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'research-comparison');assert.equal(await page.locator('#readerContent').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');
  await page.locator('.research-quiz details').first().locator('summary').click();assert(await page.locator('.research-quiz details').first().locator('p').isVisible());
  await page.keyboard.press('Escape');await page.locator('.nav-item[data-page="library"]').click();await page.locator('#microSearch').fill('aspiration level');assert.equal(await page.locator('#microGrid .micro-card').count(),1);assert.equal(await page.locator('#microGrid .micro-card').getAttribute('data-card'),'policy-decision-1');
  await page.locator('#microGrid [data-read-point]').click();assert.equal(await page.locator('#readerTitle').innerText(),'满意原则');assert.match(await page.locator('.reader-guide').innerText(),/可接受标准/);assert.match(await page.locator('.research-source-list').innerText(),/Herbert A. Simon/);
  const renderIssues=await page.evaluate(()=>{const issues=[];for(const p of MICRO_POINTS){openPointReader(p.id);const lesson=RESEARCH.lessons[p.id];if(document.getElementById('readerTitle').textContent!==p.title)issues.push(p.id+': title');if(lesson&&document.querySelectorAll('.research-supplement .reader-section').length!==lesson.sections.length+3)issues.push(p.id+': incomplete supplement');if(lesson&&!document.querySelector('.reader-guide'))issues.push(p.id+': guide');}return issues;});assert.deepEqual(renderIssues,[]);
  assert.deepEqual(errors,[]);console.log('PASS: two expanded lessons, full reading length, comparison table, guide navigation, quiz, source, alias search and 390/768/1280px layouts');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
