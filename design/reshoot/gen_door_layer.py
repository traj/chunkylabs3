#!/usr/bin/env python3
"""
Generate src/data/doorLayer.ts — the DOM element-overlay geometry — FROM the .pen.

Run:  python3 design/reshoot/gen_door_layer.py        (writes src/data/doorLayer.ts)
      python3 design/reshoot/gen_door_layer.py --check (verify on disk == generated)

WHY A GENERATOR: the overlay must land its crisp elements exactly on top of their soft
baked twins in the gen'd video. Hand-typing the numbers would let the two drift silently.
Every value below is DERIVED from `compose_reshoot.ELEMENTS` — the element table transcribed
1:1 from design/door-layer.pen frame `bi8Au`, whose AABBs are verified against Pencil's own
snapshot_layout to <0.01px (see design/reshoot/README.md). Same table that baked the pins, so
the overlay and the baked twins share ONE source of truth by construction.

THE TWO PLACEMENT SETS
  door   — native .pen coords (the out1 / close storefront held frame).
  street — the SAME marks on the wide storefront (out0), through the measured out1→out0
           similarity transform (scale 0.613564, rot +0.0927°, translate 365.755/157.505).
           Sizes scale by S; rotation gains the transform's roll; flyer shadows scale too.

Geometry is emitted as PERCENTAGES of the 1920x1080 master frame, never as px: the scene
paints the video/still with object-cover, so the overlay is positioned inside a box that
tracks that cover rect (see StationElementLayer). Percentages then hold at ANY viewport
aspect — the marks stay glued to the facade instead of to the window.

ROTATION SIGN: Pencil/PIL rotate CCW-positive about the pre-rotation TOP-LEFT corner. CSS
`rotate()` is CW-positive, so the emitted cssRotation is NEGATED and the component pins
transform-origin to `0 0`. That makes the DOM transform reproduce the bake exactly.

PORTRAIT: at 9:16 object-cover only a centre column of the 1920 frame survives (the .pen's
`portrait-safezone-guide`, and narrower still on a 390x844 phone: x 710..1210). The wordmark
lives at x 1249..1548 — entirely outside it — so per the .pen note "wordmark — portrait:
relocates to center column above door" it gets a portrait-only override, centred on the door
axis on the sign board above the door. The override is authored ONCE in door coords and
pushed through the same out1→out0 transform for the street set, so the mark stays glued to
the same physical spot on the facade at both scales.
"""
import json
import os
import subprocess
import sys

import compose_reshoot as C

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_TS = os.path.join(REPO, "src", "data", "doorLayer.ts")

W, H = 1920.0, 1080.0

# .pen asset url -> the copy served from /public. (Asset bytes are identical; the public
# names are just self-describing.)
PUBLIC_ASSET = {
    "assets/flyer-grimy-cut.png": "/door-layer/flyer-grimy-cut.png",
    "assets/flyer-curl-cut.png": "/door-layer/flyer-curl-cut.png",
    "shade-sticker-trans.png": "/door-layer/shade-sticker-trans.png",
    "chunky-sticker-removebg-preview.png": "/door-layer/chunky-wordmark.png",
    "ss2-removebg-preview.png": "/door-layer/open-sign.png",
}

# Human-readable alt text per element id (a11y; the overlay is decorative except the sign).
ALT = {
    "DUc4P": "",
    "O7vwR": "",
    "Ve5Sr": "",
    "d3oPkd": "chunkylabs",
    "NQZHy": "Come in — we're open",
}

# The OPEN sign is the diegetic CTA at the door (".pen" note: "entry CTA — hover: glow
# intensifies"). Everything else is inert decoration.
CTA_ID = "NQZHy"

