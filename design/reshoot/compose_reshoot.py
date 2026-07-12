#!/usr/bin/env python3
"""
Composite the door-layer.pen element layers onto the entry rest stills for the
Cinema Studio reshoot (start=out0-composited, end=out1-composited).

SOURCE OF TRUTH is design/door-layer.pen (frame `bi8Au` = door-station, 1920x1080).
Geometry below is transcribed 1:1 from that frame's child nodes. Placements are
NOT eyeballed. Rendering mirrors design/review/compose_review.py exactly:
Pencil anchors the pre-rotation bounding-box TOP-LEFT corner at (x, y) and rotates
CCW about that corner; per-layer opacity and the outer drop shadow are reproduced
identically. (compose_review's rotate_ttl pins the rotated top-left corner to
(x, y) -> geometrically identical to rotating about the top-left corner, which is
Pencil's documented convention.)

out1 = design/frames/door-held-frame.png  (canonical CLOSE storefront / DOOR held
        rest frame -- it IS the .pen frame's background fill).
out0 = public/transitions/street-door/street-door.poster.jpg  (WIDE storefront /
        STREET rest frame; the walk-up clip's first frame == out0).

out0 vs out1 facade transform (out1 -> out0) was recovered by ORB feature match +
RANSAC estimateAffinePartial2D (396 inliers): a straight camera push-in, no roll.
  scale = 0.61356 , rotation = +0.093 deg , translation = (365.755, 157.505)
i.e.  x0 = 0.613564*x1 + 0.000993*y1 + 365.755
      y0 = -0.000993*x1 + 0.613564*y1 + 157.505
"""
import math, os
from PIL import Image, ImageFilter

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DESIGN = os.path.join(REPO, "design")
OUT = os.path.join(DESIGN, "reshoot")
os.makedirs(OUT, exist_ok=True)

OUT1_STILL = os.path.join(DESIGN, "frames", "door-held-frame.png")
OUT0_STILL = os.path.join(REPO, "public", "transitions", "street-door", "street-door.poster.jpg")

# --- out1 -> out0 similarity transform (see module docstring) ----------------
S   = 0.613564          # scale
ROT = 0.09270           # degrees CCW
TX, TY = 365.755, 157.505
COS, SIN = math.cos(math.radians(ROT)), math.sin(math.radians(ROT))

def to_out0(x, y):
    # M row-major: [[S*cos, S*sin, TX], [-S*sin, S*cos, TY]] (rotation ~0)
    x0 = S * COS * x + S * SIN * y + TX
    y0 = -S * SIN * x + S * COS * y + TY
    return x0, y0

# --- element table transcribed from door-layer.pen frame bi8Au ---------------
# (id, name, asset-path-relative-to-DESIGN, x, y, w, h, rotation, opacity, shadow)
SHADOW = dict(dx=2, dy=3, blur=6, color=(0, 0, 0), alpha=0x66)  # outer #00000066 off(2,3) blur6
ELEMENTS = [
    ("DUc4P", "flyer-right",     "assets/flyer-grimy-cut.png",              899.0,              295.62733663469453, 52,  40,   4.0, 0.96, SHADOW),
    ("O7vwR", "flyer-left",      "assets/flyer-curl-cut.png",               470.3551180309325,  516.0,              59,  45,  -3.0, 0.78, SHADOW),
    ("Ve5Sr", "shade-sticker",   "shade-sticker-trans.png",                 969.0,              687.0,              90,  50,   0.0, 0.83, None),
    ("d3oPkd", "window-wordmark","chunky-sticker-removebg-preview.png",    1249.0,              139.0,             299, 166,   0.0, 0.85, None),
    ("NQZHy", "open-sign",       "ss2-removebg-preview.png",                947.0434442428575,  348.4331327257644,  66, 119,  -1.0, 0.82, None),
]

# --- rendering (verbatim from design/review/compose_review.py) ---------------
def scale_alpha(img, factor):
    r, g, b, a = img.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * factor))))

def rotate_ttl(img, rotation):
    """Rotate CCW and return the position of the ORIGINAL top-left corner inside
    the expanded rotated bitmap. Pasting so this point lands at (x, y) == rotating
    about the top-left corner with the corner pinned at (x, y)."""
    w, h = img.size
    rot = img.rotate(rotation, resample=Image.BICUBIC, expand=True)
    Rw, Rh = rot.size
    a = math.radians(rotation)
    dx, dy = -w / 2.0, -h / 2.0
    dxp = dx * math.cos(a) + dy * math.sin(a)
    dyp = -dx * math.sin(a) + dy * math.cos(a)
    return rot, (Rw / 2.0 + dxp, Rh / 2.0 + dyp)

def place_image(base, path, x, y, w, h, rotation=0, opacity=1.0, shadow=None):
    layer = Image.open(path).convert("RGBA").resize((w, h), Image.LANCZOS)
    if opacity < 1.0:
        layer = scale_alpha(layer, opacity)
    if shadow:
        sr, sg, sb = shadow["color"]
        a = layer.split()[3].point(lambda v: int((v / 255.0) * shadow["alpha"]))
        sil = Image.merge("RGBA", (Image.new("L", (w, h), sr), Image.new("L", (w, h), sg),
                                   Image.new("L", (w, h), sb), a))
        srot, (scx, scy) = rotate_ttl(sil, rotation)
        srot = srot.filter(ImageFilter.GaussianBlur(shadow["blur"]))
        base.alpha_composite(srot, (round(x + shadow["dx"] - scx), round(y + shadow["dy"] - scy)))
    rot, (cx, cy) = rotate_ttl(layer, rotation)
    base.alpha_composite(rot, (round(x - cx), round(y - cy)))

# --- TASK 1: out1-composited (full element set, native geometry) -------------
def build_out1():
    base = Image.open(OUT1_STILL).convert("RGBA")
    assert base.size == (1920, 1080), base.size
    for _id, _name, asset, x, y, w, h, rot, op, sh in ELEMENTS:
        place_image(base, os.path.join(DESIGN, asset), x, y, int(w), int(h), rot, op, sh)
    out = os.path.join(OUT, "out1-composited.png")
    base.convert("RGB").save(out)
    print("wrote", out, base.size)

# --- TASK 2: out0-composited (wordmark + OPEN sign only, transformed) ---------
STREET_KEEP = {"d3oPkd", "NQZHy"}   # wordmark + OPEN sign
def build_out0():
    base = Image.open(OUT0_STILL).convert("RGBA")
    assert base.size == (1920, 1080), base.size
    print("street-scale would-be sizes (evidence for keep/drop):")
    for _id, name, asset, x, y, w, h, rot, op, sh in ELEMENTS:
        w0, h0 = w * S, h * S
        keep = _id in STREET_KEEP
        print(f"  {'KEEP' if keep else 'DROP'} {name:<15} {w}x{h} -> {w0:5.1f}x{h0:5.1f}")
    for _id, _name, asset, x, y, w, h, rot, op, sh in ELEMENTS:
        if _id not in STREET_KEEP:
            continue
        x0, y0 = to_out0(x, y)
        w0, h0 = max(1, round(w * S)), max(1, round(h * S))
        rot0 = rot + ROT                       # element roll carries the scene roll (~0.09 deg)
        place_image(base, os.path.join(DESIGN, asset), x0, y0, w0, h0, rot0, op, None)
    out = os.path.join(OUT, "out0-composited.png")
    base.convert("RGB").save(out)
    print("wrote", out, base.size)

if __name__ == "__main__":
    build_out1()
    build_out0()
