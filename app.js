(function(){
 'use strict';
 var $=function(id){return document.getElementById(id);};
 var M=ScoreModel, leagues={'eng.1':['Premier League','EN'],'ger.1':['Bundesliga','DE'],'uefa.champions':['Champions League','EU']};
 var timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 var selection={provider:'espn',league:'eng.1',day:M.localDay(new Date(),timeZone),timeZone:timeZone,window:'week'};
 var followToday=true;
 var matches=[],raw=null,fetched=null,online=false,loading=false,filter='all',request=null,generation=0;
 var returnFocus=null,detailId=null,dialogMode=null,comparison=null,compareRequest=null;
 function read(key,fallback){try{var value=JSON.parse(localStorage.getItem(key));return value===null?fallback:value;}catch(e){return fallback;}}
 function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
 var favourites=read('matchboard-favourites',null);
 if(!Array.isArray(favourites)){var old=read('touchline-favourites',[]);favourites=Array.isArray(old)?old.map(function(id){return 'openliga:'+id;}):[];}
 var history=read('matchboard-history',[]);if(!Array.isArray(history))history=[];
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function date(s){if(!s)return 'not yet fetched';var d=new Date(s);return isNaN(d.getTime())?'Unknown':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
 function providerName(p){return p==='espn'?'ESPN (unofficial feed)':'OpenLigaDB';}
 function record(entry){history.push(entry);history=history.slice(-100);save('matchboard-history',history);}
 var region=read('matchboard-region','AU');if(!WatchGuide.regions[region])region='AU';
 var animateNext=true,focusKeyTime=0,toastTimer,animationTimer,detailSignature=null;
 var catalogById={},catalogByName={};
 function canonical(name){var key=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');return {koln:'cologne',hsv:'hamburg',s04:'schalke',leipzig:'rbleipzig'}[key]||key;}
 Object.keys(window.MATCHBOARD_TEAMS.leagues).forEach(function(key){window.MATCHBOARD_TEAMS.leagues[key].teams.forEach(function(t){catalogById[t.id]=t;[t.name,t.shortName].forEach(function(n){if(n)catalogByName[canonical(n)]=t;});});});
 function logo(t){var entry=catalogById[t.teamId]||catalogByName[canonical(t.teamName)]||catalogByName[canonical(t.shortName)];return M.safeLogo(t.logo)||(entry&&M.safeLogo(entry.logo));}
 function crest(t){var initials=(t.teamName||t.shortName||'?').split(/\s+/).map(function(w){return w[0];}).join('').slice(0,3).toUpperCase(),url=logo(t);return '<span class="crest '+(url?'has-image':'')+'">'+(url?'<img src="'+esc(url)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'')+'<span class="crest-fallback" aria-hidden="true">'+esc(initials)+'</span></span>';}
 function imageFallbacks(scope){scope.querySelectorAll('.crest img').forEach(function(img){function fail(){img.parentElement.classList.add('broken');}img.onerror=fail;if(img.complete&&!img.naturalWidth)fail();});}
 function kickoff(value){return new Date(value).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});}
 function toast(message){var old=document.querySelector('.toast');if(old)old.remove();clearTimeout(toastTimer);var el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=message;document.body.appendChild(el);toastTimer=setTimeout(function(){el.remove();},2400);}
 function syncNav(){document.querySelectorAll('[data-filter]').forEach(function(b){var selected=b.dataset.filter===filter;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});$('nav-home').classList.toggle('selected',filter!=='favourites');$('nav-follow').classList.toggle('selected',filter==='favourites');$('page-label').textContent=filter==='favourites'?'Following':'Scoreboard';}
 function setFilter(value){filter=value;animateNext=true;syncNav();render();}
 function watchHTML(league){var g=WatchGuide.guide(league,region),names=WatchGuide.regions;
  return '<section class="watch-panel"><div class="eyebrow">WHERE TO WATCH</div><h3>Football in '+esc(g.region)+'</h3><p>'+esc(g.scope)+' Check the provider’s schedule before subscribing.</p>'+g.providers.map(function(p){return '<a class="watch-card" href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer"><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.note)+'</small></span><span aria-hidden="true">↗</span></a>';}).join('')+(!g.providers.length?'<p>'+(g.stale?'This guide needs a fresh rights check.':'We haven’t verified a viewing service for this region yet.')+' Use the official broadcaster guide below.</p>':'')+'<p class="watch-note">Researched '+esc(g.checkedAt)+'. Provider subscriptions may cost money. Region selection changes this guide, not your device timezone.</p><div class="watch-sources"><a href="'+esc(g.source)+'" target="_blank" rel="noopener noreferrer">Official broadcaster guide ↗</a>'+(g.additionalSource?'<a href="'+esc(g.additionalSource)+'" target="_blank" rel="noopener noreferrer">Additional source ↗</a>':'')+'</div></section>';
 }
 function showWatch(updating){var html='<div class="eyebrow">FIND YOUR NEXT MATCH</div><h2>Where to watch</h2><label class="watch-region">Viewing region<select id="dialog-region">'+Object.keys(WatchGuide.regions).map(function(r){return '<option value="'+r+'" '+(r===region?'selected':'')+'>'+esc(WatchGuide.regions[r])+'</option>';}).join('')+'</select></label><p>'+esc(leagues[selection.league][0])+' · Regional competition guide</p>'+watchHTML(selection.league);
  if(updating){$('dialog-content').innerHTML=html;$('dialog-content').querySelector('h2').id='dialog-title';}else open(html,'watch');
  $('dialog-region').onchange=function(){changeRegion(this.value);showWatch(true);$('dialog-region').focus();};
 }
 function changeRegion(value){region=value;save('matchboard-region',region);$('region').value=region;var g=WatchGuide.guide(selection.league,region);$('watch-summary').textContent=g.providers.length?'Explore '+g.providers.map(function(p){return p.name;}).join(' and ')+' coverage in '+g.region+'.':'Find official broadcaster information for '+g.region+'.';if(dialogMode==='match')showMatch(detailId,true);}
 function featured(){
  var m=matches.find(function(m){return m.live;})||matches.find(function(m){return !m.finished&&(isFollowed(m.home)||isFollowed(m.away));})||matches.find(function(m){return !m.finished;})||matches.find(function(m){return isFollowed(m.home)||isFollowed(m.away);})||matches[matches.length-1];
  var html=m?'<div class="feature-label"><span>'+(m.live?'IN PLAY':m.finished?'FROM YOUR MATCHDAY':'COMING UP')+'</span><span>'+esc(leagues[selection.league][0])+'</span></div><div class="feature-match"><div class="feature-club">'+crest(m.home)+esc(m.home.shortName||m.home.teamName)+'</div><div class="feature-score">'+(m.score?m.score.join(' : '):esc(kickoff(m.kickoff)))+'<small>'+esc(m.live?status(m):m.finished?'Full time':M.localDay(m.kickoff,selection.timeZone))+'</small></div><div class="feature-club">'+crest(m.away)+esc(m.away.shortName||m.away.teamName)+'</div></div><button class="feature-open" data-feature="'+esc(m.id)+'">'+(m.finished?'Explore match report':'Match details & viewing options')+' ↗</button>':'<div class="feature-label"><span>YOUR MATCHDAY</span><span>'+esc(leagues[selection.league][0])+'</span></div><div class="feature-empty">'+(loading?'Finding your football…':'A quiet day on the pitch.<br>Explore another date or competition.')+'</div>';
  if($('featured').innerHTML!==html){$('featured').innerHTML=html;imageFallbacks($('featured'));var b=$('featured').querySelector('button');if(b)b.onclick=function(){showMatch(b.dataset.feature);};}
 }
 function isFollowed(t){return favourites.indexOf(t.teamId)>=0;}
 function team(t,score,winner){return '<div class="team"><span class="team-label">'+crest(t)+'<span class="team-name">'+esc(t.teamName||t.shortName)+(isFollowed(t)?'<span class="follow-star" aria-label="Following">☆</span>':'')+'</span></span><span class="score '+(winner?'winner':'')+'">'+(score==null?'–':esc(score))+'</span></div>';}

 function status(m){return (m.live?(online?'Reported live · ':'Saved status · '):'')+m.status+(m.live&&m.clock?' · '+m.clock:'');}
 function render(){
  var focused=document.activeElement&&document.activeElement.getAttribute('data-match');
  var visible=matches.filter(function(m){return filter==='favourites'?(isFollowed(m.home)||isFollowed(m.away)):filter==='finished'?m.finished:filter==='live'?m.live:true;});
  $('league-title').textContent=leagues[selection.league][0];
  var range=M.bounds(selection);
  $('round').textContent=(selection.window==='week'?range.start+' – '+range.end:selection.day)+' · '+selection.timeZone;
  $('connection').textContent=(loading?'Checking scores…':online?'Updated '+date(fetched):fetched?'Saved · '+date(fetched):'Waiting for scores');
  $('connection').classList.toggle('is-stale',!online&&!loading);$('refresh').classList.toggle('syncing',loading);
  $('count-all').textContent=matches.length;$('count-live').textContent=matches.filter(function(m){return m.live;}).length;
  $('attribution').innerHTML=selection.provider==='espn'?'Scores by <a href="https://www.espn.com/soccer/" target="_blank" rel="noopener noreferrer">ESPN ↗</a> · Unofficial feed':'Data: <a href="https://www.openligadb.de/" target="_blank" rel="noopener noreferrer">OpenLigaDB ↗</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a>';
  var groups={};visible.forEach(function(m){var day=M.localDay(m.kickoff,selection.timeZone);if(!groups[day])groups[day]=[];groups[day].push(m);});
  var html=Object.keys(groups).map(function(day){var title=new Date(day+'T12:00:00Z').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});return '<section class="match-group"><h3 class="day-heading">'+esc(title)+'<span>'+groups[day].length+' MATCH'+(groups[day].length===1?'':'ES')+'</span></h3><div class="match-grid">'+groups[day].map(function(m,i){var win=m.finished&&m.score?m.score[0]-m.score[1]:0;return '<button class="card '+(m.live?'is-live':'')+'" style="--i:'+Math.min(i,8)+'" data-match="'+esc(m.id)+'"><div class="card-top"><span class="status">'+esc(status(m))+'</span><time datetime="'+esc(m.kickoff)+'">'+esc(kickoff(m.kickoff))+'</time></div>'+team(m.home,m.score&&m.score[0],win>0)+team(m.away,m.score&&m.score[1],win<0)+'<div class="card-bottom"><span>'+(m.finished?'Match report':m.live?'Follow the action':'Match preview')+'</span><span aria-hidden="true">↗</span></div></button>';}).join('')+'</div></section>';}).join('');
  if(!visible.length)html=loading&&!raw?'<div class="match-grid" aria-label="Loading matches">'+[0,1,2,3].map(function(){return '<div class="skeleton" aria-hidden="true"></div>';}).join('')+'</div>':'<div class="empty"><strong>'+(filter==='live'?'No matches in play':filter==='favourites'?'Your teams, your matchday':filter==='finished'?'The final whistle is still to come':'A quiet day on the pitch')+'</strong>'+(filter==='favourites'?'Follow a team from any match report to see its fixtures here.':filter==='live'?'There are no source-reported live matches in this view.':filter==='finished'?'No completed matches in this date range.':raw!==null?'No fixtures returned. Try another date or competition.':'No saved scores yet. Try refreshing the feed.')+'</div>';
  // Avoid replacing cards on unchanged polls: this preserves focus and loaded crests.
  if($('matches').dataset.markup!==html){$('matches').dataset.markup=html;$('matches').innerHTML=html;imageFallbacks($('matches'));document.querySelectorAll('[data-match]').forEach(function(b){b.onclick=function(){showMatch(b.dataset.match);};});if(animateNext&&raw){$('matches').classList.remove('view-enter');void $('matches').offsetWidth;$('matches').classList.add('view-enter');clearTimeout(animationTimer);animationTimer=setTimeout(function(){$('matches').classList.remove('view-enter');},650);animateNext=false;}}
  if(focused){var replacement=Array.from(document.querySelectorAll('[data-match]')).find(function(b){return b.dataset.match===focused;});if(replacement&&replacement!==document.activeElement)replacement.focus({preventScroll:true});}
  syncNav();featured();var guide=WatchGuide.guide(selection.league,region);$('watch-summary').textContent=guide.providers.length?'Explore '+guide.providers.map(function(p){return p.name;}).join(' and ')+' coverage in '+guide.region+'.':'Find official broadcaster information for '+guide.region+'.';
 }

 function refresh(force){
  if(request)return;
  var s=Object.assign({},selection),token=generation,urls=M.endpoints(s),start=Date.now();
  loading=true;$('refresh').innerHTML='↻ <span>Checking</span>';render();
  function finish(){if(token!==generation)return;request=null;loading=false;$('refresh').innerHTML='↻ <span>Refresh</span>';render();updateDialog();}
  request=ScoreFeed.load(s,!!force,function(error,payload){
   if(token!==generation)return;
   if(error){online=false;$('notice').classList.add('error');record({at:new Date().toISOString(),selection:s,urls:urls,ok:false,error:error.message});$('notice').textContent='Refresh failed: '+error.message+'. '+(fetched?'Saved data from '+date(fetched)+' is shown.':'No saved scores for this date range.');finish();return;}
   try{
    var next=M.parse(s.provider,payload,s.day,Date.now(),s);
    var before=M.observations(matches),after=M.observations(next),hadBaseline=raw!==null;
    raw=payload;matches=next;fetched=new Date().toISOString();online=true;
    save(M.cacheKey(s),{fetchedAt:fetched,data:payload});
    record({at:fetched,selection:s,urls:urls,ok:true,durationMs:Date.now()-start,baseline:!hadBaseline,matches:after,changes:hadBaseline?M.changes(before,after):[]});
    $('notice').classList.remove('error');$('notice').textContent='Times shown in '+s.timeZone+'. Scores refresh automatically and may be delayed.';
   }catch(e){online=false;$('notice').textContent='Could not read feed: '+e.message+'. Saved data is shown.';record({at:new Date().toISOString(),selection:s,urls:urls,ok:false,error:e.message});}
   finish();
  });
 }
 function switchSelection(){
  generation++;if(request){request.abort();request=null;}if(compareRequest){compareRequest.abort();compareRequest=null;}comparison=null;
  close();matches=[];raw=null;fetched=null;online=false;loading=false;
  $('provider').value=selection.provider;$('league').value=selection.league;$('match-date').value=selection.day;$('window').value=selection.window;
  filter='all';animateNext=true;syncNav();
  $('provider').querySelector('[value="openliga"]').disabled=selection.league!=='ger.1';
  var cached=read(M.cacheKey(selection),null),exactCache=!!cached;
  if(!cached&&selection.provider==='openliga')cached={fetchedAt:window.TOUCHLINE_SNAPSHOT.fetchedAt,data:window.TOUCHLINE_SNAPSHOT.matches};
  if(cached){try{var parsed=M.parse(selection.provider,cached.data,selection.day,Date.now(),selection);if(exactCache||parsed.length){raw=cached.data;matches=parsed;fetched=cached.fetchedAt;}}catch(e){}}
  $('notice').textContent='Connecting to '+providerName(selection.provider)+'…';render();refresh();
 }
 function open(html,mode){if($('overlay').hidden)returnFocus=document.activeElement;$('dialog-content').innerHTML=html;var h=$('dialog-content').querySelector('h2');if(h)h.id='dialog-title';$('overlay').hidden=false;dialogMode=mode;document.querySelector('.workspace').inert=true;document.querySelector('.sidebar').inert=true;document.body.style.overflow='hidden';imageFallbacks($('dialog-content'));$('close').focus();}
 function close(){if($('overlay').hidden)return;$('overlay').hidden=true;document.querySelector('.workspace').inert=false;document.querySelector('.sidebar').inert=false;document.body.style.overflow='';dialogMode=null;detailId=null;if(returnFocus&&document.contains(returnFocus))returnFocus.focus();else $('health').focus();}
 function updateDialog(){if(dialogMode==='match')showMatch(detailId,true);else if(dialogMode==='health')health(true);}
 function showMatch(id,updating){
  var m=matches.find(function(x){return x.id===id;});
  if(!m){if(updating){$('dialog-content').innerHTML='<h2 id="dialog-title">Match no longer in this response</h2><p>The provider removed this match. Close to see the latest feed.</p>';}return;}
  var signature=JSON.stringify({match:m,online:online,region:region,favourites:favourites});
  if(updating&&signature===detailSignature){var stamp=$('detail-fetched');if(stamp)stamp.textContent=date(fetched);return;}
  detailSignature=signature;detailId=id;var activeTeam=updating&&document.activeElement.dataset.team,activeHref=updating&&document.activeElement.getAttribute('href'),scrollTop=document.querySelector('.dialog').scrollTop;
  var html='<div class="eyebrow">'+esc(leagues[selection.league][0])+' · '+esc(status(m))+'</div><h2>'+esc(m.home.teamName)+' vs '+esc(m.away.teamName)+'</h2><div class="dialog-score"><div class="dialog-club">'+crest(m.home)+esc(m.home.teamName)+'</div><strong>'+(m.score?m.score.join(' : '):'vs')+'</strong><div class="dialog-club">'+crest(m.away)+esc(m.away.teamName)+'</div></div>';
  if(m.shootout&&m.shootout.every(function(v){return v!==null;}))html+='<p>Penalty shootout: '+m.shootout.join(' : ')+'</p>';
  html+='<p>Kickoff '+esc(date(m.kickoff))+(m.half?' · Half-time '+m.half.join(' : '):'')+'</p><div class="follow">'+[m.home,m.away].map(function(t){return '<button data-team="'+esc(t.teamId)+'">'+(isFollowed(t)?'★ Following ':'☆ Follow ')+esc(t.teamName||t.shortName)+'</button>';}).join('')+'</div><h4>Reported events</h4><ul class="match-events">'+(m.events.length?m.events.map(function(e){return '<li><span class="event-clock">'+esc(e.clock)+'</span><span>'+esc(e.text)+(e.shootout?' (shootout)':'')+'</span></li>';}).join(''):'<li>No event details supplied by this source.</li>')+'</ul><p>'+esc(providerName(m.provider))+' · '+(online?'Fetched ':'Saved data fetched ')+'<span id="detail-fetched">'+esc(date(fetched))+'</span>.</p><p>'+(m.provider==='espn'?'The clock and status above are the latest provider report. No continuous clock is inferred.':'Source update: '+esc(m.updated||'not supplied')+' (provider-local time; timezone unspecified). No verified live clock supplied.')+'</p>'+watchHTML(selection.league);
  if(updating){$('dialog-content').innerHTML=html;$('dialog-content').querySelector('h2').id='dialog-title';}else open(html,'match');imageFallbacks($('dialog-content'));
  document.querySelectorAll('[data-team]').forEach(function(b){b.onclick=function(){var id=b.dataset.team,i=favourites.indexOf(id);if(i>=0)favourites.splice(i,1);else favourites.push(id);save('matchboard-favourites',favourites);toast(i>=0?'Team unfollowed':'Team added to Following');showMatch(m.id,true);render();};if(activeTeam===b.dataset.team)b.focus({preventScroll:true});});
  if(activeHref){var activeLink=Array.from($('dialog-content').querySelectorAll('a')).find(function(a){return a.getAttribute('href')===activeHref;});if(activeLink)activeLink.focus({preventScroll:true});}if(updating)document.querySelector('.dialog').scrollTop=scrollTop;else document.querySelector('.dialog').scrollTop=0;
 }
 function comparisonHtml(){
  if(!comparison)return '<p>For Bundesliga, compare independently fetched reports from both sources. Names and IDs remain separate; no scores are merged.</p>';
  if(comparison.error)return '<p>Comparison failed: '+esc(comparison.error)+'</p>';
  return '<p>Comparison for '+esc(comparison.day)+' in '+esc(comparison.timeZone)+'. These requests were made seconds apart; differences may reflect timing.</p>'+comparison.feeds.map(function(f){return '<h4>'+esc(providerName(f.provider))+' · '+esc(date(f.at))+'</h4><ul>'+(f.matches.length?f.matches.map(function(m){return '<li>'+esc(m.home)+' '+(m.score?m.score.join('–'):'–')+' '+esc(m.away)+' · '+esc(m.status)+'</li>';}).join(''):'<li>No matches returned for this date range.</li>')+'</ul>';}).join('');
 }
 function health(updating){
  var relevant=history.filter(function(h){return h.kind!=='comparison'&&h.selection&&M.cacheKey(h.selection)===M.cacheKey(selection);}),ok=relevant.filter(function(h){return h.ok;}).length;
  var html='<div class="eyebrow">LEARNING FROM REAL DATA</div><h2>Data lab</h2><p>'+esc(providerName(selection.provider))+' · '+esc(M.bounds(selection).start)+' to '+esc(M.bounds(selection).end)+' · '+esc(selection.timeZone)+'. The latest 100 observations stay on this device, including reported scores, clocks, events and changes. Favourites are specific to each source.</p><div class="metrics"><div class="metric"><strong>'+matches.length+'</strong><span>Matches in this view</span></div><div class="metric"><strong>'+ok+' / '+relevant.length+'</strong><span>Successful checks for this selection</span></div><div class="metric"><strong>'+relevant.reduce(function(n,h){return n+(h.changes||[]).length;},0)+'</strong><span>Changed match reports observed</span></div><div class="metric"><strong>'+matches.reduce(function(n,m){return n+m.events.length;},0)+'</strong><span>Events in latest response</span></div></div><p>Fetched '+esc(date(fetched))+'. '+(online?'Online response.':'Saved/offline response.')+' A successful fetch does not prove the score is current. Real goal latency requires a separately timestamped reference.</p><button id="export">Export observations</button>';
  if(selection.league==='ger.1')html+='<h3 class="lab-heading">Compare providers</h3><button id="compare" '+(compareRequest?'disabled':'')+'>'+(compareRequest?'Comparing…':'Compare this view')+'</button>'+comparisonHtml();
  else html+='<p>Provider comparison is available when you select Bundesliga.</p>';
  if(updating){var focused=document.activeElement.id;$('dialog-content').innerHTML=html;$('dialog-content').querySelector('h2').id='dialog-title';if($(focused))$(focused).focus();}else open(html,'health');
  $('export').onclick=function(){var output={exportedAt:new Date().toISOString(),selection:selection,sources:M.endpoints(selection),dataLicence:selection.provider==='openliga'?'ODbL-1.0':'ESPN data; no open-data licence established',checks:history,fetchedAt:fetched,latestMatches:M.observations(matches),comparison:comparison};var url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='matchboard-observations.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);};
  if($('compare'))$('compare').onclick=compare;
 }
 function compare(){
  if(compareRequest)return;var token=generation,s=Object.assign({},selection),feeds=[];
  function fetchProvider(p){var spec=Object.assign({},s,{provider:p});
   compareRequest=ScoreFeed.load(spec,true,function(error,payload){
    if(token!==generation)return;compareRequest=null;
    if(error){comparison={error:error.message};if(dialogMode==='health')health(true);return;}
    try{var parsed=M.parse(p,payload,s.day,Date.now(),s);feeds.push({provider:p,at:new Date().toISOString(),matches:M.observations(parsed)});
     if(p==='espn')fetchProvider('openliga');else{comparison={day:M.bounds(s).start+' to '+M.bounds(s).end,timeZone:s.timeZone,feeds:feeds};record({at:new Date().toISOString(),selection:s,kind:'comparison',ok:true,comparison:comparison});if(dialogMode==='health')health(true);}
    }catch(e){comparison={error:e.message};if(dialogMode==='health')health(true);}
   });if(dialogMode==='health')health(true);
  }fetchProvider('espn');
 }
 $('league').onchange=function(){selection.league=this.value;if(selection.league!=='ger.1')selection.provider='espn';switchSelection();};
 $('provider').onchange=function(){selection.provider=this.value;switchSelection();};
 $('window').onchange=function(){selection.window=this.value;switchSelection();};
 $('match-date').onchange=function(){if(!this.value||!this.validity.valid)return;selection.day=this.value;followToday=false;switchSelection();};
 function shiftDay(delta){var d=new Date(selection.day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);selection.day=M.utcDay(d);followToday=false;switchSelection();}
 $('previous').onclick=function(){shiftDay(-1);};$('next').onclick=function(){shiftDay(1);};$('today').onclick=function(){selection.day=M.localDay(new Date(),selection.timeZone);followToday=true;switchSelection();};
 document.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){setFilter(b.dataset.filter);};});
 $('nav-home').onclick=function(){setFilter('all');document.querySelector('.board').scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});};
 $('nav-follow').onclick=function(){setFilter('favourites');document.querySelector('.board').scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});};
 $('region').value=region;$('region').onchange=function(){changeRegion(this.value);};
 $('open-watch').onclick=$('watch-guide').onclick=function(){showWatch(false);};
 function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}

 $('close').onclick=close;$('health').onclick=function(){health(false);};$('refresh').onclick=function(){refresh(true);};
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'||e.keyCode===10009){if(!$('overlay').hidden){e.preventDefault();close();}return;}
  var scope=$('overlay').hidden?document:$('overlay'),items=Array.from(scope.querySelectorAll('button,a,select,input')).filter(function(x){return x.offsetParent!==null&&!x.disabled;});
  if(e.key==='Tab'&&!$('overlay').hidden){var ix=items.indexOf(document.activeElement);e.preventDefault();items[(ix+(e.shiftKey?-1:1)+items.length)%items.length].focus();return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key)<0)return;
  if(document.activeElement.tagName==='INPUT'||(document.activeElement.tagName==='SELECT'&&(e.key==='ArrowUp'||e.key==='ArrowDown')))return;
  e.preventDefault();if(e.repeat&&Date.now()-focusKeyTime<100)return;focusKeyTime=Date.now();var current=document.activeElement;if(items.indexOf(current)<0){items[0].focus();return;}
  var r=current.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,best=null,dist=Infinity;
  items.forEach(function(el){if(el===current)return;var q=el.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,vertical=e.key==='ArrowUp'||e.key==='ArrowDown',primary=vertical?dy:dx,secondary=vertical?dx:dy,sign=e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1;if(primary*sign<5)return;var cost=Math.abs(primary)+Math.abs(secondary)*3;if(cost<dist){dist=cost;best=el;}});if(best){best.focus({preventScroll:true});best.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'nearest',inline:'nearest'});}
 });
 function clock(){$('clock').textContent=new Date().toLocaleString(undefined,{weekday:'short',hour:'2-digit',minute:'2-digit'});}clock();setInterval(clock,10000);
 function poll(){if(document.hidden)return;var today=M.localDay(new Date(),selection.timeZone);if(followToday&&selection.day!==today){selection.day=today;switchSelection();}else refresh(false);}
 switchSelection();setInterval(poll,30000);
 document.addEventListener('visibilitychange',function(){if(!document.hidden)poll();});
})();
