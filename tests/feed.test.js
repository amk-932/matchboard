const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function harness(){
 const requests=[],pending=[];
 class XHR {
  open(method,url){this.url=url;}
  send(){requests.push(this);pending.push(this);}
  abort(){this.aborted=true;}
  respond(data,status=200){this.status=status;this.responseText=JSON.stringify(data);this.onload();}
 }
 const timers=[];const context={window:{},ScoreModel:require('../model'),XMLHttpRequest:XHR,setTimeout:fn=>timers.push(fn),Date,JSON,Error};
 vm.runInNewContext(fs.readFileSync(require.resolve('../feed'),'utf8'),context);
 return {load:context.window.ScoreFeed.load,requests,pending,start(){while(timers.length)timers.shift()();}};
}
const selection={provider:'espn',league:'eng.1',day:'2026-10-26',timeZone:'Australia/Sydney',window:'week'};
test('whole window loads with at most three concurrent requests and merged events',()=>{
 const h=harness();let result;h.load(selection,false,(e,d)=>{assert.ifError(e);result=d;});h.start();assert.equal(h.requests.length,3);
 let done=0;while(h.pending.length){const req=h.pending.shift();req.respond({events:[{id:String(done++)}]});assert.ok(h.pending.length<=3);}
 assert.equal(h.requests.length,8);assert.equal(result.events.length,8);
});
test('manual refresh bypasses every cached date',()=>{
 const h=harness();h.load(selection,false,()=>{});h.start();while(h.pending.length)h.pending.shift().respond({events:[]});
 const count=h.requests.length;h.load(selection,true,()=>{});h.start();while(h.pending.length)h.pending.shift().respond({events:[]});assert.equal(h.requests.length-count,8);
});
test('failed window is never returned as a complete scoreboard',()=>{
 const h=harness();let calls=0;h.load(selection,false,(e,d)=>{calls++;assert.ok(e);assert.equal(d,undefined);});h.start();h.pending.shift().respond({},500);
 assert.equal(calls,1);assert.ok(h.requests.slice(1).every(r=>r.aborted));h.requests[1].respond({events:[]});assert.equal(calls,1);
});
test('aborting a source switch prevents a late result from changing the view',()=>{
 const h=harness();let calls=0;const handle=h.load(selection,false,()=>calls++);h.start();handle.abort();h.requests[0].respond({events:[]});assert.equal(calls,0);assert.ok(h.requests.every(r=>r.aborted));
});
