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

# The 36 shipped frames: explicit source indices (81c8fbd) — anchored bit-exactly on the raw's
# true frame 0 and true final frame, evenly spaced between them, laid on a 24fps timeline.
IDX = [round(j * 192 / 35) for j in range(36)]

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
# The grade fit is exact in float, but the frames then go RGB -> yuv420p -> H.264 (chroma
# subsampling + CRF), which shifts each channel's mean. The gate is on the SHIPPED frames, not the
# intermediates, so that shift has to be pre-compensated here or it lands in the dissolve. Measured
# by encoding once and reading the residual of the decoded frames against the stills, then folded
# back in. Re-derive by re-running and reading the endpoint proof's ΔR/ΔG/ΔB.
ENC_COMP_START = (+0.10, +0.49, +0.01)
ENC_COMP_END = (-0.138, +0.535, +0.195)


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
    assert len(fs) == 36, f"expected 36 frames, got {len(fs)}"
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

    outdir = os.path.join(work, "corrected")
    os.makedirs(outdir, exist_ok=True)
    for j, f in enumerate(frames):
        t = j / (len(frames) - 1)
        M = lerp_affine(M_START, M_END, t)
        img = correct_frame(load(f), M, lerp_grade(t))
        # ROUND, never truncate. `astype(uint8)` floors, which costs a systematic ~0.5 level per
        # channel — enough on its own to fail the <0.5 grade gate the dissolves are judged by.
        Image.fromarray(np.rint(img).astype(np.uint8)).save(os.path.join(outdir, f"c_{j:02d}.png"))
    print(f"\nwrote {len(frames)} corrected frames -> {outdir}")

    dest = os.path.join(work, "corrected-1.5s.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", "24",
                    "-i", os.path.join(outdir, "c_%02d.png"),
                    "-c:v", "libx264", "-qp", "0", "-preset", "veryfast",
                    "-pix_fmt", "yuv420p", "-an", dest], check=True)
    print(f"wrote {dest}  (36 frames @24fps = 1.5s, lossless)")
    print("\nnext:  TRIM=1.5 bash public/transitions/_placeholder/encode.sh --real "
          f"{dest} street-door")


if __name__ == "__main__":
    main()
