#!/usr/bin/env python3
"""
Composite the door-layer.pen element layers onto the entry rest stills for the
Cinema Studio reshoot (start=out0-composited, end=out1-composited), with a
PHOTOMETRIC HARMONIZATION pass so the crisp PNG elements sit in the frames' lens.

Requires: Pillow + numpy.

SOURCE OF TRUTH is design/door-layer.pen (frame `bi8Au` = door-station, 1920x1080).
Geometry below is transcribed 1:1 from that frame's child nodes. Placements are
NOT eyeballed. Rendering mirrors design/review/compose_review.py: Pencil anchors the
pre-rotation bounding-box TOP-LEFT corner at (x, y) and rotates CCW about that corner;
per-layer opacity and the outer drop shadow are reproduced identically.

WHY HARMONIZE (Roll 1 rejected at the frame-sweep gate): a crisp, differently-graded
PNG pasted onto a soft, warm-graded video frame is internally inconsistent. Cinema
Studio reads that mismatch as error and "fixes" it by warping/re-rendering, so the
take never converges on the end pin. Fix: seat each element in the frame's lens BEFORE
pinning -- match SOFTNESS (blur to the frame's measured edge sigma), GRADE (nudge white
balance toward the local frame cast, hue preserved + capped), and GRAIN (add mono noise
at the frame's measured noise floor). All three are MEASURED per element from the base
frame region around its destination -- nothing is hardcoded.

out1 = design/frames/door-held-frame.png  (canonical CLOSE storefront / DOOR held frame).
out0 = public/transitions/street-door/street-door.poster.jpg  (WIDE storefront / STREET
        rest frame; the walk-up clip's first frame == out0).

out0 vs out1 facade transform (out1 -> out0) was recovered by ORB feature match + RANSAC
estimateAffinePartial2D (396 inliers): a straight push-in, no roll.
  scale = 0.61356 , rotation = +0.093 deg , translation = (365.755, 157.505)
"""
import math, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DESIGN = os.path.join(REPO, "design")
OUT = os.path.join(DESIGN, "reshoot")
os.makedirs(OUT, exist_ok=True)

OUT1_STILL = os.path.join(DESIGN, "frames", "door-held-frame.png")
OUT0_STILL = os.path.join(REPO, "public", "transitions", "street-door", "street-door.poster.jpg")
MONO = "/System/Library/Fonts/SFNSMono.ttf"

# --- out1 -> out0 similarity transform (see module docstring) ----------------
S   = 0.613564          # scale
ROT = 0.09270           # degrees CCW
TX, TY = 365.755, 157.505
COS, SIN = math.cos(math.radians(ROT)), math.sin(math.radians(ROT))

def to_out0(x, y):
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

# --- harmonization knobs (bounds only -- the values applied are MEASURED) -----
BLUR_MAX   = 1.6     # px, cap on the softness-match gaussian sigma
BETA_L     = 0.55    # fraction of the frame/element exposure gap closed (levels)
LUM_CAP    = 0.35    # +/- cap on the luminance (exposure) gain
GRADE_A    = 0.50    # fraction of the frame's WB cast pulled onto the element
GRADE_CAP  = 0.12    # +/- cap on the (luma-neutral) per-channel WB gain -> keeps hue
NOISE_CAP  = 6.0     # cap on grain sigma (0-255) so grain never overwhelms
SEED       = 20260712
LUMA       = np.array([0.299, 0.587, 0.114])

# ============================ measurement helpers ============================
def _gray(a):                    # a: HxWx3 float -> HxW luma
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def _grad_mag(g):                # central-difference gradient magnitude (interior)
    gx = (g[1:-1, 2:] - g[1:-1, :-2]) * 0.5
    gy = (g[2:, 1:-1] - g[:-2, 1:-1]) * 0.5
    return np.sqrt(gx * gx + gy * gy)

def _gkernel(sigma):
    rad = max(1, int(math.ceil(sigma * 3)))
    xs = np.arange(-rad, rad + 1, dtype=np.float64)
    k = np.exp(-(xs ** 2) / (2 * sigma * sigma)); return k / k.sum()

def blur2d(img, sigma):          # separable reflect-padded gaussian on a 2D array
    if sigma <= 1e-3:
        return img.astype(np.float64)
    k = _gkernel(sigma); pad = len(k) // 2
    t = np.pad(img.astype(np.float64), ((0, 0), (pad, pad)), mode="reflect")
    t = np.stack([np.convolve(r, k, mode="valid") for r in t])
    t = np.pad(t, ((pad, pad), (0, 0)), mode="reflect")
    t = np.stack([np.convolve(t[:, j], k, mode="valid") for j in range(t.shape[1])], axis=1)
    return t

