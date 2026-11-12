const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const local=require('./local-library.cjs');
const H=require('./scope-history.cjs');
const read=p=>JSON.parse(fs.readFileSync(__dirname+'/'+p,'utf8'));
const audit=read('../curation/inhand-exclusions.json');
const whole=read('../curation/whole-body-garment-exclusions.json');
const primary=read('../curation/primary-grasp-scope-2026-11-12.json');
const ctx={window:{},URL,document:{currentScript:{src:'file:///C:/atlas/library.js'}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8'),ctx);
local.load(ctx,M.catalogueRows(ctx.window.GRASP_DATA));
vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/library-ui.js','utf8'),ctx);
const D=ctx.window.GRASP_DATA,rows=C.enrich(D.rows),library=ctx.window.GRASP_LIBRARY;
const removed=[109,133,162,180,252,263,320,322,342,347,406,632,694];
assert.deepEqual(audit.rows.map(p=>p.catalogueId),removed);
assert.equal(rows.length,574);
assert.equal(new Set(rows.map(p=>p.id)).size,574);
assert.equal(new Set(rows.map(p=>p.catalogueId)).size,574);
assert.ok(rows.every(p=>Number.isSafeInteger(p.catalogueId)&&p.catalogueId>0));
assert.ok(rows.every(p=>!removed.includes(p.catalogueId)));
assert.ok(rows.every(p=>!/\bin[\s\u2010-\u2015-]+hand\s+manipulation\b/i.test(p.title)));
const original=[...H.beforePrimary(D.rows,primary).filter(p=>p.catalogueId<=710),...audit.rows,...whole.rows].sort((a,b)=>a.catalogueId-b.catalogueId);
assert.equal(original.length,710);
const identities=original.map(p=>[p.catalogueId,p.conference,p.year,p.title]);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(identities)).digest('hex'),audit.baselineIdentitySHA256);
assert.equal(library.total,710);
const state=local.readOptional('GraspAtlas_Library/download_state.json');
local.assertStateMatches(assert,state,rows);
assert.equal(library.counts.downloaded,state?state.filter(p=>p.status==='downloaded').length:0);
for(const p of rows){
 assert.equal(p.id,'paper-'+String(p.catalogueId).padStart(3,'0'));
 assert.equal(ctx.window.GraspLibrary.entry(p).title,p.title);
}
for(const p of audit.rows){
 assert.ok(!library.rows[String(p.catalogueId)]);
 assert.ok(!D.rows.some(r=>M.paperKey(r)===M.paperKey(p)));
 assert.ok(D.screening.some(r=>r[0]==='排除'&&r[3]===p.title));
}
const savedKeys=audit.rows.map(M.paperKey);
const collection=M.create(rows,{getItem:()=>JSON.stringify({version:1,keys:savedKeys}),setItem(){}});
assert.equal(collection.deleted().length,0);
collection.restoreAll();
assert.equal(collection.visible().length,574);
// These survived the earlier in-hand review; a later primary-focus rule may exclude them.
for(const id of [10,27,80,267,328,400,458,535])assert.ok([...rows,...primary.rows].some(p=>p.catalogueId===id));
const archived=local.readOptional('GraspAtlas_Library/excluded_records.json')?.records;
if(archived){
 assert.equal(archived.length,69);
 for(const p of archived.filter(p=>p.status==='downloaded'))assert.ok(fs.existsSync(__dirname+'/../../GraspAtlas_Library/'+p.file));
}
console.log('PASS: in-hand exclusions, immutable original identities, curated metadata and preserved PDF paths');
