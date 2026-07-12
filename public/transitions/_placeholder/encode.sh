#!/usr/bin/env bash
# Regenerate the SYNTHETIC placeholder transition clips.
#
# For each station transition (in STATIONS order) this produces, in the same MP4 container:
#   - <dest>.av1.mp4   AV1 via SVT-AV1, Profile 0, 8-bit (yuv420p)        -> av01.0.xxM.08
#   - <dest>.h264.mp4  H.264 via libx264, Main@4.0, broadly compatible    -> avc1.4D40xx
#   - <dest>.poster.jpg first frame, used as poster + autoplay-blocked fallback
#
# Motion comes from an animated testsrc2 base; the burned-in label PNG (generate-labels.mjs)
# is overlaid on top. GOP is ~2s (-g 60) — deliberately NOT keyframe-dense: these are
# PLAY-THROUGH clips, never scrubbed (see CLAUDE.md "Never do this").
#
# Requires: ffmpeg with libsvtav1 + libx264, and node (for the label generator).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LBL="${TMPDIR:-/tmp}/cl_labels"
DUR=3
FPS=30
# Seconds kept from the head of a --real source. Default 4 (push-ins, and 2×'d pivots which
# land at ~4s). Env-overridable for clips with a shorter clean window — e.g. the Vibes push-in
# dissolves into an invented wall after ~2.8s, so it ships TRIM=2.6: `TRIM=2.6 bash encode.sh
# --real <raw> vibes`. Keep this in lockstep with the station's durationSec.
TRIM="${TRIM:-4}"

