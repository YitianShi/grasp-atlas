const assert=require('node:assert/strict');
const C=require('../dist/core.js'),M=require('../dist/collection.js'),local=require('./local-library.cjs');
const data=require('../../Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json');
const primary=require('../curation/primary-grasp-scope-2026-11-12.json');
const audit=require('../curation/original-159-review-bin-2026-11-12.json');
const original=primary.rows.filter(p=>p.catalogueId<730),ids=new Set(original.map(p=>p.catalogueId));
assert.equal(original.length,159);assert.deepEqual(data.reviewBin.catalogueIds,[...ids]);assert.deepEqual(audit.catalogueIds,[...ids]);
const rows=C.enrich(M.catalogueRows(data));assert.equal(rows.length,710);assert.equal(new Set(rows.map(p=>p.catalogueId)).size,710);assert.equal(new Set(rows.map(M.paperKey)).size,710);
assert.equal(data.reviewBin.rows.length,136);
for(const p of data.reviewBin.rows)assert.deepEqual(p,original.find(r=>r.catalogueId===p.catalogueId));
const options={batchId:data.reviewBin.batchId,defaultRemovedKeys:rows.filter(p=>ids.has(p.catalogueId)).map(M.paperKey)};
const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const collection=M.create(rows,storage,options);
assert.equal(collection.visible().length,551);assert.equal(collection.deleted().length,159);
assert.deepEqual(new Set(collection.deleted().map(p=>p.catalogueId)),ids);
assert.equal(C.counts(collection.visible()).direct,547);assert.equal(C.counts(collection.visible()).related,4);
const target=rows.find(p=>p.catalogueId===339),key=M.paperKey(target);
assert.equal(collection.restore(key).changed,true);assert.equal(collection.visible().length,552);
const refreshed=M.create(rows,storage,options);assert.equal(refreshed.deleted().length,158);assert.ok(refreshed.visible().some(p=>p.catalogueId===339));
refreshed.restoreAll();const all=M.create(rows,storage,options);assert.equal(all.visible().length,710);assert.equal(all.deleted().length,0);
assert.equal(all.remove(key).changed,true);assert.equal(M.create(rows,storage,options).deleted().length,1);
assert.equal(JSON.parse(saved.get(M.storageKey)).version,2);assert.deepEqual(JSON.parse(saved.get(M.storageKey)).appliedBatches,[data.reviewBin.batchId]);
const own=rows.find(p=>!ids.has(p.catalogueId)),legacy=new Map([[M.storageKey,JSON.stringify({version:1,keys:[M.paperKey(own)]})]]);
const migrated=M.create(rows,{getItem:k=>legacy.get(k),setItem:(k,v)=>legacy.set(k,v)},options);
assert.equal(migrated.deleted().length,160);assert.ok(migrated.deleted().some(p=>p.catalogueId===own.catalogueId));
for(const raw of ['{broken',JSON.stringify({version:2,appliedBatches:[data.reviewBin.batchId]})])assert.equal(M.create(rows,{getItem:()=>raw,setItem(){}},options).deleted().length,159);
const blocked=M.create(rows,{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},options);
assert.equal(blocked.deleted().length,159);assert.equal(blocked.restore(key).persisted,false);assert.equal(blocked.visible().length,552);
for(const p of original){
 assert.equal(C.filter(collection.deleted().concat([target]),{query:p.title,tier:'all',conferences:C.conferences,years:C.years}).length,1);
 assert.ok(!data.screening.some(s=>s[1]===p.conference&&s[2]===p.year&&s[3]===p.title));
}
const state=local.readOptional('GraspAtlas_Library/download_state.json'),archived=local.readOptional('GraspAtlas_Library/excluded_records.json')?.records;
local.assertStateMatches(assert,state,rows);
if(state)assert.equal(state.length,710);
if(state&&archived){assert.equal(archived.length,69);assert.equal(new Set([...state,...archived].map(p=>p.id)).size,779);assert.ok(archived.every(p=>!ids.has(p.id)));}
console.log('PASS: all original 159 papers in the review bin, one-time migration, persistent selective restore, legacy preferences and PDF identities');
