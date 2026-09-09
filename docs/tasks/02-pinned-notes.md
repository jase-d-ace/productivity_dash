# Feature: Pinned Notes

**Branch:** `feat/pinned-notes`

## What

A "Pinned" property (checkbox) in Notion and a separate pinned section above the notes list on the dashboard. Users can pin/unpin notes to keep important ones visible.

## Prerequisites

Manually add a `Pinned` checkbox property to the Notion database before starting.

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | Include `pinned` in `_serialize_page`; new `list_pinned_notes()` filtered by `Pinned == true` |
| `src/server.py` | New `GET /api/notes/pinned` endpoint; update `PATCH /api/notes/{id}` to accept `pinned` field |
| `web/src/types.ts` | Add `pinned: boolean` to Note type |
| `web/src/api.ts` | New `fetchPinnedNotes()`; update `updateNote` to include `pinned` |
| `web/src/components/PinnedWidget.tsx` | **New** — separate section showing pinned notes with unpin button |
| `web/src/components/NoteCard.tsx` | Add pin/unpin toggle button |
| `web/src/components/Dashboard.tsx` | Add PinnedWidget as separate section above Notes widget in left column |

## Implementation details

### Backend

- `_serialize_page` — extract `Pinned` checkbox value, default to `false` if property missing
- `list_pinned_notes()` — query DB with filter `Pinned == true`, sorted by created_time descending
- PATCH handler — add `Pinned` property update: `{"checkbox": payload.pinned}`

### Frontend

- PinnedWidget: visually distinct section with a pin icon header, shows pinned NoteCards with an unpin button
- NoteCard: small pin icon button (toggle), uses `updateNote(id, { pinned: true/false })` mutation
- Optimistic updates on pin/unpin

## Verification

1. Add `Pinned` checkbox to Notion DB
2. Pin a note via the dashboard
3. Verify it appears in the Pinned section and disappears from the main list (or appears in both — decide during implementation)
4. Unpin — verify it returns to normal
