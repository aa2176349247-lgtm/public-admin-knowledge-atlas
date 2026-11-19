const {chromium}=require(process.env.ATLAS_PLAYWRIGHT);
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve('dist');
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname)); if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;} fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;} res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_BROWSER}); const page=await browser.newPage({viewport:{width:390,height:844}});
  const url=`http://127.0.0.1:${server.address().port}`; await page.goto(url);assert.equal(await page.locator('#storageWarning').isVisible(),false);
  await page.evaluate(()=>localStorage.setItem('public-admin-atlas-progress-v1',JSON.stringify({version:2,records:{debt:{status:'weak',note:'原笔记',updatedAt:''}},microRecords:{'public-interest-1':{status:'weak',starred:true,updatedAt:''}}}))); await page.reload();
  const backup={app:'public-admin-atlas',version:2,records:{debt:{status:'learning',note:'备份笔记',updatedAt:''}},microRecords:{'public-interest-1':{status:'mastered',starred:false,updatedAt:''}}};
  const file={name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))};
  let seen=''; page.once('dialog',async d=>{seen=d.message();await d.dismiss();}); await page.locator('#importFile').setInputFiles(file); await page.waitForTimeout(100);
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1'))); assert.match(seen,/覆盖/);assert.equal(data.records.debt.note,'原笔记'); assert.equal(data.microRecords['public-interest-1'].starred,true);
  page.once('dialog',d=>d.accept());await page.locator('#importFile').setInputFiles(file);await page.waitForTimeout(100);
  data=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1')));assert.equal(data.records.debt.note,'备份笔记');assert.equal(data.microRecords['public-interest-1'].starred,false);
  await page.reload();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('public-admin-atlas-progress-v1')));assert.equal(data.records.debt.note,'备份笔记');
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('quota');};setStatus('weak');});assert.equal(await page.locator('#storageWarning').isVisible(),true);assert.match(await page.locator('#toast').innerText(),/无法保存/);await page.reload();
  const broken='{未完整的原始数据';await page.evaluate(v=>localStorage.setItem('public-admin-atlas-progress-v1',v),broken);await page.reload();
  assert.match(await page.locator('#storageWarning').innerText(),/暂停保存/);assert.equal(await page.locator('#storageWarning').isVisible(),true);await page.evaluate(()=>save());assert.equal(await page.evaluate(()=>localStorage.getItem('public-admin-atlas-progress-v1')),broken);
  await page.locator('#storageWarning button').click();assert.equal(await page.locator('#helpDialog').isVisible(),true);const downloadPromise=page.waitForEvent('download');await page.locator('#exportBtn').click();const download=await downloadPromise;const exported=await download.createReadStream();let contents='';for await(const chunk of exported)contents+=chunk;assert.equal(contents,broken);
  console.log('PASS: real browser import and preservation/export of unreadable records at 390px');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
