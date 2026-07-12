# Entry reshoot package — door-layer composited onto out0 / out1

The DOM sticker/door-CTA layer designed in `design/door-layer.pen` is **baked into
the two entry rest stills** here, so the walk-up clip can be re-rolled with the
stickers already on the glass (no runtime DOM layer needed for the reshoot pass).

- `out0-composited.png` — **start pin** (WIDE street rest frame + walk-up first frame).
- `out1-composited.png` — **end pin** (CLOSE canonical storefront + DOOR held rest frame).

Both are 1920×1080. Regenerate with `python3 design/reshoot/compose_reshoot.py`.

**Source of truth = `design/door-layer.pen`** (frame `bi8Au` = door-station). Element
geometry is transcribed 1:1 from that frame — nothing is eyeballed. The compositor
reuses the review-render workflow (`design/review/compose_review.py`): Pencil anchors
the pre-rotation bounding-box **top-left corner** at `(x, y)` and rotates **CCW about
that corner**; per-layer opacity and the outer drop shadow are reproduced identically.

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
