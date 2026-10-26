(function(root){
 'use strict';
 var checked='2026-10-26';
 var sources={pl:'https://www.premierleague.com/ar/news/3703577/premier-league-broadcast-deals-for-2025-2028',ucl:'https://www.uefa.com/uefachampionsleague/news/0253-0d82037aaedd-f371c464f919-1000--where-to-watch-the-uefa-champions-league-tv-broadcast-partners-streams/',bund:'https://www.bundesliga.com/en/bundesliga/info/broadcasters/'};
 var regions={AU:'Australia',US:'United States',GB:'United Kingdom',CA:'Canada',IN:'India',OTHER:'Other region'};
 function service(name,url,note){return {name:name,url:url,note:note||'Check the provider’s match schedule and subscription requirements.'};}
 var entries={
 AU:{'eng.1':[service('Stan Sport','https://www.stan.com.au/watch/sport/football','Premier League coverage. Stan Sport add-on and base plan required.')],'ger.1':[service('beIN SPORTS CONNECT','https://connect-au.beinsports.com/en/competition/bundesliga','Bundesliga coverage. Also available through selected beIN distribution partners.')],'uefa.champions':[service('Stan Sport','https://www.stan.com.au/watch/sport/football/uefa-champions-league','Champions League coverage. Stan Sport add-on and base plan required.')]},
 US:{'eng.1':[service('Peacock / NBC Sports','https://www.peacocktv.com/sports/premier-league','Matches are split across Peacock and NBC networks; check this fixture’s listing.')],'ger.1':[service('USA Network / Fandango','https://www.usanetwork.com/usa-insider/how-to-watch-bundesliga-on-usa-network-streaming-on-fandango','English-language coverage for 2026/27. Check the guide for the platform carrying this fixture.')],'uefa.champions':[service('Paramount+','https://www.paramountplus.com/shows/uefa-champions-league/','English-language Champions League streaming. Subscription required.')]},
 GB:{'eng.1':[service('Sky Sports','https://www.skysports.com/premier-league','Selected live matches; UK blackout restrictions apply.'),service('TNT Sports','https://www.tntsports.co.uk/football/premier-league/','Separate match selection. Check the exact fixture before subscribing.')],'ger.1':[service('Official UK broadcaster guide','https://www.bundesliga.com/en/bundesliga/info/broadcasters/united-kingdom/gb','Lists Sky Sports, Prime Video and other partners. Match coverage varies.')],'uefa.champions':[service('TNT Sports','https://www.tntsports.co.uk/football/champions-league/','Selected Champions League coverage.'),service('Prime Video','https://www.amazon.co.uk/gp/video/storefront','Selected Champions League matches; not every fixture.')]},
 CA:{'eng.1':[service('Fubo Canada','https://www.fubo.tv/','Premier League rights holder in Canada. Check Canadian plans and the fixture schedule.')],'ger.1':[service('DAZN / OneSoccer','https://www.bundesliga.com/en/bundesliga/info/broadcasters/canada/ca','Official Canadian partners. Match selection varies by service.')],'uefa.champions':[service('DAZN Canada','https://www.dazn.com/en-CA/','UEFA coverage for the 2026/27 season.'),service('OneSoccer','https://onesoccer.ca/','Listed UEFA partner; check which fixtures are included.')]},
 IN:{'eng.1':[service('JioStar / JioHotstar','https://www.hotstar.com/in/sports','JioStar is the regional rights holder. Check the local app’s current schedule.')],'ger.1':[service('ZEE5 / Unite8 Sports','https://www.zee5.com/','Bundesliga coverage from 2026/27. Check the local sports schedule.')],'uefa.champions':[service('SonyLIV','https://www.sonyliv.com/','Sony is UEFA’s Indian subcontinent partner. Check your local package.')]}
 };
 var extra={
 'AU:eng.1':'https://www.stan.com.au/watch/sport/football',
 'AU:ger.1':'https://www.bundesliga.com/en/bundesliga/info/broadcasters/australia/au',
 'US:ger.1':'https://pressroom.versantmedia.com/usa-sports/press-releases/usa-sports-and-bundesliga-announce-exclusive-multi-year-us-media-rights',
 'IN:ger.1':'https://www.zee.com/in-the-news/z-strengthens-football-portfolio-secures-exclusive-rights-for-german-bundesliga-in-india/'
 };
 function guide(league,region,now){
  var date=now?new Date(now):new Date(),age=(date.getTime()-Date.parse(checked+'T00:00:00Z'))/86400000;
  var valid=['eng.1','ger.1','uefa.champions'].indexOf(league)>=0;
  var providers=valid&&entries[region]?entries[region][league]||[]:[];
  // Broadcast rights are seasonal. Expire the curated list rather than imply it is evergreen.
  var stale=age>120||date.getUTCFullYear()>2027;
  return {region:regions[region]||regions.OTHER,checkedAt:checked,providers:stale?[]:providers,stale:stale,scope:'Competition coverage; this match is not confirmed.',
    source:valid?sources[league==='eng.1'?'pl':league==='ger.1'?'bund':'ucl']:sources.pl,additionalSource:extra[region+':'+league]||null};
 }
 var api={guide:guide,regions:regions,checkedAt:checked};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WatchGuide=api;
})(typeof window!=='undefined'?window:globalThis);
