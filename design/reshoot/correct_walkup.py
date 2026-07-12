#!/usr/bin/env python3
"""
Correct the entry walk-up: PER-FRAME registration + grade ramp, in one pass from the RAW.

    python3 design/reshoot/correct_walkup.py <roll-2-raw.mp4> [--fit] [--verify]

    --fit     re-derive the constants below from the raw + the stills (prints them)
    --verify  only report endpoint registration/grade residuals of an existing encode

Writes a corrected 36-frame / 1.5s lossless intermediate, then hand it to encode.sh:

    TRIM=1.5 bash public/transitions/_placeholder/encode.sh --real <out> street-door

WHY PER-FRAME, NOT ONE CONSTANT (supersedes the constant correction in 8adfb86)
-------------------------------------------------------------------------------
The still-rest model dissolves still<->video at each end of the walk-up, so ANY constant delta
between the two sides of a dissolve reads as a RAMP (a pulse) rather than a cut. 8adfb86 corrected
a single isotropic scale + a single grade and the pulses shrank but survived. Two reasons, both
measured:

1. THE DRIFT IS ANISOTROPIC. The earlier fit used estimateAffinePartial2D — a SIMILARITY, which
   *structurally cannot represent* sx != sy. It averaged the two axes and silently left the
   vertical error behind. A full affine shows the video is vertically SQUASHED against the stills:

        endpoint            x-scale    y-scale    sy/sx        extra height
        raw f0   -> out0    1.00631    1.01295    +0.660%      7.1 px
        raw f192 -> out1    1.00413    1.01626    +1.208%     13.0 px

   That is the "door gets taller at the hold" report, exactly: the still is taller than the video,
   so the door grows as the still dissolves in. Shear is negligible (|shear| <= 0.0004) and
   rotation is ~0, so a full affine with independent x/y scale is the right model.

2. THE DRIFT IS TIME-VARYING. sy/sx nearly DOUBLES from start (+0.66%) to end (+1.21%), and the
   grade drifts too (per-channel offsets move 0.9-2.0 levels between endpoints). One constant
   cannot sit on both ends; it splits the difference and leaves half the error at each.

WHY A RAMP, AND NOT A PER-FRAME MEASUREMENT
-------------------------------------------
There is no mid-clip ground truth to measure against. The two masters are not two views of one
undistorted facade — they are themselves gen frames from DIFFERENT rolls (out0's plate is the old
walk-up's poster, out1's is the old door clip's held frame), and they disagree with each other:

        out1 -> out0:  x-scale 0.61301   y-scale 0.60630   sy/sx = 0.98905  (-1.095%)

So a mid frame has no single geometry it could be "correct" against, and per-frame anisotropy
measured against out1 is contaminated by out1's own distortion relative to out0. (It is also noisy
on the wide frames — 942 inliers at f0 vs 5779 at f35 — and feeding that noise per-frame into a
warp would make the facade JITTER, which is worse than the defect being fixed.)

What actually matters perceptually: the endpoints must land EXACTLY (they are what the dissolves
blend against) and the correction must be SMOOTH in between (mid-walk the facade is moving and
nothing is being blended against, so its absolute geometry is unobservable). A linear ramp between
the two measured endpoint fits gives both — exact where it is checkable, smooth where it is not.
"""
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT0 = os.path.join(HERE, "out0-composited.png")   # street rest master
OUT1 = os.path.join(HERE, "out1-composited.png")   # door rest master

# The 18 shipped frames: explicit source indices — anchored bit-exactly on the raw's true frame 0
# and true final frame (the endpoints are what the dissolves blend against, so they must be the
# real anchors, not resampled), evenly spaced between them, laid on a 24fps timeline => 0.75s.
N_FRAMES = 18
IDX = [round(j * 192 / (N_FRAMES - 1)) for j in range(N_FRAMES)]

# Per-frame gain nudge cap. The interior of the clip rides ABOVE the straight line between the two
# anchored endpoints (measured on the 1576247 encode: +2.03 luma peak at 80% through, excursion
# entirely positive — a sustained bow, not noise). That bow is what reads as "the video is lighter
# than the still". Each frame's per-channel mean is nudged back onto the endpoint-to-endpoint ramp
# by a multiplicative gain (gain, not offset — it preserves black and contrast). Capped so a bad
# fit can never blow a frame out; the largest gain actually applied is reported.
NUDGE_CAP = 0.06

# ---- fitted constants (re-derive with --fit) --------------------------------------------------
# Full affine VIDEO -> STILL at each endpoint (2x3), and the per-channel linear grade still = a*v+b.
M_START = np.array([[1.006308432, 0.000141215, -5.63571925],
                    [0.000286238, 1.012946995, -9.278300067]])
M_END = np.array([[1.004134384, -3.7727e-05, -3.720819973],
                  [-1.7307e-05, 1.016260935, -9.367903559]])