def blur_sigma_est(gray, mask=None, probe=1.0):
    """Estimate the effective gaussian blur (edge softness) of a patch, in px, by
    the re-blur method: for a step edge blurred by sigma, gradient ENERGY (grad^2,
    integrated over a fixed region) scales as 1/sigma, so probing with an extra known
    blur recovers sigma from the energy ratio rho: sigma = probe*rho/sqrt(1-rho^2).
    (L1 gradient is blur-invariant for a step edge -- energy must be squared.) The
    mask fixes the pixel set so the ratio is over identical pixels. Larger == softer."""
    gm0 = _grad_mag(gray) ** 2
    gm1 = _grad_mag(blur2d(gray, probe)) ** 2
    if mask is not None:
        sel = mask[1:-1, 1:-1]
        if not sel.any():
            sel = np.ones_like(gm0, bool)
    else:
        sel = np.ones_like(gm0, bool)
    g0, g1 = float(gm0[sel].mean()), float(gm1[sel].mean())
    rho = min(g1 / max(g0, 1e-9), 0.999)
    return probe * rho / math.sqrt(max(1 - rho * rho, 1e-6))

def immerkaer_sigma(g):          # Immerkaer '96 structure-suppressing noise estimate
    if g.shape[0] < 3 or g.shape[1] < 3:
        return 0.0
    N = (4 * g[1:-1, 1:-1]
         - 2 * (g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:])
         + (g[:-2, :-2] + g[:-2, 2:] + g[2:, :-2] + g[2:, 2:]))
    H, W = g.shape
    return float(np.abs(N).sum() * math.sqrt(math.pi / 2) / (6 * (W - 2) * (H - 2)))

def noise_floor(gray, mask=None, tile=20):
    """Noise floor = 25th-percentile of per-tile Immerkaer sigma -> the smoothest
    tiles approximate real sensor/encode grain, rejecting structured texture."""
    H, W = gray.shape; vals = []
    for yy in range(0, H - tile, tile):
        for xx in range(0, W - tile, tile):
            if mask is not None and not mask[yy:yy + tile, xx:xx + tile].all():
                continue
            vals.append(immerkaer_sigma(gray[yy:yy + tile, xx:xx + tile]))
    if not vals:
        vals = [immerkaer_sigma(gray)]
    return float(np.percentile(vals, 25))

def erode(mask, it=1):
    m = mask.copy()
    for _ in range(it):
        e = m.copy()
        e[1:, :] &= m[:-1, :]; e[:-1, :] &= m[1:, :]
        e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]
        m = e
    return m

def dilate(mask, it=1):
    m = mask.copy()
    for _ in range(it):
        e = m.copy()
        e[1:, :] |= m[:-1, :]; e[:-1, :] |= m[1:, :]
        e[:, 1:] |= m[:, :-1]; e[:, :-1] |= m[:, 1:]
        m = e
    return m

def edge_sharpness(alpha):
    """Element 'paste' sharpness = softness of the ALPHA cutout boundary (the hard
    edge that reads as a sticker), measured in px. Interior gloss/texture is NOT the
    tell, so sharpness is estimated on the boundary band, not the element's content."""
    amask = alpha > 32
    band = dilate(amask, 2) & ~erode(amask, 2)
    if band.sum() < 30:
        band = None
    return blur_sigma_est(alpha.astype(np.float64), band)

def local_region(base_np, bbox, margin=0.7):
    """Frame region around a destination bbox. `ring` masks OUT the footprint so
    grade/noise sample the frame AROUND (not under) where the element will sit."""
    H, W = base_np.shape[:2]
    x, y, w, h = bbox
    mx, my = w * margin, h * margin
    x0, y0 = int(max(0, round(x - mx))), int(max(0, round(y - my)))
    x1, y1 = int(min(W, round(x + w + mx))), int(min(H, round(y + h + my)))
    reg = base_np[y0:y1, x0:x1, :3].astype(np.float64)
    ring = np.ones(reg.shape[:2], bool)
    fx0, fy0 = int(max(0, round(x))) - x0, int(max(0, round(y))) - y0
    fx1, fy1 = int(min(W, round(x + w))) - x0, int(min(H, round(y + h))) - y0
    ring[max(0, fy0):max(0, fy1), max(0, fx0):max(0, fx1)] = False
    return reg, ring

