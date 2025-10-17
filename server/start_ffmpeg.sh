#!/usr/bin/env bash
# start_ffmpeg.sh <SOURCE_URL> <HLS_DIR>
set -e
SRC="$1"
HLS_DIR="$2"

mkdir -p "$HLS_DIR"
# remove old segments
rm -f "$HLS_DIR"/*.m3u8 "$HLS_DIR"/*.ts

# run ffmpeg to generate HLS
# -copy codecs to avoid CPU heavy transcode; may fail for some inputs -> then transcode (commented below)
ffmpeg -hide_banner -loglevel info -y -i "$SRC" \
  -c copy -f hls -hls_time 4 -hls_list_size 6 -hls_flags delete_segments+append_list -hls_allow_cache 0 \
  "$HLS_DIR/stream.m3u8"

# if copy-codec fails for some inputs, use a fallback transcode (uncomment if needed):
# ffmpeg -hide_banner -loglevel info -y -i "$SRC" -c:v libx264 -preset veryfast -b:v 1200k -c:a aac -b:a 128k -f hls -hls_time 4 -hls_list_size 6 -hls_flags delete_segments+append_list -hls_allow_cache 0 "$HLS_DIR/stream.m3u8"
