const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('../watch');
const M=require('../model');
const catalog=require('../data/team-catalog.json');
test('all supported region and league combinations have researched services',()=>{
 for(const region of ['AU','US','GB','CA','IN'])for(const league of ['eng.1','ger.1','uefa.champions']){
  const g=W.guide(league,region,'2026-10-26');assert.ok(g.providers.length);assert.ok(g.source.startsWith('https://'));assert.ok(g.providers.every(p=>p.url.startsWith('https://')));
 }
});
test('unknown region does not inherit Australian recommendations',()=>{const g=W.guide('eng.1','OTHER','2026-10-26');assert.equal(g.providers.length,0);assert.equal(g.region,'Other region');assert.ok(g.source);});
test('old broadcast rights expire to an official-guide fallback',()=>{const g=W.guide('eng.1','AU','2027-05-01');assert.equal(g.providers.length,0);assert.equal(g.stale,true);assert.ok(g.source);});
test('all catalog teams have a logo reference and counts match full competition catalogs',()=>{
 for(const [league,count] of [['eng.1',20],['ger.1',18],['uefa.champions',36]]){const teams=catalog.leagues[league].teams;assert.equal(teams.length,count);assert.equal(new Set(teams.map(t=>t.id)).size,count);assert.ok(teams.every(t=>M.safeLogo(t.logo)));}
});
test('logo URLs only allow the expected HTTPS image origin',()=>{
 for(const url of ['javascript:alert(1)','http://a.espncdn.com/logo.png','https://a.espncdn.com.evil.test/logo.png','https://example.com/logo.png'])assert.equal(M.safeLogo(url),null);
 assert.equal(M.safeLogo('https://a.espncdn.com/i/teamlogos/soccer/500/359.png'),'https://a.espncdn.com/i/teamlogos/soccer/500/359.png');
});
