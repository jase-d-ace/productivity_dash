# Feature: Tag Filtering

**Branch:** `feat/tag-filtering`

## What

Click any tag badge on the dashboard to filter the notes list to only show notes with that tag. Click again (or click a clear button) to remove the filter.

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | Add optional `tag` param to `list_notes()` using Notion's multi_select `contains` filter |
| `src/server.py` | Add `tag` query param to `GET /api/notes` |
| `web/src/api.ts` | Update `fetchNotes()` to accept optional `tag` param |
| `web/src/components/Dashboard.tsx` | Add `activeTag` state, pass down to NoteList |
| `web/src/components/NoteList.tsx` | Pass tag filter to query; show active filter chip with clear (x) button |
| `web/src/components/TagBadge.tsx` | Make clickable — accept `onClick` prop, add hover/active styles |
| `web/src/components/NoteCard.tsx` | Wire tag badge clicks up to parent filter handler |

## Implementation details

### Backend

- `list_notes()` gains optional `tag: str = None` parameter
- When `tag` is provided, add to Notion query filter:
  ```json
  { "property": "Tags", "multi_select": { "contains": "todo" } }
  ```
- `GET /api/notes?tag=ideas` passes it through

### Frontend

- Dashboard holds `activeTag` state (string | null)
- NoteList receives `activeTag`, includes it in the react-query key and fetch call
- When a TagBadge is clicked, set `activeTag` to that tag's name
- Show a filter bar above the notes list: "Filtered by: ideas [x]"
- Clicking [x] or clicking the same tag again clears the filter
- TagBadge gets a subtle highlight when it matches the active filter

## Verification

1. Click a tag on any note card — notes list should filter to only that tag
2. URL or query should update (react-query refetch)
3. Click the clear button — full list returns
4. Click the same tag again — filter clears
