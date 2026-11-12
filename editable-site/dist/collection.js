(function(root){
 'use strict';
 const storageKey='grasp-atlas.removed.v1';
 const paperKey=p=>p.collectionKey||[p.conference,p.year,String(p.title).trim().toLowerCase().replace(/\s+/g,' ')].join('|');
 function catalogueRows(data){return [...data.rows,...(data.reviewBin?.rows||[])];}
 function deletionBatches(data){return [data.reviewBin,...(data.deletionBatches||[])].filter(batch=>batch?.batchId);}
 function defaultDeletedIds(data){return new Set(deletionBatches(data).flatMap(batch=>batch.catalogueIds||[]));}
 function collectionOptions(data,rows){return {batches:deletionBatches(data).map(batch=>{const ids=new Set(batch.catalogueIds||[]);return {batchId:batch.batchId,defaultRemovedKeys:rows.filter(p=>ids.has(p.catalogueId)).map(paperKey)};})};}
 function create(rows,storage,options={}){
  const known=new Set(rows.map(paperKey));let removed=new Set(),appliedBatches=new Set();
  function reload(){
   let value=null;try{const raw=storage?.getItem(storageKey);value=raw?JSON.parse(raw):null;}catch{}
   const valid=[1,2].includes(value?.version)&&Array.isArray(value.keys);
   removed=new Set(valid&&Array.isArray(value.keys)?value.keys.filter(k=>typeof k==='string'&&known.has(k)):[]);
   appliedBatches=new Set(valid&&Array.isArray(value.appliedBatches)?value.appliedBatches.filter(k=>typeof k==='string'):[]);
   let changed=false;
   for(const batch of [options,...(options.batches||[])])if(batch.batchId&&!appliedBatches.has(batch.batchId)){
    for(const key of batch.defaultRemovedKeys||[])if(known.has(key))removed.add(key);
    appliedBatches.add(batch.batchId);changed=true;
   }
   if(changed)save();
  }
  function save(){try{if(!storage)return false;storage.setItem(storageKey,JSON.stringify({version:2,keys:[...removed],appliedBatches:[...appliedBatches]}));return true;}catch{return false;}}
  function remove(key){if(!known.has(key)||removed.has(key))return {changed:false,persisted:true};removed.add(key);return {changed:true,persisted:save()};}
  function restore(key){if(!removed.delete(key))return {changed:false,persisted:true};return {changed:true,persisted:save()};}
  function restoreAll(){const changed=removed.size>0;removed.clear();return {changed,persisted:changed?save():true};}
  // Call only after the server has permanently removed the paper from disk.
  function purge(key){const index=rows.findIndex(p=>paperKey(p)===key);if(index<0||!removed.has(key))return {changed:false,persisted:true};rows.splice(index,1);known.delete(key);removed.delete(key);return {changed:true,persisted:save()};}
  reload();return {visible:()=>rows.filter(p=>!removed.has(paperKey(p))),deleted:()=>rows.filter(p=>removed.has(paperKey(p))),remove,restore,restoreAll,purge,reload};
 }
 const api={storageKey,paperKey,catalogueRows,deletionBatches,defaultDeletedIds,collectionOptions,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GraspCollection=api;
})(typeof globalThis!=='undefined'?globalThis:this);
