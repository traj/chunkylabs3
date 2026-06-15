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
