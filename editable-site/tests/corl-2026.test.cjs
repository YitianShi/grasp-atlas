const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const local=require('./local-library.cjs');
const H=require('./scope-history.cjs');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8'),ctx);
const D=ctx.window.GRASP_DATA,rows=C.enrich(D.rows);
const review=JSON.parse(fs.readFileSync(__dirname+'/../curation/corl-2026-review.json','utf8'));
const catalogue=JSON.parse(fs.readFileSync(__dirname+'/../../Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json','utf8'));
assert.equal(JSON.stringify(D),JSON.stringify(catalogue));
const inhand=JSON.parse(fs.readFileSync(__dirname+'/../curation/inhand-exclusions.json','utf8'));
const whole=JSON.parse(fs.readFileSync(__dirname+'/../curation/whole-body-garment-exclusions.json','utf8'));
const primary=JSON.parse(fs.readFileSync(__dirname+'/../curation/primary-grasp-scope-2026-11-12.json','utf8'));
const historical=[...H.beforePrimary(D.rows,primary).filter(p=>p.catalogueId<=710),...inhand.rows,...whole.rows].sort((a,b)=>a.catalogueId-b.catalogueId);
const prefix=historical.filter(p=>p.catalogueId<=review.baselineRows).map(p=>[p.conference,p.year,p.title]);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(prefix)).digest('hex'),review.baselineIdentitySHA256);
assert.equal(review.officialRoster.length,687);
assert.equal(new Set(review.officialRoster.map(p=>p.id)).size,687);
assert.equal(review.included.length,18);
assert.equal(review.reverified.length,4);
assert.equal(D.corl2026Coverage.total,14);
const roster=new Map(review.officialRoster.map(p=>[p.url,p.title.toLowerCase()]));
const corl=rows.filter(p=>p.conference==='CoRL'&&p.year===2026);
assert.equal(corl.length,14);
for(const p of corl){
 assert.equal(roster.get(p.openreviewUrl),p.title.toLowerCase());
 assert.equal(p.acceptanceVerifiedAt,review.asOf);
 assert.equal(p.venueUrl,review.source);
 assert.equal(p.status,'已公布录用，论文集待出版');
}
const added=rows.filter(p=>p.catalogueId>review.baselineRows&&p.catalogueId<=710);
assert.equal(added.length,12);
assert.equal(added.filter(p=>p.verificationLevel==='title').length,2);
assert.equal(added.filter(p=>p.abstractKind==='summary').length,2);
for(const p of [...review.excluded,...review.pending]){
 assert.ok(!corl.some(q=>q.title===p.title));
 assert.ok(D.screening.some(s=>s[1]==='CoRL'&&s[2]===2026&&s[3]===p.title));
}
const oldKeys=rows.filter(p=>p.catalogueId<=review.baselineRows).map(M.paperKey);
const collection=M.create(rows,{getItem:()=>JSON.stringify({version:1,keys:oldKeys}),setItem(){}});
assert.equal(collection.deleted().length,545);
assert.equal(collection.visible().length,added.length+D.journalRefreshCoverage.scopeRevision.activeCatalogueIds.length+D.fullRecheckCoverage.scopeRevision.activeFromOriginal50);
for(const p of added)assert.ok(!oldKeys.includes(M.paperKey(p)));
const filtered=C.filter(rows,{query:'',tier:'all',conferences:['CoRL'],years:[2026],topic:''});
assert.equal(filtered.length,14);
local.assertStateMatches(assert,local.readOptional('GraspAtlas_Library/download_state.json'),rows);
console.log('PASS: official CoRL roster, source provenance, appended IDs, legacy deletion keys, scope decisions, catalogue and download-state consistency');
