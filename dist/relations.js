'use strict';
// These are editorial learning links. The arrow follows the stored source-to-target
// record; the prerequisite category specifically recommends the target first.
const POINT_RELATION_TYPES={
  '前置':{color:'#547c70',description:'目标知识点可作为本条的建议前置。'},
  '组成':{color:'#657dac',description:'与概念的构成、维度或分类有关，具体范围见说明。'},
  '对照':{color:'#a47748',description:'把两个相关概念放在一起辨别。'},
  '争论':{color:'#9a5f72',description:'提示不同观点或评价尺度之间值得讨论的问题。'},
  '应用':{color:'#6f8150',description:'提示概念如何联系另一问题、方法或情境。'}
};
function buildPointRelations(research,points){
  const byId=Object.fromEntries(points.map(p=>[p.id,p])),edges=[];
  for(const [source,lesson] of Object.entries(research.lessons)){
    if(!byId[source])throw Error('Unknown relation source: '+source);
    for(const edge of lesson.relations){
      if(!byId[edge.target]||!POINT_RELATION_TYPES[edge.type]||!edge.why)throw Error('Invalid relation: '+source+' -> '+edge.target);
      edges.push({source,target:edge.target,type:edge.type,why:edge.why});
    }
  }
  return edges;
}
function filterPointRelations(edges,query,type,point,pointsById,research){
  const q=normalizeStudySearch(query);
  return edges.filter(edge=>{
    if(type!=='all'&&edge.type!==type)return false;
    if(point!=='all'&&edge.source!==point&&edge.target!==point)return false;
    const source=pointsById[edge.source],target=pointsById[edge.target];
    const words=[source.title,target.title,edge.type,edge.why,...(research.lessons[edge.source]?.aliases||[]),...(research.lessons[edge.target]?.aliases||[])].join(' ');
    return !q||normalizeStudySearch(words).includes(q);
  });
}
const pointRelationEdges=buildPointRelations(RESEARCH,MICRO_POINTS);
let pointRelationPage=1;
const RELATIONS_PER_PAGE=8;
const relationType=$('pointRelationType'),relationPoint=$('pointRelationPoint'),relationQuery=$('pointRelationQuery');
relationPoint.innerHTML='<option value="all">全部知识点</option>'+[...MICRO_POINTS].sort((a,b)=>a.title.localeCompare(b.title,'zh-CN')).map(p=>'<option value="'+escapeHTML(p.id)+'">'+escapeHTML(p.title)+'</option>').join('');
function renderPointRelations(){
  const found=filterPointRelations(pointRelationEdges,relationQuery.value,relationType.value,relationPoint.value,MICRO_BY_ID,RESEARCH);
  const pages=Math.max(1,Math.ceil(found.length/RELATIONS_PER_PAGE));pointRelationPage=Math.min(Math.max(1,pointRelationPage),pages);
  $('pointRelationCount').textContent='找到 '+found.length+' 条关系 · 当前已整理 '+pointRelationEdges.length+' 条';
  const shown=found.slice((pointRelationPage-1)*RELATIONS_PER_PAGE,pointRelationPage*RELATIONS_PER_PAGE);
  $('pointRelationList').innerHTML=shown.length?shown.map(edge=>{
    const from=MICRO_BY_ID[edge.source],to=MICRO_BY_ID[edge.target],style=POINT_RELATION_TYPES[edge.type];
    const label=edge.type==='前置'?'前置（右侧先学）':edge.type;
    return '<li class="point-relation-card"><div class="point-relation-path"><button data-read-point="'+escapeHTML(from.id)+'">'+escapeHTML(from.title)+'</button><span class="point-relation-edge" style="--edge-color:'+style.color+'"><span aria-hidden="true">→</span> '+escapeHTML(label)+' <span aria-hidden="true">→</span></span><button data-read-point="'+escapeHTML(to.id)+'">'+escapeHTML(to.title)+'</button></div><p>'+escapeHTML(edge.why)+'</p></li>';
  }).join(''):'<li class="point-relation-empty">当前条件下没有已整理关系。可以更换筛选；没有关系不代表两个知识点不存在联系。</li>';
  $('pointRelationPage').textContent='第 '+pointRelationPage+' / '+pages+' 页';
  $('pointRelationPrev').disabled=pointRelationPage===1;$('pointRelationNext').disabled=pointRelationPage===pages;
}
for(const element of [relationType,relationPoint])element.addEventListener('change',()=>{pointRelationPage=1;renderPointRelations();});
relationQuery.addEventListener('input',()=>{pointRelationPage=1;renderPointRelations();});
$('pointRelationPrev').addEventListener('click',()=>{pointRelationPage--;renderPointRelations();});
$('pointRelationNext').addEventListener('click',()=>{pointRelationPage++;renderPointRelations();});
renderPointRelations();
