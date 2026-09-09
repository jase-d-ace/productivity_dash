# Feature: Note Expansion

**Branch:** `feat/note-expansion`

## What

On the `/create/:noteId` page, a button that sends the note's title to Claude and generates thought-provoking questions/prompts to help the user flesh out the idea before writing.

## Files to modify/create

| File | Change |
|---|---|
| `requirements.txt` | Add `anthropic` |
| `.env.example` | Add `ANTHROPIC_API_KEY` |
| `src/server.py` | New `POST /api/notes/{id}/expand` endpoint — calls Claude, returns prompts |
| `web/src/api.ts` | New `expandNote(id)` |
| `web/src/components/CreatePage.tsx` | Add "Generate prompts" button; display prompts in sidebar; click to insert as heading |

## Implementation details

### Backend

- New endpoint `POST /api/notes/{id}/expand`:
  1. Fetch the note (title, tags, notes)
  2. Call Claude API with system prompt + note context
  3. Return `{ "prompts": ["question 1", "question 2", ...] }`
- System prompt:
  > You are a thought partner helping someone develop an idea. Given the note title and any existing context, generate 4-6 specific, open-ended questions that help explore the idea deeper. Be specific to the topic. Do not be generic. Return only the questions, one per line.
- Parse Claude's response: split by newlines, strip numbering/bullets
- Requires `ANTHROPIC_API_KEY` env var (optional — endpoint returns 501 if not configured)

### Frontend

- CreatePage sidebar (right side, below Pomodoro timer): new "Expand" button
- On click: call `expandNote(noteId)`, show loading state
- Display returned prompts as a numbered list
- Each prompt is clickable — clicking inserts it as a `## heading` at the cursor position (or appended to the editor content)
- Prompts persist in component state until the page is left
- Button can be clicked again to regenerate

## Verification

1. Set `ANTHROPIC_API_KEY` in `.env`
2. Navigate to `/create/:noteId` for any note
3. Click "Expand" — should see loading, then 4-6 questions appear
4. Click a question — should insert into the editor as a heading
5. Test without API key — should show a helpful error, not crash
