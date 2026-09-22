#!/usr/bin/env bash
# Download WordPress uploads from the old Kinsta library onto this host.
# Usage: download-wp-uploads.sh [dest-dir] [paths-json]
set -euo pipefail

DEST="${1:-/data/coolify/newslines-wp-content}"
LIST="${2:-/data/coolify/newslines-wp-content/wp-uploads.json}"
ORIGIN="https://newslinesorggc.kinsta.cloud"
JOBS="${JOBS:-16}"

mkdir -p "$DEST/uploads" "$DEST/logs"
cd "$DEST"

if [[ ! -f "$LIST" ]]; then
  echo "missing path list: $LIST" >&2
  exit 1
fi

python3 - <<'PY' "$LIST" "$DEST/logs/urls.txt"
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
paths = data["paths"] if isinstance(data, dict) else data
with open(sys.argv[2], "w", encoding="utf-8") as out:
    for path in paths:
        if path.startswith("/wp-content/"):
            out.write(path[len("/wp-content/"):] + "\n")
        elif path.startswith("wp-content/"):
            out.write(path[len("wp-content/"):] + "\n")
        else:
            out.write(path.lstrip("/") + "\n")
print(len(paths))
PY

echo "Downloading into $DEST from $ORIGIN"
xargs -a "$DEST/logs/urls.txt" -P "$JOBS" -I{} bash -c '
  rel="$1"
  dest="'"$DEST"'/$rel"
  mkdir -p "$(dirname "$dest")"
  if [[ -s "$dest" ]]; then
    exit 0
  fi
  code=$(curl -fsSL --retry 3 --retry-delay 1 -o "$dest" -w "%{http_code}" "'"$ORIGIN"'/wp-content/$rel" || true)
  if [[ "$code" != "200" ]]; then
    rm -f "$dest"
    echo "$code $rel" >> "'"$DEST"'/logs/failed.txt"
    exit 0
  fi
' _ {}

ok=$(find "$DEST/uploads" -type f | wc -l)
fail=$(wc -l < "$DEST/logs/failed.txt" 2>/dev/null || echo 0)
echo "done files=$ok failed=$fail"
