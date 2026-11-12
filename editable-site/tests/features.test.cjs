const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../dist/core.js');
const I=require('../dist/i18n.js');
const M=require('../dist/collection.js');
const H=require('./scope-history.cjs');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8'),ctx);
const D=ctx.window.GRASP_DATA,rows=C.enrich(D.rows);
const primary=JSON.parse(fs.readFileSync(__dirname+'/../curation/primary-grasp-scope-2026-11-12.json','utf8'));

// Document frequency merges aliases without counting repeated title words twice.
const keywords=C.keywordCounts([{title:'Grasp Grasps Grasping Objects with a 6-DoF Robot'},{title:'Object Grasping for 6D Robots'},{title:'Learning learned policies and multimodal multi-modal generation'}]);
assert.equal(keywords.find(k=>k.keyword==='grasping').count,2);
assert.equal(keywords.find(k=>k.keyword==='object').count,2);
assert.equal(keywords.find(k=>k.keyword==='6-DoF').count,2);
assert.equal(keywords.find(k=>k.keyword==='robotic').count,2);
assert.equal(keywords.find(k=>k.keyword==='multimodal').count,1);
assert.equal(keywords.find(k=>k.keyword==='learning').count,1);
assert.ok(!keywords.some(k=>['with','and','for'].includes(k.keyword)));
assert.equal(C.keywordCounts(rows).length,10);assert.deepEqual(C.keywordCounts([]),[]);

