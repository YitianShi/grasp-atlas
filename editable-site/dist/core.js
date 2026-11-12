(function(root){
  'use strict';
  const conferenceVenues=['AAAI','ICLR','NeurIPS','CVPR','ICCV','ECCV','ICML','CoRL','ICRA','RSS'];
  const journalVenues=['RA-L','T-ASE','T-RO'];
  const conferences=[...conferenceVenues,...journalVenues];
  const years=[2020,2021,2022,2023,2024,2025,2026];
  const topics=[
    {id:'dexterous',label:'灵巧手抓取',pattern:/灵巧|多指/},
    {id:'pose',label:'6-DoF / 位姿',pattern:/[67]-DoF|6D|旋转表示/},
    {id:'generation',label:'生成与优化',pattern:/生成|扩散|等变流|优化/},
    {id:'language',label:'语言与任务',pattern:/语言|任务|功能|语义|推理|可供性|VLA/},
    {id:'perception',label:'感知与场景',pattern:/视觉|感知|点云|重建|补全|杂乱|遮挡|透明|低光|视角/},
    {id:'control',label:'策略与控制',pattern:/策略|控制|动态|运动规划|仿真|课程学习/},
    {id:'data',label:'数据与基准',pattern:/数据|基准|标注|预训练/},
    {id:'transfer',label:'迁移与泛化',pattern:/迁移|跨|泛化|零样本|少样本|单示范|蒸馏/}
  ];
  function enrich(rows){return rows.map((p,i)=>({...p,publicationType:journalVenues.includes(p.conference)?'journal':'conference',id:'paper-'+String(p.catalogueId??i+1).padStart(3,'0'),topics:topics.filter(t=>t.pattern.test(p.type)).map(t=>t.id)}));}
  function filter(rows,s){const tokens=String(s.query||'').trim().toLowerCase().split(/\s+/).filter(Boolean);return rows.filter(p=>{if(!((s.tier==='all'||!s.tier||p.tier===s.tier)&&s.conferences.includes(p.conference)&&s.years.includes(p.year)&&(!s.topic||p.topics.includes(s.topic))))return false;const fields=[p.title,p.abstract||'',p.type,p.conference,p.note,String(p.year),...(p.resources?.code||[]),...(p.resources?.engines||[]),...(p.resources?.datasets||[])],source=fields.join(' '),english=root.GraspI18n?.text(source,'en')||source;return tokens.every(q=>(source+' '+english).toLowerCase().includes(q));});}
  function sort(rows,mode){return rows.slice().sort((a,b)=>{let d=0;if(mode==='oldest')d=a.year-b.year;else if(mode==='title')d=a.title.localeCompare(b.title);else if(mode==='conference')d=a.conference.localeCompare(b.conference);else d=b.year-a.year;return d||a.title.localeCompare(b.title);});}
  const keywordStopwords=new Set('a an the and or of for in on to with via using through from by as at under toward towards into over without any all new novel based framework approach method methods efficient effective robust enables enable enhancing improved improving better large scale real time end'.split(' '));
  const keywordAliases={grasp:'grasping',grasps:'grasping',grasped:'grasping',robot:'robotic',robots:'robotic',learn:'learning',learned:'learning',objects:'object',hands:'hand',datasets:'dataset',tasks:'task',policies:'policy',poses:'pose',networks:'network',representations:'representation',scenes:'scene',generative:'generation',uncertainties:'uncertainty'};
  const keywordLabels={'6dof':'6-DoF','7dof':'7-DoF',crossembodiment:'cross-embodiment',simtoreal:'sim-to-real'};
  function keywordCounts(rows,limit=10){
    const frequencies=new Map();
    for(const p of rows){
      const title=String(p.title||'').toLowerCase().replace(/\b([67])[\s-]*(?:dof|d)\b/g,' $1dof ').replace(/\bmulti[-\s]?modal\b/g,' multimodal ').replace(/\bcross[-\s]embodiment\b/g,' crossembodiment ').replace(/\bsim[-\s]to[-\s]real\b/g,' simtoreal ');
      const words=new Set((title.match(/[a-z0-9]+/g)||[]).map(t=>keywordAliases[t]||t).filter(t=>t.length>=3&&!/^\d+$/.test(t)&&!keywordStopwords.has(t)));
      for(const word of words)frequencies.set(word,(frequencies.get(word)||0)+1);
    }
    return [...frequencies].map(([word,count])=>({keyword:keywordLabels[word]||word,count})).sort((a,b)=>b.count-a.count||a.keyword.localeCompare(b.keyword)).slice(0,Math.max(0,limit));
  }
  function counts(rows){return {total:rows.length,direct:rows.filter(p=>p.tier==='直接').length,related:rows.filter(p=>p.tier==='相关').length,conferences:Object.fromEntries(conferences.map(c=>[c,rows.filter(p=>p.conference===c).length])),years:Object.fromEntries(years.map(y=>[y,rows.filter(p=>p.year===y).length])),topics:Object.fromEntries(topics.map(t=>[t.id,rows.filter(p=>p.topics.includes(t.id)).length])),keywords:keywordCounts(rows),cells:Object.fromEntries(conferences.map(c=>[c,Object.fromEntries(years.map(y=>[y,rows.filter(p=>p.conference===c&&p.year===y).length]))]))};}
  const api={conferences,conferenceVenues,journalVenues,years,topics,enrich,filter,sort,counts,keywordCounts};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.GraspCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
