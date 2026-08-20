# Figma export (html.to.design, File tab)

Standard for this project. Design lives in the `.dc.html` comps; each **approved** comp gets a throwaway `-figma.html` twin committed to `docs/reference/` and imported through html.to.design's **File** tab. No public URLs.

## When
On approval only. Twins are not maintained — if the design moves, the old twin is stale and gets regenerated, not patched.

## Import-safe substitutions (why the twin exists)
| In the design | In the twin |
| --- | --- |
| `backdrop-filter: blur(...)` | flat rgba fill sampled to match the blurred result; blur reapplied Figma-side |
| grain overlay (`feTurbulence` + `mix-blend-mode`) | dropped |
| `mix-blend-mode`, `clip-path` | dropped, or baked into a PNG |
| rotated / transformed text | removed (transforms outline or shift text on import) |
| canvas chrome: turn intro, id badges, comp captions | removed |
| covers as CSS gradients | real `<img>` elements so they land as fillable rectangles |

Geometry, type, color, borders and text content are kept verbatim — the twin should measure the same as the comp.

## Layer naming (component priority)
Every object carries a semantic class; html.to.design uses it as the layer name.

`panel-browse`, `panel-detail`, `row-default`, `row-nowplaying`, `player-mini`, `tabs`, `btn-primary`, `btn-secondary`, `tag-nowplaying`

Supporting names in use: `row-hover`, `tag-play`, `tag-playlist`, `cover-thumb`, `plate-photo`, `row-list`, `row-title`, `row-meta`, `panel-header`, `detail-title`, `detail-meta`, `detail-actions`, `btn-playpause`, `scrubber`, `embed-slot`, `time-elapsed`, `time-total`.

## File layout
One twin per delivery, each comp a top-level `div` named `comp-<id>-<slug>` sized exactly to its frame (1600×900 unless stated). Assets sit beside the HTML (`wall.png`).

## Figma-side finishing (handled in-house)
Background blur effects, component/variant promotion, auto-layout, text-style and color-style binding.

## Current twins
- `mixes-player-detail-v5-figma.html` — 5A player alone, 5B gatefold detail, 5C playlist detail. Approved 20 Aug 2026.
