# Matchboard

A football companion designed for the living-room screen: current scores, favourite teams, club badges, match reports and regional viewing guides. Built with plain HTML, CSS and JavaScript, with no subscription service or build dependencies.

## Run locally

Requires Python 3 for the preview and Node 18+ for the collector scripts and tests.

```sh
npm start
```

Open **http://127.0.0.1:8765/**. Alternatively run `python3 -m http.server 8765 --bind 127.0.0.1` from this folder. Network access is required for current scores and remote club badges.

## What is included

- Premier League, Bundesliga and UEFA Champions League, using experimental ESPN access. OpenLigaDB is also selectable for Bundesliga.
- Recent-and-upcoming seven-day view, or one local day. Date filtering and kickoff times use the device timezone, including daylight saving.
- All-matches, live, results and followed-team filters. Favourites stay on the device and are specific to the data provider.
- Full team names and remotely referenced badges, backed by complete collected catalogs: 20 Premier League, 18 Bundesliga and 36 Champions League teams. These counts include clubs appearing in more than one competition. Failed images fall back to initials.
- A featured match, date-grouped score cards, event reports, winner highlights and reported match clocks.
- Region selection for Australia, United States, United Kingdom, Canada and India. Other regions get an official broadcaster-directory link. Viewing region does not change the timezone.
- Soft card and dialog transitions, directional keyboard navigation, visible focus, preserved focus on unchanged polls, and reduced-motion support. Compact screens use bottom navigation; TV-sized layouts use a sidebar and larger type.
- Data lab with local observations, score/event change detection, JSON export, and independent Bundesliga provider comparison.

Regional recommendations establish competition coverage, not the availability of an individual fixture, plan or language. Check the linked service's schedule before subscribing. Guide entries are dated 26 October 2026 and expire to official-source links after 120 days. No paid subscription is created by this app.

## Navigation

Use mouse/touch, Tab/Shift+Tab, or arrow keys and Enter. Select boxes use up/down to change selection and left/right to leave. Native date inputs retain their normal keyboard behavior. Escape/Return closes a dialog and restores focus. Following, Where to watch and Data lab are reachable from the navigation rail or compact bottom bar. A real Samsung remote still needs device testing.

## Refresh and accuracy

Checks run every 30 seconds while the app is visible, and on returning to it. Current/adjacent UTC-day requests can be reused for 15 seconds; other dates for five minutes. Refresh bypasses response caches. Date-window requests run with a maximum of three concurrent requests. Failure of one date fails the view update so an incomplete window is not presented as complete. Saved responses remain visibly dated when refresh fails.

A successful request is not proof of an up-to-date upstream score. Clocks are reported by the source, never simulated. Scheduled placeholder zero scores are hidden. OpenLigaDB past kickoff times alone do not mean live. Team and match IDs remain provider-specific; scores from different providers are never silently merged.

No background daemon, unattended scheduler, advertising tracker, external font or paid hosting is installed. Preferences and observations use browser local storage. The last 100 observations are kept locally; exports are initiated by the user.

## Tests and data collection

```sh
npm test
npm run collect -- --league eng.1 --date 2026-10-25
npm run collect -- --league uefa.champions --date 2026-10-21
npm run collect -- --league ger.1 --date 2026-10-25 --compare
npm run collect:teams
```

The command-line collector uses explicit UTC dates and saves timestamped observations under `data/observations/` (excluded from version control). The older `scripts/collect.py` is a one-off OpenLigaDB collector. Team collection regenerates `data/team-catalog.json` and its browser-loadable companion.

**34 tests pass.** Tests cover score/status interpretation, local dates and daylight saving, request cancellation, deduplication, forced refresh, complete date-window loading, logo-origin validation, full team catalogs, region mappings and expired broadcaster information.

Browser checks confirmed Premier League reports, Champions League data, both Bundesliga sources, region switching, Following navigation, and loaded badges. Layouts were inspected at 1920 × 1080 and a 390px compact width with no horizontal overflow. This is browser validation, not physical TV certification. No live-goal latency benchmark has been completed.

## Project map

| File | Purpose |
| --- | --- |
| `index.html`, `style.css`, `app.js` | Interface, responsive layout, motion and navigation |
| `model.js`, `feed.js` | Provider normalization, date windows and request handling |
| `watch.js` | Dated regional viewing guide |
| `data/team-catalog.*` | Club names, IDs and badge URL references |
| `data/snapshot.js`, `data/matchday.json`, `data/season.json` | Original attributed OpenLigaDB samples |
| `scripts/` | One-off data and team collectors |
| `tests/` | Dependency-free Node tests |
| `config.xml` | Initial Tizen TV web-app manifest |
| `RESEARCH.md` | Free football data and GitHub repository research |
| `BROADCAST-RESEARCH.md` | Regional viewing sources, limitations and logo research |
| `docs/` | Design decisions and verified interface screenshots |

## Samsung status

The manifest targets Tizen 6.0+ provisionally and permits the data and image origins used by the prototype. Tizen Studio is not installed in this workspace. This has not been packaged, signed, installed or tested on a physical TV. Generate proper application/package identifiers and your Samsung development certificate before packaging.

This is a foreground scoreboard. Smart Hub preview, persistent background scores over other apps, screensaver replacement, native streaming-app launches and match deep links are not implemented. Home-screen access remains a model-specific feasibility task. Browser exports and external provider links may behave differently on a TV.

## Sources, rights and cost

Original application code and logo: MIT (LICENSE). OpenLigaDB data: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) with [OpenLigaDB attribution](https://www.openligadb.de/). ESPN-derived data and badge references are excluded from the software licence; no open-data or club-image licence is asserted. Club marks belong to their respective owners. The app displays remote images from the approved ESPN image origin; it does not redistribute a badge image pack.

The free ESPN integration is unofficial, informed by [Public-ESPN-API](https://github.com/pseudo-r/Public-ESPN-API) and the approach used by [TeamTracker](https://github.com/vasqued2/ha-teamtracker). No third-party repository code was installed or copied. Public reachability does not establish data redistribution permission; settle permitted use before publishing the app.

No paid service is enabled. Viewing services may require their own subscriptions, clearly indicated in the guide. Future paid data integrations should protect keys on a server after choosing a provider and budget.
