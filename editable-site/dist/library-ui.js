(function(root){
 'use strict';
 if(!root.GRASP_LIBRARY){
  const total=(root.GRASP_DATA?.rows?.length||0)+(root.GRASP_DATA?.reviewBin?.rows?.length||0);
  root.GRASP_LIBRARY={total,counts:{downloaded:0,pending:total,unavailable:0,needs_review:0,missing_file:0},rows:{}};
 }
 function entry(p){
  const id=String(Number(String(p.id||'').replace('paper-','')));
  const r=root.GRASP_LIBRARY?.rows?.[id];
  return r&&r.title===p.title&&r.year===p.year&&r.venue===p.conference?r:null;
 }
 function remote(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
 function local(value){
  if(!value||value.includes('\\')||value.split('/').some(s=>s==='..'||s==='.')||!value.includes('/papers/')||!value.endsWith('.pdf')||/^[/]|[:?#]/.test(value))return '';
  try{const base=new URL(root.GRASP_LIBRARY_BASE);const u=new URL(value.split('/').map(encodeURIComponent).join('/'),base);return u.href.startsWith(base.href)&&/^(file:|https?:)$/.test(u.protocol)?u.href:'';}catch{return '';}
 }
 function links(p){
  const r=entry(p),file=r?.status==='downloaded'?local(r.file):'';
  const online=remote(r?.paper_url)||remote(p.url),pdf=remote(r?.pdf_url);
  const abstract=remote(p.abstractPageUrl);
  return {file,online,pdf,abstract,primary:file||online||pdf||abstract,status:r?.status||'pending'};
 }
 const api={entry,links,local,remote};
 root.GraspLibrary=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
