(function(root){
  'use strict';
  function normalise(m,now){
    if(!m || !m.team1 || !m.team2 || !m.matchID) throw new Error('Unexpected match format');
    var results=m.matchResults||[];
    var total=results.find(function(r){return r.resultTypeID===2;});
    var half=results.find(function(r){return r.resultTypeID===1;});
    var started=Date.parse(m.matchDateTimeUTC)<=now;
    // A past kickoff does not prove that a match is live (postponements, missing updates).
    var status=m.matchIsFinished?'Full time':started?'Awaiting confirmation':'Upcoming';
    return {id:m.matchID,home:m.team1,away:m.team2,kickoff:m.matchDateTimeUTC,
      finished:!!m.matchIsFinished,status:status,score:total?[total.pointsTeam1,total.pointsTeam2]:null,
      half:half?[half.pointsTeam1,half.pointsTeam2]:null,goals:m.goals||[],updated:m.lastUpdateDateTime,
      season:m.leagueSeason,round:m.group&&m.group.groupOrderID};
  }
  function utcDay(value){var d=new Date(value);return isNaN(d.getTime())?'':d.toISOString().slice(0,10);}
  function localDay(value,timeZone){
    var d=new Date(value);if(isNaN(d.getTime()))return '';
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),out={};
    parts.forEach(function(p){out[p.type]=p.value;});return out.year+'-'+out.month+'-'+out.day;
  }
  function shiftDay(day,amount){var d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+amount);return utcDay(d);}
  function bounds(s){return {start:shiftDay(s.day,s.window==='week'?-3:0),end:shiftDay(s.day,s.window==='week'?3:0)};}
  function midnight(day,timeZone){
    var target=Date.parse(day+'T00:00:00Z'),guess=target;
    for(var i=0;i<4;i++){
      var p={},parts=new Intl.DateTimeFormat('en-GB',{timeZone:timeZone||'UTC',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
      parts.forEach(function(v){p[v.type]=v.value;});
      var displayed=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour)%24,Number(p.minute),Number(p.second));
      var next=guess+target-displayed;if(next===guess)break;guess=next;
    }return guess;
  }
  function requestDays(s){var b=bounds(s),first=utcDay(midnight(b.start,s.timeZone)),last=utcDay(midnight(shiftDay(b.end,1),s.timeZone)-1),days=[];
    for(var d=first;d<=last;d=shiftDay(d,1))days.push(d);return days;
  }
  function safeLogo(url){return typeof url==='string'&&/^https:\/\/a\.espncdn\.com\//i.test(url)?url:null;}
  function scoreValue(value){if(value===null||value===undefined||value==='')return null;var n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
  function espn(event){
    var c=event&&event.competitions&&event.competitions[0];
    if(!event.id||!c||!Array.isArray(c.competitors))throw new Error('Unexpected ESPN match format');
    var home=c.competitors.find(function(t){return t.homeAway==='home';});
    var away=c.competitors.find(function(t){return t.homeAway==='away';});
    if(!home||!away||!home.team||!away.team)throw new Error('Missing ESPN home/away teams');
    var state=event.status||c.status||{},type=state.type||{};
    var h=scoreValue(home.score),a=scoreValue(away.score);
    function team(t){return {teamId:'espn:'+t.team.id,teamName:t.team.displayName||t.team.name,shortName:t.team.shortDisplayName||t.team.displayName,logo:safeLogo(t.team.logo||((t.team.logos||[])[0]||{}).href)};}
    return {id:'espn:'+event.id,provider:'espn',home:team(home),away:team(away),kickoff:event.date||c.date,
      finished:!!type.completed,live:type.state==='in',status:type.description||'Status unavailable',
      clock:state.displayClock||null,score:type.state==='pre'||h===null||a===null?null:[h,a],half:null,
      season:event.season&&event.season.year,updated:null,
      events:(c.details||[]).map(function(d){return {clock:d.clock&&d.clock.displayValue||'?',
        text:(d.type&&d.type.text||'Event')+' · '+(d.athletesInvolved||[]).map(function(p){return p.displayName||p.shortName;}).join(', '),
        goal:!!d.scoringPlay,shootout:!!d.shootout};}),
      shootout:[scoreValue(home.shootoutScore),scoreValue(away.shootoutScore)]};
  }
  function parse(provider,data,day,now,options){
    var list;
    if(provider==='espn'){
      if(!data||!Array.isArray(data.events))throw new Error('Invalid ESPN response');
      list=data.events.map(espn);
    }else if(provider==='openliga'){
      if(!Array.isArray(data))throw new Error('Invalid OpenLigaDB response');
      list=data.map(function(raw){var m=normalise(raw,now);m.id='openliga:'+m.id;m.provider='openliga';
        m.home=Object.assign({},m.home,{teamId:'openliga:'+m.home.teamId});m.away=Object.assign({},m.away,{teamId:'openliga:'+m.away.teamId});
        m.live=false;m.clock=null;m.events=m.goals.map(function(g){return {clock:String(g.matchMinute==null?'?':g.matchMinute)+'′',text:(g.goalGetterName||'Scorer not supplied')+' · '+g.scoreTeam1+'–'+g.scoreTeam2+(g.isPenalty?' (penalty)':'')+(g.isOwnGoal?' (own goal)':''),goal:true};});return m;});
    }else throw new Error('Unknown provider');
    var s=Object.assign({day:day},options||{}),b=bounds(s),seen={};
    return list.filter(function(m){var d=localDay(m.kickoff,s.timeZone);if(d<b.start||d>b.end||!d||seen[m.id])return false;seen[m.id]=true;return true;}).sort(function(a,b){return Date.parse(a.kickoff)-Date.parse(b.kickoff);});
  }
  function cacheKey(s){return 'matchboard-cache:v2:'+s.provider+':'+s.league+':'+s.day+':'+(s.timeZone||'UTC')+':'+(s.window||'day');}
  function endpoint(s){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s.day)||utcDay(s.day)!==s.day)throw new Error('Choose a valid date');
    if(['eng.1','ger.1','uefa.champions'].indexOf(s.league)<0)throw new Error('Unsupported league');
    if(s.provider==='espn')return 'https://site.api.espn.com/apis/site/v2/sports/soccer/'+s.league+'/scoreboard?dates='+s.day.replace(/-/g,'')+'&limit=1000';
    if(s.provider!=='openliga'||s.league!=='ger.1')throw new Error('OpenLigaDB is available for Bundesliga only');
    var year=Number(s.day.slice(0,4))-(Number(s.day.slice(5,7))<7?1:0);
    return 'https://api.openligadb.de/getmatchdata/bl1/'+year;
  }
  function endpoints(s){
    endpoint(s);var urls=requestDays(s).map(function(day){return endpoint(Object.assign({},s,{day:day}));});
    return urls.filter(function(url,i){return urls.indexOf(url)===i;});
  }
  function observations(list){return list.map(function(m){return {id:m.id,home:m.home.teamName,away:m.away.teamName,score:m.score,status:m.status,clock:m.clock,kickoff:m.kickoff,events:m.events};});}
  function changes(before,after){var prior={};before.forEach(function(m){prior[m.id]=m;});return after.filter(function(m){return !prior[m.id]||JSON.stringify(prior[m.id])!==JSON.stringify(m);}).map(function(m){return {id:m.id,before:prior[m.id]||null,after:m};}).concat(before.filter(function(m){return !after.some(function(n){return n.id===m.id;});}).map(function(m){return {id:m.id,before:m,after:null};}));}
  var api={safeLogo:safeLogo,normalise:normalise,espn:espn,parse:parse,utcDay:utcDay,localDay:localDay,shiftDay:shiftDay,bounds:bounds,requestDays:requestDays,endpoints:endpoints,cacheKey:cacheKey,endpoint:endpoint,observations:observations,changes:changes};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.ScoreModel=api;
})(typeof window!=='undefined'?window:globalThis);
