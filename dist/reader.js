'use strict';
const initialReaderHash=location.hash;
let readerPointId=null,readerReturnHash='',readerReturnFocus=null;
const readerTrail=[];
const readerSections=[['definition','概念定位'],['interpretation','深入解读'],['mechanism','作用机制'],['case','情境推演'],['limits','辨析与边界'],['exam','考研表达'],['connections','联系与阅读']];
function pointReadingLength(p){return [p.body,p.example,...Object.values(DEEP_NOTES[p.id])].join('').length;}
function readerRelatedPoints(id){const p=MICRO_BY_ID[id];return (MICRO_BY_NODE[p.node]||[]).filter(x=>x.id!==id).slice(0,5);}
function readerSection(id,title,html){return '<section class="reader-section" id="reader-'+id+'" aria-labelledby="reader-heading-'+id+'"><h3 id="reader-heading-'+id+'"><span>'+String(readerSections.findIndex(x=>x[0]===id)+1).padStart(2,'0')+'</span>'+title+'</h3>'+html+'</section>';}
function readerFooterNavigation(p){const index=MICRO_POINTS.findIndex(x=>x.id===p.id);return '<div class="reader-pagination"><button data-reader-step="-1" '+(index===0?'disabled':'')+'><span>← 上一知识点</span><small>'+(index?escapeHTML(MICRO_POINTS[index-1].title):'已是第一篇')+'</small></button><button data-reader-step="1" '+(index===MICRO_POINTS.length-1?'disabled':'')+'><span>下一知识点 →</span><small>'+(index<MICRO_POINTS.length-1?escapeHTML(MICRO_POINTS[index+1].title):'已是最后一篇')+'</small></button></div>';}
function renderReader(){
  const p=MICRO_BY_ID[readerPointId];if(!p)return;
  const n=nodeById[p.node],m=moduleById[n.m],d=DEEP_NOTES[p.id],index=MICRO_POINTS.indexOf(p),length=pointReadingLength(p);
  const readings=(NODE_READING_INDEX[n.id]||[]).map(i=>READING_LINKS[i]).filter(Boolean);
  const comparisons=COMPARISONS.filter(c=>c.nodes.includes(n.id));
  $('pointReader').innerHTML='<div class="reader-topbar"><span class="reader-brand">'+icon('book')+'知识点精读<span>PUBLIC ADMIN ATLAS</span></span><button class="reader-contents-button" id="readerContentsButton" aria-controls="readerContents" aria-label="打开本篇阅读目录">目录</button><button class="reader-close" id="closeReader" aria-label="关闭详细解读">'+icon('maximize').replace(ICONS.maximize,'M6 6l12 12 M18 6L6 18')+'</button></div><div class="reader-layout"><aside class="reader-sidebar"><span class="reader-overline">本篇目录</span><nav aria-label="详细解读目录">'+readerSections.map(([id,title],i)=>'<button data-reader-anchor="'+id+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+title+'</button>').join('')+'</nav><div class="reader-topic"><span class="reader-overline">同主题 · '+n.name+'</span>'+MICRO_BY_NODE[n.id].map(q=>'<button class="'+(q.id===p.id?'active':'')+'" data-read-point="'+q.id+'" '+(q.id===p.id?'aria-current="true"':'')+'><i class="status-dot '+microState(q.id).status+'"></i>'+escapeHTML(q.title)+'</button>').join('')+'</div><div class="reader-study-tip">先理解概念，再说明机制。<br>用情境检验，用自己的话复述。</div></aside><div class="reader-content" id="readerContent"><article><header class="reader-article-header"><div class="reader-meta"><span style="color:'+m.color+'">'+m.name+'</span><span>'+p.type+'</span><span>'+String(index+1).padStart(3,'0')+' / '+MICRO_POINTS.length+'</span></div><h2 id="readerTitle" tabindex="-1">'+escapeHTML(p.title)+'</h2><p class="reader-subtitle">所属主题：'+n.name+' <span>·</span> 正文约 '+length+' 字（含标点）</p><div id="readerStatus" class="reader-status-area">'+pointStatusButtons(p)+'</div></header>'+readerSection('definition','概念定位','<div class="reader-definition">'+escapeHTML(p.body)+'</div>')+readerSection('interpretation','深入解读','<p>'+escapeHTML(d.interpretation)+'</p>')+readerSection('mechanism','作用机制','<p>'+escapeHTML(d.mechanism)+'</p>')+readerSection('case','情境推演','<div class="reader-scenario"><span>教学假设情境</span><p>'+escapeHTML(p.example)+'</p></div><p>'+escapeHTML(d.caseAnalysis)+'</p>')+readerSection('limits','辨析与边界','<div class="reader-boundary">'+escapeHTML(d.limits)+'</div>')+readerSection('exam','考研表达','<p>'+escapeHTML(d.exam)+'</p><details class="reader-theme-guide"><summary>展开所属主题的答题框架 '+icon('chevron')+'</summary><ol>'+EXAM_GUIDES[n.id].map(t=>'<li>'+escapeHTML(t)+'</li>').join('')+'</ol><p>本篇抓手与主题框架用于组织论证，不是唯一标准答案。</p></details>')+readerSection('connections','联系与阅读','<div class="reader-related-points">'+readerRelatedPoints(p.id).map(q=>'<button data-read-point="'+q.id+'">'+escapeHTML(q.title)+'<span>↗</span></button>').join('')+'</div>'+(comparisons.length?'<details class="reader-comparisons"><summary>相关易混对照 <span>'+comparisons.length+' 组</span></summary>'+comparisons.map(c=>'<div class="reader-compare-note"><strong>'+c.title+'</strong><p>'+c.note+'</p></div>').join('')+'</details>':'')+'<h4>主题延伸阅读</h4><p class="reader-source-note">以下是原典、课程或相关主题阅读线索，不代表本篇逐条引文出处。站内内容为独立学习整理；假设情境不作为实证发现。</p><div class="reader-sources">'+readings.map(r=>'<a href="'+r.url+'" target="_blank" rel="noopener noreferrer"><strong>'+escapeHTML(r.title)+' ↗</strong><small>'+escapeHTML(r.author)+'</small><span>'+escapeHTML(r.desc)+'</span></a>').join('')+'</div><button class="reader-back-map" data-reader-parent="'+n.id+'">'+icon('network')+'回到「'+n.name+'」知识节点 ↗</button>')+'<p class="reader-scope-note">通用学科复习材料。请结合目标院校考纲和指定教材使用；现行法律、政策与具体制度细节需另查最新权威文本。</p>'+readerFooterNavigation(p)+'</article></div></div>';
}
function openPointReader(id,{from,restore}={}){
  if(!MICRO_BY_ID[id]||!DEEP_NOTES[id])return;
  const modal=$('pointReader'),wasOpen=modal.open;
  if(wasOpen&&from&&id===readerPointId)return;
  if(wasOpen&&from&&modal.contains(from)){
    readerTrail.push({
      point:readerPointId,
      hash:location.hash,
      scroll:$('readerContent').scrollTop,
      focus:from.id,
      openDetails:[...$('readerContent').querySelectorAll('details')].map(detail=>detail.open)
    });
    if(readerTrail.length>24)readerTrail.shift();
  }else if(!restore){
    readerTrail.length=0;
  }
  if(!wasOpen){readerReturnHash=location.hash.startsWith('#point=')?'':location.hash;const opener=document.activeElement;readerReturnFocus={element:opener,elementId:opener?.id,root:opener?.parentElement?.closest('[id]'),point:opener?.dataset.readPoint,fallbackId:opener?.closest('[data-reader-return-focus]')?.dataset.readerReturnFocus};}
  readerPointId=id;renderReader();
  if(!wasOpen){document.body.classList.add('reader-open');modal.showModal();}
  if(restore)$('readerContent').querySelectorAll('details').forEach((detail,index)=>{detail.open=!!restore.openDetails[index];});
  const target=(restore?.focus&&$(restore.focus))||$('readerTitle');
  target.focus({preventScroll:true});
  $('readerContent').scrollTo({top:restore?.scroll||0,behavior:'instant'});
  history.replaceState(null,'',location.pathname+location.search+(restore?.hash||'#point='+encodeURIComponent(id)));
}
function refreshReaderStatus(){
  if(!readerPointId||!$('pointReader').open)return;
  const p=MICRO_BY_ID[readerPointId];
  $('readerStatus').innerHTML=pointStatusButtons(p);
  $('pointReader').querySelectorAll('.reader-topic [data-read-point]').forEach(b=>{const dot=b.querySelector('.status-dot');if(dot)dot.className='status-dot '+microState(b.dataset.readPoint).status;});
}
function focusReaderSection(id,behavior='smooth'){
  const section=$(id);if(!section||!$('pointReader').contains(section))return;
  section.tabIndex=-1;section.focus({preventScroll:true});
  section.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':behavior,block:'start'});
}
function closePointReader(){
  const modal=$('pointReader');
  if(!modal.open)return;
  history.replaceState(null,'',location.pathname+location.search+readerReturnHash);
  document.body.classList.remove('reader-open');
  readerPointId=null;
  readerTrail.length=0;
  const back=readerReturnFocus;
  readerReturnFocus=null;
  modal.close();
  if(!back)return;
  const target=back.element?.isConnected?back.element:(back.elementId?$(back.elementId):null)||(back.point&&back.root?.isConnected?[...back.root.querySelectorAll('[data-read-point]')].find(b=>b.dataset.readPoint===back.point):null);
  if(target?.getClientRects().length)target.focus({preventScroll:true});
  else if(back.root?.id==='microGrid'&&back.root.getClientRects().length)$('microStatusFilter').focus({preventScroll:true});
  else if(back.fallbackId){const fallback=$(back.fallbackId);if(fallback?.getClientRects().length)fallback.focus();}
}
$('pointReader').addEventListener('cancel',event=>{
  event.preventDefault();
  closePointReader();
});
document.addEventListener('click',e=>{
  const open=e.target.closest('[data-read-point]');if(open){if(open.matches("a")&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;e.preventDefault();openPointReader(open.dataset.readPoint,{from:open.dataset.readerRelation?open:undefined});return;}
  if(e.target.closest('#readerTrailBack')){
    const restore=readerTrail.pop();
    if(restore)openPointReader(restore.point,{restore});
    return;
  }
  if(e.target.closest('#closeReader')){closePointReader();return;}
  const anchor=e.target.closest('[data-reader-anchor]');if(anchor){focusReaderSection('reader-'+anchor.dataset.readerAnchor);return;}
  const step=e.target.closest('[data-reader-step]');if(step&&!step.disabled){const index=MICRO_POINTS.findIndex(p=>p.id===readerPointId),next=MICRO_POINTS[index+Number(step.dataset.readerStep)];if(next)openPointReader(next.id);return;}
  const parent=e.target.closest('[data-reader-parent]');
  if(parent)revealMapNode(parent.dataset.readerParent,true);
});
const initialPoint=new URLSearchParams(location.hash.slice(1)).get('point');if(initialPoint&&MICRO_BY_ID[initialPoint])openPointReader(initialPoint);
