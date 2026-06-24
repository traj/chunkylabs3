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
    -movflags +faststart \
    "$out/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (mandatory floor). Same codec approach as encode().
  ffmpeg -y -hide_banner -loglevel error \
    -ss 0 -t "$TRIM" -i "$input" \
    -vf "format=yuv420p" -map 0:v:0 -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
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
    -movflags +faststart \
    "$out/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (mandatory floor). Same codec approach as encode_real().
  ffmpeg -y -hide_banner -loglevel error \
    -i "$input" \
    -vf "reverse,format=yuv420p" -map 0:v:0 -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
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
    -movflags +faststart \
    "$DIR/$dest.av1.mp4"

  # H.264 — libx264 Main@4.0 (1080p-capable, broadly compatible).
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "testsrc2=s=1920x1080:r=$FPS:d=$DUR" \
    -i "$png" \
    -filter_complex "$filt" -map "[v]" -an \
    -c:v libx264 -profile:v main -level:v 4.0 -preset medium -crf 23 -g 60 \
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
