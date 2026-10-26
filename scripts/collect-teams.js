'use strict';
const fs=require('node:fs');
(async()=>{
 const catalog={checkedAt:'2026-10-26',source:'ESPN public team endpoints',imageRights:'Club and competition marks belong to their respective owners; no open licence is asserted.',leagues:{}};
 for(const league of ['eng.1','ger.1','uefa.champions']){
  const url=`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams?limit=1000`;
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json(),sport=d.sports&&d.sports[0],competition=sport&&sport.leagues&&sport.leagues[0];
  if(!competition||!Array.isArray(competition.teams))throw new Error('Unexpected team catalog');
  catalog.leagues[league]={source:url,teams:competition.teams.map(({team:t})=>({id:'espn:'+t.id,name:t.displayName,shortName:t.shortDisplayName,abbreviation:t.abbreviation,logo:(t.logos||[]).find(l=>l.href&&l.href.startsWith('https://a.espncdn.com/'))?.href||null}))};
  console.log(league,catalog.leagues[league].teams.length,'teams');
 }
 fs.writeFileSync('data/team-catalog.json',JSON.stringify(catalog,null,2));fs.writeFileSync('data/team-catalog.js','window.MATCHBOARD_TEAMS = '+JSON.stringify(catalog)+';\n');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
