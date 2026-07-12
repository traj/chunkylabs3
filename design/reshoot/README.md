# Entry reshoot package — door-layer composited onto out0 / out1

The DOM sticker/door-CTA layer designed in `design/door-layer.pen` is **baked into
the two entry rest stills** here, so the walk-up clip can be re-rolled with the
stickers already on the glass (no runtime DOM layer needed for the reshoot pass).

- `out0-composited.png` — **start pin** (WIDE street rest frame + walk-up first frame).
- `out1-composited.png` — **end pin** (CLOSE canonical storefront + DOOR held rest frame).

Both are 1920×1080. Regenerate with `python3 design/reshoot/compose_reshoot.py`
(needs Pillow + numpy). The recipe below is **unchanged** — only the pins were rebuilt.

**Source of truth = `design/door-layer.pen`** (frame `bi8Au` = door-station). Element
geometry is transcribed 1:1 from that frame — nothing is eyeballed. The compositor
reuses the review-render workflow (`design/review/compose_review.py`): Pencil anchors
the pre-rotation bounding-box **top-left corner** at `(x, y)` and rotates **CCW about
that corner**; per-layer opacity and the outer drop shadow are reproduced identically.

---

## Roll 1 rejected → photometric harmonization

**Roll 1 of the walk-up reshoot was REJECTED at the frame-sweep gate:** the take
warped / re-rendered instead of tweening and never converged on the end pin
(final-frame mean abs diff ≈30 vs `out1-composited`). **Diagnosis:** the pins were
internally inconsistent — crisp, brightly/neutrally-graded PNG elements pasted onto
soft, dim, warm-graded video frames. Cinema Studio reads that seam as error and
"fixes" it by warping the letterforms.

**Fix:** seat every element in each frame's lens *before* pinning. Both pins are now
rebuilt through a harmonization pass in `compose_reshoot.py`, applied to each element
**after** its geometric transform and **before** paste. Every value is **measured**
from the base frame around/under the element's destination — nothing is hardcoded:

1. **Softness** — blur to the frame's measured edge sigma under the footprint (re-blur
   / grad² estimator, calibrated against synthetic edges). The heavily-downscaled
   cutouts already sit near the frame's edge softness, so the measured deficits are
   small (0.00–0.51 px) — a real sticker at this distance carries this same edge width;
   the deficit is applied, never sharpened.
2. **Grade** — exposure (levels) + white balance pulled toward the local frame, hue
   preserved (WB gain forced luma-neutral) and capped so it can't go muddy. **This is
   the main seating win:** the bright PNGs (luma ~135–220) dim ×0.65–0.95 into the dim
   scene (frame luma ~64–125) and pick up its warm cast — the wordmark stays brand
   pink, just pink-as-this-frame-photographs-it.
3. **Grain** — monochromatic noise at the frame's measured noise floor, masked to the
   element's alpha, so no element is unnaturally clean.

**Photometric parity (out1 pin, measured before → after vs local frame):**

| element | softness blur | edge σ frame-under / elem | exposure × (frame L / elem L) | grain σ (frame floor) |
|---------|--------------:|---------------------------|-------------------------------|-----------------------|
| window-wordmark | 0.00 px | 0.44 / 0.52 | ×0.831 (94 / 135) | 0.50 (0.36) |
| open-sign | 0.00 px | 0.35 / 0.62 | ×0.819 (124 / 185) | 0.83 (0.83) |
| shade-sticker | 0.00 px | 0.55 / 0.64 | ×0.954 (69 / 75) | 0.50 (0.31) |
| flyer-left | 0.51 px | 0.74 / 0.54 | ×0.650 (64 / 217) | 0.50 (0.36) |
| flyer-right | 0.10 px | 0.50 / 0.49 | ×0.700 (99 / 219) | 0.85 (0.85) |

Full per-element numbers for both pins print when the script runs.
`harmonization-check.png` is a 2×-zoom before/after of the wordmark and OPEN sign —
after harmonization they dim/warm/grain into the glass instead of popping as decals.
**Geometry is unchanged** by the pass (it only recolours/softens pixels, never moves
them): out1 element AABBs still match Pencil `snapshot_layout` to 0.000 px (same check
as a73baa0).

---

## Element layers (from `door-layer.pen`, frame `bi8Au`)

Visible element layers only — the `enabled:false` portrait-safezone guide (`yptto`)
and the three `note` annotations (`Ehh0o`, `cQIQp`, `a2oEPl`) are intentionally omitted.
Z-order is `.pen` child order (top of table = back, bottom = front).

