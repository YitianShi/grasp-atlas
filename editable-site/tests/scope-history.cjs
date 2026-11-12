// Historical reviews remain immutable when a later user decision restores papers.
const restoration=require('../curation/reconstruction-grasp-restoration-2026-11-12.json');
const restoredIds=new Set(restoration.restoredCatalogueIds);
function beforePrimary(rows,primary){
 return [...new Map([...rows,...primary.rows].map(p=>[p.catalogueId,p])).values()].sort((a,b)=>a.catalogueId-b.catalogueId);
}
function currentPrimaryExclusions(primary){return primary.rows.filter(p=>!restoredIds.has(p.catalogueId));}
module.exports={restoration,restoredIds,beforePrimary,currentPrimaryExclusions};
