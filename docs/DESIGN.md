# Matchboard design and interaction notes

## Direction

Quiet sports editorial design: dark forest backgrounds, muted sage panels, a pale lime accent and system typography. The original pitch mark remains the brand identifier. Club badges have a neutral contrast surface and initials when an image cannot be loaded.

## Structure

A persistent navigation rail leads to Scoreboard, Following, Where to watch and Data lab. On narrow screens the same navigation becomes a bottom bar. The header carries the saved viewing region, time and manual refresh. A featured match introduces the matchday, followed by the selected competition, date controls, filters, day-grouped cards and regional viewing entry point.

## Motion

Cards enter with a short 28ms stagger and 350ms transition. Hover and keyboard focus use a restrained lift and visible outline. Dialogs enter over 250ms. Live indicators breathe gently. These animations are removed with prefers-reduced-motion. Unchanged refresh results keep existing card nodes, image state and focus. Detail dialogs retain scroll position and focus; the close control remains sticky within long reports.

## Keyboard and accessibility

Native buttons, labels, selects, date controls and links are used throughout. Arrow navigation chooses the nearest control in the requested direction, with throttling for held keys. Tab remains available; modal Tab navigation wraps inside the dialog. Escape or the TV Return key closes it. Background regions become inert during a modal. Logos are decorative because the full club name is adjacent. Source status and toasts use status announcements.

The native date field is still dependent on the TV/browser's implementation. All remote behavior and native external service launches require physical Samsung testing. The responsive layout is not a claim that every Tizen browser supports every modern CSS enhancement; those enhancements degrade to the base layout when unsupported.

## Viewing guide

Five region choices have curated competition coverage with official source links and a research date. Unknown and expired recommendations fall back to an official directory. No per-fixture channel confirmation is implied. The viewing region and match timezone remain separate so users can research travel or another household's services without moving kickoff times.
