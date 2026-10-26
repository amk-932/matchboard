'use strict';
// One observation per provider per invocation. No scheduler or paid services.
const fs = require('node:fs');
const path = require('node:path');
const M = require('../model');
const args = process.argv.slice(2);
function option(name, fallback) { const i=args.indexOf(name); return i<0?fallback:args[i+1]; }
const day=option('--date',M.utcDay(new Date()));
const league=option('--league','eng.1');
const providers=args.includes('--compare')?['espn','openliga']:[option('--provider','espn')];
if(providers.includes('openliga')&&league!=='ger.1')throw new Error('Use --league ger.1 for OpenLigaDB or comparison');
const folder=path.join(__dirname,'../data/observations');fs.mkdirSync(folder,{recursive:true});
(async()=>{
 for(const provider of providers){
  const selection={provider,league,day};const url=M.endpoint(selection);const start=Date.now();let entry;
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json(),matches=M.observations(M.parse(provider,data,day,Date.now()));
   const priorPath=path.join(folder,`${provider}-${league}-${day}-latest.json`);
   let before=null;try{before=JSON.parse(fs.readFileSync(priorPath,'utf8'));}catch{}
   entry={at:new Date().toISOString(),selection,url,ok:true,durationMs:Date.now()-start,
    dataLicence:provider==='openliga'?'ODbL-1.0':'No open-data licence established; unofficial ESPN access',
    baseline:!before,matches,changes:before?M.changes(before.matches,matches):[]};
   fs.writeFileSync(priorPath,JSON.stringify(entry,null,2));
  }catch(error){entry={at:new Date().toISOString(),selection,url,ok:false,error:error.message};process.exitCode=1;}
  const output=path.join(folder,`${entry.at.replace(/[:.]/g,'-')}-${provider}-${league}.json`);
  fs.writeFileSync(output,JSON.stringify(entry,null,2));
  console.log(JSON.stringify({provider,league,day,ok:entry.ok,matches:entry.matches?.length,changes:entry.changes?.length,error:entry.error,file:output}));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
