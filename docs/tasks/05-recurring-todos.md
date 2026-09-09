# Feature: Recurring Todos

**Branch:** `feat/recurring-todos`

## What

Mark a todo as daily or weekly. When completed (checked off), the server automatically creates a fresh copy (unchecked) so it reappears for the next cycle.

## Prerequisites

Manually add a `Recurrence` select property to the Notion database with options: `daily`, `weekly` (leave blank for non-recurring).

## Files to modify/create

| File | Change |
|---|---|
| `src/notion_client.py` | Include `recurrence` in `_serialize_page`; new `create_recurring_copy(page_id)` that clones title+tags with Done=false |
| `src/server.py` | Update `PATCH /api/notes/{id}` — when marking `done=true` and note has recurrence set, auto-create a new copy |
| `web/src/types.ts` | Add `recurrence: string \| null` to Note type |
| `web/src/components/TodoItem.tsx` | Show recurrence indicator icon (circular arrow); add click-to-cycle recurrence (none -> daily -> weekly -> none) |
| `web/src/api.ts` | Update `updateNote` type to include `recurrence` |

## Implementation details

### Backend

- `_serialize_page` — extract `Recurrence` select value, default to `null`
- `create_recurring_copy(page_id)` — fetch the page, create a new page with same title, tags (including "todo"), and recurrence, but `Done=false`
- In `update_note` endpoint: after updating the page, if `payload.done is True`, fetch the updated page, check recurrence, and if set, call `create_recurring_copy`
- The new copy appears as a fresh todo in the list

### Frontend

- TodoItem: small circular arrow icon next to the title when `recurrence` is set
- Clicking the icon cycles: none -> daily -> weekly -> none (calls `updateNote(id, { recurrence })`)
- When a recurring todo is checked off, the query invalidation will pick up the new copy automatically

## Verification

1. Add `Recurrence` select to Notion DB
2. Set a todo to "daily" recurrence via the UI
3. Check it off — a new unchecked copy with the same title/tags should appear
4. Verify the new copy also has the recurrence property set
