const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const local=require('./local-library.cjs');
const H=require('./scope-history.cjs');
const read=p=>JSON.parse(fs.readFileSync(__dirname+'/'+p,'utf8'));
const scope=read('../curation/whole-body-garment-exclusions.json'),journal=read('../curation/journal-update-2026-11-12.json');
const primary=read('../curation/primary-grasp-scope-2026-11-12.json');
const ctx={window:{},URL,document:{currentScript:{src:'file:///C:/atlas/library.js'}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/data.js','utf8'),ctx);
local.load(ctx,M.catalogueRows(ctx.window.GRASP_DATA));
vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/library-ui.js','utf8'),ctx);
const D=ctx.window.GRASP_DATA,rows=C.enrich(D.rows),L=ctx.window.GRASP_LIBRARY;
const beforePrimary=H.beforePrimary(D.rows,primary);
const body=[8,110,251,442,465,466,699],garment=[3,42,177,257,388,431,452,460,622,664,679,691];
assert.equal(scope.rows.length,19);
assert.deepEqual(scope.rows.filter(p=>p.exclusionCategory==='whole_body_grasping').map(p=>p.catalogueId),body);
assert.deepEqual(scope.rows.filter(p=>p.exclusionCategory==='garment_grasping').map(p=>p.catalogueId),garment);
const ids=new Set(rows.map(p=>p.catalogueId));
for(const id of [...body,...garment]){assert.ok(!ids.has(id));assert.ok(!L.rows[id]);}
for(const id of [49,107,170,200,272,498,520,589])assert.ok(beforePrimary.some(p=>p.catalogueId===id));
assert.equal(D.scopeRules.excludeWholeBodyGrasping,true);
assert.equal(D.scopeRules.excludeGarmentGrasping,true);
assert.equal(D.scopeRules.excludeClothGrasping,true);
assert.equal(D.scopeRules.excludeInHandManipulation,true);
assert.ok(!rows.some(p=>/\b(?:cloth\w*|garment\w*|textile\w*|towel\w*)\b/i.test(p.title)));
for(const id of [11,89,139,160,272,331,715,725])assert.ok(beforePrimary.some(p=>p.catalogueId===id));
const excludedKeys=scope.rows.map(M.paperKey);
const personal=M.create(rows,{getItem:()=>JSON.stringify({version:1,keys:excludedKeys}),setItem(){}});
personal.restoreAll();assert.equal(personal.visible().length,574);
const beforeScope=[...beforePrimary.filter(p=>p.catalogueId<=710),...scope.rows].sort((a,b)=>a.catalogueId-b.catalogueId);
assert.equal(beforeScope.length,697);
const digest=xs=>crypto.createHash('sha256').update(JSON.stringify(xs.map(p=>[p.catalogueId,p.conference,p.year,p.title]))).digest('hex');
assert.equal(digest(beforeScope),scope.baselineIdentitySHA256);
assert.equal(digest(beforePrimary.filter(p=>p.catalogueId<=710)),journal.baselineIdentitySHA256);
assert.equal(journal.fromDate,'2026-10-01');assert.equal(journal.throughDate,'2026-11-12');
assert.equal(journal.included.length,19);assert.equal(journal.reverified.length,4);
assert.deepEqual(journal.summary.byVenue,{'RA-L':14,'T-ASE':3,'T-RO':2});
const added=C.enrich(journal.included);
assert.deepEqual([...added].map(p=>p.catalogueId),Array.from({length:19},(_,i)=>711+i));
assert.equal(added.filter(p=>p.abstractKind==='preprint').length,14);
assert.equal(added.filter(p=>p.abstractKind==='summary').length,3);
assert.equal(added.filter(p=>p.verificationLevel==='title').length,2);
assert.equal(new Set(rows.filter(p=>p.doi).map(p=>p.doi.toLowerCase())).size,rows.filter(p=>p.doi).length);
for(const p of added){
 assert.ok(['RA-L','T-ASE','T-RO'].includes(p.conference));
 assert.equal(p.journalMetadata.checkedAt,'2026-11-12');
 assert.ok(p.journalMetadata.source.includes(p.doi));
 const dates=p.journalMetadata.dates['published-print']||p.journalMetadata.dates.published;
 const issueWindow=dates?.[0]?.[0]===2026&&[10,11].includes(dates[0][1]);
 const firstRecord=p.journalMetadata.recordCreatedAt.slice(0,10);
 assert.ok(issueWindow||firstRecord>='2026-10-01'&&firstRecord<='2026-11-12');
 if(ids.has(p.catalogueId)||D.reviewBin.catalogueIds.includes(p.catalogueId))assert.equal(ctx.window.GraspLibrary.entry(p).title,p.title);
 else assert.equal(ctx.window.GraspLibrary.entry(p),null);
 assert.ok(!/whole.body|garment|cloth|in.hand|tactile|surgical|underwater|bimanual|suction|vacuum/i.test(p.title));
}
const verdictCounts=journal.decisions.reduce((a,p)=>(a[p.decision]=(a[p.decision]||0)+1,a),{});
assert.deepEqual(verdictCounts,{already_represented:4,excluded:50,included:19,pending:46});
const state=local.readOptional('GraspAtlas_Library/download_state.json');
local.assertStateMatches(assert,state,rows);
assert.equal(L.total,710);assert.equal(L.counts.downloaded,state?state.filter(p=>p.status==='downloaded').length:0);
const archived=local.readOptional('GraspAtlas_Library/excluded_records.json')?.records;
if(archived)assert.equal(archived.length,69);
if(state&&archived){
 const history=new Map([...state,...archived].map(p=>[p.id,p]));
 for(const p of added){const r=history.get(p.catalogueId);assert.equal(r.title,p.title);assert.equal(r.year,p.year);assert.equal(r.venue,p.conference);}
}
assert.deepEqual([...rows.filter(p=>p.catalogueId>=711&&p.catalogueId<=729)].map(p=>p.catalogueId),[714,717,720,722]);
console.log('PASS: original journal provenance, archived historical additions, scope exclusions and reconstruction restoration');
