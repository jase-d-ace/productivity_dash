#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Quick Capture to Notion
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📝
# @raycast.argument1 { "type": "text", "placeholder": "thought" }
# @raycast.argument2 { "type": "text", "placeholder": "tags (comma-separated)", "optional": true }
# @raycast.argument3 { "type": "text", "placeholder": "body / details", "optional": true }
# @raycast.packageName Notion Quick Capture

# Documentation:
# @raycast.description Capture a thought to Notion via nn
# @raycast.author jase

export PATH="/Users/jase/.pyenv/shims:/usr/local/bin:/usr/bin:$PATH"

CMD=(python3 /Users/jase/playground/notion_connector/src/nn.py "$1")

if [ -n "$2" ]; then
  CMD+=(-t "$2")
fi

if [ -n "$3" ]; then
  CMD+=(-b "$3")
fi

"${CMD[@]}"
