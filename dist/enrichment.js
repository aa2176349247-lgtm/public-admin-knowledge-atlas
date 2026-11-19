'use strict';
const MICRO_BY_ID=Object.fromEntries(MICRO_POINTS.map(p=>[p.id,p]));
const MICRO_BY_NODE=Object.fromEntries(NODES.map(n=>[n.id,MICRO_POINTS.filter(p=>p.node===n.id)]));
const MICRO_STATUS={unstarted:'未开始',mastered:'已熟悉',weak:'需巩固'};
let microRecords={},storedRaw=null,storageReadError=false;
try{storedRaw=localStorage.getItem('public-admin-atlas-progress-v1');const saved=JSON.parse(storedRaw||'{}');microRecords=validateMicroRecords(saved.microRecords||{});}catch(e){storageReadError=true;}
function validateMicroRecords(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('小知识点记录格式不正确');
  const out={};
  for(const [id,r] of Object.entries(input)){
    if(!Object.hasOwn(MICRO_BY_ID,id))continue;
    if(!r||typeof r!=='object'||!Object.hasOwn(MICRO_STATUS,r.status)||typeof r.starred!=='boolean')throw Error('小知识点状态格式不正确');
    out[id]={status:r.status,starred:r.starred,updatedAt:typeof r.updatedAt==='string'?r.updatedAt:''};
  }
  return out;
}
function parseStudyBackup(data){
  if(!data||data.app!=='public-admin-atlas'||![1,2].includes(data.version))throw Error('请选择本应用导出的 JSON 记录');
  return {records:validateRecords(data.records),microRecords:data.version===2?validateMicroRecords(data.microRecords||{}):{}};
}
function normalizeStudySearch(value){return String(value).toLowerCase().replace(/\s+/g,'');}
const microState=id=>microRecords[id]||{status:'unstarted',starred:false};
let libraryTab='points',libraryModule='all',microQuery='',microType='all',microFilter='all',microPage=1;
const POINTS_PER_PAGE=12;
function microCounts(module){const points=MICRO_POINTS.filter(p=>!module||NODES.find(n=>n.id===p.node).m===module);const result={total:points.length,mastered:0,weak:0,unstarted:0,starred:0};points.forEach(p=>{const r=microState(p.id);result[r.status]++;if(r.starred)result.starred++;});return result;}
function pointStatusButtons(p,compact=false){const state=microState(p.id);return '<div class="micro-card-actions '+(compact?'compact':'')+'"><button class="star-button '+(state.starred?'active':'')+'" data-star="'+p.id+'" aria-label="'+(state.starred?'取消收藏':'收藏')+p.title+'" aria-pressed="'+state.starred+'">'+(state.starred?'★':'☆')+'<span>'+(state.starred?'已收藏':'收藏')+'</span></button><div class="micro-status-buttons">'+Object.entries(MICRO_STATUS).map(([status,label])=>'<button class="'+(state.status===status?'active ':'')+status+'" data-micro-status="'+status+'" data-point="'+p.id+'" aria-pressed="'+(state.status===status)+'">'+label+'</button>').join('')+'</div></div>';}
function renderNodeExpansion(n){
  const points=MICRO_BY_NODE[n.id]||[],count=points.filter(p=>microState(p.id).status==='mastered').length;
  return '<div class="detail-section detail-micro-section"><div class="detail-section-title"><h3>'+icon('book')+'小知识点</h3><span data-node-micro-count="'+n.id+'">已熟悉 '+count+' / '+points.length+'</span></div><p class="detail-small">展开逐点理解，细分进度单独记录。</p>'+points.map(p=>'<details class="inline-micro"><summary><span class="status-dot '+(microState(p.id).status==='mastered'?'mastered':microState(p.id).status==='weak'?'weak':'unstarted')+'"></span><span>'+escapeHTML(p.title)+'</span>'+icon('chevron')+'</summary><div class="inline-micro-content"><p>'+escapeHTML(p.body)+'</p><div class="micro-example"><b>假设情境</b>'+escapeHTML(p.example)+'</div>'+readerEntryButton(p,true)+pointStatusButtons(p,true)+'</div></details>').join('')+'<button class="detail-library-link" data-open-node-points="'+n.id+'">在知识点库中继续学习 ↗</button></div><details class="exam-guide detail-section"><summary>'+icon('layers')+'考研答题提示'+icon('chevron')+'</summary><p class="detail-small">以下是组织思路，非唯一标准答案。</p><ol>'+(EXAM_GUIDES[n.id]||[]).map(t=>'<li>'+escapeHTML(t)+'</li>').join('')+'</ol></details>';
}
function libraryMatches(){return MICRO_POINTS.filter(p=>{const n=nodeById[p.node],s=microState(p.id);return (libraryModule==='all'||n.m===libraryModule)&&(microType==='all'||p.type===microType)&&(microFilter==='all'||(microFilter==='starred'?s.starred:s.status===microFilter))&&(!microQuery||normalizeStudySearch([p.title,p.body,p.example,...Object.values(DEEP_NOTES[p.id]),n.name,moduleById[n.m].name,p.type].join(' ')).includes(normalizeStudySearch(microQuery)));});}
function readerEntryButton(p,compact=false){return '<button class="read-point-button '+(compact?'compact':'')+'" data-read-point="'+p.id+'">'+icon('book')+'打开详细解读<span>↗</span></button>';}
function pointCard(p){const n=nodeById[p.node],m=moduleById[n.m],state=microState(p.id);return '<article class="micro-card" data-card="'+p.id+'"><details><summary><div class="micro-card-meta"><span style="color:'+m.color+'"><i class="module-dot" style="background:'+m.color+'"></i>'+m.name+'</span><span class="type-pill">'+p.type+'</span></div><h3>'+escapeHTML(p.title)+'</h3><p class="micro-teaser">'+escapeHTML(p.body)+'</p><span class="expand-hint">展开理解与情境 '+icon('chevron')+'</span></summary><div class="expanded-point"><p>'+escapeHTML(p.body)+'</p><div class="micro-example"><b>假设情境</b>'+escapeHTML(p.example)+'</div><button class="point-parent" data-jump="'+n.id+'">所属节点：'+n.name+' ↗</button></div></details><div class="micro-card-footer">'+readerEntryButton(p)+pointStatusButtons(p)+'</div></article>';}
function renderLibrary(){
  document.querySelectorAll('[data-library-tab]').forEach(b=>{const active=b.dataset.libraryTab===libraryTab;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('pointsArea').hidden=libraryTab!=='points';$('compareArea').hidden=libraryTab!=='compare';$('readingArea').hidden=libraryTab!=='reading';$('textbookArea').hidden=libraryTab!=='textbooks';
  if(libraryTab==='textbooks')renderTextbookIndex();
  $('libraryModules').innerHTML='<button class="filter-chip '+(libraryModule==='all'?'active':'')+'" data-library-module="all">全部板块</button>'+MODULES.map(m=>'<button class="filter-chip '+(libraryModule===m.id?'active':'')+'" data-library-module="'+m.id+'"><span class="module-dot" style="background:'+m.color+'"></span>'+m.name+'</button>').join('');
  $('typeFilters').innerHTML=[['all','全部类型'],...['概念','理论','易混','应用'].map(t=>[t,t])].map(([id,label])=>'<button class="'+(microType===id?'active':'')+'" data-micro-type="'+id+'">'+label+'</button>').join('');
  const found=libraryMatches(),pages=Math.max(1,Math.ceil(found.length/POINTS_PER_PAGE));microPage=Math.min(microPage,pages);const c=microCounts();
  $('microResultCount').textContent='找到 '+found.length+' 个知识点';$('microLearnedCount').textContent='全部已熟悉 '+c.mastered+' / '+c.total+' · 收藏 '+c.starred;
  $('microGrid').innerHTML=found.length?found.slice((microPage-1)*POINTS_PER_PAGE,microPage*POINTS_PER_PAGE).map(pointCard).join(''):'<div class="empty-copy library-empty">'+icon(microFilter==='starred'?'book':'search')+'<h3>'+(microFilter==='starred'?'当前范围还没有收藏':'没有匹配的小知识点')+'</h3><p>试试其他关键词、模块或掌握状态。</p><button class="secondary-button" id="resetMicroFilters">清除筛选</button></div>';
  $('microPagination').innerHTML=found.length?'<span>第 '+microPage+' / '+pages+' 页 · 每页 12 条</span><div><button data-micro-page="'+(microPage-1)+'" '+(microPage===1?'disabled':'')+' aria-label="上一页">←</button>'+Array.from({length:pages},(_,i)=>'<button data-micro-page="'+(i+1)+'" class="'+(microPage===i+1?'active':'')+'" '+(microPage===i+1?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'<button data-micro-page="'+(microPage+1)+'" '+(microPage===pages?'disabled':'')+' aria-label="下一页">→</button></div>':'';
  if(typeof renderComparisonIndex==='function')renderComparisonIndex();else $('comparisonGrid').innerHTML=COMPARISONS.map((c,i)=>'<details class="comparison-card"><summary><span>'+String(i+1).padStart(2,'0')+'</span><div><h3>'+c.title+'</h3><p>'+c.a+' <b>vs.</b> '+c.b+'</p></div>'+icon('chevron')+'</summary><div class="comparison-content"><div class="comparison-table-wrap"><table><thead><tr><th scope="col">比较维度</th><th scope="col">'+c.a+'</th><th scope="col">'+c.b+'</th></tr></thead><tbody>'+c.rows.map(r=>'<tr>'+r.map((v,i)=>(i===0?'<th scope="row">':'<td>')+escapeHTML(v)+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table></div><p class="comparison-note">'+c.note+'</p><div class="related-links">'+c.nodes.map(relationLink).join('')+'</div></div></details>').join('');
  $('readingLinkCount').textContent=READING_LINKS.length;
  $('readingGrid').innerHTML=READING_LINKS.map((r,i)=>'<a class="reading-card" href="'+r.url+'" target="_blank" rel="noopener noreferrer"><div class="reading-card-top"><span>READING '+String(i+1).padStart(2,'0')+'</span><b>↗</b></div><h3>'+r.title+'</h3><small>'+r.author+'</small><p>'+r.desc+'</p><div>'+r.modules.map(id=>'<span style="color:'+moduleById[id].color+';background:'+moduleById[id].light+'">'+moduleById[id].name+'</span>').join('')+'</div></a>').join('');
}
function refreshPointControls(id){const p=MICRO_BY_ID[id];document.querySelectorAll('[data-point="'+id+'"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.microStatus===microState(id).status)));const details=$('detailPanel');const openTitles=[...details.querySelectorAll('details[open]')].map(d=>d.querySelector('summary').textContent);const previousScroll=details.scrollTop;const openCards=[...document.querySelectorAll('.micro-card details[open]')].map(d=>d.closest('[data-card]').dataset.card);renderDetail();details.querySelectorAll('details').forEach(d=>{d.open=openTitles.includes(d.querySelector('summary').textContent);});details.scrollTop=previousScroll;renderLibrary();for(const cardId of openCards){const card=document.querySelector('[data-card="'+cardId+'"] details');if(card)card.open=true;}renderMicroReview();if(typeof refreshReaderStatus==='function')refreshReaderStatus();}
function updatePoint(id,changes){
  if(!MICRO_BY_ID[id])return;
  const active=document.activeElement,root=active?.closest('#pointReader,#detailPanel,#microGrid');
  const wasStar=active?.dataset.star===id,activeStatus=active?.dataset.point===id?active.dataset.microStatus:null;
  microRecords[id]={...microState(id),...changes,updatedAt:new Date().toISOString()};save();refreshPointControls(id);
  if(root&&(wasStar||activeStatus)){
    const replacement=[...root.querySelectorAll(wasStar?'[data-star]':'[data-micro-status]')].find(b=>wasStar?b.dataset.star===id:b.dataset.point===id&&b.dataset.microStatus===activeStatus);
    if(replacement)replacement.focus({preventScroll:true});
    else if(root.id==='microGrid')$('microStatusFilter').focus({preventScroll:true});
  }
}
function renderMicroReview(){const c=microCounts();$('microReview').innerHTML='<div class="micro-review-heading"><div><h2>细分知识点进度</h2><p class="muted">独立记录，不自动改变核心节点的掌握状态。</p></div><button class="secondary-button" data-review-micro="weak">复习需巩固知识点 ↗</button></div><div class="micro-review-stats"><div><strong>'+c.mastered+'<small> / '+c.total+'</small></strong><span>已熟悉</span></div><div><strong>'+c.weak+'</strong><span>需巩固</span></div><div><strong>'+c.unstarted+'</strong><span>未开始</span></div><div><strong>'+c.starred+'</strong><span>已收藏</span></div></div><div class="micro-module-progress">'+MODULES.map(m=>{const v=microCounts(m.id);return '<button data-open-point-module="'+m.id+'"><span><i class="module-dot" style="background:'+m.color+'"></i>'+m.name+'<small>'+v.mastered+' / '+v.total+'</small></span><div class="progress-track"><span style="width:'+(v.total?v.mastered/v.total*100:0)+'%;background:'+m.color+'"></span></div></button>';}).join('')+'</div>';}
function resetLibrary(){libraryModule='all';microQuery='';microType='all';microFilter='all';microPage=1;$('microSearch').value='';$('microStatusFilter').value='all';}
function openPointModule(id){resetLibrary();libraryTab='points';libraryModule=id;setPage('library');}
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-library-tab]');if(tab){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigatePage('library',{tab:tab.dataset.libraryTab,scroll:false,focus:false});return;}
  const mod=e.target.closest('[data-library-module]');if(mod){libraryModule=mod.dataset.libraryModule;microPage=1;renderLibrary();return;}
  const type=e.target.closest('[data-micro-type]');if(type){microType=type.dataset.microType;microPage=1;renderLibrary();return;}
  const paging=e.target.closest('[data-micro-page]');if(paging&&!paging.disabled){microPage=Number(paging.dataset.microPage);renderLibrary();$('libraryPage').scrollIntoView({behavior:'smooth',block:'start'});return;}
  const star=e.target.closest('[data-star]');if(star){const id=star.dataset.star;updatePoint(id,{starred:!microState(id).starred});if(storageAvailable)toast(microState(id).starred?'已加入收藏':'已取消收藏');return;}
  const status=e.target.closest('[data-micro-status]');if(status){updatePoint(status.dataset.point,{status:status.dataset.microStatus});if(storageAvailable)toast(MICRO_BY_ID[status.dataset.point].title+' · '+MICRO_STATUS[status.dataset.microStatus]);return;}
  const open=e.target.closest('[data-open-node-points]');if(open){resetLibrary();libraryTab='points';microQuery=nodeById[open.dataset.openNodePoints].name.toLowerCase();$('microSearch').value=nodeById[open.dataset.openNodePoints].name;setPage('library');return;}
  const module=e.target.closest('[data-open-point-module]');if(module){openPointModule(module.dataset.openPointModule);return;}
  if(e.target.closest('#resetMicroFilters')){resetLibrary();renderLibrary();return;}
  if(e.target.closest('[data-review-micro]')){resetLibrary();libraryTab='points';microFilter='weak';$('microStatusFilter').value='weak';setPage('library');}
});
document.addEventListener('input',e=>{if(e.target.id==='microSearch'){microQuery=e.target.value.trim().toLowerCase();microPage=1;renderLibrary();}});
document.addEventListener('change',e=>{if(e.target.id==='microStatusFilter'){microFilter=e.target.value;microPage=1;renderLibrary();}});
