# Feature: Daily Digest

**Branch:** `feat/daily-digest`

## What

A `/api/digest` endpoint returning today's notes, open todos, and recently published pages. A new dashboard widget displays this as a "Today" summary.

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | New `list_notes_since(iso_date)` function using Notion's `created_time` filter |
| `src/server.py` | New `GET /api/digest` endpoint — aggregates today's notes, open todo count, recent pages |
| `web/src/api.ts` | New `fetchDigest()` function |
| `web/src/components/DigestWidget.tsx` | **New** — widget showing today's capture count, open todos, recent pages |
| `web/src/components/Dashboard.tsx` | Add DigestWidget above Notes in left column |

## Implementation details

### Backend

- `list_notes_since(iso_date)` — query Notion DB with `created_time` filter `on_or_after: iso_date`, sorted by created_time descending
- `GET /api/digest` returns:
  ```json
  {
    "today_notes": [...],
    "open_todos_count": 5,
    "recent_pages": [...]
  }
  ```
- Reuse existing `list_todos()` (filter for `done == false`) and `list_child_pages()` (take last 3)

### Frontend

- DigestWidget: compact card showing "3 notes today", "5 open todos", "2 pages this week"
- Positioned above the Notes widget in the left column

## Verification

1. Start backend: `cd src && uvicorn server:app --reload --port 8000`
2. `curl http://localhost:8000/api/digest` — should return today's stats
3. Start frontend: `cd web && npm run dev`
4. Dashboard should show the new digest widget at the top