# ============================ harmonization pass ============================
def harmonize_layer(layer, base_np, bbox, name, seed, rec):
    x, y, w, h = bbox
    H, W = base_np.shape[:2]
    reg, ring = local_region(base_np, bbox)          # AROUND (not under): grade + noise
    ux0, uy0 = int(max(0, round(x))), int(max(0, round(y)))
    ux1, uy1 = int(min(W, round(x + w))), int(min(H, round(y + h)))
    under = base_np[uy0:uy1, ux0:ux1, :3].astype(np.float64)   # UNDER footprint: softness
    sig_frame   = blur_sigma_est(_gray(under)) if under.size > 9 else blur_sigma_est(_gray(reg))
    noise_frame = noise_floor(_gray(reg), ring)      # grain floor (0-255)
    fmean = reg[ring].mean(axis=0) if ring.any() else reg.reshape(-1, 3).mean(axis=0)

    arr = np.asarray(layer).astype(np.float64)
    rgb, a = arr[..., :3].copy(), arr[..., 3].copy()
    sig_elem_before = edge_sharpness(a)

    # 1. SOFTNESS MATCH -- blur element to the frame's measured edge sigma UNDER it.
    #    Deficit only (never sharpen). Small here: the heavily-downscaled cutouts are
    #    already near the frame's edge softness, so a real sticker at this distance
    #    would carry this same edge width. Grade/grain do the heavy seating.
    r = min(math.sqrt(max(0.0, sig_frame ** 2 - sig_elem_before ** 2)), BLUR_MAX)
    if r > 0.02:                                      # premultiplied blur -> no edge halo
        ap = a / 255.0
        pr = rgb * ap[..., None]
        for c in range(3):
            pr[..., c] = blur2d(pr[..., c], r)
        ab = np.clip(blur2d(a, r), 0, 255)
        apb = ab / 255.0
        rgb = np.where(apb[..., None] > 1e-3, pr / np.maximum(apb[..., None], 1e-3), rgb)
        a = ab
    core = erode(a > 32, 2)
    sig_elem_after = edge_sharpness(a)

    # 2. GRADE MATCH -- exposure (levels) + white balance toward the local frame,
    #    hue-preserving (WB gain forced luma-neutral) and capped so it can't go muddy.
    emean = rgb[core].mean(axis=0) if core.any() else rgb.reshape(-1, 3).mean(axis=0)
    Lf, Le = float(fmean @ LUMA), float(emean @ LUMA)
    lum_gain = float(np.clip(1 + BETA_L * (Lf / max(Le, 1e-3) - 1), 1 - LUM_CAP, 1 + LUM_CAP))
    wb = fmean / max(fmean.mean(), 1e-3)             # frame illuminant cast
    wb_gain = np.clip(1 + GRADE_A * (wb - 1), 1 - GRADE_CAP, 1 + GRADE_CAP)
    wb_gain = wb_gain / float(wb_gain @ LUMA)        # renormalize -> pure color, no exposure
    total_gain = lum_gain * wb_gain
    rgb = rgb * total_gain

    # 3. GRAIN MATCH -- monochromatic noise at the frame floor, masked to alpha.
    used_noise = float(np.clip(noise_frame, 0.5, NOISE_CAP))
    en_before = noise_floor(_gray(rgb), core)
    rng = np.random.default_rng(seed)
    n = rng.normal(0, used_noise, size=a.shape)
    rgb = np.clip(rgb + n[..., None] * (a / 255.0)[..., None], 0, 255)
    en_after = noise_floor(_gray(rgb), core)

    rec.append(dict(name=name, r=r, sig_frame=sig_frame,
                    se_before=sig_elem_before, se_after=sig_elem_after,
                    noise_frame=noise_frame, used_noise=used_noise,
                    en_before=en_before, en_after=en_after,
                    lum=round(lum_gain, 3), Lf=round(Lf, 1), Le=round(Le, 1),
                    wb=[round(float(v), 3) for v in wb_gain],
                    total=[round(float(v), 3) for v in total_gain],
                    fmean=[round(float(v), 1) for v in fmean],
                    emean=[round(float(v), 1) for v in emean]))
    return Image.fromarray(np.dstack([rgb, a]).astype(np.uint8))

# ============================ rendering ============================
def scale_alpha(img, factor):
    r, g, b, a = img.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * factor))))

def rotate_ttl(img, rotation):
    """Rotate CCW, return the ORIGINAL top-left corner's position in the expanded
    bitmap. Pasting so this lands at (x, y) == rotating about the top-left corner."""
    w, h = img.size
    rot = img.rotate(rotation, resample=Image.BICUBIC, expand=True)
    Rw, Rh = rot.size
    a = math.radians(rotation)
    dx, dy = -w / 2.0, -h / 2.0
    dxp = dx * math.cos(a) + dy * math.sin(a)
    dyp = -dx * math.sin(a) + dy * math.cos(a)
    return rot, (Rw / 2.0 + dxp, Rh / 2.0 + dyp)