# Portrait override for the wordmark, authored in DOOR (.pen) coords: centred on the door axis
# (x = 960 - w/2) on the sign board above the door, so it reads inside the 9:16 centre column.
#
# The vertical band is genuinely tight, and both edges are hard constraints — not taste:
#   top    — the door's "← Back to the street" CTA sits top-left (bottom edge ~y 56 on a
#            390x844 screen = y ~72 in door coords). At the native 166 height the wordmark's
#            top corner ran UNDER that button. Verified collision, so it sits below it.
#   bottom — the door lintel (~y 227). Past that the mark stops reading as signage above the
#            door and starts covering the door itself.
# So it drops to y 90 and scales to 234x130 (aspect preserved: 299/166 = 234/130 = 1.80) to
# clear both. Re-check `ctaButtons[].overlapsWordmark` in the portrait verify if these move.
PORTRAIT_WORDMARK = {"id": "d3oPkd", "x": 843.0, "y": 90.0, "w": 234.0, "h": 130.0}


def pct(v, total):
    return round(v / total * 100.0, 5)


def placement(x, y, w, h, rot):
    """One placement, as percentages of the 1920x1080 master + CSS-signed rotation."""
    return {
        "xPct": pct(x, W),
        "yPct": pct(y, H),
        "wPct": pct(w, W),
        "hPct": pct(h, H),
        # Pencil rotates CCW-positive; CSS rotate() is CW-positive -> negate.
        "cssRotation": round(-rot, 5),
    }


def shadow(sh, scale):
    if sh is None:
        return None
    r, g, b = sh["color"]
    a = sh["alpha"] / 255.0
    return {
        # px at the 1920 master scale; the component multiplies by the live cover scale.
        "dx": round(sh["dx"] * scale, 4),
        "dy": round(sh["dy"] * scale, 4),
        "blur": round(sh["blur"] * scale, 4),
        "color": f"rgba({r}, {g}, {b}, {round(a, 4)})",
    }


def build():
    elements = []
    for _id, name, asset, x, y, w, h, rot, op, sh in C.ELEMENTS:
        # street = the out1->out0 similarity transform (measured; see compose_reshoot).
        x0, y0 = C.to_out0(x, y)
        w0, h0 = w * C.S, h * C.S

        el = {
            "id": _id,
            "name": name,
            "asset": PUBLIC_ASSET[asset],
            "alt": ALT[_id],
            "opacity": op,
            "isCta": _id == CTA_ID,
            "door": placement(x, y, w, h, rot),
            "street": placement(x0, y0, w0, h0, rot + C.ROT),
            "doorShadow": shadow(sh, 1.0),
            "streetShadow": shadow(sh, C.S),
        }

        if _id == PORTRAIT_WORDMARK["id"]:
            px, py = PORTRAIT_WORDMARK["x"], PORTRAIT_WORDMARK["y"]
            pw, ph = PORTRAIT_WORDMARK["w"], PORTRAIT_WORDMARK["h"]
            # Same mark, same facade spot, expressed at each scale.
            sx, sy = C.to_out0(px, py)
            el["doorPortrait"] = placement(px, py, pw, ph, rot)
            el["streetPortrait"] = placement(sx, sy, pw * C.S, ph * C.S, rot + C.ROT)

        elements.append(el)
    return elements


HEADER = '''// AUTO-GENERATED by design/reshoot/gen_door_layer.py — DO NOT EDIT BY HAND.
// Regenerate:  python3 design/reshoot/gen_door_layer.py
// Verify:      python3 design/reshoot/gen_door_layer.py --check
//
// The DOM element overlay for the entry stations. The gen'd walk-up carries SOFT, slightly
// warped BAKED TWINS of these five marks (the video was generated from sticker-composited
// pins); this layer lands the crisp originals on top at the hold. Geometry is derived from
// design/door-layer.pen (frame `bi8Au`) — the same table that baked the pins — so the crisp
// mark and its baked twin share one source of truth and cannot drift. Verified: every baked
// element sits within 6.5px of its .pen footprint at 1920 scale (gate <=15px).
//
// All geometry is a PERCENTAGE of the 1920x1080 master frame. The scene paints the video/
// still with object-cover, so StationElementLayer positions this inside a box tracking that
// cover rect — the marks stay glued to the FACADE at any viewport aspect, not to the window.
//
// `cssRotation` is already CSS-signed (Pencil rotates CCW-positive about the top-left corner;
// CSS rotate() is CW-positive). Pin transform-origin to `0 0` and apply it directly.
'''

