# Feature: Weekly Review

**Branch:** `feat/weekly-review`

## What

A new `/review` route showing the past week's notes grouped by day. Helps spot patterns in what you're capturing.

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | New `list_notes_for_week()` — fetch notes from past 7 days using Notion's `created_time` date filter |
| `src/server.py` | New `GET /api/notes/week` endpoint |
| `web/src/api.ts` | New `fetchWeeklyNotes()` |
| `web/src/components/WeeklyReview.tsx` | **New** — page component grouping notes by day |
| `web/src/App.tsx` | Add `/review` route |
| `web/src/components/Layout.tsx` | Add "Review" nav link in header |

## Implementation details

### Backend

- `list_notes_for_week()` — query Notion DB with filter:
  ```json
  { "timestamp": "created_time", "created_time": { "on_or_after": "2026-09-01" } }
  ```
  Calculate the date 7 days ago, fetch all matching notes (may need multiple pages if > 100)
- Endpoint returns flat list; frontend handles grouping

### Frontend

- WeeklyReview page: full-width layout (similar to CreatePage)
- Group notes by day using `created_time`
- Day headers: "Monday, Sep 1" format
- Each day section shows note cards (title, tags, preview of notes field)
- Days with no notes show "No notes" in muted text
- Today at the top, working backwards
- Back link to dashboard

### Navigation

- Layout.tsx header: add "Review" link next to "Inkwell" title
- Style consistently with existing header

## Verification

1. Ensure you have notes from multiple days in the past week
2. Navigate to `/review`
3. Notes should be grouped by day with correct headers
4. Empty days should be handled gracefully
