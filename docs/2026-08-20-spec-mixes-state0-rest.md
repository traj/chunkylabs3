# Spec — Mixes State 0 (rest state), frozen 2026-08-20

_Build source of truth: Figma page 06, frame `Mixes · State 0 — REST` (node 35:3), file ffGlWMJ2GPhhYZyAiHQjJX. This doc mirrors the frozen values for CC. Supersedes the "featured tapes on top tier" State 0 wording in 2026-08-20-spec-mixes-flow-and-playback-architecture.md; all other parts of that spec stand._

## Concept

Featured mixes are DOM `<img>` covers racked on the LEFT DISPLAY WALL of the Mixes plate, each occluding a baked face-out record 1:1. Collage register: no UI chrome beyond the treatment below. Covers fade in per the fade-in contract (after `atRest`, staggered ~120ms; dissolve before any tween).

## Geometry (1920×1080 plate space, plate = design/plates/plate-mixes.png)

- Board seat lines (cover BOTTOM edges): y = 246 (row 1) · 365 (row 2) · 484 (row 3)
- Cover size: 104×104 (uniform; 2px stroke renders OUTSIDE this box)
- Positions (x, y — final, Al B-placed):

| cover | file (content/harvest/art/tracks/) | x | y | rotation |
|---|---|---|---|---|
| sugar-cookies-1 | sugar-cookies-volume-1.jpg | 366 | 142 | 0 |
| age-of-love | age-of-love-mix.jpg | 489 | 142 | 0 |
| housetape-2025 | housetape-2025.jpg | 240 | 261 | 0 |
| storm | storm.jpg | 365 | 261 | 0 |
| jan2k | jan2k.jpg | 489 | 261 | −0.34° |
| salsa-01 | salsa-01-2002.jpg | 242 | 380 | −0.58° |
| live-in-bk | live-in-bk-2019.jpg | 488 | 380 | 0 |

- Reserved empty slots for VIEW ALL divider card (design TBD): row1-col2 (~x240) and row3-col3 (~x365).
- Positions are percentages of the plate's object-cover box at implementation time, not viewport px — anchor to the same box the video/still uses.

## Rest treatment (locked)

```css
border: 2px solid #fff;            /* outside the 104px box */
box-shadow: 0 4px 14px 3px rgba(36, 18, 0, 0.7);
border-radius: 0;                  /* site law */
```

## Layer order (bottom → top)

plate/video · covers · scrim (shipped StationFrame gradient: `linear-gradient(to top, rgba(0,0,0,.7), rgba(0,0,0,.2) 50%, rgba(0,0,0,.4))`) · corner chrome (TR wordmark 45%, BL nav pad idle 30%, BR mini-player when built, TL empty).

## Open (not in this spec)

- Photographic grade recipe for covers (warm tint etc.) — pending comp v2 verdict.
- Hover: intent = glow bloom outside stroke + 2–3px lift + deepened shadow — values pending comp v2.
- Click behavior: opens the wall's browse/detail flow per the flow spec (State 1/2 docs).
- Curation: the seven above are placement-confirmed, not editorially confirmed.