TYPES = '''
/** One placement of a mark, as percentages of the 1920x1080 master frame. */
export type ElementPlacement = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  /** Degrees, already negated for CSS (transform-origin must be `0 0`). */
  cssRotation: number;
};

/** Outer drop shadow, in px at the 1920 master scale — multiply by the live cover scale. */
export type ElementShadow = {
  dx: number;
  dy: number;
  blur: number;
  color: string;
};

export type DoorLayerElement = {
  /** The .pen node id — the traceable link back to design/door-layer.pen. */
  id: string;
  name: string;
  asset: string;
  /** Empty string = decorative (aria-hidden). */
  alt: string;
  opacity: number;
  /** The OPEN sign is the diegetic CTA at the door; everything else is inert. */
  isCta: boolean;
  /** Native .pen coords — the close storefront (out1) held frame. */
  door: ElementPlacement;
  /** The same mark on the wide storefront (out0), via the measured out1->out0 transform. */
  street: ElementPlacement;
  doorShadow: ElementShadow | null;
  streetShadow: ElementShadow | null;
  /** Portrait-only override (wordmark). Absent = the mark keeps its landscape placement. */
  doorPortrait?: ElementPlacement;
  streetPortrait?: ElementPlacement;
};

/** Which station's framing a mark is being placed on. */
export type ElementPlacementSet = "door" | "street";

/**
 * Portrait kicks in when the viewport is TALLER than the 1920x1080 master (aspect < 16/9):
 * object-cover then crops the frame's sides and only a centre column survives, so the
 * wordmark (x 1249..1548) would be cut off entirely. Matches the .pen `portrait-safezone-guide`.
 */
export const MASTER_ASPECT = 1920 / 1080;

/** Resolve a mark's placement for a station framing + orientation. */
export function placementFor(
  el: DoorLayerElement,
  set: ElementPlacementSet,
  portrait: boolean,
): ElementPlacement {
  if (portrait) {
    const override = set === "door" ? el.doorPortrait : el.streetPortrait;
    if (override) return override;
  }
  return set === "door" ? el.door : el.street;
}

/** The matching shadow for a placement set (px at master scale). */
export function shadowFor(
  el: DoorLayerElement,
  set: ElementPlacementSet,
): ElementShadow | null {
  return set === "door" ? el.doorShadow : el.streetShadow;
}
'''


def render(elements):
    body = json.dumps(elements, indent=2)
    # JSON -> TS object literal: unquote the keys.
    lines = []
    for line in body.split("\n"):
        stripped = line.lstrip()
        if stripped.startswith('"') and '": ' in stripped:
            indent = line[: len(line) - len(stripped)]
            key, rest = stripped.split('": ', 1)
            lines.append(f"{indent}{key[1:]}: {rest}")
        else:
            lines.append(line)
    body = "\n".join(lines)
    return (
        HEADER
        + TYPES
        + "\n/** The five marks, back-to-front (.pen child order = paint order). */\n"
        + "export const DOOR_LAYER_ELEMENTS: readonly DoorLayerElement[] = "
        + body
        + " as const;\n"
    )


def main():
    ts = render(build())
    if "--check" in sys.argv:
        with open(OUT_TS) as f:
            on_disk = f.read()
        if on_disk != ts:
            print("STALE: src/data/doorLayer.ts does not match the .pen geometry.")
            sys.exit(1)
        print("OK: src/data/doorLayer.ts is in sync with design/door-layer.pen")
        return

    with open(OUT_TS, "w") as f:
        f.write(ts)
    print("wrote", OUT_TS)
    for el in build():
        d, s = el["door"], el["street"]
        print(
            f"  {el['name']:16} door {d['xPct']:7.3f}% {d['yPct']:7.3f}% "
            f"{d['wPct']:6.3f}% {d['hPct']:6.3f}% rot {d['cssRotation']:+.3f}"
            f"   street {s['xPct']:7.3f}% {s['yPct']:7.3f}% {s['wPct']:6.3f}% {s['hPct']:6.3f}%"
            + ("   [+portrait override]" if "doorPortrait" in el else "")
            + ("   [CTA]" if el["isCta"] else "")
        )


if __name__ == "__main__":
    main()
