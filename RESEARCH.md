# Free football data: GitHub research

Checked 26 October 2026 (Australia/Sydney). Research only: the scoreboard's provider has not been changed and no third-party repository was installed or executed.

## Recommendation

Explore an optional ESPN provider adapter for the prototype, informed by Public-ESPN-API and TeamTracker. Keep OpenLigaDB as the openly licensed Bundesliga option. Use openfootball for fixtures/results where daily or slower upstream updates are acceptable. A reachable endpoint is not a data redistribution licence; establish permitted use before publishing the TV app.

## Repositories inspected

| Repository | What it actually supplies | Assessment |
| --- | --- | --- |
| [pseudo-r/Public-ESPN-API](https://github.com/pseudo-r/Public-ESPN-API) | Unofficial ESPN endpoint documentation and reference code; no hosted data service. MIT code. | Useful candidate for our next experiment. Soccer documentation covers Premier League, Bundesliga, UCL and more. Explicitly distinguishes public reachability from reuse permission. |
| [vasqued2/ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) | Home Assistant integration using ESPN and other score APIs, with native EPL, Bundesliga and Champions League support. | Concrete example of this approach in a working application; learn from its integration rather than installing Home Assistant into the TV app. |
| [openfootball/football.json](https://github.com/openfootball/football.json) | Public-domain fixtures/results for numerous leagues. | JSON generated daily at 05:00 UTC, but upstream text datasets have no automatic daily update. Useful for fixtures, history and fallback; not live scores. |
| [rezarahiminia/livescoreFootball](https://github.com/rezarahiminia/livescoreFootball) | Community-hosted API plus Node/MongoDB code. README declares ISC; GitHub metadata did not identify a licence. | Public service worked in probes. Self-hosting the API alone does not collect scores: a separate external listener writes the database. README prioritises England and Spain; do not assume all advertised competitions are populated. Check licence file and upstream data permission before copying/distributing. |
| [Ryzellx/football-live-api](https://github.com/Ryzellx/football-live-api) | MIT TypeScript server, described as FotMob-powered, with broad league endpoints and caching. | Promising features in documentation, but hosted match endpoint returned HTTP 402 DEPLOYMENT_DISABLED. This does not establish that self-hosted source is broken or that the author charges for data. Not validated for use. |
| [abotapi/sofascore-scraper](https://github.com/abotapi/sofascore-scraper) | MIT examples invoking a hosted Apify scraper. | README explicitly says pay per result, with free monthly credit. Not an assured zero-cost independent feed. |
| [profilsoftware/open-matchroom](https://github.com/profilsoftware/open-matchroom) | MIT match-centre UI/backend with admin entry of events and seeded demo data. | Useful product reference, not evidence of an included automatic major-league data feed. |

## Actual network probes

No credentials, API keys, subscription or payment used. These are one-off access/schema checks, not a reliability benchmark.

| Request | Result |
| --- | --- |
| ESPN `soccer/eng.1/scoreboard` | HTTP 200; 5 events, 2026/27 season metadata. Returned events were dated 25 October, so the default endpoint must not be presented as necessarily today's fixtures. |
| ESPN `soccer/ger.1/scoreboard?dates=20261025` | HTTP 200; 2 events with teams, scores and completed status. |
| ESPN `soccer/uefa.champions/scoreboard?dates=20261021` | HTTP 200; 9 events with teams, scores and completed status. |
| ESPN scoreboards with `dates=20261020-20261026&limit=100` | All three attempts returned HTTP 400. Retried simplified default/single-date requests successfully. Range-query support remains unverified. |
| `https://worldcup26.ir/get/soccer/meta` | HTTP 200; service reports 35 competitions with matches, 2,628 stored matches, and a recent successful sync. These are service-reported counts, not an independent league-by-league audit. |
| `https://worldcup26.ir/get/soccer/eng.1/scoreboard?dates=20261025` | HTTP 200; 5 events. |
| `https://football-live-api.vercel.app/api/matches/today` | HTTP 402; body reports Payment required / DEPLOYMENT_DISABLED. |

ESPN scoreboard base: `https://site.api.espn.com/apis/site/v2/sports/`.

The two Bundesliga scores checked matched the existing OpenLigaDB snapshot (Hoffenheim 3–0 Leverkusen, Freiburg 1–3 Bayern). This is a small consistency check, not proof of either provider's independence or accuracy. No ongoing match was observed; live goal latency, corrections and clock updates remain untested. Browser CORS access and Samsung TV access to these alternative providers have not been tested.

## Proposed next experiment

1. Separate data collection from the UI with a common match model and explicit provider label.
2. Test single-date requests for EPL, Bundesliga and UCL; preserve kickoff timezone, home/away order and status.
3. During a live match, collect modestly spaced observations and compare goal changes, clock updates, corrections and outages.
4. Keep provider-specific IDs and never silently combine scores from different sources.
5. Keep cached data visibly dated. Add a paid, supported provider later only if reliability or distribution requirements warrant it.

Sources: repository READMEs and the [ESPN soccer endpoint reference](https://github.com/pseudo-r/Public-ESPN-API/blob/main/docs/sports/soccer.md), retrieved using the GitHub connector; public endpoint responses tested directly. Claims about hosting and coverage can change.

## Implementation follow-up — 26 October 2026

The recommended experimental integration is now implemented: common provider model, explicit ESPN league/date requests, separate provider/date caches and team IDs, source-labelled details and clocks, local observations with score/event change detection, and independent Bundesliga comparison. The browser confirmed ESPN access and both-provider comparison. One-off normalized observations for EPL, Bundesliga and UCL were saved under `data/observations/`. Eighteen automated tests pass. No paid service or unattended monitoring was enabled. Live match latency and actual Samsung hardware/home-screen tests remain pending external test conditions.

## Design and regional-guide follow-up

The v0.3 interface adds sidebar/bottom navigation, date-grouped cards, a featured fixture, restrained animation, reduced-motion handling, unchanged-refresh focus preservation, complete team catalogs and badge references. The curated region guide and exact primary-source links are documented in BROADCAST-RESEARCH.md. Thirty-four tests pass. The app's code, research and attributed samples are prepared for the private amk-932/matchboard repository. Badge images remain remote; no open licence is claimed for them. The watching guide is competition-level and does not claim fixture-by-fixture streaming availability.
