'use strict';

const libraryDestinations = ['points', 'compare', 'reading', 'textbooks'];
const pageSections = {map: ['atlasGraph', 'pointRelationsTitle', 'atlasModules']};

function pageHash(destination, tab, section) {
  const params = new URLSearchParams({page: destination});
  if (destination === 'library' && tab && tab !== 'points') params.set('tab', tab);
  if (pageSections[destination]?.includes(section)) params.set('at', section);
  return '#' + params.toString();
}

function syncPageLocation(next, previous) {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('point')) return;
  const owner = params.has('node') ? 'map' : params.has('route') ? 'path' :
    params.has('comparison') ? 'library' : params.get('page') || 'map';
  const currentTab = params.has('comparison') ? 'compare' : params.get('tab') || 'points';
  const changedPage = owner !== next && previous !== next;
  const changedTab = next === 'library' && owner === next && currentTab !== libraryTab;
  if (changedPage || changedTab) {
    history.pushState(null, '', pageHash(next, libraryTab));
  }
  const currentSection = next === 'map' ? params.get('at') : null;
  document.querySelectorAll('.map-sections a').forEach(link => {
    if (link.dataset.pageSection === currentSection) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function showPage(destination, {tab = 'points', section, focus = true, scroll = true} = {}) {
  if (destination === 'library') libraryTab = libraryDestinations.includes(tab) ? tab : 'points';
  setPage(destination, scroll && !section);
  const target = section && $(section);
  if (target) {
    target.focus({preventScroll: true});
    target.scrollIntoView({block: 'start', behavior: 'instant'});
  } else if (focus) {
    $('pageTitle').focus({preventScroll: true});
  }
}

function navigatePage(destination, {tab, section, focus, scroll} = {}) {
  if (!Object.hasOwn(pageInfo, destination)) return;
  afterReaderCloses(() => {
    const hash = pageHash(destination, tab, section);
    if (location.hash !== hash) history.pushState(null, '', hash);
    showPage(destination, {tab, section, focus, scroll});
  }, false);
}

function revealPageLocation(params) {
  const destination = params.get('page') || (!location.hash || location.hash === '#map' ? 'map' : '');
  if (!Object.hasOwn(pageInfo, destination)) return false;
  const section = params.get('at');
  const options = {tab: params.get('tab'), section: pageSections[destination]?.includes(section) ? section : undefined};
  afterReaderCloses(() => showPage(destination, options), true);
  return true;
}

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('pageTitle').focus();
});

const quickFind = $('quickFind');
const quickInput = $('quickFindInput');
const quickResults = $('quickFindResults');
const quickLinks = [
  {title: '知识点库', label: '页面', open: () => navigatePage('library')},
  {title: '学习路径', label: '页面', open: () => navigatePage('path')},
  {title: '复习看板', label: '页面', open: () => navigatePage('review')},
  {title: '易混对照', label: '知识点库', open: () => navigatePage('library', {tab: 'compare'})},
  {title: '阅读与来源', label: '知识点库', open: () => navigatePage('library', {tab: 'reading'})},
  {title: '知识地图', label: '页面', open: () => navigatePage('map')},
  {title: '教材索引', label: '知识点库', keywords: ['公共政策分析', '西方行政思想史', '章节', '讲义'], open: () => navigatePage('library', {tab: 'textbooks'})},
  ...NODES.map(node => ({
    title: node.name, label: '地图 · ' + moduleById[node.m].name, keywords: node.terms,
    open: () => revealMapNode(node.id, true)
  })),
  ...RESEARCH.readingPaths.map(route => ({
    title: route.title, label: '学习路线 · ' + route.steps.length + ' 步', keywords: [route.desc],
    open: () => revealReadingRoute(route.id, true)
  })),
  ...COMPARISONS.map(table => ({
    title: table.title, label: '概念对照', keywords: [table.a, table.b],
    open: () => revealComparison(table.id, true)
  })),
  ...MICRO_POINTS.map(point => ({
    title: point.title, label: '精读 · ' + nodeById[point.node].name,
    keywords: [...(RESEARCH.lessons[point.id]?.aliases || []), ...(RESEARCH.lessons[point.id]?.scholars || [])],
    open: () => openPointReader(point.id)
  }))
].map(link => ({
  ...link,
  searchableTitle: normalizeStudySearch(link.title),
  searchableTerms: (link.keywords || []).map(normalizeStudySearch)
}));

let quickMatches = [];
let quickDestination = null;
function renderQuickFind() {
  const query = normalizeStudySearch(quickInput.value);
  const scored = quickLinks.map(link => {
    const title = link.searchableTitle;
    const score = title === query ? 0 : title.startsWith(query) ? 1 : title.includes(query) ? 2 :
      link.searchableTerms.some(term => term.includes(query)) ? 3 : -1;
    return {link, score};
  });
  quickMatches = query ? scored.filter(row => row.score >= 0).sort((a, b) => a.score - b.score).map(row => row.link) :
    quickLinks.slice(0, 6);
  $('quickFindCount').textContent = query ? (quickMatches.length ?
    (quickMatches.length > 9 ? '显示前 9 项，共 ' + quickMatches.length + ' 项' : quickMatches.length + ' 项结果') :
    '没有匹配项。试试概念、别名或学者姓名。') : '常用入口';
  quickResults.innerHTML = quickMatches.slice(0, 9).map((link, index) =>
    '<li><button type="button" data-quick-index="' + index + '"><span><strong>' + escapeHTML(link.title) +
    '</strong><small>' + escapeHTML(link.label) + '</small></span><b aria-hidden="true">↗</b></button></li>'
  ).join('');
}

function openQuickFind() {
  if (quickFind.open || $('pointReader').open || $('helpDialog').open) return;
  quickInput.value = '';
  renderQuickFind();
  quickFind.showModal();
  quickInput.focus();
}

$('quickFindBtn').addEventListener('click', openQuickFind);
$('mobileHelpBtn').addEventListener('click', () => $('helpBtn').click());
$('closeQuickFind').addEventListener('click', () => quickFind.close());
quickInput.addEventListener('input', renderQuickFind);
quickResults.addEventListener('click', event => {
  const result = event.target.closest('[data-quick-index]');
  if (!result) return;
  quickDestination = quickMatches[Number(result.dataset.quickIndex)];
  quickFind.close();
});
quickFind.addEventListener('close', () => {
  $('quickFindBtn').focus({preventScroll: true});
  const destination = quickDestination;
  quickDestination = null;
  destination?.open();
});
quickFind.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    quickFind.close();
    return;
  }
  const results = [...quickResults.querySelectorAll('button')];
  const index = results.indexOf(document.activeElement);
  if (event.key === 'Enter' && event.target === quickInput && results.length) {
    event.preventDefault();
    results[0].click();
  } else if (['ArrowDown', 'ArrowUp'].includes(event.key) && results.length) {
    event.preventDefault();
    const target = event.key === 'ArrowDown' ? results[Math.min(index + 1, results.length - 1)] :
      index > 0 ? results[index - 1] : quickInput;
    target.focus();
  }
});
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey) || event.isComposing) return;
  if ($('pointReader').open || $('helpDialog').open) return;
  event.preventDefault();
  openQuickFind();
});

if (/Mac|iPhone|iPad/.test(navigator.platform)) $('quickFindBtn').querySelector('kbd').textContent = '⌘ K';
if (initialReaderHash) revealPageLocation(new URLSearchParams(initialReaderHash.slice(1)));
