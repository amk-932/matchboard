# Regional football viewing research

Checked 26 October 2026. The app's curated guide is in `watch.js`. It covers the three supported competitions in Australia, United States, United Kingdom, Canada and India. Other regions receive an official broadcaster-directory link rather than an invented recommendation.

## What the guide means

A listed provider has competition-level coverage in the region. It does not confirm an individual fixture, channel, language, plan, replay entitlement or device app. Some rights are split between services, some UK fixtures are subject to blackouts, and provider packages change. Users should check the linked provider schedule. There are no subscription prices, affiliate links, automatic sign-ups or paid-data services in the app.

The chosen region affects viewing recommendations only; match dates still use the device timezone. Recommendations are dated and expire after 120 days to official-source links until researched again.

## Verified source index

### Premier League

[Official 2025–2028 broadcaster directory](https://www.premierleague.com/ar/news/3703577/premier-league-broadcast-deals-for-2025-2028) identifies Stan Sport (Australia), NBC Sports (US), Sky Sports/TNT Sports (UK), Fubo (Canada), and JioStar (South Asia). [The UK rights announcement](https://www.premierleague.com/en/news/3807882) describes separate packages and highlights rights. [Stan football](https://www.stan.com.au/watch/sport/football) confirms its Australian offering. [Premier League's US page](https://www.premierleague.com/cp/its-all-here) identifies the US platforms. [JioHotstar's publisher event](https://apps.apple.com/in/app/jiohotstar/id934459219?eventid=6761253844) identifies the Indian streaming route. These sources establish partners; individual matches still need provider listings.

### UEFA Champions League

[UEFA's broadcaster directory, updated 21 October 2026](https://www.uefa.com/uefachampionsleague/news/0253-0d82037aaedd-f371c464f919-1000--where-to-watch-the-uefa-champions-league-tv-broadcast-partners-streams/) lists the relevant partners. [Stan's competition page](https://www.stan.com.au/watch/sport/football/uefa-champions-league) provides Australian coverage information. [Paramount+](https://www.paramountplus.com/shows/uefa-champions-league/) provides the US competition hub. UEFA also lists TNT Sports/Prime Video in the UK, DAZN/OneSoccer in Canada, and Sony in the Indian subcontinent. [DAZN's rights announcement](https://dazngroup.com/press-room/dazn-canada-retains-exclusive-rights-to-uefa-club-competitions/) covers Canada through 2026/27. A service listed as a highlights partner is not offered as a full live-match service.

### Bundesliga

The Bundesliga maintains official country directories for [Australia](https://www.bundesliga.com/en/bundesliga/info/broadcasters/australia/au), [UK](https://www.bundesliga.com/en/bundesliga/info/broadcasters/united-kingdom/gb), [Canada](https://www.bundesliga.com/en/bundesliga/info/broadcasters/canada/ca), and [all regions](https://www.bundesliga.com/en/bundesliga/info/broadcasters/). Australia lists beIN; UK and Canada list multiple partners, so the app links to the official guide. The [USA Sports announcement](https://pressroom.versantmedia.com/usa-sports/press-releases/usa-sports-and-bundesliga-announce-exclusive-multi-year-us-media-rights) identifies USA Network/Fandango for English-language coverage from 2026/27, avoiding the outdated assumption of ESPN+. [ZEE's announcement](https://www.zee.com/in-the-news/z-strengthens-football-portfolio-secures-exclusive-rights-for-german-bundesliga-in-india/) identifies ZEE5/Unite8 Sports in India from 2026/27.

## What is not yet verified

- Match-by-match availability for each region and plan.
- Samsung app identifiers or reliable deep links directly into a fixture.
- Regions outside the five researched choices.
- Automatic rights updates: this is a dated editorial dataset, not a paid television-listings feed.

## Team logo research

`data/team-catalog.json` contains the ESPN team IDs, names, logo references and source endpoints for all 20 Premier League teams, 18 Bundesliga teams and 36 Champions League participants returned at collection time. Teams appearing in more than one competition are intentionally repeated per catalog. The UI loads HTTPS images only from `a.espncdn.com`, with no-referrer requests, decorative image semantics and initials on load failure. Logos are remote references, not redistributed image files. Some OpenLigaDB names are matched to the catalog using explicit aliases; this does not merge score records or provider IDs.

Club marks remain the property of their owners. Neither the app's MIT licence nor the OpenLigaDB data licence grants trademark/image rights. The repository records references and the prototype's display behavior without claiming an open licence for badges. Team membership and badge URLs may change; rerun `npm run collect:teams` to refresh the catalog.
