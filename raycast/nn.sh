#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Inkwell — Quick Capture
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📝
# @raycast.argument1 { "type": "text", "placeholder": "thought" }
# @raycast.argument2 { "type": "text", "placeholder": "tags (comma-separated)", "optional": true }
# @raycast.argument3 { "type": "text", "placeholder": "body / details", "optional": true }
# @raycast.packageName Inkwell

# Documentation:
# @raycast.description Capture a thought to Notion via Inkwell
# @raycast.author jase

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.pyenv/shims:/usr/local/bin:/usr/bin:$PATH"

CMD=(python3 "$SCRIPT_DIR/src/nn.py" "$1")

if [ -n "$2" ]; then
  CMD+=(-t "$2")
fi

if [ -n "$3" ]; then
  CMD+=(-b "$3")
fi

"${CMD[@]}"