| id | layer | asset (relative to `design/`) | x | y | w | h | rot° | opacity | shadow |
|----|-------|-------------------------------|-----|-----|-----|-----|-----|---------|--------|
| `DUc4P` | flyer-right | `assets/flyer-grimy-cut.png` | 899 | 295.627 | 52 | 40 | +4 | 0.96 | outer `#00000066`, off (2,3), blur 6 |
| `O7vwR` | flyer-left | `assets/flyer-curl-cut.png` | 470.355 | 516 | 59 | 45 | −3 | 0.78 | outer `#00000066`, off (2,3), blur 6 |
| `Ve5Sr` | shade-sticker | `shade-sticker-trans.png` | 969 | 687 | 90 | 50 | 0 | 0.83 | — |
| `d3oPkd` | window-wordmark (CHUNKYLABS) | `chunky-sticker-removebg-preview.png` | 1249 | 139 | 299 | 166 | 0 | 0.85 | — |
| `NQZHy` | OPEN sign (Come in · WE'RE OPEN) | `ss2-removebg-preview.png` | 947.043 | 348.433 | 66 | 119 | −1 | 0.82 | — |

All five asset paths resolve on disk. All element rects match their source aspect
ratios, so Pencil's `mode:"fill"` reduces to a plain resize (no crop).

**Pixel-verify (out1).** Pencil's own layout engine (`snapshot_layout`) reports each
element's post-rotation axis-aligned bbox; the compositor's rotation math reproduces
them to <0.01 px:

| id | rot° | Pencil AABB (x, y, w, h) | compositor AABB |
|----|-----|--------------------------|-----------------|
| `DUc4P` | +4 | 899, 292, 54.664, 43.530 | 899.0, 291.99, 54.664, 43.530 |
| `O7vwR` | −3 | 468, 516, 61.274, 48.026 | 467.99, 516.0, 61.274, 48.026 |
| `NQZHy` | −1 | 944.967, 348.433, 68.067, 120.134 | 944.966, 348.433, 68.067, 120.134 |

Unrotated layers (`Ve5Sr`, `d3oPkd`) match `.pen` `x/y/w/h` exactly. Visual layout also
matches Pencil's `get_screenshot` render of `bi8Au` element-for-element.

---

## out0 facade transform (out1 → out0)

`out0` is the same facade pulled back (straight camera push-in, no roll). The transform
was **measured**, not guessed — ORB feature match + RANSAC `estimateAffinePartial2D`
between the two stills (396 inliers), then validated by warping out1 into out0 space
(neon sign, door, window frames and record boxes register cleanly):

```
scale       = 0.61356           (out1 facade is ~1.63× larger than out0)
rotation    = +0.093°           (negligible; carried onto element roll for fidelity)
translation = (365.755, 157.505)

x0 = 0.613564·x1 + 0.000993·y1 + 365.755
y0 = −0.000993·x1 + 0.613564·y1 + 157.505
```

The whole out1 crop lands in out0 as the centered rectangle [366,158]–[1545,818].

**All five elements are pinned on BOTH stills** (pin-matching rule). An element present
on the end pin (out1) but absent on the start pin (out0) would *materialize mid-tween* —
so every mark is composited on out0 too, at its transformed street-scale size (= `.pen`
size × 0.61356; flyer shadows scale with it). The small sizes at street distance are
expected and correct — consistency across the two pins beats per-mark legibility.

| layer | out1 size | out0 (street) size |
|-------|-----------|--------------------|
| window-wordmark | 299×166 | 183.5×101.9 |
| OPEN sign | 66×119 | 40.5×73.0 |
| shade-sticker | 90×50 | 55.2×30.7 |
| flyer-right | 52×40 | 31.9×24.5 |
| flyer-left | 59×45 | 36.2×27.6 |

---

## Cinema Studio recipe (Al B rolls the gen)

**Take-A walk-up** — the gentle min-motion push-in that already shipped as the
`street-door` trio, re-rolled with the composited stickers on the glass.

```
Tool     : Higgsfield Cinema Studio  (image-to-video, dual pin)
Start    : design/reshoot/out0-composited.png   (wide storefront)
End      : design/reshoot/out1-composited.png   (close centered storefront)
Motion   : gentle MINIMUM motion (Take-A recipe) — a slow push-up, no roll, no
           parallax invention. Keep the facade rigid; the camera walks in.
Length   : 8s
Res      : 1080p
Audio    : OFF
```

Roll a few takes; pick on the **frame-sweep gate** below before encoding.

### Frame-sweep gate (letterform check)

Scrub the raw take across **mid-motion** (the middle of the push-in, where the wordmark
and OPEN sign are smallest-but-moving) and read the two letterform marks:

- **soft** (letterforms slightly blurred by motion but still the right shapes) → **PASS**.
- **melt** (Inception-style geometry liquefy — CHUNKYLABS/OPEN letters warp, smear, or
  invent strokes) → **REJECT** that take, roll another.
- **2 rejects** on a start/end pair → **fall back to the DOM fade-at-hold** (skip the
  gen; hold out0, cross-fade the composited stickers up as the room settles on out1).

> **This harmonized rebuild is the LAST reroll.** Roll 1 already spent one reject
> (warp/non-convergence → the harmonization fix above). Per the standing gate, a second
> reject falls back to the DOM fade-at-hold — do not keep re-rolling past it.

### Post-pick encode (deterministic — no re-gen)

Once a take passes the sweep, encode it to the engine spec at **original entry pace
(NOT sped)** — the walk-up is a real-time walk-in, so no 2× pass:

```
TRIM=4 bash public/transitions/_placeholder/encode.sh --real <winner-take.mp4> street-door
```

- `--real` → SVT-AV1 (Profile 0, 8-bit, `av01.0.08M.08`) + libx264 (Main@4.0,
  `avc1.4D4028`) + first-frame poster, GOP 60, `+faststart`.
- `TRIM=4` (default) trims the first 4 s: this both lands the hold on out1 (its framing
  arrives at t≈4 s of the 8 s raw) **and** amputates the overshoot past out1.
- Poster = first frame = **out0** — seamless pre-roll from the street's out0 rest still
  into the playing clip.
- Output overwrites `public/transitions/street-door/{av1,h264}.mp4` + `.poster.jpg`.
  Entry pace is **not** sped — no speed flag, no `TRIM` override.
```

---

## Boundary correction — the grade pulse and the stretch pulse (deterministic, at encode)

The still-rest model dissolves still↔video at each end of the walk-up. Two *systematic* gen
behaviours showed up **as pulses across those dissolves**, because a dissolve makes any constant
delta between its two sides read as a brightness/size ramp:

- **Grade pulse** — the gen's render is LIGHTER and cooler than the composited pins.
- **Stretch pulse** — the gen renders very slightly ZOOMED OUT vs the pins.

Both are constant per-frame offsets, so both are fixable **deterministically at encode from the
raw** — no reroll, no re-gen. Measured on the bit-exact endpoint anchors (raw frames 0 and 192):

| | video→still scale | grade (still = a·video + b) |
|---|---|---|
| START (f0 vs out0) | 1.00936 | R 0.9579·v−0.56 · G 0.8609·v+2.82 · B 0.8571·v+1.12 |
| END (f192 vs out1) | 1.00551 | R 0.9536·v+2.72 · G 0.8688·v+4.41 · B 0.8627·v+3.41 |

The frame centre maps to (960,540) at both ends (±1.3px), so the geometry is a **pure centred
zoom** — no translation, correctable by one constant. The luma percentile map is straight (max
deviation 2.7 levels), so a **per-channel linear** fit is enough; no curve is needed.

Applied: **scale k = 1.00744** (the mean — symmetric ±0.19% residual = 1.8px at the frame edge;
END-only would leave 3.7px at the start) and the **END grade fit** (the held boundary is the one
the eye dwells on; the start is left ~2–3 levels bright, which is below JND).

```
ffmpeg -i <roll-2 raw> -vf "\
select='eq(n,0)+eq(n,5)+...+eq(n,192)',setpts=N/24/TB,\
format=gbrp,scale=1934:1088:flags=lanczos,crop=1920:1080,\
lutrgb=r='clip(0.9536*val+2.717,0,255)':g='clip(0.8688*val+4.407,0,255)':b='clip(0.8627*val+3.413,0,255)',\
format=yuv420p" -r 24 -fps_mode cfr -c:v libx264 -qp 0 -an corrected-1.5s.mp4
TRIM=1.5 bash public/transitions/_placeholder/encode.sh --real corrected-1.5s.mp4 street-door
```

ONE pass from the RAW — never re-process the shipped file, never stack passes. The LUT is fully
in range (0→2.7/4.4/3.4, 255→245.9/225.9/223.4) so nothing clips.

**Result at the boundaries** (endpoint vs the still it dissolves against):

| boundary | grade pulse (Δluma) | stretch pulse | MAD |
|---|---|---|---|
| START | 4.14 → **1.42** | 8.9px → **1.9px** | 17.24 → 12.80 |
| END | 3.03 → **0.43** | 6.1px → **0.3px** | 15.66 → 12.20 |

The residual MAD (~12) is the gen's **repaint** — different texture/detail, which no global grade
or scale can remove. It is unstructured, so it does not read as a pulse. On-screen (CDP screencast,
`design/review/entry-{before,after}.mp4`) the frame walked DOWN 1.56 luma levels through the hold
dissolve before, and is flat to 0.08 after.
