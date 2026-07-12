#!/usr/bin/env python3
"""
Faithful full-res render of design/door-layer.pen (pass 3) for Al B's veto pass.
Pencil's export_nodes cannot render this image-heavy frame, so we composite the
identical source assets at the identical .pen geometry here. Geometry, rotation
(Pencil = degrees CCW about the TOP-LEFT corner), per-layer opacity and drop
shadows are mirrored 1:1 from the .pen node values.

Current canvas (Al B baseline): sticker-style CHUNKYLABS wordmark (right window),
photographed shade sticker (door glass), his two small flyers. The portrait
safe-zone guide is enabled:false in the .pen, so it is intentionally omitted here.
No font stand-ins this round — every visible layer is an image asset.
"""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = "/Users/al_b/Desktop/projects/chunkylabs3/design"
ASSETS = os.path.join(BASE, "assets")
OUT = os.path.join(BASE, "review")
os.makedirs(OUT, exist_ok=True)

base = Image.open(os.path.join(BASE, "frames/door-held-frame.png")).convert("RGBA")
W, H = base.size  # 1920 x 1080
MONO = "/System/Library/Fonts/SFNSMono.ttf"

def scale_alpha(img, factor):
    r, g, b, a = img.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * factor))))

def rotate_ttl(img, rotation):
    w, h = img.size
    rot = img.rotate(rotation, resample=Image.BICUBIC, expand=True)
    Rw, Rh = rot.size
    a = math.radians(rotation)
    dx, dy = -w / 2.0, -h / 2.0
    dxp = dx * math.cos(a) + dy * math.sin(a)
    dyp = -dx * math.sin(a) + dy * math.cos(a)
    return rot, (Rw / 2.0 + dxp, Rh / 2.0 + dyp)

def place_image(path, x, y, w, h, rotation=0, opacity=1.0, shadow=None):
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

def draw_note(x, y, w, lines):
    mono = ImageFont.truetype(MONO, 17)
    monoh = ImageFont.truetype(MONO, 15)
    pad, lh = 12, 22
    h = pad + 20 + 8 + lh * len(lines) + pad
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rounded_rectangle([x, y, x + w, y + h], radius=8,
                        fill=(250, 240, 208, 235), outline=(214, 196, 140, 255), width=1)
    d.text((x + pad, y + pad), "Note  ⌄", font=monoh, fill=(150, 120, 40, 255))
    d.line([x + pad, y + pad + 20, x + w - pad, y + pad + 20], fill=(214, 196, 140, 200), width=1)
    for i, ln in enumerate(lines):
        d.text((x + pad, y + pad + 28 + i * lh), ln, font=mono, fill=(60, 50, 20, 255))
    base.alpha_composite(ov)

# --- overlays, mirrored from door-layer.pen (pass 3, Al B baseline) ----------
FLY = dict(blur=6, color=(0, 0, 0), alpha=0x66)
place_image(os.path.join(ASSETS, "flyer-grimy-cut.png"),
            903, 569, 70, 54, rotation=4, opacity=0.96, shadow=dict(dx=2, dy=3, **FLY))   # flyer-right
place_image(os.path.join(ASSETS, "flyer-curl-cut.png"),
            470, 516, 59, 45, rotation=-3, opacity=0.78, shadow=dict(dx=2, dy=3, **FLY))  # flyer-left
place_image(os.path.join(BASE, "shade-sticker-trans.png"),
            967, 682, 90, 50, rotation=0, opacity=0.87)                                    # shade sticker (Ve5Sr)
place_image(os.path.join(BASE, "chunky-sticker-removebg-preview.png"),
            1249, 139, 299, 166, rotation=0, opacity=0.85)                                 # window wordmark (d3oPkd)

draw_note(64, 1030, 360, ["portrait safe-zone · 9:16",
                          "object-cover center column  (hidden guide)"])
draw_note(420, 1043, 360, ["entry CTA — hover:", "glow intensifies"])
draw_note(1491, 1038, 360, ["wordmark — portrait:",
                            "relocates to center", "column above door"])

full = base.convert("RGB")
full.save(os.path.join(OUT, "door-layer-full.png"))
sq = full.resize((700, round(700 * H / W)), Image.LANCZOS)
sq.save(os.path.join(OUT, "door-layer-squint-700.png"))
print("wrote full", full.size, "and squint", sq.size)
