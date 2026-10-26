(function(root){
 'use strict';
 // Single-date upstream requests cover the whole local date window. Limit concurrency
 // and reuse recent reports for dates outside today; manual Refresh bypasses this cache.
 var cache={};
 function load(selection,force,callback){
  var urls=ScoreModel.endpoints(selection),responses=new Array(urls.length),active=[],next=0,complete=0,stopped=false;
  function abort(){stopped=true;active.forEach(function(x){x.abort();});}
  function fail(reason){if(stopped)return;abort();callback(new Error(reason));}
  function finish(){if(stopped)return;stopped=true;
   var merged=selection.provider==='espn'?{events:[]}:[];
   responses.forEach(function(data){if(selection.provider==='espn')merged.events=merged.events.concat(data.events);else merged=merged.concat(data);});
   callback(null,merged);
  }
  function pump(){
   if(stopped)return;if(complete===urls.length){finish();return;}
   while(next<urls.length&&active.length<3){
    var i=next++,url=urls[i],saved=cache[url],match=/dates=(\d{8})/.exec(url),today=ScoreModel.utcDay(new Date());
    var isCurrent=match&&match[1]>=ScoreModel.shiftDay(today,-1).replace(/-/g,'')&&match[1]<=ScoreModel.shiftDay(today,1).replace(/-/g,'');
    var ttl=selection.provider==='openliga'||isCurrent?15000:300000;
    if(!force&&saved&&Date.now()-saved.at<ttl){responses[i]=saved.data;complete++;continue;}
    (function(index,base){
     var xhr=new XMLHttpRequest();active.push(xhr);
     xhr.open('GET',base+(base.indexOf('?')>=0?'&':'?')+'_='+Date.now());xhr.timeout=15000;
     xhr.onload=function(){if(stopped)return;try{
      if(xhr.status!==200)throw new Error('HTTP '+xhr.status);
      var data=JSON.parse(xhr.responseText);
      if(selection.provider==='espn'?!data||!Array.isArray(data.events):!Array.isArray(data))throw new Error('Unexpected feed format');
      cache[base]={at:Date.now(),data:data};responses[index]=data;complete++;
      active.splice(active.indexOf(xhr),1);pump();
     }catch(e){fail(e.message);}};
     xhr.onerror=function(){fail('Network or browser access unavailable');};xhr.ontimeout=function(){fail('Request timed out');};xhr.send();
    })(i,url);
   }
   if(!stopped&&complete===urls.length)finish();
  }
  // Defer work so even an entirely cached response returns after the handle is assigned.
  setTimeout(pump,0);return {abort:abort};
 }
 root.ScoreFeed={load:load};
})(window);
