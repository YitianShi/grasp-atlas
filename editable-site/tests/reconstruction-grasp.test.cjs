const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../dist/core.js'),M=require('../dist/collection.js');
const H=require('./scope-history.cjs'),local=require('./local-library.cjs');
const cat=require('../../Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json');
const primary=require('../curation/primary-grasp-scope-2026-11-12.json');
const audit=H.restoration,expected=[27,68,150,151,221,231,269,302,353,396,409,453,470,488,547,554,611,612,634,639,684,690,722,736,743,750,776];
assert.deepEqual(audit.restoredCatalogueIds,expected);assert.equal(audit.included.length,27);
const baseline=cat.rows.filter(p=>!H.restoredIds.has(p.catalogueId));
assert.equal(baseline.length,547);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(baseline.map(p=>[p.catalogueId,p.conference,p.year,p.title]))).digest('hex'),audit.baselineIdentitySHA256);
assert.equal(cat.scopeRules.primaryGraspResearchOnly,true);assert.equal(cat.scopeRules.includeReconstructionForGrasping,true);
for(const flag of ['excludeInHandManipulation','excludeWholeBodyGrasping','excludeGarmentGrasping','excludeClothGrasping','excludeTactilePolicyInput','excludeHardwareDesign'])assert.equal(cat.scopeRules[flag],true);
const rows=C.enrich(cat.rows),ids=new Set(rows.map(p=>p.catalogueId));
for(const id of expected){
 const p=cat.rows.find(p=>p.catalogueId===id),old={...primary.rows.find(p=>p.catalogueId===id)};
 for(const key of ['exclusionCategory','focusExclusionKind','exclusionReason','evidenceSource','evidenceLevel'])delete old[key];
 const {scopeInclusion,...actual}=p;
 assert.deepEqual(actual,old);assert.equal(scopeInclusion.category,'reconstruction_for_grasping');
 assert.ok(!cat.screening.some(s=>s[1]===p.conference&&s[2]===p.year&&s[3]===p.title));
 assert.equal(C.filter(rows,{query:p.title,tier:'all',conferences:C.conferences,years:C.years}).length,1);
 const decision=audit.decisions.find(p=>p.catalogueId===id);assert.equal(decision.decision,'restore');assert.ok(decision.reason.length>40);assert.match(decision.source,/^https:\/\//);
}
assert.equal(audit.decisions.find(p=>p.catalogueId===302).evidenceLevel,'title');
assert.equal(cat.rows.find(p=>p.catalogueId===302).abstract,'');
assert.equal(cat.rows.find(p=>p.catalogueId===488).abstract,'');
for(const decision of audit.borderlineKeptExcluded)assert.ok(!ids.has(decision.catalogueId));
for(const source of ['inhand-exclusions','whole-body-garment-exclusions','hardware-exclusions','keyword-exclusions']){
 const excluded=require('../curation/'+source+'.json').rows;
 const keys=new Set(rows.map(M.paperKey));for(const p of excluded)assert.ok(!keys.has(M.paperKey(p)),p.title);
}
const counts=C.counts(rows);
const I=require('../dist/i18n.js');
const page=fs.readFileSync(__dirname+'/../dist/index.html','utf8');
const scope=page.match(/<div class="scope-intro">[\s\S]*?<\/div>/)[0].replace(/<[^>]+>/g,'');
assert.ok(scope.includes('159 篇'));assert.ok(!/[\u3400-\u9fff]/.test(I.translateText(scope)));
assert.equal(counts.total,574);assert.equal(counts.direct,563);assert.equal(counts.related,11);
assert.deepEqual(counts.conferences,audit.summary.byVenue);
assert.deepEqual(counts.years,audit.summary.byYear);
assert.deepEqual(cat.journalRefreshCoverage.scopeRevision.activeCatalogueIds,[714,717,720,722]);
assert.equal(cat.fullRecheckCoverage.scopeRevision.activeFromOriginal50,13);assert.equal(cat.fullRecheckCoverage.scopeRevision.removedFromOriginal50,37);
assert.equal(cat.scopeExclusionCoverage.removed,205);assert.equal(H.currentPrimaryExclusions(primary).length,173);
const state=local.readOptional('GraspAtlas_Library/download_state.json'),archive=local.readOptional('GraspAtlas_Library/excluded_records.json')?.records;
local.assertStateMatches(assert,state,cat.rows);
if(state&&archive){
 assert.equal(new Set([...state,...archive].map(p=>p.id)).size,779);
 for(const id of expected){assert.ok(state.some(p=>p.id===id));assert.ok(!archive.some(p=>p.id===id));}
}
console.log('PASS: historical reconstruction restorations, unchanged metadata/IDs and preserved exclusions');