GRADE_START = [(0.99706, -3.3937), (0.937863, -1.2672), (0.93082, -2.3858)]   # R, G, B
GRADE_END = [(1.000116, -1.3929), (0.947881, -0.3742), (0.943304, -0.9992)]

# Delivery-encode pre-compensation, per channel, ADDED to the grade offset — and RAMPED, because
# the shift is not the same at both ends.
#
# CALIBRATED AGAINST THE BROWSER, NOT FFMPEG. The clips used to ship untagged, so ffmpeg read them
# as BT.601 while Chrome rendered them as BT.709 — a ~2.2 luma gap. Every earlier grade was
# therefore fitted against a picture the visitor never saw, which is why the video kept reading
# light no matter how "exact" the ffmpeg-side gate looked. encode.sh now tags bt709 and the
# intermediate below is converted with the bt709 matrix, so decoder and browser finally agree; the
# residual is then closed against CDP-PAINTED values on BOTH codec paths.
ENC_COMP_START = (-0.820, -0.605, -1.480)
ENC_COMP_END = (-0.435, -0.435, -1.065)


# ---- affine decompose / recompose (so we can interpolate in a meaningful basis) ---------------
def decompose(M):
    a, b, tx = M[0]
    c, d, ty = M[1]
    sx = math.hypot(a, c)
    rot = math.atan2(c, a)
    det = a * d - b * c
    sy = det / sx
    shear = (a * b + c * d) / det
    return dict(sx=sx, sy=sy, rot=rot, shear=shear, tx=tx, ty=ty)


def recompose(p):
    ct, st = math.cos(p["rot"]), math.sin(p["rot"])
    sx, sy, sh = p["sx"], p["sy"], p["shear"]
    return np.array([[sx * ct, sy * (sh * ct - st), p["tx"]],
                     [sx * st, sy * (sh * st + ct), p["ty"]]])


def lerp_affine(A, B, t):
    """Interpolate in decomposed space — lerping raw matrix entries would mix scale into shear."""
    pa, pb = decompose(A), decompose(B)
    return recompose({k: pa[k] + (pb[k] - pa[k]) * t for k in pa})


def lerp_grade(t):
    return [(GRADE_START[c][0] + (GRADE_END[c][0] - GRADE_START[c][0]) * t,
             GRADE_START[c][1] + (GRADE_END[c][1] - GRADE_START[c][1]) * t
             + ENC_COMP_START[c] + (ENC_COMP_END[c] - ENC_COMP_START[c]) * t)
            for c in range(3)]


# ---- fitting (--fit) --------------------------------------------------------------------------
def fit_affine(src, dst):
    g = lambda a: cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    orb = cv2.ORB_create(30000)
    ks, ds = orb.detectAndCompute(g(src), None)
    kd, dd = orb.detectAndCompute(g(dst), None)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    m = sorted(bf.match(ds, dd), key=lambda x: x.distance)[:6000]
    sp = np.float32([ks[x.queryIdx].pt for x in m]).reshape(-1, 1, 2)
    dp = np.float32([kd[x.trainIdx].pt for x in m]).reshape(-1, 1, 2)
    M, inl = cv2.estimateAffine2D(sp, dp, method=cv2.RANSAC, ransacReprojThreshold=2.5,
                                  maxIters=20000, confidence=0.999)
    return M, int(inl.sum())


def fit_grade(video, still, M):
    w = cv2.warpAffine(video.astype(np.float32), M, (1920, 1080), flags=cv2.INTER_LANCZOS4)
    valid = cv2.warpAffine(np.ones((1080, 1920), np.float32), M, (1920, 1080)) > 0.999
    out = []
    for c in range(3):
        x = w[..., c][valid].astype(np.float64)
        y = still[..., c][valid]
        a, b = np.polyfit(x, y, 1)
        out.append((float(a), float(b)))
    return out


# ---- pipeline ---------------------------------------------------------------------------------
def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)


def extract(raw, workdir):
    os.makedirs(workdir, exist_ok=True)
    expr = "+".join(f"eq(n\\,{i})" for i in IDX)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-vf", f"select='{expr}'",
                    "-vsync", "0", os.path.join(workdir, "r_%02d.png")], check=True)
    fs = sorted(f for f in os.listdir(workdir) if f.startswith("r_"))
    assert len(fs) == N_FRAMES, f"expected {N_FRAMES} frames, got {len(fs)}"
    return [os.path.join(workdir, f) for f in fs]


