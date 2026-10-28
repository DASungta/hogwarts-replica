#!/usr/bin/env bash
# Render every camera shot at a quick preview quality and tile them into contact sheets.
#   bash tools/allshots.sh <prefix> [spp] [shot ...]      e.g.  bash tools/allshots.sh d0 8
# Writes out/<prefix>-<shot>.png and out/<prefix>-sheet-N.jpg (6 shots per sheet). Needs tools/serve.mjs on 8747.
cd "$(dirname "$0")/.."
prefix=${1:-d0}; spp=${2:-8}; shift 2 2>/dev/null
shots=("$@")
[ ${#shots[@]} -eq 0 ] && shots=(arrival front southeast bridge aerial grounds quad north lawn gate northwest west woodbridge owlery stones circle willow ruins hagrid hut forest quidditch pitch station stationview stationbridge stationloco hall hallup halldais halldoor hallbeast hallfire hallowl hallpoints stair stairgal stairhall stairflight)
files=()
for s in "${shots[@]}"; do
  node tools/shot.mjs --shot "$s" --spp "$spp" --w 1280 --h 720 --out "out/$prefix-$s.png" --timeout 300 ${SHOT_PARAMS:+--params "$SHOT_PARAMS"} 2>&1 | grep -E "ERROR|rror" | cut -c1-200
  files+=("out/$prefix-$s.png")
done
n=0
for ((i = 0; i < ${#files[@]}; i += 6)); do
  n=$((n + 1)); python -I tools/sheet.py "out/$prefix-sheet-$n.jpg" 2 960 "${files[@]:i:6}" > /dev/null
done
echo "rendered ${#files[@]} shots into $n sheets"
