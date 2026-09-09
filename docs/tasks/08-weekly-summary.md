# Feature: Weekly Summary

**Branch:** `feat/weekly-summary`

## What

An auto-generated weekly narrative summary of all notes, triggered on a schedule (every Sunday). Appears as a notification on the dashboard ("Your Weekly Summary is Ready!") with a dedicated view to read it.

## Dependencies

- Feature 6 (weekly-review): reuses `list_notes_for_week()` from `notion_client.py`
- Feature 7 (note-expansion): `anthropic` is already in `requirements.txt` and `ANTHROPIC_API_KEY` in `.env.example`

## Files to modify/create

| File | Change |
|---|---|
| `src/summary.py` | **New** — module for generating summaries via Claude and storing them in Notion |
| `src/server.py` | New `POST /api/summaries/generate` endpoint (called by scheduler); new `GET /api/summaries` to list; new `GET /api/summaries/latest` for notification |
| `src/notion_client.py` | New `create_summary_page(title, content_blocks)` — creates a page under a "Weekly Summaries" parent; new `list_summary_pages()` |
| `web/src/api.ts` | New `fetchLatestSummary()`, `fetchSummaries()` |
| `web/src/components/SummaryNotification.tsx` | **New** — banner/badge in header showing "Your Weekly Summary is Ready!" |
| `web/src/components/SummaryView.tsx` | **New** — page showing rendered summary with date range |
| `web/src/App.tsx` | Add `/summaries` route |
| `web/src/components/Layout.tsx` | Add notification indicator in header |

## Implementation details

### Summary generation (`src/summary.py`)

- `generate_weekly_summary()`:
  1. Call `list_notes_for_week()` to get all notes from past 7 days
  2. Format notes as context for Claude (title, tags, notes, date)
  3. System prompt: "Summarize this person's week of captured thoughts. Write a brief, engaging narrative (3-5 paragraphs) highlighting themes, patterns, and notable ideas. End with 1-2 observations or suggestions."
  4. Store result as a child page in Notion under a dedicated parent page
  5. Return the summary

### Storage

- Create a top-level page "Weekly Summaries" in Notion (or use a dedicated DB)
- Each summary is a child page with title "Week of Sep 1-7, 2026" and the narrative as paragraph blocks
- Persists across Railway deploys (stored in Notion, not local filesystem)

### Scheduling

- **Railway cron job**: separate service in `railway.json` that runs weekly:
  ```
  curl -X POST https://productivitydash-production.up.railway.app/api/summaries/generate \
    -H "Authorization: Bearer $API_SECRET"
  ```
- Alternatively: use `apscheduler` background thread in the FastAPI app (simpler, no extra Railway service)

### Notification

- `GET /api/summaries/latest` returns the most recent summary with its `created_time`
- Frontend polls this on dashboard load
- If the latest summary was created within the last 7 days and hasn't been "dismissed", show the notification banner
- Dismissal stored in localStorage

### Frontend

- SummaryNotification: purple banner below header or badge on "Summaries" nav link
- Clicking it navigates to `/summaries`
- SummaryView: shows the latest summary rendered as formatted text, with date range header and link to older summaries

## Verification

1. Ensure notes exist from the past week
2. Manually trigger: `curl -X POST .../api/summaries/generate -H "Authorization: Bearer ..."`
3. Check Notion — a new "Week of..." page should exist
4. Visit dashboard — notification banner should appear
5. Click through to `/summaries` — summary should render
6. Dismiss notification — should not reappear until next week's summary
