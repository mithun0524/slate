#!/bin/sh
# Real sound effects, from Remotion's own hosted set — free to use in a Remotion
# project, no attribution, no account. Everything mechanical or organic in the
# mix is one of these; only drones, subs and pads are synthesised.
set -e
mkdir -p public/sfx
for n in whoosh switch mouse-click ding page-turn; do
  curl -fsSL -o "public/sfx/$n.wav" "https://remotion.media/$n.wav"
  echo "✓ public/sfx/$n.wav"
done