# ---------------------------------------------------------------------------------------------
# COLOUR TAGS — MANDATORY on every output, both codecs.
#
# Our clips used to ship UNTAGGED (color_range/space/primaries/transfer all "unknown"), which
# means every decoder GUESSES — and they guess differently. Measured on the entry walk-up:
#   * ffmpeg read the untagged file as BT.601; Chrome renders it as BT.709 -> a ~2.2 luma gap
#     between what our calibration tools saw and what the visitor actually saw. Any grade fitted
#     with ffmpeg was therefore fitted against the wrong picture.
#   * WORSE: the AV1 and H.264 renditions of the SAME frames painted ~2 luma apart in Chrome
#     (65.24 vs 67.21), so the entry looked different depending on which <source> the browser
#     picked. iOS takes the H.264 path — the worse of the two.
#
# Tagging alone is not enough: the tags DECLARE a colourspace, they do not change the matrix
# swscale uses to convert. Anything entering here as RGB must ALSO be converted with the bt709
# matrix (see design/reshoot/correct_walkup.py, which writes its intermediate with
# scale=out_color_matrix=bt709:out_range=tv). Inputs that are already yuv420p pass through
# untouched and are simply tagged.
COLOR_TAGS=(-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709)
#
# The generic -color_* flags above only reach the CONTAINER/stream metadata — measured: they set
# the matrix but left primaries/transfer "unknown" in BOTH bitstreams. Browsers trust the
# BITSTREAM, so the description has to be written there too, per encoder. Without this the AV1 and
# H.264 renditions of identical YUV painted 2.2 luma apart in Chrome (ffmpeg decoded them 0.24
# apart — i.e. the pixels always agreed; only the decoders' guesses did not).
# 1 = BT.709 for primaries/transfer/matrix; SVT-AV1 color-range 0 = studio/limited.
X264_COLOR=(-x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709")
SVTAV1_COLOR=(-svtav1-params "color-primaries=1:transfer-characteristics=1:matrix-coefficients=1:color-range=0")


# Real-asset mode: encode ONE real source clip (landscape) to the SAME spec the synthetic
# clips use — AV1 (SVT-AV1, Profile 0 8-bit) + H.264 (Main@4.0) + first-frame poster, GOP
# 60, +faststart. Trims the FIRST $TRIM seconds (-ss 0 -t $TRIM). The real clip IS the
# source — no testsrc2, no label overlay. Vertical/mobile crop is a later pass (NOT here).
#   Usage: bash encode.sh --real <input.mp4> <dest> [outdir]
encode_real() {
  local input="$1"
  local dest="$2"
  local out="$3"
  mkdir -p "$out"

  # AV1 — SVT-AV1, Profile 0 (yuv420p = 8-bit 4:2:0). Same codec approach as encode().
  ffmpeg -y -hide_banner -loglevel error \
    -ss 0 -t "$TRIM" -i "$input" \
    -vf "format=yuv420p" -map 0:v:0 -an \
    -c:v libsvtav1 -preset 6 -crf 38 -g 60 \
    "${COLOR_TAGS[@]}" "${SVTAV1_COLOR[@]}" \
    -movflags +faststart \
    "$out/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (mandatory floor). Same codec approach as encode().
  ffmpeg -y -hide_banner -loglevel error \
    -ss 0 -t "$TRIM" -i "$input" \
    -vf "format=yuv420p" -map 0:v:0 -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
    "${COLOR_TAGS[@]}" "${X264_COLOR[@]}" \
    -movflags +faststart \
    "$out/$dest.h264.mp4"

  # Poster — first frame of the trimmed clip (NOT any external still).
  ffmpeg -y -hide_banner -loglevel error \
    -i "$out/$dest.h264.mp4" -frames:v 1 -q:v 3 "$out/$dest.poster.jpg"
}

# Reverse-edge mode: encode the time-REVERSED whole of a forward master to the SAME spec,
# so a "return" edge (to→from) plays a real backing-out clip FORWARD (the reverse lives in
# the file, never in playback — no negative playbackRate; play-once-hold stays intact). No
# trim: the `reverse` filter buffers the entire clip, so the output inherits the source
# duration (counter→door return = 8s; mixes→counter, door→street returns = 4s). The poster is
# the first frame of the REVERSED file (= forward clip's LAST frame = the room you leave from
# on the return) — the correct landing poster for a back edge.
#   Usage: bash encode.sh --reverse <forward-master.mp4> <from-to> [outdir]
encode_reverse() {
  local input="$1"
  local dest="$2"
  local out="$3"
  mkdir -p "$out"

  # AV1 — SVT-AV1, Profile 0 (yuv420p = 8-bit 4:2:0). Same codec approach as encode_real().
  ffmpeg -y -hide_banner -loglevel error \
    -i "$input" \
    -vf "reverse,format=yuv420p" -map 0:v:0 -an \
    -c:v libsvtav1 -preset 6 -crf 38 -g 60 \
    "${COLOR_TAGS[@]}" "${SVTAV1_COLOR[@]}" \
    -movflags +faststart \
    "$out/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (mandatory floor). Same codec approach as encode_real().
  ffmpeg -y -hide_banner -loglevel error \
    -i "$input" \
    -vf "reverse,format=yuv420p" -map 0:v:0 -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
    "${COLOR_TAGS[@]}" "${X264_COLOR[@]}" \
    -movflags +faststart \
    "$out/$dest.h264.mp4"

  # Poster — first frame of the REVERSED clip (NOT the forward poster).
  ffmpeg -y -hide_banner -loglevel error \
    -i "$out/$dest.h264.mp4" -frames:v 1 -q:v 3 "$out/$dest.poster.jpg"
}

if [[ "${1:-}" == "--real" ]]; then
  echo "encoding REAL '$3' from $2 (first ${TRIM}s) ..."
  encode_real "$2" "$3" "${4:-$DIR/../$3}"
  echo "done."
  exit 0
fi

if [[ "${1:-}" == "--reverse" ]]; then
  echo "encoding REVERSE '$3' from $2 (full clip, time-reversed) ..."
  encode_reverse "$2" "$3" "${4:-$DIR/../$3}"
  echo "done."
  exit 0
fi

mkdir -p "$LBL"
node "$DIR/generate-labels.mjs" "$LBL"

encode() {
  local dest="$1"
  local png="$LBL/$dest.label.png"
  local filt="[0:v][1:v]overlay=0:0,format=yuv420p[v]"

  # AV1 — SVT-AV1, Profile 0 (yuv420p = 8-bit 4:2:0).
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "testsrc2=s=1920x1080:r=$FPS:d=$DUR" \
    -i "$png" \
    -filter_complex "$filt" -map "[v]" -an \
    -c:v libsvtav1 -preset 6 -crf 38 -g 60 \
    "${COLOR_TAGS[@]}" "${SVTAV1_COLOR[@]}" \
    -movflags +faststart \
    "$DIR/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (1080p-capable, broadly compatible).
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "testsrc2=s=1920x1080:r=$FPS:d=$DUR" \
    -i "$png" \
    -filter_complex "$filt" -map "[v]" -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
    "${COLOR_TAGS[@]}" "${X264_COLOR[@]}" \
    -movflags +faststart \
    "$DIR/$dest.h264.mp4"

  # Poster — first frame.
  ffmpeg -y -hide_banner -loglevel error \
    -i "$DIR/$dest.h264.mp4" -frames:v 1 -q:v 3 "$DIR/$dest.poster.jpg"
}

for d in door counter left-bins right-bins mixtape-shelf; do
  echo "encoding $d ..."
  encode "$d"
done
echo "done."
