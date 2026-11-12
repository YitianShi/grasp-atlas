const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const local=require('./local-library.cjs');
const H=require('./scope-history.cjs');
const read=p=>JSON.parse(fs.readFileSync(__dirname+'/'+p,'utf8'));
const audit=read('../curation/primary-grasp-scope-2026-11-12.json');
const cat=read('../../Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json');
const state=local.readOptional('GraspAtlas_Library/download_state.json');
const archived=local.readOptional('GraspAtlas_Library/excluded_records.json')?.records;
const ctx={window:{},URL,document:{currentScript:{src:'file:///C:/atlas/library.js'}}};vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8'),ctx);local.load(ctx,M.catalogueRows(cat));
assert.equal(JSON.stringify(ctx.window.GRASP_DATA),JSON.stringify(cat));
assert.equal(cat.scopeRules.primaryGraspResearchOnly,true);
assert.equal(cat.rows.length,574);local.assertStateMatches(assert,state,cat.rows);assert.equal(audit.rows.length,200);
assert.equal(audit.decisions.length,747);assert.equal(audit.decisions.filter(d=>d.decision==='exclude').length,200);
const ids=new Set(cat.rows.map(p=>p.catalogueId));
assert.equal(ids.size,574);assert.ok(cat.rows.every(p=>p.tier==='直接'||H.restoredIds.has(p.catalogueId)));
const before=H.beforePrimary(cat.rows,audit);
assert.equal(before.length,747);
const hash=crypto.createHash('sha256').update(JSON.stringify(before.map(p=>[p.catalogueId,p.conference,p.year,p.title]))).digest('hex');
assert.equal(hash,audit.baselineIdentitySHA256);
assert.deepEqual(cat.rows.filter(p=>p.catalogueId>=730).map(p=>p.catalogueId),[730,731,732,733,734,736,743,750,762,763,771,772,776]);
assert.equal(audit.summary.lastRecheckRemoved,41);assert.equal(audit.summary.lastRecheckRetained,9);
assert.deepEqual(audit.tierChanges.map(p=>p.catalogueId),[146,244,377,483,526,673]);
for(const id of [6,37,55,69,85,146,204,244,377,389,483,526,658,665,669,673])assert.ok(ids.has(id));
for(const id of [11,39,138,217,456,524,535,543,635,697,700,711,715,725,728,735,737,747,758,767,777,778,779])assert.ok(!ids.has(id));
const allDownload=state&&archived?new Map([...state,...archived].map(p=>[p.id,p])):null;
if(allDownload)assert.equal(allDownload.size,779);
if(archived)assert.equal(archived.length,69);
for(const p of audit.rows){
 assert.equal(p.exclusionCategory,'not_primary_grasp');assert.ok(p.exclusionReason.length>30);
 if(allDownload)assert.equal(allDownload.get(p.catalogueId).title,p.title);
 if(H.restoredIds.has(p.catalogueId)){assert.ok(ids.has(p.catalogueId));continue;}
 if(cat.reviewBin.catalogueIds.includes(p.catalogueId)){assert.ok(!ids.has(p.catalogueId));assert.ok(ctx.window.GRASP_LIBRARY.rows[String(p.catalogueId)]);continue;}
 assert.ok(!ids.has(p.catalogueId));assert.ok(!ctx.window.GRASP_LIBRARY.rows[String(p.catalogueId)]);
 assert.ok(cat.screening.some(s=>s[0]==='排除'&&s[3]===p.title));
}
const removedKeys=H.currentPrimaryExclusions(audit).map(M.paperKey);const collection=M.create(C.enrich(cat.rows),{getItem:()=>JSON.stringify({version:1,keys:removedKeys}),setItem(){}});
assert.equal(collection.deleted().length,0);collection.restoreAll();assert.equal(collection.visible().length,574);
assert.equal(ctx.window.GRASP_LIBRARY.total,710);assert.equal(ctx.window.GRASP_LIBRARY.counts.downloaded,state?state.filter(p=>p.status==='downloaded').length:0);
assert.equal(C.counts(C.enrich(cat.rows)).conferences.ICML,1);
console.log('PASS: historical grasp-primary audit, reconstruction exception and recoverable review records');