def place_image(base, base_np, path, x, y, w, h, rotation, opacity, shadow,
                harmonize, name, seed, rec):
    layer = Image.open(path).convert("RGBA").resize((w, h), Image.LANCZOS)
    if harmonize and base_np is not None:
        layer = harmonize_layer(layer, base_np, (x, y, w, h), name, seed, rec)
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

def scale_shadow(sh):
    if sh is None:
        return None
    s = dict(sh)
    s["dx"], s["dy"], s["blur"] = sh["dx"] * S, sh["dy"] * S, sh["blur"] * S
    return s

# ============================ builders ============================
def build_out1(harmonize=True, rec=None, save=False):
    base = Image.open(OUT1_STILL).convert("RGBA")
    assert base.size == (1920, 1080), base.size
    base_np = np.asarray(base) if harmonize else None
    for i, (_id, name, asset, x, y, w, h, rot, op, sh) in enumerate(ELEMENTS):
        place_image(base, base_np, os.path.join(DESIGN, asset), x, y, int(w), int(h),
                    rot, op, sh, harmonize, name, SEED + i, rec if rec is not None else [])
    if save:
        out = os.path.join(OUT, "out1-composited.png")
        base.convert("RGB").save(out); print("wrote", out, base.size)
    return base

def build_out0(harmonize=True, rec=None, save=False):
    base = Image.open(OUT0_STILL).convert("RGBA")
    assert base.size == (1920, 1080), base.size
    base_np = np.asarray(base) if harmonize else None
    for i, (_id, name, asset, x, y, w, h, rot, op, sh) in enumerate(ELEMENTS):
        x0, y0 = to_out0(x, y)
        w0, h0 = max(1, round(w * S)), max(1, round(h * S))
        place_image(base, base_np, os.path.join(DESIGN, asset), x0, y0, w0, h0,
                    rot + ROT, op, scale_shadow(sh), harmonize, name, SEED + 100 + i,
                    rec if rec is not None else [])
    if save:
        out = os.path.join(OUT, "out0-composited.png")
        base.convert("RGB").save(out); print("wrote", out, base.size)
    return base

# ============================ reporting ============================
def print_records(tag, rec):
    print(f"\n=== {tag} photometric harmonization (all values MEASURED per element) ===")
    for d in rec:
        print(f"  {d['name']}")
        print(f"     softness : blur {d['r']:.3f}px  (frame-under sigma {d['sig_frame']:.3f} vs "
              f"elem edge {d['se_before']:.3f} -> {d['se_after']:.3f})")
        print(f"     grade    : exposure x{d['lum']:.3f} (frame L {d['Lf']:.1f} / elem L {d['Le']:.1f})  "
              f"WB {d['wb']}  net gain {d['total']}")
        print(f"                elem mean {d['emean']} -> frame mean {d['fmean']}")
        print(f"     grain    : sigma {d['used_noise']:.2f} (frame floor {d['noise_frame']:.2f})  "
              f"elem noise {d['en_before']:.2f} -> {d['en_after']:.2f}")

def analytic_aabb(x, y, w, h, rot):
    a = math.radians(rot); c, s = math.cos(a), math.sin(a)
    xs = [px * c + py * s for px, py in ((0, 0), (w, 0), (0, h), (w, h))]
    ys = [-px * s + py * c for px, py in ((0, 0), (w, 0), (0, h), (w, h))]
    return x + min(xs), y + min(ys), max(xs) - min(xs), max(ys) - min(ys)

def verify_geometry():
    # Pencil snapshot_layout (door-layer.pen bi8Au) -- unchanged inputs -> unchanged AABBs.
    pencil = {"DUc4P": (899, 292, 54.664, 43.530), "O7vwR": (468, 516, 61.274, 48.026),
              "NQZHy": (944.967, 348.433, 68.067, 120.134)}
    print("\n=== geometry check (out1 analytic AABB vs Pencil snapshot_layout) ===")
    for _id, name, _a, x, y, w, h, rot, _o, _s in ELEMENTS:
        if _id in pencil:
            ax, ay, aw, ah = analytic_aabb(x, y, w, h, rot)
            px, py, pw, ph = pencil[_id]
            print(f"  {name:<15} mine ({ax:8.3f},{ay:8.3f},{aw:7.3f},{ah:7.3f})  "
                  f"pencil ({px:8.3f},{py:8.3f},{pw:7.3f},{ph:7.3f})  "
                  f"dmax {max(abs(ax-px),abs(ay-py),abs(aw-pw),abs(ah-ph)):.3f}px")

