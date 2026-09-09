# Feature: Archive View

**Branch:** `feat/archive-view`

## What

A collapsible "Archive" widget below the Pages widget in the right column showing archived (deleted) notes with a restore button.

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | New `list_archived_notes()` to query archived pages; new `restore_page(page_id)` to un-archive |
| `src/server.py` | New `GET /api/notes/archived` endpoint; new `POST /api/notes/{id}/restore` endpoint |
| `web/src/api.ts` | New `fetchArchivedNotes()`, `restoreNote(id)` |
| `web/src/components/ArchiveWidget.tsx` | **New** — collapsible widget (default collapsed), shows archived notes with restore button |
| `web/src/components/Dashboard.tsx` | Add ArchiveWidget below PagesWidget in right column |

## Implementation details

### Backend

- `list_archived_notes()` — Notion API: use `POST /v1/search` with `filter: { property: "object", value: "page" }` and check for archived status. Alternatively, track archived IDs locally. Need to verify Notion API support for querying archived pages.
- `restore_page(page_id)` — `PATCH /v1/pages/{id}` with `{ "archived": false }`
- Both endpoints require auth

### Frontend

- ArchiveWidget: collapsed by default, header shows "Archive (N)" with expand/collapse chevron
- Each archived note shows title, archived date, and a restore button
- Restore triggers mutation, invalidates both `archived` and `notes` query caches
- Optimistic removal from archive list on restore

## Verification

1. Delete a note from the dashboard
2. Expand the Archive widget — deleted note should appear
3. Click restore — note should reappear in the main notes list
4. Archive widget count should decrement

## Known risk

Notion's API support for querying archived pages may be limited. If `POST /v1/databases/{id}/query` doesn't return archived pages, we may need to use `POST /v1/search` or track deletions locally. Investigate during implementation.
