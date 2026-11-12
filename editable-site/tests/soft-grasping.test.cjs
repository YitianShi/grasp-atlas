const assert=require('node:assert/strict');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const data=require('../../Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json');
const audit=require('../curation/soft-grasping-exclusions-2026-11-12.json');
const rows=C.enrich(M.catalogueRows(data)),ids=new Set(audit.catalogueIds),oldIds=new Set(data.reviewBin.catalogueIds);
const batch=data.deletionBatches.find(b=>b.batchId===audit.batchId);
assert.equal(ids.size,40);assert.deepEqual(batch.catalogueIds,audit.catalogueIds);
assert.equal([...ids].filter(id=>!oldIds.has(id)).length,28);assert.equal([...ids].filter(id=>oldIds.has(id)).length,12);
assert.equal(rows.length,710);assert.equal(data.rows.length,574);assert.equal(data.reviewBin.rows.length,136);
assert.equal(data.reviewBin.batchId,'original-159-2026-11-12');
assert.equal(M.defaultDeletedIds(data).size,187);
for(const r of audit.rows){assert.ok(rows.some(p=>p.catalogueId===r.catalogueId&&p.title===r.title));assert.ok(r.reason&&r.evidenceLevel&&r.sources.length);}
assert.ok(data.scopeRules.excludeSoftGrippers&&data.scopeRules.excludeSoftDeformableObjectGrasping);
// Regression cases: hidden soft hands, flexible cables/sheets and explicit soft-jaw mechanics.
for(const id of [87,135,147,159,160,175,194,210,271,327,331,339,358,467,530,561,566,568,625,650,688,730])assert.ok(ids.has(id));
for(const id of [53,89,112,238,272,298,315,325,378,426,471,556,575,643,697])assert.ok(!ids.has(id));
const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},options=M.collectionOptions(data,rows);
const key=id=>M.paperKey(rows.find(p=>p.catalogueId===id));
const initial=M.create(rows,storage,options);
assert.equal(initial.visible().length,523);assert.equal(initial.deleted().length,187);
const counts=C.counts(initial.visible());assert.deepEqual([counts.total,counts.direct,counts.related],[523,519,4]);
assert.equal(JSON.parse(saved.get(M.storageKey)).appliedBatches.length,2);
// A user can restore a newly excluded soft paper and keep that choice on reload.
initial.restore(key(159));const restored=M.create(rows,storage,options);
assert.equal(restored.visible().length,524);assert.ok(restored.visible().some(p=>p.catalogueId===159));
restored.restoreAll();assert.equal(M.create(rows,storage,options).visible().length,710);
// A new policy batch must not reapply the original159 batch or erase personal deletions.
saved.clear();const legacyOptions={batchId:data.reviewBin.batchId,defaultRemovedKeys:rows.filter(p=>oldIds.has(p.catalogueId)).map(M.paperKey)};
const previous=M.create(rows,storage,legacyOptions);
previous.restore(key(221));previous.restore(key(339));previous.remove(key(1));
const updated=M.create(rows,storage,options);
assert.ok(updated.visible().some(p=>p.catalogueId===221));
assert.ok(updated.deleted().some(p=>p.catalogueId===339));
assert.ok(updated.deleted().some(p=>p.catalogueId===1));
assert.equal(updated.visible().length,523);
updated.restore(key(339));assert.ok(M.create(rows,storage,options).visible().some(p=>p.catalogueId===339));
// Legacy v1 records and unavailable storage both receive the complete current defaults.
saved.set(M.storageKey,JSON.stringify({version:1,keys:[key(1)]}));assert.equal(M.create(rows,storage,options).deleted().length,188);
assert.equal(M.create(rows,null,options).deleted().length,187);
console.log('PASS: soft grippers and deformable objects excluded, boundary cases retained, one-time independent migration and selective restoration');
