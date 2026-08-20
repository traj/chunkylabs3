# Design plates — canonical rest-state stills

One color-correct, full-native-resolution PNG per **rest state** (the held frame the visitor
actually stands and looks at), extracted from the real shipped footage. These are the canonical,
color-managed reference stills for design work (Figma / Pencil / DD) — a stable replacement for
ad-hoc screenshots.

**All plates: 1920×1080, PNG, rgb24 (full-range sRGB).**

## Rest states = the 6 stations

The rest-state set is enumerated from the engine's own source of truth, `src/data/stations.ts`
(`STATIONS` + the edge resolver `resolveTransition`), **not** from filenames. The engine defines
exactly six stations, and every station is a rest state — there are no others:

| Plate | Station (id) | Facing | Rest state is… |
| --- | --- | --- | --- |
| `plate-street.png` | The Street (`street`) | exterior | storefront, wide (entry) |
| `plate-door.png` | The Door (`door`) | exterior | storefront, close (entry) |
| `plate-counter.png` | The Counter (`counter`) | N (hub) | the clerk's counter |
| `plate-mixes.png` | Mixes (`left-bins`) | W (left) | the Mixes wall |
| `plate-crate.png` | Crate (`right-bins`) | E (right) | the Crate wall |
| `plate-vibes.png` | Vibes (`mixtape-shelf`) | S (ahead) | the Vibes wall |

Station **ids** keep their scaffold names (`left-bins`/`right-bins`/`mixtape-shelf`); the plates
are named by the **display wall** (Mixes/Crate/Vibes) per the task. The id→wall rename is a
separate deferred thread (see `stations.ts`).

## Color contract

The shipped H.264 clips are **untagged** in the bitstream (`color_space/transfer/primaries =
unknown`; the AV1 renditions carry only `color_range=tv`). The *intended* contract — stated in
`public/transitions/_placeholder/encode.sh` — is **BT.709** for matrix + primaries + transfer,
**limited (tv)** range. Chrome renders untagged HD (≥720p) content as BT.709, so 709 is both the
authored intent and what the visitor actually sees.

That untagged state is exactly the documented hazard: an unpinned decode lets ffmpeg **guess**
the matrix (it picks BT.601 for these files) while the browser uses BT.709 — a real, measured
color divergence (see `encode.sh`, and the session note "untagged→BT.601/ffmpeg, BT.709/Chrome").
Extraction therefore **pins the matrix explicitly** — no default-matrix conversion:

```
scale=in_range=tv:in_color_matrix=bt709:out_range=pc,format=rgb24
```

