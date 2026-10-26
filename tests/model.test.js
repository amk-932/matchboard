const test = require('node:test');
const assert = require('node:assert/strict');
const {normalise} = require('../model');
const snapshot = require('../data/matchday.json');
const base = {matchID:1,team1:{teamId:1},team2:{teamId:2},matchDateTimeUTC:'2026-01-01T12:00:00Z',matchResults:[],goals:[]};
test('past kickoff is not labelled live and absent results are not 0–0',()=>{
 const m=normalise(base,Date.parse('2026-01-02')); assert.equal(m.status,'Awaiting confirmation');assert.equal(m.score,null);
});
test('half-time is never mistaken for the total',()=>{
 const m=normalise({...base,matchResults:[{resultTypeID:1,pointsTeam1:2,pointsTeam2:1}]},Date.now());assert.equal(m.score,null);assert.deepEqual(m.half,[2,1]);
});
test('result type, not array position, determines full-time score',()=>{
 const m=normalise({...base,matchIsFinished:true,matchResults:[{resultTypeID:2,pointsTeam1:0,pointsTeam2:0},{resultTypeID:1,pointsTeam1:0,pointsTeam2:0}]},Date.now());assert.deepEqual(m.score,[0,0]);assert.equal(m.status,'Full time');
});
test('future kickoff remains upcoming',()=>{assert.equal(normalise(base,Date.parse('2025-01-01')).status,'Upcoming');});
test('real captured matchday normalises without losing matches',()=>{assert.equal(snapshot.matches.map(m=>normalise(m,Date.now())).length,9);});
test('invalid feed objects are rejected',()=>{assert.throws(()=>normalise({},Date.now()));});

const M = require('../model');
function event(overrides={}) { return {id:'7',date:'2026-10-25T14:00:00Z',status:{type:{state:'post',completed:true,description:'Full Time'},displayClock:"90'+4'"},competitions:[{competitors:[{homeAway:'away',team:{id:'2',displayName:'Away'},score:'2'},{homeAway:'home',team:{id:'1',displayName:'Home'},score:'0'}],details:[]}],...overrides}; }
test('ESPN uses homeAway rather than array order, preserving zero',()=>{const m=M.espn(event());assert.equal(m.home.teamName,'Home');assert.deepEqual(m.score,[0,2]);assert.equal(m.id,'espn:7');});
test('upcoming ESPN zero placeholders are not actual scores',()=>{const m=M.espn(event({status:{type:{state:'pre',description:'Scheduled'}}}));assert.equal(m.score,null);assert.equal(m.live,false);});
test('missing scores stay unknown',()=>{let e=event();delete e.competitions[0].competitors[0].score;assert.equal(M.espn(e).score,null);});
test('live clock is preserved from source; no kickoff-based inference',()=>{const m=M.espn(event({status:{type:{state:'in',description:'Second Half'},displayClock:"67'"}}));assert.equal(m.live,true);assert.equal(m.clock,"67'");});
test('postponed ESPN match is not live',()=>{assert.equal(M.espn(event({status:{type:{state:'pre',description:'Postponed'}}})).status,'Postponed');});
test('valid empty feed differs from malformed feed',()=>{assert.deepEqual(M.parse('espn',{events:[]},'2026-10-25',Date.now()),[]);assert.throws(()=>M.parse('espn',{},'2026-10-25',Date.now()));});
test('date filtering uses UTC, excludes neighbouring day',()=>{assert.equal(M.parse('espn',{events:[event()]},'2026-10-26',Date.now()).length,0);assert.equal(M.parse('espn',{events:[event()]},'2026-10-25',Date.now()).length,1);});
test('cache isolates provider, league and day',()=>{const s={provider:'espn',league:'ger.1',day:'2026-10-25'};for(const change of [{provider:'openliga'},{league:'eng.1'},{day:'2026-10-26'}])assert.notEqual(M.cacheKey(s),M.cacheKey({...s,...change}));});
test('OpenLigaDB team IDs cannot collide with ESPN IDs',()=>{const m=M.parse('openliga',snapshot.matches,'2026-10-24',Date.now())[0];assert.match(m.home.teamId,/^openliga:/);});
test('July boundary selects correct OpenLigaDB season',()=>{assert.match(M.endpoint({provider:'openliga',league:'ger.1',day:'2026-05-20'}),/2025$/);assert.match(M.endpoint({provider:'openliga',league:'ger.1',day:'2026-10-25'}),/2026$/);});
test('unsupported leagues and invalid dates are rejected',()=>{assert.throws(()=>M.endpoint({provider:'openliga',league:'eng.1',day:'2026-10-25'}));assert.throws(()=>M.endpoint({provider:'espn',league:'eng.1',day:'2026-02-31'}));});
test('observations detect score corrections, clock updates, removed matches',()=>{const a=M.observations([M.espn(event())]);const b=JSON.parse(JSON.stringify(a));b[0].score=[1,2];assert.equal(M.changes(a,b).length,1);b[0].clock="91'";assert.equal(M.changes(a,b).length,1);assert.equal(M.changes(a,[])[0].after,null);assert.deepEqual(M.changes(a,a),[]);});

test('Sydney local day includes previous UTC evening',()=>{
 const data={events:[event({date:'2026-10-25T14:00:00Z'})]};
 assert.equal(M.parse('espn',data,'2026-10-26',Date.now(),{timeZone:'Australia/Sydney'}).length,1);
 assert.equal(M.parse('espn',data,'2026-10-25',Date.now(),{timeZone:'Australia/Sydney'}).length,0);
});
test('Sydney recent and upcoming view includes Arsenal Saturday and United Sunday',()=>{
 const data={events:[event({id:'arsenal',date:'2026-10-24T14:00:00Z'}),event({id:'united',date:'2026-10-25T14:00:00Z'})]};
 assert.equal(M.parse('espn',data,'2026-10-26',Date.now(),{timeZone:'Australia/Sydney',window:'week'}).length,2);
});
test('local-day request coverage straddles UTC midnight',()=>{
 assert.deepEqual(M.requestDays({day:'2026-10-26',timeZone:'Australia/Sydney'}),['2026-10-25','2026-10-26']);
 assert.deepEqual(M.requestDays({day:'2026-10-26',timeZone:'America/Los_Angeles'}),['2026-10-26','2026-10-27']);
});
test('DST start and end do not omit parts of the local day',()=>{
 for(const day of ['2026-10-04','2026-04-05'])assert.deepEqual(M.requestDays({day,timeZone:'Australia/Sydney'}),[M.shiftDay(day,-1),day]);
});
test('seven-day request window covers every local day with bounded unique URLs',()=>{
 const s={provider:'espn',league:'eng.1',day:'2026-10-26',timeZone:'Australia/Sydney',window:'week'};
 assert.deepEqual(M.bounds(s),{start:'2026-10-23',end:'2026-10-29'});
 const urls=M.endpoints(s);assert.equal(urls.length,8);assert.equal(new Set(urls).size,8);assert.ok(urls.every(u=>u.includes('limit=1000')));
});
test('duplicate response events are shown once',()=>{const e=event();assert.equal(M.parse('espn',{events:[e,e]},'2026-10-25',Date.now()).length,1);});
test('different timezone or view cannot reuse wrong cached matches',()=>{
 const s={provider:'espn',league:'eng.1',day:'2026-10-26'};
 assert.notEqual(M.cacheKey(s),M.cacheKey({...s,timeZone:'Australia/Sydney'}));assert.notEqual(M.cacheKey(s),M.cacheKey({...s,window:'week'}));
});
