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
source "$SCRIPT_DIR/.env" 2>/dev/null

INKWELL_URL="${INKWELL_URL:-https://productivitydash-production.up.railway.app}"

BODY="{\"title\": \"$1\""

if [ -n "$2" ]; then
  TAGS=$(echo "$2" | sed 's/[^,]*/"&"/g; s/^/[/; s/$/]/')
  BODY="$BODY, \"tags\": $TAGS"
fi

if [ -n "$3" ]; then
  BODY="$BODY, \"body\": \"$3\""
fi

BODY="$BODY}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$INKWELL_URL/api/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_SECRET" \
  -d "$BODY")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "Saved to Inkwell"
else
  echo "Error ($HTTP_CODE)"
fi