- `in_color_matrix=bt709` — decode YCbCr→RGB with the **709** matrix (not ffmpeg's guessed 601).
  Measured impact vs. the naive default: PSNR ≈ 37–43 dB, red channel most shifted — i.e. the
  guess is visibly wrong, the pin is necessary.
- `in_range=tv → out_range=pc` — expand studio/limited luma to full-range for the PNG.
- Output is full-range sRGB RGB (BT.709 and sRGB share primaries).

**No transfer re-curve.** `zscale` (libzimg) is unavailable in the local ffmpeg 8.1.1 build, so
swscale is used. A literal BT.709→sRGB *transfer* recurve (tested via the `colorspace` filter)
lifts mean luma **85 → 96 (~13%, PSNR ≈ 25 dB) — a large, visible brightening** that does **not**
match how the browser presents the SDR footage. Browsers show 709 SDR video without that gamma
lift, so re-curving would make the plates diverge from the shipped look. The plates therefore keep
the encoded transfer (709 ≈ sRGB by the standard SDR-on-sRGB-display convention), which matches
the browser — confirmed by the counter verification below.

## Video-derived plates (extracted held final frames)

Method: seek near the end (`-sseof -2`) and let `-update 1` overwrite until EOF, leaving the
**last decoded frame** (the held "you are here" frame). Verified bit-exact against an explicit
last-index `select` (PSNR = inf). Source = the **H.264** rendition (the mandatory floor and the
iOS-majority path; content is identical to the AV1 rendition).

Full command per clip:

```
ffmpeg -y -sseof -2 -i <SOURCE> \
  -vf "scale=in_range=tv:in_color_matrix=bt709:out_range=pc,format=rgb24" \
  -update 1 design/plates/<PLATE>.png
```

| Plate | Source clip | Frame | Why this clip |
| --- | --- | --- | --- |
| `plate-counter.png` | `public/transitions/counter/counter.h264.mp4` | last (index 191 of 192) | `counter.transitionIn` — the door→counter push-in; its held frame **is** the counter rest. |
| `plate-mixes.png` | `public/transitions/mixes/mixes.h264.mp4` | last (index 23 of 24) | `left-bins.transitionIn` — the counter→Mixes quarter-turn; held frame is the Mixes wall. |
| `plate-crate.png` | `public/transitions/crate/crate.h264.mp4` | last (index 23 of 24) | `right-bins.transitionIn` — the counter→Crate quarter-turn; held frame is the Crate wall. |
| `plate-vibes.png` | `public/transitions/cv-mixes/cv-mixes.h264.mp4` | last (index 23 of 24) | See note — the engine's representative counter→Vibes arrival. |

### Note — Vibes has no single stable rest frame

Vibes (`mixtape-shelf`) is **not** reached by its own `transitionIn` (the direct `vibes.*`
push-in is retired and never resolves). It is reached by:

- **counter → Vibes**: a chained express, `EXPRESS_EDGES["counter->mixtape-shelf"]`, which the
  controller rolls 50/50 between `cv-mixes` and `cv-crate`;
- **Mixes/Crate → Vibes** (the ring): `FORWARD_EDGES` `mixes-vibes` / `crate-vibes`.

These four arrivals were generated separately and land on **visibly different** framings of the
Vibes wall — measured last-frame divergence is only PSNR ≈ 20–22 dB between them (i.e. the "Vibes
rest state" is not pixel-stable; half of hub arrivals even land on `cv-crate`, not `cv-mixes`).
The canonical plate uses **`cv-mixes`**, which is what `resolveTransition("counter",
"mixtape-shelf")` returns as the deterministic representative (`EXPRESS_EDGES` side[0]) for the
primary hub→Vibes trip. This divergence is a design observation surfaced by the extraction, **not
fixed here** (out of scope for this task).

## Entry plates (composited masters — NOT re-derived from video)

The street and door rest states already exist as crisp composited masters (video base frame +
the `design/door-layer.pen` marks baked on by `design/reshoot/compose_reshoot.py`). Per the task,
these are **copied verbatim** from their PNG masters — never re-extracted from video (the walk-up
clip is a soft in-between; the masters are the sharp plate the store cross-dissolves to). The
runtime `still` JPEGs in `public/stills/` are q94 exports of these same masters; the plates copy
the lossless PNG masters.

| Plate | Copied from | Rest state |
| --- | --- | --- |
| `plate-street.png` | `design/reshoot/out0-composited.png` | wide storefront (street rest / walk-up first frame) |
| `plate-door.png` | `design/reshoot/out1-composited.png` | close storefront (door held rest frame) |

## Verification

`plate-counter.png` was verified against reality: the site was run locally (`npm run dev`) and
the browser's own decode of the counter clip's held final frame was compared to the plate at full
native resolution.

Method note: the comparison is against the **raw decoded final frame**, not a screenshot of the
composited store scene — on purpose. The store paints a **scrim gradient** over the video
(`StationFrame.tsx`, the `from-black/70…` overlay), which is UI, not part of the rest-state plate;
screenshotting the scene would diverge by the scrim. So the counter clip was decoded in-browser
(same origin → untainted canvas), seeked to its final frame (`currentTime = 7.979s`, i.e. frame
191 of 192 — the held rest), drawn to a 1920×1080 canvas, and diffed pixel-for-pixel against the
plate loaded into a second canvas.

**Result — PASS (near-identical):**

| Metric | Value |
| --- | --- |
| Seeked to | 7.979 s (frame 191 / 192 — the held final frame) |
| Mean abs diff | **0.72 / 255** (R 0.74 · G 0.53 · B 0.90) |
| PSNR | **46.8 dB** |
| Pixels differing > 16/255 | **0.00 %** |

The residual (< 1 code value) is decode/rounding noise, far below any visible threshold; the plate
also passed an eyeball check (crisp counter + turntables, correct warm interior grade, no
wrong-matrix color cast). This empirically confirms the color pipeline: the transfer-recurve
variant would have diverged ~13 % in luma (PSNR ≈ 25 dB) and failed — the matrix-only conversion
matches the browser to within 0.7/255.

_(Browser note: two Chrome instances were connected; the first was a LAN-relayed browser whose
input injection and media pipeline were throttled, so the check ran on the second. Both reach the
dev server over the LAN IP, not `localhost`.)_
