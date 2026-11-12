(function(){
 'use strict';
 const C=window.GraspCore,D=window.GRASP_DATA,P=C.enrich(window.GraspCollection.catalogueRows(D)),$=id=>document.getElementById(id),pageSize=20;
 const M=window.GraspCollection;let localStore=null;try{localStore=window.localStorage;}catch{}
 const I=window.GraspI18n||{text:v=>String(v??''),getLanguage:()=> 'zh',setLanguage(){},apply(){},observe(){}};
 const collection=M.create(P,localStore,M.collectionOptions(D,P));let toastTimer=null,undoKey=null;
 const state={query:'',tier:'all',conferences:[...C.conferences],years:[...C.years],topic:'',sort:'newest',page:0};
 let filtered=[],view='papers',binQuery='',purgeTarget=null,purgeBusy=false;
 const localServer=location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname);
 const esc=v=>I.text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const href=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)?esc(u.href):'#';}catch{return '#';}};
 const external=(url,text,cls='')=>`<a class="${cls}" href="${href(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
 const library=window.GraspLibrary||{links:p=>({online:p.url,primary:p.url,status:'pending'})};
 const localLink=(url,text,cls='')=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
 function paperTitle(p){const l=library.links(p);return l.file?localLink(l.file,p.title):l.primary?external(l.primary,p.title):esc(p.title);}
 function paperActions(p){
  const l=library.links(p);
  const status={pending:'全文尚未下载',unavailable:'暂未取得公开全文',needs_review:'候选 PDF 待核验',missing_file:'本地文件缺失，请重新下载'}[l.status]||'全文尚未下载';
  return (l.file?localLink(l.file,'打开本地 PDF','source-link local-pdf'):`<span class="paper-download-status">${esc(status)}</span>`)+(l.online?external(l.online,'在线论文','source-link'):l.abstract?external(l.abstract,'官方会议摘要','source-link'):'<span class="paper-download-status">论文链接待核实</span>')+(l.pdf?external(l.pdf,'在线 PDF','source-link'):'')+(!l.online?external('https://scholar.google.com/scholar?q='+encodeURIComponent(p.title),'按标题检索','source-link'):'');
 }
 function renderLibrary(){
  const n=filtered.length,downloaded=filtered.filter(p=>library.links(p).file).length;
  $('library-summary').textContent=I.getLanguage()==='en'?`${downloaded} / ${n} filtered papers available locally`:`当前筛选 ${n} 篇，${downloaded} 篇已核验全文可离线打开`;
 }
 async function refreshLibrary(){
  if(location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname)){
   try{
    const response=await fetch('/api/library',{cache:'no-store'});if(!response.ok)throw Error('server');
    const data=await response.json();
    if(Array.isArray(data.catalogueIds)&&P.some(p=>!data.catalogueIds.includes(p.catalogueId))){location.reload();return;}
    window.GRASP_LIBRARY=data.library;window.GRASP_LIBRARY_BASE=new URL('/',location.href).href;
    $('library-download').hidden=false;$('library-download').disabled=data.running;
    $('library-download').textContent=I.text(data.running?'正在下载…':'下载 / 重试全部');
    $('library-help').textContent=I.text(data.running?'下载进行中，全文状态自动更新。':'点击下载或重试，可继续下载尚未完成的论文。');
    const opened=[...document.querySelectorAll('.paper-abstract[open]')].map(node=>node.closest('.paper').id);
    const notes=[...document.querySelectorAll('.paper-note:not([hidden])')].map(node=>node.id);
    renderPapers();
    for(const id of opened){const node=document.querySelector('#'+id+' .paper-abstract');if(node)node.open=true;}
    for(const id of notes){const node=$(id);if(node)node.hidden=false;const button=document.querySelector('[aria-controls="'+id+'"]');if(button)button.setAttribute('aria-expanded','true');}
    I.apply(document);return;
   }catch{}
  }
  if(!document.head)return;
  const script=document.createElement('script');script.src=new URL('library.js',window.GRASP_LIBRARY_BASE||new URL('.',location.href)).href+'?t='+Date.now();
  script.onload=()=>{renderPapers();I.apply(document);script.remove();};
  script.onerror=()=>{toastMessage('全文索引加载失败，请检查 library.js 是否与网站一起保留。');script.remove();};
  document.head.appendChild(script);
 }
 $('library-refresh').addEventListener('click',refreshLibrary);
 $('library-download').addEventListener('click',async()=>{
  $('library-download').disabled=true;
  try{const response=await fetch('/api/download',{method:'POST',headers:{'X-Grasp-Atlas':'1','Content-Type':'application/json'},body:JSON.stringify({ids:collection.visible().map(p=>p.catalogueId)})});if(!response.ok)throw Error('server');await refreshLibrary();}
  catch{toastMessage('下载器启动失败，请使用 Start_Grasp_Atlas.cmd 重新打开。');$('library-download').disabled=false;}
 });
 if(location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname)&&typeof fetch==='function'){
  setTimeout(refreshLibrary,0);setInterval(refreshLibrary,5000);
 }
 function syncControls(){
  $('search').value=state.query;$('topic').value=state.topic;$('sort').value=state.sort;
  document.querySelectorAll('[name=tier]').forEach(x=>x.checked=x.value===state.tier);
  document.querySelectorAll('[data-conference]').forEach(x=>x.checked=state.conferences.includes(x.dataset.conference));
  document.querySelectorAll('[data-venue-group]').forEach(x=>{const venues=x.dataset.venueGroup==='journal'?C.journalVenues:x.dataset.venueGroup==='conference'?C.conferenceVenues:C.conferences;x.setAttribute('aria-pressed',String(state.conferences.length===venues.length&&venues.every(v=>state.conferences.includes(v))));});
  document.querySelectorAll('[data-year]').forEach(x=>x.setAttribute('aria-pressed',String(state.years.includes(Number(x.dataset.year)))));
 }
 function syncURL(){const q=new URLSearchParams();if(state.query)q.set('q',state.query);if(state.tier!=='all')q.set('tier',state.tier);if(state.conferences.length!==C.conferences.length)q.set('conf',state.conferences.join(','));if(state.years.length!==C.years.length)q.set('year',state.years.join(','));if(state.topic)q.set('topic',state.topic);if(state.sort!=='newest')q.set('sort',state.sort);const next=location.protocol==='file:'?'#'+view+(q.size?'?'+q.toString():''):location.pathname+(q.size?'?'+q.toString():'')+'#'+view;try{history.replaceState(null,'',next);}catch{}}
 function activeFilters(){const chips=[];if(state.query)chips.push(['query','搜索：'+state.query]);if(state.tier!=='all')chips.push(['tier',state.tier==='直接'?'直接相关':'扩展相关']);if(state.conferences.length!==C.conferences.length)chips.push(['conferences',state.conferences.length?state.conferences.join(' / '):'未选择会议或期刊']);if(state.years.length!==C.years.length)chips.push(['years',state.years.length?state.years.join(' / '):'未选择年份']);if(state.topic)chips.push(['topic',C.topics.find(t=>t.id===state.topic).label]);$('active-filters').innerHTML=chips.map(([key,label])=>`<button class="active-chip" data-remove="${key}" aria-label="移除筛选：${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('');}
 const abstractKind=p=>({preprint:'作者预印本摘要',indexed:'文献索引摘要',published:'出版商摘要',summary:'摘要概述'}[p.abstractKind]||'摘要');
 function abstractBlock(p){
  if(!p.abstract)return '<div class="abstract-unavailable">摘要暂未获取</div>';
  const label=p.abstractKind==='summary'?'摘要概述':'摘要';
  const attribution=p.abstractCitation?`<p class="abstract-attribution">${esc(p.abstractCitation)}</p>`:'';
  const license=p.abstractLicense==='CC-BY-4.0'?external('https://creativecommons.org/licenses/by/4.0/','CC BY 4.0'):esc(p.abstractLicense||'');
  return `<details class="paper-abstract"><summary><span>${esc(label)}</span><small>${esc(abstractKind(p))}</small></summary><div class="abstract-body"><p>${esc(p.abstract)}</p>${attribution}<div class="abstract-source">${p.abstractSource?external(p.abstractSource,'摘要来源'):''}<span>${esc(p.abstractProvider||'')}</span><span>${license}</span></div></div></details>`;
 }
 function renderPapers(){
  renderLibrary();
  const n=C.counts(filtered);$('result-count').textContent=n.total;$('result-detail').textContent=`${n.direct} 篇直接相关 · ${n.related} 篇扩展相关 · 不含触觉输入`;$('mobile-count').textContent=n.total+' 篇';
  const totalPages=Math.ceil(filtered.length/pageSize);state.page=Math.max(0,Math.min(state.page,Math.max(0,totalPages-1)));const start=state.page*pageSize;
  $('paper-list').innerHTML=filtered.slice(start,start+pageSize).map((p,i)=>{
   const m=p.resources||{},codes=m.code||[],engines=m.engines||[],datasets=m.datasets||[];
   const code=codes.length?codes.map(u=>external(u,new URL(u).hostname==='github.com'?new URL(u).pathname.split('/').filter(Boolean).slice(0,2).join('/'):'代码库')).join(' · '):esc(m.codeNote||'未找到已核实的公开仓库');
   return `<article class="paper" id="${p.id}"><span class="paper-index">${String(start+i+1).padStart(2,'0')}</span><div class="paper-content"><h3 class="paper-title">${paperTitle(p)}</h3><div class="paper-tags"><span class="tag conf">${esc(p.conference)}</span><span class="tag">${p.year}</span>${p.tier==='相关'?'<span class="tag related">扩展相关</span>':''}${p.publicationType==='journal'?'<span class="tag journal">期刊论文</span>':''}${p.verificationLevel==='title'?'<span class="tag preliminary">范围初筛</span>':''}${p.status.includes('卷期预分配')?'<span class="tag pending">卷期预分配</span>':''}${p.status==='Early Access'?'<span class="tag pending">Early Access</span>':p.status.includes('待出版')?'<span class="tag pending">已录用 · 论文集待出版</span>':''}<span class="paper-type">${esc(p.type)}</span></div>${abstractBlock(p)}<div class="resource-row"><span><b>代码</b> ${code}</span><span><b>仿真</b> ${esc(engines.join(' / ')||m.engineNote||'未核实仿真引擎')}</span><span><b>数据</b> ${esc(datasets.join(' / ')||m.datasetNote||'未核实数据集')}</span></div><div class="paper-note" id="note-${p.id}" hidden><p><strong>纳入程度：</strong>${p.tier==='直接'?'直接相关':'扩展相关'} · ${esc(p.type)}</p><p>${esc(p.note||'按发表来源、机器人抓取主题及非触觉输入条件纳入。')}</p><p><strong>发表状态：</strong>${esc(p.status)}</p>${p.citation?'<p><strong>期刊信息：</strong>'+esc(p.citation)+'</p>':''}${p.doi?'<p><strong>DOI：</strong>'+external('https://doi.org/'+p.doi,p.doi)+'</p>':''}${p.presentedAt?.length?'<p><strong>会议展示：</strong>'+esc(p.presentedAt.join(' / '))+'</p>':''}${p.conferenceSource?'<p>'+external(p.conferenceSource,'会议展示来源')+'</p>':''}${p.linkNote?'<p><strong>论文链接：</strong>'+esc(p.linkNote)+'</p>':''}${p.paperUrl&&p.paperUrl!==p.url?'<p>'+external(p.paperUrl,'原收录来源')+'</p>':''}${p.venueUrl?'<p>'+external(p.venueUrl,p.publicationType==='journal'?'发表来源':'会议录用来源')+'</p>':''}${m.note?'<p><strong>资源说明：</strong>'+esc(m.note)+'</p>':''}${m.sources?.length?'<p><strong>资源核对来源：</strong>'+m.sources.map((s,i)=>external(s,'来源 '+(i+1))).join(' · ')+'</p>':''}</div></div><div class="paper-actions">${paperActions(p)}<button class="detail-button" data-detail="${p.id}" aria-expanded="false" aria-controls="note-${p.id}">详情与来源 ⌄</button><button class="delete-button" data-delete="${p.id}" aria-label="删除文章：${esc(p.title)}" title="从当前浏览器清单删除这篇文章">删除</button></div></article>`;
  }).join('')||'<div class="empty-state"><h3>没有匹配的论文</h3><p>试试减少关键词，或扩大会议与年份范围。</p><button class="button" data-reset>重置所有筛选</button></div>';
  $('pagination').innerHTML=totalPages?`<span>显示 ${start+1}–${Math.min(start+pageSize,filtered.length)} / ${filtered.length} 篇</span><div class="page-buttons"><button data-page="${state.page-1}" ${state.page===0?'disabled':''} aria-label="上一页">←</button>${Array.from({length:totalPages},(_,i)=>i).filter(i=>i===0||i===totalPages-1||Math.abs(i-state.page)<=2).map((i,j,a)=>`${j&&i>a[j-1]+1?'<span class="page-ellipsis" aria-hidden="true">…</span>':''}<button data-page="${i}" class="${i===state.page?'active':''}" ${i===state.page?'aria-current="page"':''} aria-label="第 ${i+1} 页">${i+1}</button>`).join('')}<button data-page="${state.page+1}" ${state.page===totalPages-1?'disabled':''} aria-label="下一页">→</button></div>`:'';
 }
 function renderStats(){
  const n=C.counts(filtered);$('stats-count').textContent=n.total;const maxC=Math.max(1,...Object.values(n.conferences)),maxY=Math.max(1,...Object.values(n.years)),maxT=Math.max(1,...Object.values(n.topics));
  $('conference-chart').innerHTML=C.conferences.slice().sort((a,b)=>n.conferences[b]-n.conferences[a]).map(c=>`<button class="bar-row" data-chart-conf="${c}" ${n.conferences[c]?'':'disabled'} aria-label="查看 ${c} 的 ${n.conferences[c]} 篇论文"><span>${c}</span><span class="bar-track"><span class="bar-fill" style="width:${n.conferences[c]/maxC*100}%"></span></span><span class="bar-value">${n.conferences[c]}</span></button>`).join('');
  $('year-chart').innerHTML=C.years.map(y=>`<button class="year-column" data-chart-year="${y}" ${n.years[y]?'':'disabled'} aria-label="查看 ${y} 年的 ${n.years[y]} 篇论文"><div class="year-track"><div class="year-bar" style="height:${n.years[y]/maxY*85}%"><span class="year-count">${n.years[y]}</span></div></div><span>${y}</span></button>`).join('');
  const mode=$('heatmap-mode').value,maxCell=Math.max(1,...Object.values(n.cells).flatMap(Object.values));
  $('heatmap').innerHTML=`<table class="heatmap" aria-label="会议、期刊与年份的论文分布"><thead><tr><th scope="col">会议 / 期刊</th>${C.years.map(y=>'<th scope="col">'+y+'</th>').join('')}</tr></thead><tbody>${C.conferences.map(c=>'<tr><th scope="row">'+c+'</th>'+C.years.map(y=>{const v=n.cells[c][y],fraction=mode==='row'?v/(n.conferences[c]||1):mode==='column'?v/(n.years[y]||1):v/maxCell;const label=mode==='count'?v:(fraction*100).toFixed(1)+'%';const color=v?`hsl(215 73% ${97-fraction*49}%)`:'#f7f8fa';return `<td><button data-cell-conf="${c}" data-cell-year="${y}" style="background:${color};color:${fraction>.52&&v?'#fff':v?'#285586':'#a2adbb'}" ${v?'':'disabled'} aria-label="${c} ${y}：${v} 篇，${esc(label)}">${label}</button></td>`;}).join('')+'</tr>').join('')}</tbody></table>`;
  $('topic-chart').innerHTML=C.topics.map(t=>`<button class="topic-row" data-chart-topic="${t.id}" ${n.topics[t.id]?'':'disabled'} aria-label="查看 ${t.label} 的 ${n.topics[t.id]} 篇论文"><span>${t.label}</span><span class="bar-track"><span class="bar-fill" style="width:${n.topics[t.id]/maxT*100}%"></span></span><span class="bar-value">${n.topics[t.id]}</span></button>`).join('');
  const maxK=Math.max(1,...n.keywords.map(k=>k.count));
  $('keyword-chart').innerHTML=n.keywords.map((k,i)=>`<div class="keyword-row" aria-label="第 ${i+1} 名，${esc(k.keyword)}，${k.count} 篇论文"><span class="keyword-label"><small>${String(i+1).padStart(2,'0')}</small>${esc(k.keyword)}</span><span class="bar-track"><span class="bar-fill" style="width:${k.count/maxK*100}%"></span></span><span class="bar-value">${k.count}</span></div>`).join('')||'<p class="chart-note">当前筛选没有可统计的标题关键词。</p>';
 }
 function renderScreening(){const mode=$('screening-filter').value;$('screening-list').innerHTML=D.screening.filter(p=>mode==='all'||(mode==='待核对'?p[0]==='待核对':p[0]!=='待核对')).map(p=>`<article class="screening-item"><span class="tag ${p[0]==='待核对'?'pending':''}">${esc(p[0])}</span><div><h3>${external(p[5],p[3])}</h3><p>${esc(p[4])}</p><div class="screening-meta">${esc(p[1])} · ${p[2]}</div></div></article>`).join('');}
 function toastMessage(message,key=null){clearTimeout(toastTimer);undoKey=key;$('toast').innerHTML=`<span>${esc(message)}</span>${key?'<button data-undo>撤销</button>':''}`;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;undoKey=null;},key?15000:3500);}
 function openPurge(id){
  if(purgeBusy)return;
  const p=collection.deleted().find(p=>p.id===id);if(!p)return;
  purgeTarget=p;$('purge-paper-title').textContent=p.title;$('purge-error').hidden=true;$('purge-error').textContent='';
  $('purge-local-help').hidden=localServer;$('purge-confirm').disabled=!localServer;$('purge-confirm').textContent=I.text('永久删除');
  I.apply(document);$('purge-dialog').showModal();
 }
 $('purge-cancel').addEventListener('click',()=>{if(!purgeBusy)$('purge-dialog').close();});
 $('purge-dialog').addEventListener('cancel',e=>{if(purgeBusy)e.preventDefault();});
 $('purge-dialog').addEventListener('close',()=>{if(!purgeBusy){purgeTarget=null;$('purge-paper-title').textContent='';$('purge-error').textContent='';}});
 $('purge-confirm').addEventListener('click',async()=>{
  if(!purgeTarget||purgeBusy||!localServer)return;
  const p=purgeTarget;purgeBusy=true;$('purge-confirm').disabled=true;$('purge-cancel').disabled=true;$('purge-confirm').textContent=I.text('正在永久删除…');$('purge-error').hidden=true;
  try{
   const response=await fetch('/api/purge',{method:'POST',headers:{'X-Grasp-Atlas':'1','Content-Type':'application/json'},body:JSON.stringify({id:p.catalogueId,confirm:true})});
   const result=await response.json();if(!response.ok||result.deleted!==true)throw Error(result.error||'purge_failed');
   const key=M.paperKey(p);collection.purge(key);
   D.rows=D.rows.filter(r=>r.catalogueId!==p.catalogueId);
   if(D.reviewBin){D.reviewBin.rows=D.reviewBin.rows.filter(r=>r.catalogueId!==p.catalogueId);D.reviewBin.catalogueIds=D.reviewBin.catalogueIds.filter(id=>id!==p.catalogueId);}
   for(const batch of D.deletionBatches||[])batch.catalogueIds=batch.catalogueIds.filter(id=>id!==p.catalogueId);
   D.screening=D.screening.filter(r=>String(r[3]).toLowerCase()!==p.title.toLowerCase());
   if(result.library)window.GRASP_LIBRARY=result.library;
   binQuery='';$('bin-search').value='';purgeBusy=false;$('purge-dialog').close();purgeTarget=null;$('purge-paper-title').textContent='';
   apply();renderScreening();$('bin-search').focus();toastMessage('论文及相关本地信息已永久删除');
   // Reload the rebuilt bundle too, removing the old inline metadata from this tab.
   setTimeout(()=>location.reload(),1200);
  }catch(error){
   const messages={busy:'下载任务正在运行，请等下载结束后再永久删除。',not_found:'这篇论文已不在项目中，请刷新页面。',unsafe_path:'本地文件路径异常，永久删除已停止。',invalid_data:'本地记录无法读取，永久删除已停止。'};
   $('purge-error').textContent=I.text(messages[error.message]||'永久删除失败，请关闭占用的文件后重试。');$('purge-error').hidden=false;
  }finally{purgeBusy=false;$('purge-confirm').disabled=false;$('purge-cancel').disabled=false;$('purge-confirm').textContent=I.text('永久删除');}
 });
 function renderCollection(rows){
  const n=C.counts(rows);document.querySelectorAll('[data-collection-count]').forEach(x=>x.textContent=n[x.dataset.collectionCount]);document.querySelectorAll('[data-conf-count]').forEach(x=>x.textContent=n.conferences[x.dataset.confCount]);
  const coverage=k=>rows.filter(p=>p.resources?.[k]?.length).length;$('resource-coverage').textContent=`${coverage('code')} 篇已核实作者仓库 · ${coverage('engines')} 篇已核实仿真平台 · ${coverage('datasets')} 篇已记录数据或任务基准`;
  const abstracts=rows.filter(p=>p.abstract&&p.abstractKind!=='summary').length,summaries=rows.filter(p=>p.abstract&&p.abstractKind==='summary').length,missing=rows.length-abstracts-summaries;$('abstract-coverage').textContent=`${abstracts} 篇摘要 · ${summaries} 篇摘要概述 · ${missing} 篇暂未获取`;
  const deleted=collection.deleted();document.querySelectorAll('[data-deleted-count]').forEach(x=>x.textContent=deleted.length);$('removed-count').textContent=deleted.length;$('restore-all').hidden=!deleted.length;$('removed-details').hidden=!deleted.length;$('removed-empty').hidden=!!deleted.length;$('removed-shortcut').hidden=!deleted.length||view==='bin';$('removed-shortcut').textContent=`已删除 ${deleted.length} 篇 · 查看与恢复`;
  const binRows=C.filter(deleted,{query:binQuery,tier:'all',conferences:C.conferences,years:C.years,topic:''});
  $('bin-no-results').hidden=!!binRows.length||!deleted.length;
  $('removed-list').innerHTML=binRows.map(p=>`<article class="removed-row"><div><h4>${paperTitle(p)}</h4><small>${esc(p.conference)} · ${p.year}</small>${abstractBlock(p)}</div><div class="removed-actions"><button class="button small" data-restore="${p.id}" aria-label="恢复文章：${esc(p.title)}">恢复</button><button class="button small danger" data-purge="${p.id}" aria-label="永久删除论文：${esc(p.title)}">永久删除</button></div></article>`).join('');
 }
 function apply(){const rows=collection.visible();filtered=C.sort(C.filter(rows,state),state.sort);renderCollection(rows);syncControls();activeFilters();renderPapers();renderStats();syncURL();I.apply(document);}
 function reset(){Object.assign(state,{query:'',tier:'all',conferences:[...C.conferences],years:[...C.years],topic:'',sort:'newest',page:0});apply();}
 function navigate(next,scroll=false){view=['papers','stats','scope','bin'].includes(next)?next:'papers';const headings={papers:['探索机器人抓取研究','十大学术会议，三本机器人期刊。找到下一篇值得阅读的论文。'],stats:['看见研究的分布','从会议、期刊、年份与研究方向，探索这份抓取论文清单。'],scope:['一份可追溯的文献清单','了解收录范围、信息边界与每一条筛选记录。'],bin:['回收站','查看删除的文章，并恢复到论文清单。']};$('filter-drawer').hidden=view==='bin';$('removed-shortcut').hidden=!collection.deleted().length||view==='bin';$('view-title').textContent=headings[view][0];$('view-description').textContent=headings[view][1];['papers','stats','scope','bin'].forEach(v=>$(v+'-view').hidden=v!==view);$('search-panel').hidden=['scope','bin'].includes(view);$('active-filters').hidden=['scope','bin'].includes(view);document.querySelectorAll('[data-view]').forEach(a=>{a.classList.toggle('active',a.dataset.view===view);if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});syncURL();if(scroll)window.scrollTo({top:0,behavior:'smooth'});}
 function chartFilter(part){Object.assign(state,part,{page:0});apply();navigate('papers',true);}
 const venueOptions=venues=>venues.map(c=>`<label class="conf-option"><input type="checkbox" checked data-conference="${c}"><span>${c}</span><span class="count" data-conf-count="${c}">0</span></label>`).join('');
 $('conference-options').innerHTML=venueOptions(C.conferenceVenues);$('journal-options').innerHTML=venueOptions(C.journalVenues);
 $('year-options').innerHTML=C.years.map(y=>`<button class="year-chip" data-year="${y}" aria-pressed="true">${y}</button>`).join('');
 $('topic').insertAdjacentHTML('beforeend',C.topics.map(t=>`<option value="${t.id}">${t.label}</option>`).join(''));
 $('bin-search').addEventListener('input',e=>{binQuery=e.target.value;renderCollection(collection.visible());I.apply(document);});
 $('search').addEventListener('input',e=>{state.query=e.target.value;state.page=0;apply();});
 $('topic').addEventListener('change',e=>{state.topic=e.target.value;state.page=0;apply();});$('sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=0;apply();});
 $('heatmap-mode').addEventListener('change',renderStats);$('screening-filter').addEventListener('change',renderScreening);$('reset').addEventListener('click',reset);$('all-conf').addEventListener('click',()=>{state.conferences=[...C.conferences];state.page=0;apply();});
 document.addEventListener('change',e=>{if(e.target.matches('[name=tier]')){state.tier=e.target.value;state.page=0;apply();}if(e.target.matches('[data-conference]')){state.conferences=Array.from(document.querySelectorAll('[data-conference]:checked'),x=>x.dataset.conference);state.page=0;apply();}});
 document.addEventListener('click',e=>{
  const x=e.target.closest('button,a');if(!x)return;
  if(x.dataset.venueGroup){state.conferences=[...(x.dataset.venueGroup==='journal'?C.journalVenues:x.dataset.venueGroup==='conference'?C.conferenceVenues:C.conferences)];state.page=0;apply();return;}
  if(x.dataset.language){I.setLanguage(x.dataset.language);$('toast').hidden=true;apply();navigate(view);renderScreening();I.apply(document);return;}
  if(x.dataset.view){e.preventDefault();navigate(x.dataset.view,true);}
  if(x.hasAttribute('data-year')){const y=Number(x.dataset.year);state.years=state.years.includes(y)?state.years.filter(v=>v!==y):[...state.years,y].sort();state.page=0;apply();}
  if(x.hasAttribute('data-query')){state.query=x.dataset.query;state.page=0;apply();$('search').focus();}
  if(x.hasAttribute('data-remove')){const k=x.dataset.remove;state[k]=k==='conferences'?[...C.conferences]:k==='years'?[...C.years]:k==='tier'?'all':'';state.page=0;apply();}
  if(x.hasAttribute('data-detail')){const panel=$('note-'+x.dataset.detail);panel.hidden=!panel.hidden;x.setAttribute('aria-expanded',String(!panel.hidden));x.textContent=panel.hidden?'详情与来源 ⌄':'收起详情 ⌃';}
  if(x.hasAttribute('data-delete')){const p=P.find(p=>p.id===x.dataset.delete);if(p){const key=M.paperKey(p),result=collection.remove(key);if(result.changed){apply();toastMessage(result.persisted?'已删除文章；可在回收站中恢复':'已删除文章，但此浏览器无法保存记录，刷新后会恢复',key);}}}
  if(x.hasAttribute('data-restore')){const p=P.find(p=>p.id===x.dataset.restore);if(p){const result=collection.restore(M.paperKey(p));apply();toastMessage(result.persisted?'文章已恢复':'文章已恢复，但此浏览器无法保存记录');}}
  if(x.hasAttribute('data-purge')){openPurge(x.dataset.purge);return;}
  if(x.hasAttribute('data-undo')&&undoKey){const result=collection.restore(undoKey);apply();toastMessage(result.persisted?'已撤销删除':'已撤销删除，但此浏览器无法保存记录');}
  if(x.hasAttribute('data-page')&&!x.disabled){state.page=Number(x.dataset.page);renderPapers();$('results-title').scrollIntoView({block:'start',behavior:'smooth'});}
  if(x.hasAttribute('data-reset'))reset();
  if(x.dataset.chartConf)chartFilter({conferences:[x.dataset.chartConf]});if(x.dataset.chartYear)chartFilter({years:[Number(x.dataset.chartYear)]});if(x.dataset.chartTopic)chartFilter({topic:x.dataset.chartTopic});if(x.dataset.cellConf)chartFilter({conferences:[x.dataset.cellConf],years:[Number(x.dataset.cellYear)]});
 });
 $('brand').addEventListener('click',e=>{e.preventDefault();reset();navigate('papers',true);});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();if(['scope','bin'].includes(view))navigate('papers');$('search').focus();}});
 $('export').addEventListener('click',()=>{
  const safe=v=>{let s=I.text(v);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const rows=[['会议 / 期刊','年份','标题','研究方向','相关程度','发表状态','论文或项目','论文链接说明','代码库','仿真引擎','数据集','资源说明','资源来源','资源核对日期','纳入说明','发表类型','期刊信息','会议展示','DOI','范围核对','摘要','摘要来源','摘要版本','摘要署名','摘要许可','本地 PDF','全文下载状态','在线 PDF'],...filtered.map(p=>[p.conference,p.year,p.title,p.type,p.tier,p.status,p.url||'未核实独立论文链接',p.linkNote||'',(p.resources?.code||[]).join(' | ')||p.resources?.codeNote||'未找到已核实的公开仓库',(p.resources?.engines||[]).join(' | ')||p.resources?.engineNote||'未核实仿真引擎',(p.resources?.datasets||[]).join(' | ')||p.resources?.datasetNote||'未核实数据集',p.resources?.note||'',(p.resources?.sources||[]).join(' | '),p.resources?.verifiedAt||'',p.note,p.publicationType==='journal'?'期刊论文':'会议论文',p.citation||'',(p.presentedAt||[]).join(' | '),p.doi||'',p.verificationLevel==='title'?'标题初筛':p.verificationLevel==='abstract'?'摘要 / 项目核对':'',p.abstract||'摘要暂未获取',p.abstractSource||'',p.abstract?abstractKind(p):'',p.abstractCitation||'',p.abstractLicense||'',library.links(p).file||'',library.links(p).status,library.links(p).pdf||''])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='grasp-atlas-'+filtered.length+'-papers.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toastMessage('已导出 '+filtered.length+' 篇论文');
 });
 function loadURL(){Object.assign(state,{query:'',tier:'all',conferences:[...C.conferences],years:[...C.years],topic:'',sort:'newest',page:0});const u=new URLSearchParams(location.protocol==='file:'?location.hash.split('?').slice(1).join('?'):location.search);state.query=u.get('q')||'';if(['all','直接','相关'].includes(u.get('tier')))state.tier=u.get('tier');if(u.has('conf'))state.conferences=u.get('conf').split(',').filter(v=>C.conferences.includes(v));if(u.has('year'))state.years=u.get('year').split(',').map(Number).filter(v=>C.years.includes(v));if(C.topics.some(t=>t.id===u.get('topic')))state.topic=u.get('topic');if(['newest','oldest','title','conference'].includes(u.get('sort')))state.sort=u.get('sort');}
 $('restore-all').addEventListener('click',()=>{const result=collection.restoreAll();apply();toastMessage(result.persisted?'已恢复全部文章':'已恢复全部文章，但此浏览器无法保存记录');});
 $('removed-shortcut').addEventListener('click',()=>{navigate('bin',true);$('removed-title').scrollIntoView({block:'start',behavior:'smooth'});});
 window.addEventListener('storage',e=>{if(e.key===M.storageKey||e.key===null){collection.reload();apply();}});
 loadURL();navigate(location.hash.slice(1).split('?')[0]);apply();renderScreening();I.apply(document);I.observe(document);window.addEventListener('popstate',()=>{loadURL();navigate(location.hash.slice(1).split('?')[0]);apply();});
 if(window.matchMedia('(max-width:920px)').matches)document.querySelector('.filter-drawer').open=false;
 const context=document.modelContext;
 if(context?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'filter_grasp_papers',title:'筛选抓取论文',description:'配置论文浏览器的筛选条件，切换到论文清单并返回匹配论文。不会打开外部链接。',inputSchema:{type:'object',properties:{query:{type:'string'},conferences:{type:'array',items:{type:'string',enum:C.conferences}},years:{type:'array',items:{type:'integer',enum:C.years}},tier:{type:'string',enum:['all','直接','相关']},topic:{type:'string',enum:['',...C.topics.map(t=>t.id)]}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('输入必须是对象');for(const k of Object.keys(input)){if(!['query','conferences','years','tier','topic'].includes(k))throw new Error('未知筛选字段');}if(input.query!==undefined&&(typeof input.query!=='string'||input.query.length>500))throw new Error('搜索词无效');for(const [k,allowed]of [['conferences',C.conferences],['years',C.years]])if(input[k]!==undefined&&(!Array.isArray(input[k])||input[k].some(v=>!allowed.includes(v))))throw new Error(k+' 无效');if(input.tier!==undefined&&!['all','直接','相关'].includes(input.tier))throw new Error('相关程度无效');if(input.topic!==undefined&&!['',...C.topics.map(t=>t.id)].includes(input.topic))throw new Error('研究方向无效');Object.assign(state,input,{page:0});apply();navigate('papers');return {total:filtered.length,papers:filtered.slice(0,pageSize).map(p=>({id:p.id,title:p.title,conference:p.conference,year:p.year,url:p.url,resources:p.resources||{},abstract:p.abstract||'',abstractSource:p.abstractSource||''}))};}});
  register({name:'read_grasp_statistics',title:'读取抓取论文统计',description:'读取当前筛选条件和对应会议与期刊、年份和方向统计，不改变页面状态。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('输入应为空对象');return {asOf:D.asOf,filters:{...state,conferences:[...state.conferences],years:[...state.years]},...C.counts(filtered)};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
})();