def correct_frame(img, M, grade):
    w = cv2.warpAffine(img.astype(np.float32), M, (1920, 1080),
                       flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    w = w.astype(np.float64)
    for c in range(3):
        a, b = grade[c]
        w[..., c] = a * w[..., c] + b
    return np.clip(w, 0, 255)


def main():
    raw = sys.argv[1]
    work = os.path.join(REPO, ".walkup-work")
    frames = extract(raw, os.path.join(work, "raw"))
    out0, out1 = load(OUT0), load(OUT1)

    global M_START, M_END, GRADE_START, GRADE_END
    if "--fit" in sys.argv:
        M_START, i0 = fit_affine(load(frames[0]), out0)
        M_END, i1 = fit_affine(load(frames[-1]), out1)
        GRADE_START = fit_grade(load(frames[0]), out0, M_START)
        GRADE_END = fit_grade(load(frames[-1]), out1, M_END)
        print(f"M_START = {M_START.tolist()}   ({i0} inliers)")
        print(f"M_END   = {M_END.tolist()}   ({i1} inliers)")
        print(f"GRADE_START = {GRADE_START}")
        print(f"GRADE_END   = {GRADE_END}")

    for k, p in (("START", decompose(M_START)), ("END", decompose(M_END))):
        print(f"  {k:5}: sx {p['sx']:.5f}  sy {p['sy']:.5f}  aniso {p['sy']/p['sx']:.5f} "
              f"({(p['sy']/p['sx']-1)*100:+.3f}%)  rot {math.degrees(p['rot']):+.4f}°  "
              f"shear {p['shear']:+.5f}  t ({p['tx']:+.2f},{p['ty']:+.2f})")

    n = len(frames)
    # PASS 1 — affine + grade only, keeping just the per-channel means. (Two passes so we never
    # hold 18 full float frames in memory.)
    means = np.zeros((n, 3))
    for j, f in enumerate(frames):
        t = j / (n - 1)
        img = correct_frame(load(f), lerp_affine(M_START, M_END, t), lerp_grade(t))
        means[j] = img.reshape(-1, 3).mean(0)

    # The endpoint-to-endpoint ramp: the straight line the interior should ride. The endpoints are
    # anchored on the stills by the grade fit, so this line runs still-to-still by construction.
    ramp = np.stack([np.linspace(means[0, c], means[-1, c], n) for c in range(3)], 1)
    exc = means - ramp
    LUM = np.array([0.299, 0.587, 0.114])
    print(f"\n  interior excursion above the endpoint ramp (BEFORE nudge): "
          f"peak {(exc @ LUM).max():+.2f} luma at frame {int((exc @ LUM).argmax())}/{n-1}")

    # PASS 2 — re-correct and nudge each frame's means onto the ramp.
    outdir = os.path.join(work, "corrected")
    os.makedirs(outdir, exist_ok=True)
    gains = np.ones((n, 3))
    for j, f in enumerate(frames):
        t = j / (n - 1)
        img = correct_frame(load(f), lerp_affine(M_START, M_END, t), lerp_grade(t))
        g = np.clip(ramp[j] / np.maximum(means[j], 1e-6), 1 - NUDGE_CAP, 1 + NUDGE_CAP)
        gains[j] = g
        img = np.clip(img * g, 0, 255)
        # ROUND, never truncate. `astype(uint8)` floors, which costs a systematic ~0.5 level per
        # channel — enough on its own to fail the <0.5 grade gate the dissolves are judged by.
        Image.fromarray(np.rint(img).astype(np.uint8)).save(os.path.join(outdir, f"c_{j:02d}.png"))

    worst = int(np.abs(gains - 1).max(1).argmax())
    print(f"  largest nudge applied: {(np.abs(gains - 1).max()) * 100:.2f}% at frame {worst}/{n-1} "
          f"(R {gains[worst,0]:.4f}  G {gains[worst,1]:.4f}  B {gains[worst,2]:.4f})   cap {NUDGE_CAP*100:.0f}%")
    print(f"  endpoints untouched by the nudge: f0 gain {gains[0]}, f{n-1} gain {gains[-1]}")
    print(f"\n  wrote {n} corrected frames -> {outdir}")

    secs = n / 24
    dest = os.path.join(work, f"corrected-{secs:g}s.mp4")
    # BT.709 MATRIX, not just the tag. These frames are RGB; swscale would otherwise convert them
    # to YUV with its BT.601 default, and the browser would then decode them as BT.709 — the exact
    # mismatch that made every earlier grade land ~2 luma light on screen.
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", "24",
                    "-i", os.path.join(outdir, "c_%02d.png"),
                    "-vf", "scale=out_color_matrix=bt709:out_range=tv",
                    "-c:v", "libx264", "-qp", "0", "-preset", "veryfast",
                    "-pix_fmt", "yuv420p",
                    "-color_range", "tv", "-colorspace", "bt709",
                    "-color_primaries", "bt709", "-color_trc", "bt709",
                    "-an", dest], check=True)
    print(f"  wrote {dest}  ({n} frames @24fps = {secs:g}s, lossless, bt709/tv)")
    print(f"\nnext:  TRIM={secs:g} bash public/transitions/_placeholder/encode.sh --real "
          f"{dest} street-door")


if __name__ == "__main__":
    main()
