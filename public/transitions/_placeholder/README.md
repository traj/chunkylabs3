# Synthetic placeholder transitions

**These are NOT real creative assets.** They are auto-generated test clips that stand in for
the real station-to-station video transitions so the play-through transition engine can be
built and exercised. **They will be replaced by real encodes per the asset track.** Do not
ship them.

> **STATUS (2026-06-23):** the four-walls navigation pivot re-cut the shot list from the
> linear chain in the table below into **outbound clips from the counter hub** (see
> `docs/asset-pipeline-spec.md`). **Real clips now live** for `door`, `counter`, and the
> Mixes wall (`mixes/`, on the `left-bins` station) — each in its own
> `public/transitions/<id>/` dir, NOT here. This `_placeholder/` set **stays** as the
> fixture/encoder for the walls still unbuilt (Crate = `right-bins`, Vibes = `mixtape-shelf`).
> The table below documents the synthetic fixture's own naming, not the final shot list.

Each clip is an animated `testsrc2` pattern (for obvious motion = play-through) with a
burned-in label panel naming the transition. One clip per transition, named by the
destination station id (matching `STATIONS` in `src/data/stations.ts`):

| File base        | Transition              |
| ---------------- | ----------------------- |
| `door`           | street → door           |
| `counter`        | door → counter          |
| `left-bins`      | counter → left bins     |
| `right-bins`     | left bins → right bins  |
| `mixtape-shelf`  | right bins → mixtape    |

For each base: `<base>.av1.mp4`, `<base>.h264.mp4`, `<base>.poster.jpg`.

## Encode profile (matches the research doc §Q1)

- Container: MP4 for both codecs.
- **AV1** — SVT-AV1 (`libsvtav1`), Profile 0, 8-bit (`yuv420p`). Exact codec string: **`av01.0.08M.08`**.
- **H.264** — `libx264`, Main profile, level 4.0 (1080p-capable, broadly compatible). Exact codec string: **`avc1.4D4028`**.
- 1920×1080, 30fps, ~3s, GOP 60 (`-g 60`).
- These exact codec strings are what the engine puts in the ordered `<source>` markup
  (`src/components/stations/StationTransition.tsx`).

> **GOP is deliberately NOT keyframe-dense.** These are **play-through** clips, played once
> per enter and looped — never scrubbed. Dense/all-keyframe GOPs are the scrub path we do
> not use (see CLAUDE.md "Never do this" and research §Q3).

## Regenerating

Requires `ffmpeg` with `libsvtav1` + `libx264`, and Node.

```bash
bash encode.sh
```

- `generate-labels.mjs` — dependency-free Node script; renders the burned-in label PNGs.
- `encode.sh` — generates labels, then runs the two ffmpeg encodes + poster per transition.

## When real assets land (asset-track checklist)

- Encode AV1 with **SVT-AV1, not libaom** (sane encode times); keep **H.264/MP4 as the
  mandatory floor** — never AV1-only.
- Use **file-accurate codec strings** per encode (parse `av1C`/`avcC`, don't assume).
- On-device QA before shipping: non-AV1 iPhone (14 / SE / standard-15) **and** an AV1 iPhone
  (15 Pro / 16) **and** a mid-tier Android; verify autoplay under Low Power Mode and inside
  Instagram/TikTok/Facebook in-app WKWebViews.
