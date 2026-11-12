// Runtime download files are intentionally absent from a clean Git checkout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function readOptional(relative){
 const file=path.join(root,relative);
 return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
}
function load(context,rows){
 const file=path.join(root,'library.js');
 if(fs.existsSync(file))vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 else context.window.GRASP_LIBRARY={total:rows.length,counts:{downloaded:0,pending:rows.length,unavailable:0,needs_review:0,missing_file:0},rows:Object.fromEntries(rows.map(p=>[p.catalogueId,{title:p.title,year:p.year,venue:p.conference,status:'pending',file:'',paper_url:p.url||'',pdf_url:''}]))};
 return context.window.GRASP_LIBRARY;
}
function assertStateMatches(assert,state,rows){
 if(!state)return;
 // Curated rows remain the prefix; recoverable review records are appended.
 assert.ok(state.length>=rows.length);
 for(let i=0;i<rows.length;i++){
  assert.equal(state[i].id,rows[i].catalogueId);
  assert.equal(state[i].title,rows[i].title);
  assert.equal(state[i].year,rows[i].year);
  assert.equal(state[i].venue,rows[i].conference);
 }
}
module.exports={readOptional,load,assertStateMatches};
