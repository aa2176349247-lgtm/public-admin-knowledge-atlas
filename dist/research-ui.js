'use strict';
// The historical explanation stays available; the research supplement has its own provenance.
const researchText=p=>{const x=RESEARCH.lessons[p.id];return x?[x.summary,...x.aliases,...x.scholars,...x.sections.flatMap(s=>[s.title,...s.paragraphs,...(s.table?[s.table.caption,...s.table.headers,...s.table.rows.flat()]:[])]),...x.quiz.flatMap(q=>[q.q,q.a])].join(' '):'';};
const originalLibraryMatches=libraryMatches;
libraryMatches=function(){const q=microQuery;microQuery='';const candidates=originalLibraryMatches();microQuery=q;return candidates.filter(p=>{const lesson=RESEARCH.lessons[p.id],status=$('researchFilter')?.value||'all',level=$('levelFilter')?.value||'all';const contentMatch=status==='all'||(status==='verified'&&!!lesson?.fullVerified)||(status==='supplement'&&!!lesson)||(status==='legacy'&&!lesson?.fullVerified);return contentMatch&&(level==='all'||(lesson?.level||'待分级')===level)&&(!q||normalizeStudySearch([p.title,p.body,p.example,...Object.values(DEEP_NOTES[p.id]),nodeById[p.node].name,moduleById[nodeById[p.node].m].name,p.type,researchText(p)].join(' ')).includes(normalizeStudySearch(q)));});};
function pointStudyLength(p){const lesson=RESEARCH.lessons[p.id];return pointReadingLength(p)+(lesson?[lesson.summary,...lesson.sections.flatMap(s=>[s.title,...s.paragraphs,...(s.table?[s.table.caption,...s.table.headers,...s.table.rows.flat()]:[])]),...lesson.quiz.flatMap(q=>[q.q,q.a])].join('').length:0);}
const originalPointCard=pointCard;
pointCard=function(p){
  const lesson=RESEARCH.lessons[p.id],state=lesson?.fullVerified?'verified':lesson?'supplement':'pending';
  const label=state==='verified'?'正文与专题已核验':state==='supplement'?'专题已核验':'正文待核验';
  const meta='<div class="point-content-meta"><span class="content-review '+state+'" data-content-state="'+state+'">'+label+'</span><span>'+(lesson?escapeHTML(lesson.level):'待分级')+'</span></div>';
  const context='<p class="point-topic-name">'+escapeHTML(nodeById[p.node].name)+'</p>';
  const scope='<div class="point-reading-meta"><span>约 '+pointStudyLength(p).toLocaleString('zh-CN')+' 字</span><span>'+(lesson?'核验至 '+escapeHTML(lesson.verifiedAt||RESEARCH.verifiedAt):'基础学习整理')+'</span></div>';
  return originalPointCard(p).replace('<h3>',meta+'<h3>').replace('</h3>','</h3>'+context).replace('<p class="micro-teaser">'+escapeHTML(p.body)+'</p>','<p class="micro-teaser">'+escapeHTML(lesson?.summary||p.body)+'</p>'+scope).replace(pointStatusButtons(p),'<p class="card-study-label">我的学习记录</p>'+pointStatusButtons(p));
};
const originalResetLibrary=resetLibrary;
resetLibrary=function(){originalResetLibrary();for(const id of ['researchFilter','levelFilter'])$(id).value='all';};
const originalRenderLibrary=renderLibrary;
renderLibrary=function(){
  originalRenderLibrary();
  const reviewed=MICRO_POINTS.filter(p=>RESEARCH.lessons[p.id]?.fullVerified).length;
  document.querySelector('[data-library-total]').textContent=MICRO_POINTS.length;document.querySelector('[data-library-verified]').textContent=reviewed;document.querySelector('[data-library-pending]').textContent=MICRO_POINTS.length-reviewed;
  $('clearLibraryFilters').hidden=libraryModule==='all'&&!microQuery&&microType==='all'&&microFilter==='all'&&$('researchFilter').value==='all'&&$('levelFilter').value==='all';
  document.querySelectorAll('[data-library-module],[data-micro-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
  refreshStudyTreeState();
  renderReadingSources();
};
$('clearLibraryFilters').addEventListener('click',()=>{resetLibrary();renderLibrary();$('microSearch').focus();});
for(const id of ['researchFilter','levelFilter'])$(id).addEventListener('change',()=>{microPage=1;renderLibrary();});
document.addEventListener('click',e=>{if(e.target.closest('#resetMicroFilters')){for(const id of ['researchFilter','levelFilter'])$(id).value='all';renderLibrary();}});
const originalFilteredNodes=filteredNodes;
filteredNodes=function(){const q=search;search='';const candidates=originalFilteredNodes();search=q;return candidates.filter(n=>!q||normalizeStudySearch([n.name,n.desc,...n.terms,moduleById[n.m].name,...MICRO_BY_NODE[n.id].flatMap(p=>[p.title,p.body,p.example,...Object.values(DEEP_NOTES[p.id]),researchText(p)])].join(' ')).includes(normalizeStudySearch(q)));};
const originalRenderReader=renderReader;
function researchTable(table){
  if(!table)return '';
  return '<div class="research-table-wrap" role="region" aria-label="'+escapeHTML(table.caption)+'" tabindex="0"><table><caption>'+escapeHTML(table.caption)+'</caption><thead><tr>'+table.headers.map(h=>'<th scope="col">'+escapeHTML(h)+'</th>').join('')+'</tr></thead><tbody>'+table.rows.map(row=>'<tr>'+row.map((cell,i)=>(i===0?'<th scope="row">':'<td>')+escapeHTML(cell)+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table></div>';
}
function lessonDirectory(lesson,point){
  return lesson.sections.map((s,i)=>'<a href="#point='+encodeURIComponent(point.id)+'&amp;section='+encodeURIComponent(s.id)+'" data-research-anchor="'+escapeHTML(s.id)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+escapeHTML(s.title)+'</a>').join('');
}
function readerContentsDirectory(lesson,point){
  const base=readerSections.map(([id,title],i)=>'<button data-reader-anchor="'+id+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+title+'</button>').join('');
  const extra=lesson?'<span class="reader-directory-label">专题精读</span>'+lessonDirectory(lesson,point)+'<span class="reader-directory-label">检验与追溯</span>'+[['study-quiz','自测与参考解析'],['study-connections','有说明的知识联系'],['study-sources','本专题参考来源']].map(([id,title])=>'<a href="#point='+encodeURIComponent(point.id)+'&amp;section='+id+'" data-research-anchor="'+id+'">'+title+'</a>').join(''):'';
  return '<details class="reader-guide-directory" id="readerContents"><summary>本篇阅读目录 <span>正文'+(lesson?' · 专题 · 自测 · 来源':'')+'</span></summary><nav aria-label="本篇阅读目录"><span class="reader-directory-label">基础正文</span>'+base+extra+'</nav></details>';
}
function validResearchSection(point,id){const lesson=RESEARCH.lessons[point];return !!lesson&&(lesson.sections.some(s=>s.id===id)||['study-quiz','study-connections','study-sources'].includes(id));}
function comparisonLink(id,label){
  return '<a class="compare-direct-link" href="#comparison='+encodeURIComponent(id)+'" data-open-comparison="'+escapeHTML(id)+'">'+
    icon('link')+escapeHTML(label)+'</a>';
}
function mapNodeHash(id){return '#node='+encodeURIComponent(id);}
function mapNodeLink(id,label){
  return '<a class="map-node-link" href="'+mapNodeHash(id)+'" data-open-map-node="'+escapeHTML(id)+'">'+
    icon('network')+escapeHTML(label)+'</a>';
}
function afterReaderCloses(action,preserveHash){
  const reader=$('pointReader');
  if(!reader.open){action();return;}
  if(preserveHash)readerReturnHash=location.hash;
  closePointReader();
  action();
}
function revealMapNode(id,writeHash=false){
  if(!Object.hasOwn(nodeById,id))return;
  afterReaderCloses(()=>{
    const hash=mapNodeHash(id);
    if(writeHash&&location.hash!==hash)history.pushState(null,'',hash);
    selectNode(id,true,false);
    const panel=$('detailPanel'),title=$('topicReadingTitle');
    panel.scrollTop=0;
    title.focus({preventScroll:true});
    panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  },!writeHash);
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-open-map-node]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  revealMapNode(link.dataset.openMapNode,true);
});
function readerConnectionCards(lesson){
  return lesson.relations.map((relation,index)=>{
    const target=MICRO_BY_ID[relation.target];
    const targetLesson=RESEARCH.lessons[target.id];
    const scope=targetLesson?.fullVerified?'正文与专题按范围核验':targetLesson?'专题已核验，正文待核验':'正文待核验';
    const id='reader-relation-'+index;
    return '<li class="reader-connection-card"><span class="reader-connection-kind">'+escapeHTML(relation.type)+'</span>'+
      '<div><button id="'+id+'" data-read-point="'+escapeHTML(target.id)+'" data-reader-relation="true" aria-describedby="'+id+'-why">'+
      escapeHTML(target.title)+' <span aria-hidden="true">↗</span></button><p id="'+id+'-why">'+escapeHTML(relation.why)+'</p>'+
      '<small>'+escapeHTML(nodeById[target.node].name)+' · '+scope+'</small></div></li>';
  }).join('');
}
renderReader=function(){
  originalRenderReader();
  const p=MICRO_BY_ID[readerPointId],lesson=RESEARCH.lessons[p.id],article=$('pointReader').querySelector('article');if(!article)return;
  const subtitle=article.querySelector('.reader-subtitle');
  const length=lesson?pointStudyLength(p):pointReadingLength(p);
  subtitle.innerHTML=mapNodeLink(p.node,nodeById[p.node].name)+'<span class="reader-length">'+
    (lesson?'正文与专题自测约 ':'正文约 ')+length+' 字（含标点）</span>';
  subtitle.dataset.readingLength=String(length);
  const comparisons=COMPARISONS.filter(table=>table.nodes.includes(p.node));
  article.querySelectorAll('.reader-compare-note').forEach((note,index)=>{
    note.insertAdjacentHTML('beforeend',comparisonLink(comparisons[index].id,'查看完整对照与来源'));
  });
  const back=readerTrail.at(-1);
  if(back){
    const button=document.createElement('button');
    button.id='readerTrailBack';
    button.className='reader-trail-back';
    button.textContent='← 上篇';
    button.setAttribute('aria-label','返回上篇：'+MICRO_BY_ID[back.point].title);
    $('readerContentsButton').before(button);
    button.closest('.reader-topbar').classList.add('has-reader-trail');
  }
  const block=document.createElement('div');block.className='research-supplement';
  if(!lesson){block.innerHTML='<p class="research-status">原有学习整理 · 尚未逐条核验来源。主题阅读线索不等同逐条出处。</p>';article.prepend(block);const guide=document.createElement('div');guide.className='reader-guide';guide.innerHTML=readerContentsDirectory(null,p);article.querySelector('.reader-article-header').append(guide);return;}
  const guide=document.createElement('div');guide.className='reader-guide';
  guide.innerHTML='<div class="reader-guide-meta"><span>本篇导读</span><span>'+escapeHTML(lesson.level)+' · '+lesson.sourceIds.length+' 项来源</span></div><p>'+escapeHTML(lesson.summary)+'</p>'+readerContentsDirectory(lesson,p);
  article.querySelector('.reader-article-header').append(guide);
  const side=document.createElement('nav');side.className='reader-research-nav';side.setAttribute('aria-label','专题精读目录');side.innerHTML='<span class="reader-overline">专题精读</span>'+lessonDirectory(lesson,p);$('pointReader').querySelector('.reader-topic').before(side);
  const sections=lesson.sections.map(s=>'<section class="reader-section" id="research-'+escapeHTML(s.id)+'"><small class="research-kind">'+escapeHTML(s.kind)+'</small><h3>'+escapeHTML(s.title)+'</h3>'+s.paragraphs.map(t=>'<p>'+escapeHTML(t)+'</p>').join('')+researchTable(s.table)+'</section>').join('');
  const quiz=lesson.quiz.map((q,i)=>'<details><summary><span>'+String(i+1).padStart(2,'0')+'</span>'+escapeHTML(q.q)+'</summary><p>'+escapeHTML(q.a)+'</p></details>').join('');
  const relations=readerConnectionCards(lesson);
  const sources=lesson.sourceIds.map(id=>{const s=RESEARCH.sources[id];return '<li><a href="'+escapeHTML(s.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s.title)+' ↗</a><span>'+escapeHTML(s.author)+'</span>'+(s.readUrl?'<a class="research-read-link" href="'+escapeHTML(s.readUrl)+'" target="_blank" rel="noopener noreferrer">实际核读入口 ↗</a>':'')+'<small>'+escapeHTML(s.readScope)+'</small></li>';}).join('');
  block.innerHTML='<header class="research-heading"><span>深入理解</span><h3>专题精读</h3><p>'+escapeHTML(lesson.summary)+'</p></header><p class="research-status">按标注范围核验 · '+(lesson.verifiedAt||RESEARCH.verifiedAt)+(lesson.fullVerified?' · 正文与专题均已核验':' · 下列专题已核验，上方原有正文待核验')+'。教学分析和假设情境与原典观点分别标注。</p>'+sections+'<section class="reader-section research-quiz" id="research-study-quiz"><small class="research-kind">检验理解</small><h3>自测与参考解析</h3><p class="research-hint">先用自己的话回答，再展开参考解析。</p>'+quiz+'</section><section class="reader-section research-connections" id="research-study-connections"><small class="research-kind">建立联系</small><h3>有说明的知识联系</h3><ul>'+relations+'</ul></section><section class="reader-section research-source-list" id="research-study-sources"><small class="research-kind">追溯依据</small><h3>本专题参考来源</h3><ol>'+sources+'</ol><p class="research-hint">核验日期：'+(lesson.verifiedAt||RESEARCH.verifiedAt)+'；所列核读范围不等同于通读所有文献。</p></section>';
  article.insertBefore(block,article.querySelector('.reader-scope-note'));
};
function treeProgressText(id){const points=MICRO_BY_NODE[id]||[];return '已熟悉 '+points.filter(p=>microState(p.id).status==='mastered').length+' / '+points.length;}
function refreshTreeProgress(){document.querySelectorAll('[data-tree-progress]').forEach(el=>{el.textContent=treeProgressText(el.dataset.treeProgress);});}
function refreshStudyTreeState(){document.querySelectorAll('[data-tree-state]').forEach(el=>{const id=el.dataset.treeState;el.textContent=(RESEARCH.lessons[id]?.fullVerified?'正文按范围核验':RESEARCH.lessons[id]?'专题已核验，旧正文待核验':'旧正文待核验')+' · '+MICRO_STATUS[microState(id).status];});refreshTreeProgress();}
function renderStudyTree(){
  const root=$('studyTree');if(!root)return;
  const groups=MODULES.map(m=>{const nodes=NODES.filter(n=>n.m===m.id),total=nodes.reduce((sum,n)=>sum+MICRO_BY_NODE[n.id].length,0);return '<details class="tree-module" data-tree-module="'+m.id+'"><summary><span class="tree-module-name"><i class="module-dot" style="background:'+m.color+'"></i>'+escapeHTML(m.name)+'</span><span class="tree-module-total">'+total+' 篇</span></summary><div class="tree-module-content">'+nodes.map(n=>'<details class="tree-topic" data-tree-topic="'+n.id+'"><summary><span>'+escapeHTML(n.name)+'</span><small data-tree-progress="'+n.id+'">'+treeProgressText(n.id)+'</small></summary><ul id="tree-points-'+n.id+'">'+MICRO_BY_NODE[n.id].map(p=>'<li><button id="tree-read-'+p.id+'" data-read-point="'+p.id+'">'+escapeHTML(p.title)+' <span>↗</span></button><small data-tree-state="'+p.id+'">'+(RESEARCH.lessons[p.id]?.fullVerified?'正文按范围核验':RESEARCH.lessons[p.id]?'专题已核验，旧正文待核验':'旧正文待核验')+' · '+escapeHTML(MICRO_STATUS[microState(p.id).status])+'</small></li>').join('')+'</ul></details>').join('')+'</div></details>';});
  const split=Math.ceil(groups.length/2);root.innerHTML=[groups.slice(0,split),groups.slice(split)].map(group=>'<div class="tree-column">'+group.join('')+'</div>').join('');
}
renderStudyTree();
document.querySelectorAll('[data-point-count]').forEach(el=>el.textContent=String(MICRO_POINTS.length));
const originalRenderPaths=renderPaths;
function readingRouteHash(id){return '#route='+encodeURIComponent(id);}
renderPaths=function(){
  if(!RESEARCH.readingPaths?.length){originalRenderPaths();return;}
  const expanded=new Set([...$('learningPath').querySelectorAll('.path-framework[open]')].map(el=>el.closest('[data-route]').dataset.route));
  const hash=$('pointReader').open?readerReturnHash:location.hash;
  const current=new URLSearchParams(hash.slice(1)).get('route');
  $('pathChooser').innerHTML=RESEARCH.readingPaths.map(route=>
    '<a href="'+readingRouteHash(route.id)+'" data-path-scroll="'+escapeHTML(route.id)+'"'+
    (current===route.id?' aria-current="true"':'')+'>'+escapeHTML(route.title)+'<small>'+route.steps.length+' 步</small></a>'
  ).join('');
  $('learningPath').innerHTML=RESEARCH.readingPaths.map((route,index)=>{
    const mastered=route.steps.filter(s=>microState(s.point).status==='mastered').length;
    const next=route.steps.find(s=>microState(s.point).status==='weak')||route.steps.find(s=>microState(s.point).status!=='mastered')||route.steps[0];
    const steps=route.steps.map((s,i)=>{const p=MICRO_BY_ID[s.point],status=microState(p.id).status;return '<li class="path-step '+status+'" data-path-step="'+p.id+'"><span class="path-step-number">'+String(i+1).padStart(2,'0')+'</span><div><button id="route-'+route.id+'-step-'+i+'" data-read-point="'+p.id+'">'+escapeHTML(p.title)+'<span>↗</span></button><p>'+escapeHTML(s.why)+'</p><span class="path-study-status">'+escapeHTML(MICRO_STATUS[status])+'</span></div></li>';}).join('');
    const core=route.coreNodes.map(id=>'<button class="related-link" data-jump="'+id+'"><i class="status-dot '+statusOf(id)+'"></i>'+escapeHTML(nodeById[id].name)+'<span>查看节点 ↗</span></button>').join('');
    return '<article class="path-card guided-path" data-route="'+route.id+'"><header class="guided-path-heading"><span>'+String(index+1).padStart(2,'0')+'</span><div><small>精选 '+route.steps.length+' 篇 · 可跳读</small><h2 id="route-heading-'+route.id+'" tabindex="-1">'+escapeHTML(route.title)+'</h2></div></header><p class="guided-path-description">'+escapeHTML(route.desc)+'</p><div class="path-personal-progress"><span>我已熟悉 <b>'+mastered+' / '+route.steps.length+'</b></span><span>由学习标记统计</span></div><button class="path-start" id="route-'+route.id+'-start" data-read-point="'+next.point+'"><span>'+(mastered===route.steps.length?'回顾本路线':mastered||route.steps.some(s=>microState(s.point).status==='weak')?'继续精读':'从这里开始')+'</span><strong>'+escapeHTML(MICRO_BY_ID[next.point].title)+' ↗</strong></button><ol class="path-steps">'+steps+'</ol><div class="path-reflection"><small>读完试着回答</small><p>'+escapeHTML(route.question)+'</p></div><details class="path-framework" '+(expanded.has(route.id)?'open':'')+'><summary>查看本主题框架节点</summary><div>'+core+'</div></details></article>';
  }).join('');
};
function revealReadingRoute(id,writeHash=false){
  if(!RESEARCH.readingPaths.some(route=>route.id===id))return;
  afterReaderCloses(()=>{
    const hash=readingRouteHash(id);
    if(writeHash&&location.hash!==hash)history.pushState(null,'',hash);
    setPage('path',false);
    const heading=$('route-heading-'+id);
    heading.focus({preventScroll:true});
    heading.closest('.guided-path').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  },!writeHash);
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-path-scroll],[data-open-topic-route]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  revealReadingRoute(link.dataset.pathScroll||link.dataset.openTopicRoute,true);
});
function topicReadingGuide(node){
  const points=MICRO_BY_NODE[node.id]||[];
  if(!points.length)return '';
  const isReviewed=point=>RESEARCH.lessons[point.id]?.fullVerified;
  const unfinished=points.filter(point=>microState(point.id).status!=='mastered');
  const weak=unfinished.find(point=>microState(point.id).status==='weak');
  const reviewed=points.filter(isReviewed).length;
  const next=weak||unfinished.find(isReviewed)||unfinished[0]||points[0];
  const nextLesson=RESEARCH.lessons[next.id];
  const reason=weak?'先复习你的薄弱点':!unfinished.length?'全部已熟悉，选一篇回顾':isReviewed(next)?'继续读已核验的内容':'从尚未熟悉的内容开始';
  const routes=RESEARCH.readingPaths.filter(route=>route.coreNodes.includes(node.id));
  const routesHTML=routes.length?'<div class="topic-reading-routes"><h4>相关学习路线</h4>'+routes.map(route=>
    '<a class="topic-route" href="'+readingRouteHash(route.id)+'" data-open-topic-route="'+escapeHTML(route.id)+'"><span>'+escapeHTML(route.title)+'</span><small>'+route.steps.length+' 步 ↗</small></a>'
  ).join('')+'</div>':'';
  const pointList='<ul class="topic-reading-choices">'+points.map(point=>{
    const lesson=RESEARCH.lessons[point.id],state=microState(point.id);
    const contentState=lesson?.fullVerified?'正文与专题按范围核验':lesson?'专题已核验，正文待核验':'正文待核验';
    return '<li><div><button id="topic-read-'+point.id+'" data-read-point="'+point.id+'">'+escapeHTML(point.title)+
      ' <span aria-hidden="true">↗</span></button><small>'+contentState+'</small></div><span class="topic-personal-state '+state.status+'">'+MICRO_STATUS[state.status]+'</span></li>';
  }).join('')+'</ul>';
  const choices=points.length>5?'<details class="topic-reading-list"><summary>查看本主题 '+points.length+' 篇知识点</summary>'+pointList+'</details>':pointList;
  return '<section class="topic-reading-guide" aria-labelledby="topicReadingTitle"><div class="topic-reading-heading"><h3 id="topicReadingTitle" tabindex="-1">主题精读</h3></div>'+
    '<div class="topic-reading-progress"><span data-node-micro-count="'+node.id+'">个人已熟悉 '+(points.length-unfinished.length)+' / '+points.length+
    '</span><span>正文按范围核验 '+reviewed+' / '+points.length+'</span></div>'+
    '<button class="topic-reading-start" id="topic-start-'+node.id+'" data-read-point="'+next.id+'"><span>'+reason+'</span><strong>'+
    escapeHTML(next.title)+' <span aria-hidden="true">↗</span></strong>'+(nextLesson?'<small>'+escapeHTML(nextLesson.summary)+'</small>':'')+'</button>'+
    routesHTML+choices+'<button class="topic-reading-library" data-open-node-points="'+node.id+'">在知识点库查看本主题 ↗</button></section>';
}
const originalRenderDetailWithResearch=renderDetail;
renderDetail=function(){
  originalRenderDetailWithResearch();const root=$('detailPanel'),old=root.querySelector('.detail-micro-section');if(!old)return;
  old.remove();root.querySelector('.detail-head').insertAdjacentHTML('afterend',topicReadingGuide(nodeById[selected]));
  root.querySelector('.topic-reading-heading').insertAdjacentHTML('beforeend',mapNodeLink(selected,'节点链接'));
  const linked=new URLSearchParams(location.hash.slice(1)).get('node');
  if(page==='map'&&Object.hasOwn(nodeById,linked)&&linked!==selected)history.replaceState(null,'',mapNodeHash(selected));
};
const originalSetPage=setPage;
setPage=function(next,scroll){
  const previous=page;
  originalSetPage(next,scroll);
  if(typeof syncPageLocation==='function')syncPageLocation(next,previous);
};
function orderedReviewPoints(predicate){
  const stamp=p=>{const time=Date.parse(microRecords[p.id]?.updatedAt||'');return Number.isFinite(time)?time:0;};
  return MICRO_POINTS.filter(p=>predicate(microState(p.id))).sort((a,b)=>stamp(a)-stamp(b));
}
function reviewRecordDate(id){const time=Date.parse(microRecords[id]?.updatedAt||'');return Number.isFinite(time)?'记录更新于 '+new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time)):'未记录日期';}
function reviewPointDeck(kind,title,points,description,allLabel,filter){
  const items=points.slice(0,6).map(p=>{const m=moduleById[nodeById[p.node].m],lesson=RESEARCH.lessons[p.id];return '<li><div class="review-point-meta"><span style="color:'+m.color+'">'+escapeHTML(m.name)+'</span><small>'+escapeHTML(reviewRecordDate(p.id))+'</small></div><button id="review-'+kind+'-'+p.id+'" data-read-point="'+p.id+'"><strong>'+escapeHTML(p.title)+'</strong><span>↗</span></button><p>'+escapeHTML(lesson?.summary||p.body)+'</p><small class="review-point-source">'+(lesson?.fullVerified?'正文与专题按范围核验':lesson?'专题已核验，原正文待核验':'正文来源待核验')+'</small></li>';}).join('');
  return '<section class="review-point-deck '+kind+'"><header><h3>'+title+'</h3><span>'+points.length+' 篇</span></header><p class="review-deck-guide">'+description+'</p>'+(items?'<ul id="review-'+kind+'-points" class="review-point-list" data-reader-return-focus="microReviewTitle">'+items+'</ul><div class="review-deck-bottom"><span>显示 '+Math.min(points.length,6)+' / '+points.length+' · 记录较早的在前，无日期在前</span><button data-review-library="'+filter+'">'+allLabel+' ↗</button></div>':'<div class="review-deck-empty"><p>'+(kind==='weak'?'在阅读时主动标记“需巩固”，即可在这里找到它。':'收藏仍标记“未开始”的知识点，会出现在这里；已熟悉和需巩固条目分别处理。')+'</p><button data-page="library">去知识点库 ↗</button></div>')+'</section>';
}
const originalRenderMicroReview=renderMicroReview;
renderMicroReview=function(){
  originalRenderMicroReview();const root=$('microReview'),heading=root.querySelector('h2');heading.id='microReviewTitle';heading.tabIndex=-1;heading.textContent='细分知识点复习';
  const weak=orderedReviewPoints(s=>s.status==='weak'),saved=orderedReviewPoints(s=>s.starred&&s.status==='unstarted');
  const workspace=document.createElement('div');workspace.className='review-reading-workspace';workspace.innerHTML=reviewPointDeck('weak','需要巩固的知识点',weak,'这里是你主动标记的薄弱点。先精读，再决定是否改为已熟悉。','查看全部需巩固','weak')+reviewPointDeck('saved','收藏待学',saved,'你收藏且仍标记为未开始的内容。打开阅读不会自动改变自评。','查看全部收藏','starred');
  const modules=root.querySelector('.micro-module-progress');modules.before(workspace);const details=document.createElement('details');details.className='review-module-details';details.innerHTML='<summary>查看各板块细分进度</summary>';modules.before(details);details.append(modules);
  renderStudyRecordPanel();
};
let recordImportReturnFocus=false;
function restoreRecordImportFocus(){if(recordImportReturnFocus){recordImportReturnFocus=false;$('recordImportBtn')?.focus();}}
$('importFile').addEventListener('cancel',restoreRecordImportFocus);
function renderStudyRecordPanel(){
  let panel=$('studyRecordPanel');if(!panel){panel=document.createElement('details');panel.id='studyRecordPanel';panel.className='study-record-panel';panel.setAttribute('aria-labelledby','studyRecordTitle');$('reviewPage').querySelector('.review-intro').after(panel);}
  const count=Object.keys(records).length,points=Object.keys(microRecords).length,saved=MICRO_POINTS.filter(p=>microState(p.id).starred).length;
  const status=storageReadError?'原记录读取异常，已暂停保存。请先导出原始记录。':storageAvailable?'当前记录已保存在此浏览器。':'本次修改尚未持久保存，请及时导出备份。';
  const wasOpen=panel.open;
  const headline='<summary><div><h2 id="studyRecordTitle">学习记录与备份</h2><p>'+(storageReadError?'原记录读取异常，建议先导出原始内容':'已载入 '+count+' 个节点 · '+points+' 个细分记录 · '+saved+' 个收藏')+'</p></div><span class="record-panel-toggle">备份与迁移 '+icon('chevron')+'</span></summary>';
  panel.innerHTML=headline+'<div class="record-panel-body"><div class="record-panel-intro"><span>YOUR STUDY RECORDS</span><h3>把学习记录带在身边</h3><p>记录保存在当前浏览器。更换设备或浏览器时，可先导出，再在另一处导入；不会自动同步。</p></div>'+(storageReadError?'<p class="record-count-unavailable">原记录尚未读入，暂不统计数量。<br>可以导出原始内容，保留恢复线索。</p>':'<dl class="record-panel-counts"><div><dt>核心节点记录</dt><dd>'+count+'<small>含节点笔记</small></dd></div><div><dt>细分学习记录</dt><dd>'+points+'<small>来自主动标记</small></dd></div><div><dt>当前收藏</dt><dd>'+saved+'<small>细分知识点</small></dd></div></dl>')+'<div class="record-panel-actions"><button id="recordExportBtn" class="secondary-button" data-record-action="export">'+icon('download')+(storageReadError?'导出原始记录':'导出学习记录')+'</button><button id="recordImportBtn" class="secondary-button" data-record-action="import">'+icon('upload')+'导入学习记录</button><button id="recordHelpBtn" data-record-action="help">查看记录说明 ↗</button></div><p class="record-panel-status '+(storageReadError||!storageAvailable?'unsaved':'')+'" role="status">'+status+'</p><p class="record-panel-note">打开精读不会自动计为已熟悉。核心节点与细分点分别记录；导入重叠条目前会提示影响，建议先备份当前记录。</p></div>';
  panel.open=wasOpen||storageReadError||!storageAvailable;
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-record-action]');if(!button)return;const action=button.dataset.recordAction;if(action==='export')$('exportBtn').click();if(action==='import'){recordImportReturnFocus=true;$('importBtn').click();}if(action==='help'){if(!$('helpDialog').open)$('helpDialog').showModal();$('exportBtn').focus();}});
document.addEventListener('click',e=>{const button=e.target.closest('[data-review-library]');if(!button)return;resetLibrary();libraryTab='points';microFilter=button.dataset.reviewLibrary;$('microStatusFilter').value=microFilter;setPage('library');$('microSearch').focus();});
let comparisonQuery='',comparisonModule='all',comparisonReview='all';
function resetComparisonFilters(){
  comparisonQuery='';comparisonModule='all';comparisonReview='all';
  $('comparisonSearch').value='';$('comparisonModule').value='all';$('comparisonReview').value='all';
}
function revealComparison(id,writeHash=false){
  if(!COMPARISONS.some(table=>table.id===id))return;
  const show=()=>{
    const hash='#comparison='+encodeURIComponent(id);
    if(writeHash&&location.hash!==hash)history.pushState(null,'',hash);
    libraryTab='compare';
    setPage('library',false);
    const cardId='comparison-'+id;
    if(!$(cardId)){resetComparisonFilters();renderComparisonIndex();}
    const card=$(cardId);
    card.open=true;
    card.querySelector('summary').focus({preventScroll:true});
    card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  afterReaderCloses(show,!writeHash);
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-open-comparison]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  revealComparison(link.dataset.openComparison,true);
});
function comparisonModules(c){return [...new Set([...c.nodes.map(id=>nodeById[id].m),...(RESEARCH.comparisonGuides[c.id]||[]).map(id=>nodeById[MICRO_BY_ID[id].node].m)])];}
function prepareComparisonIndex(){
  const area=$('compareArea'),reviewed=Object.keys(RESEARCH.comparisonReviews).length;
  area.querySelector('.comparison-intro').outerHTML='<section class="compare-intro" aria-labelledby="compareTitle"><div><span>MAKE THE DISTINCTION</span><h2 id="compareTitle">先分清概念，再解释联系</h2><p>沿同一维度对照，留意适用边界。需要展开论证时，直接进入相关精读，查看机制、情境和来源。</p></div><div class="compare-overview"><strong>'+COMPARISONS.length+'<small>组概念对照</small></strong><p><b>'+reviewed+'</b> 组按范围核验<br><b>'+(COMPARISONS.length-reviewed)+'</b> 组仍待逐条核验</p></div></section>';
  const tools=document.createElement('div');tools.className='compare-tools';tools.innerHTML='<label class="compare-search"><span>搜索对照</span><input type="search" id="comparisonSearch" placeholder="例如：产出、信度、参与机会"></label><label>关联板块<select id="comparisonModule"><option value="all">全部板块</option>'+MODULES.map(m=>'<option value="'+m.id+'">'+escapeHTML(m.name)+'</option>').join('')+'</select></label><label>内容核验<select id="comparisonReview"><option value="all">全部对照</option><option value="reviewed">按范围核验</option><option value="pending">待逐条核验</option></select></label><button class="secondary-button" id="clearComparisonFilters" hidden>清除对照筛选</button>';
  const grid=$('comparisonGrid');grid.before(tools);const count=document.createElement('p');count.id='comparisonResultCount';count.className='compare-result-count';count.setAttribute('aria-live','polite');grid.before(count);grid.dataset.readerReturnFocus='comparisonSearch';
  $('comparisonSearch').addEventListener('input',()=>{comparisonQuery=$('comparisonSearch').value.trim();renderComparisonIndex();});
  $('comparisonModule').addEventListener('change',()=>{comparisonModule=$('comparisonModule').value;renderComparisonIndex();});
  $('comparisonReview').addEventListener('change',()=>{comparisonReview=$('comparisonReview').value;renderComparisonIndex();});
  $('clearComparisonFilters').addEventListener('click',()=>{resetComparisonFilters();renderComparisonIndex();$('comparisonSearch').focus();});
}
function renderComparisonIndex(){
  const grid=$('comparisonGrid');if(!$('comparisonSearch'))return;
  const open=new Set([...grid.querySelectorAll('[data-comparison-id][open]')].map(el=>el.dataset.comparisonId));
  const scopes=new Set([...grid.querySelectorAll('[data-comparison-scope][open]')].map(el=>el.dataset.comparisonScope));
  const query=normalizeStudySearch(comparisonQuery),found=COMPARISONS.filter(c=>{
    const review=RESEARCH.comparisonReviews[c.id],points=(RESEARCH.comparisonGuides[c.id]||[]).map(id=>MICRO_BY_ID[id]);
    return (comparisonModule==='all'||comparisonModules(c).includes(comparisonModule))&&(comparisonReview==='all'||(comparisonReview==='reviewed'?!!review:!review))&&(!query||normalizeStudySearch([c.title,c.a,c.b,...c.rows.flat(),c.note,...points.map(p=>p.title),...(review?.sourceIds||[]).map(id=>RESEARCH.sources[id].title)].join(' ')).includes(query));
  });
  grid.innerHTML=found.length?found.map(c=>{
    const review=RESEARCH.comparisonReviews[c.id],points=(RESEARCH.comparisonGuides[c.id]||[]).map(id=>MICRO_BY_ID[id]);
    const status=review?'对照按范围核验':'对照待逐条核验';
    const evidence=review?'<details class="compare-source-scope" data-comparison-scope="'+c.id+'" '+(scopes.has(c.id)?'open':'')+'><summary>核验范围与来源 <span>'+review.sourceIds.length+' 项</span></summary><p>'+escapeHTML(review.scope)+'</p><small>核验日期：'+review.reviewedAt+' · 仅限本对照。</small><ul>'+review.sourceIds.map(id=>{const s=RESEARCH.sources[id];return '<li><a href="'+escapeHTML(s.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s.title)+' ↗</a>'+(s.readUrl?'<a class="compare-read-source" href="'+escapeHTML(s.readUrl)+'" target="_blank" rel="noopener noreferrer">实际核读入口 ↗</a>':'')+'<p>'+escapeHTML(s.readScope)+'</p></li>';}).join('')+'</ul></details>':'<p class="compare-pending-note">这组对照仍待逐条核验。关联精读各自标注核验状态。</p>';
    const readings='<div class="compare-reading"><h4>相关精读</h4>'+points.map(p=>'<button id="compare-'+c.id+'-'+p.id+'" data-read-point="'+p.id+'"><span>'+escapeHTML(p.title)+'<small>'+(RESEARCH.lessons[p.id]?.fullVerified?'正文与专题按范围核验':'旧正文待核验')+'</small></span><b aria-hidden="true">↗</b></button>').join('')+'</div>';
    return '<details class="comparison-card" id="comparison-'+c.id+'" data-comparison-id="'+c.id+'" '+(open.has(c.id)?'open':'')+'><summary><span class="compare-number">'+String(COMPARISONS.indexOf(c)+1).padStart(2,'0')+'</span><div><span class="compare-review '+(review?'reviewed':'pending')+'">'+status+'</span><h3>'+escapeHTML(c.title)+'</h3><p>'+escapeHTML(c.a)+' <b>vs.</b> '+escapeHTML(c.b)+'</p></div>'+icon('chevron')+'</summary><div class="comparison-content"><div class="compare-table-tools"><span>沿同一行比较</span>'+comparisonLink(c.id,'本表链接')+'</div><div class="comparison-table-wrap" role="region" aria-label="'+escapeHTML(c.title)+'对照表" tabindex="0"><table><caption>'+escapeHTML(c.title)+'</caption><thead><tr><th scope="col">比较维度</th><th scope="col">'+escapeHTML(c.a)+'</th><th scope="col">'+escapeHTML(c.b)+'</th></tr></thead><tbody>'+c.rows.map(row=>'<tr>'+row.map((cell,i)=>(i===0?'<th scope="row">':'<td>')+escapeHTML(cell)+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table></div><div class="compare-boundary"><small>别忽略边界</small><p>'+escapeHTML(c.note)+'</p></div><div class="compare-follow-up">'+readings+evidence+'</div><details class="compare-core-links"><summary>查看关联框架节点</summary><div class="related-links">'+c.nodes.map(relationLink).join('')+'</div></details></div></details>';
  }).join(''):'<div class="compare-empty"><h3>没有匹配的对照</h3><p>试试其他概念，或清除板块和核验筛选。</p></div>';
  $('comparisonResultCount').textContent='找到 '+found.length+' / '+COMPARISONS.length+' 组对照 · 内容核验与个人学习标记分别记录';
  $('clearComparisonFilters').hidden=!comparisonQuery&&comparisonModule==='all'&&comparisonReview==='all';
}
let sourceQuery='',sourceModule='all',sourcePage=1;
const SOURCE_PAGE_SIZE=8;
function readingSourceEntries(){
  const linked=new Map();
  for(const [id,lesson]of Object.entries(RESEARCH.lessons)){const point=MICRO_BY_ID[id];if(!point)continue;for(const sourceId of lesson.sourceIds){if(!linked.has(sourceId))linked.set(sourceId,[]);linked.get(sourceId).push(point);}}
  return [...linked].map(([id,points])=>({id,source:RESEARCH.sources[id],points,modules:[...new Set(points.map(p=>nodeById[p.node].m))]}));
}
function prepareReadingIndex(){
  const area=$('readingArea'),entries=readingSourceEntries();
  area.innerHTML='<section class="source-index-intro" aria-labelledby="sourceIndexTitle"><div><span>READ WITH EVIDENCE</span><h2 id="sourceIndexTitle">找到来源，也看清它支持到哪里</h2><p>检索专题关联的原典、教材和公开资料。先查看实际核读范围，再打开原页或返回精读；书目、摘要与指定段落分别说明。</p></div><dl><div><dt>专题关联来源</dt><dd>'+entries.length+'</dd></div><div><dt>关联专题</dt><dd>'+Object.keys(RESEARCH.lessons).length+'</dd></div></dl></section><div class="source-search-tools"><label class="source-search"><span>搜索来源</span><input type="search" id="sourceSearch" placeholder="作者、书名、术语或核读范围"></label><label class="source-module-select">关联板块<select id="sourceModule"><option value="all">全部板块</option>'+MODULES.map(m=>'<option value="'+m.id+'">'+escapeHTML(m.name)+'</option>').join('')+'</select></label><button id="clearSourceFilters" class="secondary-button" hidden>清除来源筛选</button></div><p id="sourceResultCount" class="source-result-count" aria-live="polite" tabindex="-1"></p><div id="sourceGrid" class="source-grid" data-reader-return-focus="sourceSearch"></div><div id="sourcePagination" class="source-pagination"></div><details class="source-legacy"><summary>主题延伸阅读 <span>'+READING_LINKS.length+' 项</span></summary><p>以下保留原有主题阅读入口，供继续探索；它们与上方逐篇标注的专题来源分开，不视为每篇正文的逐条出处。</p><div id="readingGrid" class="reading-grid"></div></details>';
  $('sourceSearch').addEventListener('input',()=>{sourceQuery=$('sourceSearch').value.trim();sourcePage=1;renderReadingSources();});
  $('sourceModule').addEventListener('change',()=>{sourceModule=$('sourceModule').value;sourcePage=1;renderReadingSources();});
  $('clearSourceFilters').addEventListener('click',()=>{sourceQuery='';sourceModule='all';sourcePage=1;$('sourceSearch').value='';$('sourceModule').value='all';renderReadingSources();$('sourceSearch').focus();});
  $('sourcePagination').addEventListener('click',e=>{const button=e.target.closest('[data-source-page]');if(!button||button.disabled)return;sourcePage=Number(button.dataset.sourcePage);renderReadingSources();$('sourceResultCount').focus();});
}
function renderReadingSources(){
  const grid=$('sourceGrid');if(!grid)return;
  const entries=readingSourceEntries(),query=normalizeStudySearch(sourceQuery);
  const found=entries.filter(item=>(sourceModule==='all'||item.modules.includes(sourceModule))&&(!query||normalizeStudySearch([item.source.title,item.source.author,item.source.year,item.source.readScope,...item.points.map(p=>p.title)].join(' ')).includes(query)));
  const pages=Math.max(1,Math.ceil(found.length/SOURCE_PAGE_SIZE));sourcePage=Math.max(1,Math.min(sourcePage,pages));
  const open=new Set([...grid.querySelectorAll('details[open][data-source-open]')].map(el=>el.dataset.sourceOpen));
  grid.innerHTML=found.length?found.slice((sourcePage-1)*SOURCE_PAGE_SIZE,sourcePage*SOURCE_PAGE_SIZE).map(item=>{const source=item.source;return '<article class="source-card" data-source-id="'+escapeHTML(item.id)+'"><div class="source-card-meta"><span>'+escapeHTML(source.kind||'参考来源')+'</span><span>'+escapeHTML(String(source.year||'年份见原页'))+'</span></div><h3><a href="'+escapeHTML(source.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(source.title)+' <span>↗</span></a></h3><p class="source-card-author">'+escapeHTML(source.author||'作者见原页')+'</p><div class="source-module-tags">'+item.modules.map(id=>'<span style="color:'+moduleById[id].color+'">'+escapeHTML(moduleById[id].name)+'</span>').join('')+'</div><details class="source-read-scope" data-source-open="scope-'+escapeHTML(item.id)+'" '+(open.has('scope-'+item.id)?'open':'')+'><summary>实际核读范围</summary><p>'+escapeHTML(source.readScope)+'</p>'+(source.readUrl?'<a href="'+escapeHTML(source.readUrl)+'" target="_blank" rel="noopener noreferrer">实际核读入口 ↗</a>':'')+'</details><details class="source-used-in" data-source-open="points-'+escapeHTML(item.id)+'" '+(open.has('points-'+item.id)?'open':'')+'><summary>用于 '+item.points.length+' 篇专题</summary><ul>'+item.points.map(p=>'<li><button id="source-'+escapeHTML(item.id)+'-'+p.id+'" data-read-point="'+p.id+'">'+escapeHTML(p.title)+' <span>↗</span></button></li>').join('')+'</ul></details></article>';}).join(''):'<div class="source-empty"><h3>没有匹配的来源</h3><p>试试作者、书名或清除板块筛选。专题来源记录仍可从各篇精读页查看。</p></div>';
  $('sourceResultCount').textContent='找到 '+found.length+' 项关联来源 · 当前第 '+sourcePage+' / '+pages+' 页';
  $('sourcePagination').innerHTML=found.length?'<button data-source-page="'+(sourcePage-1)+'" '+(sourcePage===1?'disabled':'')+'>← 上一页</button><span>'+sourcePage+' / '+pages+'</span><button data-source-page="'+(sourcePage+1)+'" '+(sourcePage===pages?'disabled':'')+'>下一页 →</button>':'';
  $('clearSourceFilters').hidden=!sourceQuery&&sourceModule==='all';$('readingLinkCount').textContent=entries.length;$('readingLinkCount').setAttribute('aria-label','专题关联来源数');
}
const originalUpdatePoint=updatePoint;updatePoint=function(id,changes){originalUpdatePoint(id,changes);if(page==='path')renderPaths();};
document.addEventListener('click',e=>{const a=e.target.closest('[data-research-anchor]');if(a){e.preventDefault();const section=a.dataset.researchAnchor;history.replaceState(null,'',location.pathname+location.search+'#point='+encodeURIComponent(readerPointId)+'&section='+encodeURIComponent(section));focusReaderSection('research-'+section);}});
document.addEventListener('click',e=>{if(!e.target.closest('#readerContentsButton'))return;const directory=$('readerContents');if(!directory)return;directory.open=true;directory.querySelector('summary').focus({preventScroll:true});directory.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
// Open a deep link only after the reader wrapper is installed.
const initialParams=new URLSearchParams(initialReaderHash.slice(1));const linkedPoint=initialParams.get('point');if(linkedPoint&&MICRO_BY_ID[linkedPoint]){openPointReader(linkedPoint);const section=initialParams.get('section');if(section&&validResearchSection(linkedPoint,section)){history.replaceState(null,'',location.pathname+location.search+'#point='+encodeURIComponent(linkedPoint)+'&section='+encodeURIComponent(section));requestAnimationFrame(()=>focusReaderSection('research-'+section,'instant'));}}
// Browser back/forward or a pasted fragment within the same page does not reload it.
window.addEventListener('hashchange',()=>{
  const hash=location.hash,params=new URLSearchParams(hash.slice(1)),id=params.get('point'),section=params.get('section'),comparison=params.get('comparison'),node=params.get('node');
  const route=params.get('route');
  if(id&&MICRO_BY_ID[id]){
    if(readerPointId!==id||!$('pointReader').open)openPointReader(id);
    if(section&&validResearchSection(id,section)){
      history.replaceState(null,'',location.pathname+location.search+hash);
      requestAnimationFrame(()=>focusReaderSection('research-'+section,'instant'));
    }
  }else if(COMPARISONS.some(table=>table.id===comparison)){
    revealComparison(comparison);
  }else if(Object.hasOwn(nodeById,node)){
    revealMapNode(node);
  }else if(RESEARCH.readingPaths.some(path=>path.id===route)){
    revealReadingRoute(route);
  }else if(typeof revealPageLocation==='function'&&revealPageLocation(params)){
    return;
  }else if($('pointReader').open){
    readerReturnHash=hash;closePointReader();
  }
});
prepareComparisonIndex();
prepareReadingIndex();
renderLibrary();
renderMicroReview();
if(Object.hasOwn(nodeById,initialParams.get('node'))&&!linkedPoint&&!initialParams.has('comparison'))revealMapNode(initialParams.get('node'));
else renderDetail();
if(initialParams.has('comparison')&&!linkedPoint)revealComparison(initialParams.get('comparison'));
else if(initialParams.has('route')&&!linkedPoint&&!Object.hasOwn(nodeById,initialParams.get('node')))revealReadingRoute(initialParams.get('route'));

function renderTextbookIndex(){
  const root=$('textbookIndex');
  if(root.childElementCount)return;
  const routeById=Object.fromEntries(RESEARCH.readingPaths.map(route=>[route.id,route]));
  const pointById=Object.fromEntries(MICRO_POINTS.map(point=>[point.id,point]));
  const linkFor=link=>{
    if(link.kind==='compare')return '<a href="#page=library&tab=compare">易混对照</a>';
    const id=encodeURIComponent(link.id);
    if(link.kind==='route')return '<a href="#route='+id+'" data-path-scroll="'+id+'">学习路线 · '+escapeHTML(routeById[link.id].title)+'</a>';
    return '<a href="#point='+id+'" data-read-point="'+id+'">'+escapeHTML(pointById[link.id].title)+'</a>';
  };
  root.innerHTML=RESEARCH.textbookIndex.map(book=>'<article class="textbook-book" aria-labelledby="textbook-'+book.id+'"><header><h3 id="textbook-'+book.id+'">'+escapeHTML(book.title)+'</h3><span>'+book.chapters.length+' 章</span><p>'+escapeHTML(book.source)+'</p></header>'+book.chapters.map(chapter=>'<details class="textbook-chapter"><summary>'+escapeHTML(chapter.title)+'</summary><div><ul>'+chapter.links.map(link=>'<li>'+linkFor(link)+'</li>').join('')+'</ul><p><b>核读提示</b> '+escapeHTML(chapter.note)+'</p></div></details>').join('')+'</article>').join('');
}