const exclusions=JSON.parse(fs.readFileSync(__dirname+'/../curation/keyword-exclusions.json','utf8'));
assert.equal(exclusions.rows.length,20);
const keys=new Set(rows.map(M.paperKey));
for(const p of exclusions.rows){assert.equal(keys.has(M.paperKey(p)),false,p.title);assert.ok(D.screening.some(s=>s[3]===p.title));}
for(const p of rows)assert.ok(!exclusions.keywords.some(k=>p.title.toLowerCase().includes(k)),p.title);
const icra=rows.filter(p=>p.conference==='ICRA');assert.equal(icra.filter(p=>p.url).length,208);assert.equal(icra.filter(p=>!p.url).length,1);
assert.equal(new Set(icra.filter(p=>p.url).map(p=>p.url)).size,207); // Two programme titles identify the same DOI; preserve historical row IDs.
for(const p of icra){if(p.url)assert.match(p.url,/^https:\/\/(doi\.org\/10\.|ieeexplore\.ieee\.org\/document\/\d+|arxiv\.org\/abs\/|www\.inrol\.snu\.ac\.kr\/_files\/ugd\/|ras\.papercept\.net\/conferences\/conferences\/ICRA26\/program\/ICRA26_ContentListWeb_[345]\.html#Ab[0-9]+)/,p.title);else assert.ok(p.linkNote&&p.linkLabel.includes('待核实'));}
assert.equal(icra.find(p=>p.title.startsWith('HOGraspFlow')).url,'https://arxiv.org/abs/2509.16871');

// Abstract-only words and multi-field terms are searched case-insensitively.
const abstractRows=C.enrich([{title:'Test Grasp',conference:'ICRA',year:2025,type:'抓取策略',abstract:'Epistemic and aleatoric uncertainty guide active interaction.'},{title:'Other',conference:'ICRA',year:2025,type:'抓取策略',abstract:''}]);
const abstractState={query:'ALEATORIC interaction',tier:'all',conferences:C.conferences,years:C.years,topic:''};
assert.equal(C.filter(abstractRows,abstractState).length,1);
assert.equal(C.filter(abstractRows,{...abstractState,query:'Test epistemic'}).length,1);
assert.equal(C.filter(abstractRows,{...abstractState,query:'aleatoric missingword'}).length,0);
assert.equal(C.filter(abstractRows,{...abstractState,conferences:['RA-L']}).length,0);
for(const p of rows){assert.equal(typeof p.abstract,'string');assert.ok(['available','unavailable'].includes(p.abstractStatus));if(p.abstract){assert.match(p.abstractSource,/^https:\/\//);assert.ok(p.abstract.length>80);assert.ok(['CC0-1.0','CC-BY-4.0','Original summary'].includes(p.abstractLicense));if(p.abstractKind==='published'){assert.ok(p.abstractAuthors.length);assert.ok(p.abstractCitation.includes(p.title));}}else assert.equal(p.abstractStatus,'unavailable');}
assert.equal(D.abstractCoverage.available,rows.filter(p=>p.abstract).length);
assert.equal(D.abstractCoverage.available+D.abstractCoverage.missing,rows.length);
assert.equal(D.abstractCoverage.abstracts+D.abstractCoverage.summaries,D.abstractCoverage.available);
assert.ok(D.abstractCoverage.available>400);
const additions=H.beforePrimary(rows,primary).filter(p=>p.catalogueId>677&&p.catalogueId<=692);assert.equal(additions.length,13);
assert.ok(additions.every(p=>p.abstract&&p.verificationLevel==='abstract'));
assert.equal(additions.filter(p=>p.resources.code.length).length,7);
assert.ok(additions.every(p=>!p.resources.code.some(u=>/mlresearch|nerfies|safevalues/.test(u))));
const active=additions.find(p=>p.title.startsWith('ActiveGrasp:'));
const activeState={query:'SE(3) affordable',tier:'all',conferences:['CVPR'],years:[2026],topic:''};
assert.ok(C.filter(rows,activeState).some(p=>p.title===active.title));
assert.ok(!active.title.toLowerCase().includes('affordable'));
assert.deepEqual([...active.resources.engines],['PyBullet']);
assert.equal(additions.find(p=>p.title.startsWith('RTAGrasp:')).url,'https://ieeexplore.ieee.org/document/11128140/');

// The UI and every published metadata field have an English representation.
const cjk=/[\u3400-\u9fff]/;
for(const value of [...C.topics.map(t=>t.label),...rows.flatMap(p=>[p.type,p.tier,p.status,p.note,p.linkLabel,p.linkNote,...Object.values(p.resources||{}).flat()]),...D.screening.flatMap(p=>[p[0],p[4]])].filter(v=>typeof v==='string'))assert.ok(!cjk.test(I.translateText(value)),value);
assert.equal(I.translateText('2026 年部分论文仅公布录用，年度数据尚未齐全。'),'Some 2026 entries are acceptance announcements; annual coverage remains incomplete.');
assert.equal(I.translateText('第 2 页'),'Page 2');
assert.equal(I.translateText('298 篇直接相关 · 27 篇扩展相关'),'298 directly relevant papers · 27 related papers');
assert.equal(I.translateText('GraspQP（基于 DexGraspNet 的 5,700 个物体；五种夹爪）'),'GraspQP (5,700 DexGraspNet-based objects; five grippers)');
const fields={query:'dexterous',tier:'all',conferences:C.conferences,years:C.years,topic:''};
assert.ok(C.filter(C.enrich([{title:'Example',type:'灵巧手抓取',conference:'ICRA',year:2025}]),fields).length);
assert.ok(C.filter(rows,{...fields,query:'灵巧'}).length);

const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const api=I.create(storage);assert.equal(api.getLanguage(),'zh');api.setLanguage('en');assert.equal(I.create(storage).getLanguage(),'en');api.setLanguage('xx');assert.equal(api.getLanguage(),'en');
const blocked=I.create({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});blocked.setLanguage('en');assert.equal(blocked.text('研究方向'),'Research topics');
// Repeated application and language round trips preserve source text and attributes.
const text={nodeValue:'统计概览',parentElement:{tagName:'SPAN'}},dynamic={nodeValue:'325 篇',parentElement:{tagName:'SPAN'}},script={nodeValue:'const label="统计概览";',parentElement:{tagName:'SCRIPT'}};
const attrs={placeholder:'搜索标题、代码库、仿真引擎或数据集…','aria-label':'第 2 页'};
const input={tagName:'INPUT',getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v};
const buttons=['zh','en'].map(language=>({dataset:{language},setAttribute(k,v){this[k]=v;}}));
const doc={documentElement:{},createTreeWalker(){const nodes=[text,dynamic,script];let i=0;return {nextNode:()=>nodes[i++]||null};},querySelectorAll:selector=>selector==='[data-language]'?buttons:[input]};
api.apply(doc);api.apply(doc);assert.equal(text.nodeValue,'Statistics');assert.equal(dynamic.nodeValue,'325 papers');assert.equal(attrs['aria-label'],'Page 2');assert.equal(buttons[1]['aria-pressed'],'true');assert.equal(doc.documentElement.lang,'en');assert.equal(script.nodeValue,'const label="统计概览";');
dynamic.nodeValue='324 篇';api.apply(doc);assert.equal(dynamic.nodeValue,'324 papers');
api.setLanguage('zh');api.apply(doc);assert.equal(text.nodeValue,'统计概览');assert.equal(dynamic.nodeValue,'324 篇');assert.equal(attrs['aria-label'],'第 2 页');assert.equal(doc.documentElement.lang,'zh-CN');assert.equal(buttons[0]['aria-pressed'],'true');
console.log('PASS: keyword frequency, title exclusions, individual paper links, bilingual metadata/search, persisted language and reversible DOM translations');