# ============================ before/after check image ============================
def build_check():
    off = build_out1(harmonize=False)
    on  = build_out1(harmonize=True)
    try:
        f_lab = ImageFont.truetype(MONO, 20); f_sub = ImageFont.truetype(MONO, 16)
    except OSError:
        f_lab = ImageFont.load_default(); f_sub = f_lab
    targets = [("d3oPkd", "CHUNKYLABS wordmark"), ("NQZHy", "WE'RE OPEN sign")]
    Z, pad, gap = 2, 24, 28
    panels = []
    for _id, title in targets:
        _i, name, _a, x, y, w, h, rot, _o, _s = next(e for e in ELEMENTS if e[0] == _id)
        ax, ay, aw, ah = analytic_aabb(x, y, int(w), int(h), rot)
        m = 10
        box = (int(ax - m), int(ay - m), int(ax + aw + m), int(ay + ah + m))
        cb = off.convert("RGB").crop(box).resize((int((aw + 2*m) * Z), int((ah + 2*m) * Z)), Image.NEAREST)
        ca = on.convert("RGB").crop(box).resize(cb.size, Image.NEAREST)
        panels.append((title, cb, ca))
    cw = max(pad * 3 + p[1].width + p[2].width for p in panels)
    rows = [40 + 26 + p[1].height for p in panels]
    canvas = Image.new("RGB", (cw, 30 + sum(rows) + gap * len(panels)), (18, 18, 20))
    d = ImageDraw.Draw(canvas)
    d.text((pad, 8), "Harmonization check — 2x zoom (nearest), out1 pins", font=f_lab, fill=(235, 235, 235))
    yy = 40
    for title, cb, ca in panels:
        d.text((pad, yy), title, font=f_lab, fill=(240, 210, 150)); yy += 26
        d.text((pad, yy - 2), "BEFORE (crisp paste)", font=f_sub, fill=(180, 180, 185))
        d.text((pad * 2 + cb.width, yy - 2), "AFTER (harmonized)", font=f_sub, fill=(180, 180, 185))
        yy += 20
        canvas.paste(cb, (pad, yy)); canvas.paste(ca, (pad * 2 + cb.width, yy))
        yy += cb.height + gap
    out = os.path.join(OUT, "harmonization-check.png")
    canvas.save(out); print("wrote", out, canvas.size)

# ============================ shipped stills ============================
# STILL-REST MODEL: these composites are no longer just gen pins — they ARE the frames the site
# rests on (src/data/stations.ts `still`). Export them here so the shipped stills can never drift
# from the pins the clip was generated between; regenerating the pins regenerates what ships.
#
# PNG masters stay in design/reshoot (lossless, and what Cinema Studio is fed). The web copies are
# JPEG q94 at 4:4:4 — ~600KB vs ~2.4MB, which matters on a mobile-first, iOS-heavy entry screen.
# subsampling=0 is NOT optional: the wordmark is saturated pink TYPE, and 4:2:0 would smear its
# chroma edges into exactly the mush these stills exist to avoid.
SHIP = {
    "out0-composited.png": "entry-street.jpg",  # street rest  (wide storefront)
    "out1-composited.png": "entry-door.jpg",    # door rest    (close storefront, held frame)
}


def export_shipped():
    dest_dir = os.path.join(REPO, "public", "stills")
    os.makedirs(dest_dir, exist_ok=True)
    print("\n=== shipped stills (public/stills) ===")
    for src_name, out_name in SHIP.items():
        src = os.path.join(OUT, src_name)
        dst = os.path.join(dest_dir, out_name)
        im = Image.open(src).convert("RGB")
        assert im.size == (1920, 1080), im.size
        im.save(dst, "JPEG", quality=94, subsampling=0, optimize=True, progressive=True)
        print(f"  {src_name} -> public/stills/{out_name}  "
              f"({os.path.getsize(src)/1e6:.2f}MB PNG -> {os.path.getsize(dst)/1e3:.0f}KB JPEG)")


if __name__ == "__main__":
    rec1, rec0 = [], []
    build_out1(harmonize=True, rec=rec1, save=True)
    build_out0(harmonize=True, rec=rec0, save=True)
    print_records("out1", rec1)
    print_records("out0", rec0)
    verify_geometry()
    build_check()
    export_shipped()
