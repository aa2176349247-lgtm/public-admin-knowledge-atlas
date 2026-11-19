const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist'),server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url);await page.emulateMedia({reducedMotion:'reduce'});
  const core={status:'weak',note:'本批前的旧笔记',updatedAt:'2026-11-01'};await page.evaluate(core=>localStorage.setItem('public-admin-atlas-progress-v1',JSON.stringify({version:2,records:{debt:core},microRecords:{'public-interest-1':{status:'weak',starred:true}}})),core);await page.reload();await page.locator('.nav-item[data-page="library"]').click();await page.locator('[data-library-tab="compare"]').click();assert.equal(await page.locator('[data-comparison-id]').count(),12);assert.equal(await page.locator('.compare-review.reviewed').count(),12);assert.equal(await page.locator('.compare-review.pending').count(),0);
  if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});for(const width of [390,768,1280]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`compare-overview-${width}.png`)});}}
  await page.locator('[data-library-tab="compare"]').focus();await page.keyboard.press('/');assert.equal(await page.evaluate(()=>document.activeElement.id),'comparisonSearch');assert(await page.locator('#comparisonSearch').isVisible());
  await page.locator('#comparisonSearch').fill('可减损性');assert.equal(await page.locator('[data-comparison-id]').count(),1);assert.equal(await page.locator('[data-comparison-id]').getAttribute('data-comparison-id'),'goods-commons');await page.locator('#clearComparisonFilters').click();await page.locator('#comparisonReview').selectOption('pending');assert.equal(await page.locator('[data-comparison-id]').count(),0);assert(await page.locator('.compare-empty').isVisible());await page.locator('#clearComparisonFilters').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'comparisonSearch');
  await page.locator('#comparisonSearch').fill('产出');const table=page.locator('[data-comparison-id="policy-output"]');await table.locator(':scope>summary').click();await table.locator('.compare-source-scope>summary').click();assert.match(await table.locator('.compare-source-scope').innerText(),/删去把活动当产出/);assert(!((await table.locator('tbody tr').first().innerText()).includes('交付的活动')));
  for(const width of [390,768,1280]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: page overflow`);assert(await table.evaluate(e=>e.scrollWidth<=e.clientWidth));await table.locator('.comparison-table-wrap').focus();assert.equal(await table.locator('.comparison-table-wrap').getAttribute('role'),'region');if(process.env.ATLAS_AUDIT_ARTIFACTS){fs.mkdirSync(process.env.ATLAS_AUDIT_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`compare-${width}.png`)});}}
  await page.setViewportSize({width:390,height:844});await page.locator('#compare-policy-output-evaluation-1').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#readerTitle').innerText(),/产出/);assert.equal(await page.evaluate(()=>microState('evaluation-1').status),'unstarted');await page.locator('#readerStatus [data-micro-status="weak"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='compare-policy-output-evaluation-1');assert(await table.evaluate(e=>e.open));assert(await table.locator('.compare-source-scope').evaluate(e=>e.open));assert.equal(await page.locator('#comparisonSearch').inputValue(),'产出');assert.equal(await page.locator('#comparisonReview').inputValue(),'all');assert.equal(await page.locator('.compare-review.reviewed').count(),2);
  await page.locator('#clearComparisonFilters').click();await page.locator('#comparisonSearch').fill('信度');const validity=page.locator('[data-comparison-id="reliability-validity"]');await validity.locator(':scope>summary').click();assert.match(await validity.locator('#compare-reliability-validity-recruitment-1 small').innerText(),/按范围核验/);assert.match(await validity.locator('#compare-reliability-validity-methods-operationalization small').innerText(),/按范围核验/);assert(await page.locator('.compare-source-scope a').evaluateAll(a=>a.every(e=>e.target==='_blank'&&e.rel.includes('noopener')&&e.href.startsWith('https:'))));
  for(const [id,section,rows,needle]of [['institutions-1','mechanisms',3,'DiMaggio'],['institutions-2','distinctions',3,'全文受限'],['institutions-3','feedback',3,'1997'],['governance-reform-goals-evidence','chain',4,'2020']]){await page.goto(url+'/#point='+id+'&section='+section);await page.waitForFunction(section=>document.activeElement.id==='research-'+section,section);assert.equal(await page.locator('.research-table-wrap tbody tr').count(),rows);assert.equal(await page.locator('.research-quiz details').count(),4);assert.match(await page.locator('.research-source-list').innerText(),new RegExp(needle));assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');await page.locator('.research-quiz details').first().locator('summary').click();assert(await page.locator('.research-quiz details').first().locator('p').isVisible());for(const width of [390,768,1280]){await page.setViewportSize({width,height:950});assert(await page.locator('#readerContent').evaluate(e=>e.scrollWidth<=e.clientWidth+1),id+': reader overflow');}}
  await page.locator('#readerStatus [data-star]').click();await page.locator('#readerStatus [data-micro-status="mastered"]').click();await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1')));assert.deepEqual(saved.records.debt,core);assert.equal(saved.microRecords['public-interest-1'].starred,true);assert.equal(saved.microRecords['evaluation-1'].status,'weak');assert.equal(saved.microRecords['governance-reform-goals-evidence'].status,'mastered');assert.equal(saved.microRecords['governance-reform-goals-evidence'].starred,true);assert.deepEqual(errors,[]);
  for(const [id,matches,rows] of [
   ['budget-1','预算法',3],['budget-2','General Accounting Office',3],['budget-3','绩效管理',3],
   ['fiscal-relations-1','财政事权',4],['fiscal-relations-2','Evaluating Fiscal Equalisation',3],['fiscal-relations-3','2026年中央对地方',3]
  ]){
   await page.goto(url+'/#point='+id+'&section=comparison');
   await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
   assert.equal(await page.locator('.research-table-wrap tbody tr').count(),rows);
   assert.equal(await page.locator('.research-quiz details').count(),4);
   assert.match(await page.locator('.research-source-list').innerText(),new RegExp(matches));
   assert.equal(await page.evaluate(id=>microState(id).status,id),'unstarted');
  }
  await page.goto(url+'/#comparison=budget-final');
  const budget=page.locator('#comparison-budget-final');
  await page.waitForFunction(()=>document.activeElement.parentElement.id==='comparison-budget-final');
  assert(await budget.evaluate(card=>card.open));
  await budget.locator('.compare-source-scope>summary').click();
  assert.match(await budget.locator('.compare-source-scope').innerText(),/法定|预算法/);
  assert.match(await budget.locator('.compare-read-source').getAttribute('href'),/www\.gov\.cn/);
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:940});await budget.scrollIntoViewIfNeeded();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+': comparison page width');
   const tableWidth=await budget.locator('.comparison-table-wrap').evaluate(region=>({content:region.scrollWidth,visible:region.clientWidth,min:getComputedStyle(region.querySelector('table')).minWidth}));
   assert(tableWidth.content<=tableWidth.visible+1,width+': all budget comparison columns visible '+JSON.stringify(tableWidth));
   if(process.env.ATLAS_AUDIT_ARTIFACTS)await page.screenshot({path:path.join(process.env.ATLAS_AUDIT_ARTIFACTS,`budget-comparison-${width}.png`)});
  }
  const budgetReader=budget.locator('#compare-budget-final-budget-1');
  await budgetReader.click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement.id==='compare-budget-final-budget-1');
  assert.match(page.url(),/#comparison=budget-final$/);
  assert(await budget.locator('.compare-source-scope').evaluate(scope=>scope.open));
  await page.locator('#comparisonSearch').fill('可减损性');
  assert.equal(await budget.count(),0);
  await page.evaluate(()=>location.hash='point=fiscal-relations-2&section=comparison');
  await page.waitForFunction(()=>document.activeElement.id==='research-comparison');
  await page.locator('.reader-comparisons>summary').click();
  const direct=page.locator('.reader-comparisons [data-open-comparison="fiscal-gap"]');
  assert.equal(await direct.getAttribute('href'),'#comparison=fiscal-gap');
  await direct.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.activeElement.parentElement.id==='comparison-fiscal-gap');
  assert.equal(await page.locator('#comparisonSearch').inputValue(),'');
  const gap=page.locator('#comparison-fiscal-gap');
  assert(await gap.evaluate(card=>card.open));
  assert.match(page.url(),/#comparison=fiscal-gap$/);
  await page.reload();await page.waitForFunction(()=>document.activeElement.parentElement.id==='comparison-fiscal-gap');
  assert.equal(await gap.locator('a[data-open-comparison="fiscal-gap"]').getAttribute('href'),'#comparison=fiscal-gap');
  await page.goto(url+'/#comparison=central-local');
  await page.waitForFunction(()=>document.activeElement.parentElement.id==='comparison-central-local');
  const central=page.locator('#comparison-central-local');
  assert.equal(await central.locator('[data-read-point]').count(),4);
  await central.locator('.compare-source-scope>summary').click();
  assert.match(await central.locator('.compare-source-scope').innerText(),/Making Decentralisation Work/);
  assert.deepEqual(errors,[]);
  console.log('PASS: comparison filtering and scoped evidence, table URLs, reader-to-table and focus return, six fiscal lessons, preserved records, and 320/390/768/1280px layouts.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


