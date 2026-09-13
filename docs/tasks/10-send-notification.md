# Feature: Morning Todo Notification (Twilio SMS)

**Branch:** `feat/send-notification`

## What

Send a daily SMS every morning with the current todo list via Twilio. ~$1.53/month (phone number rental + one message/day).

## Twilio Setup (Manual)

1. Create a Twilio account at twilio.com
2. Buy a phone number (~$1.15/month)
3. Note the Account SID, Auth Token, and Twilio phone number
4. Add to Railway env vars:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` (the Twilio number, e.g. +1234567890)
   - `TWILIO_TO_NUMBER` (your personal phone, e.g. +1234567890)
   - `NOTIFICATION_HOUR=7` (24h format, when to send)
   - `NOTIFICATION_TZ=America/New_York`

## Files to modify/create

| File | Change |
|---|---|
| `src/notify.py` | **New** — format todo list, send SMS via Twilio |
| `src/server.py` | New `POST /api/notifications/send-todos` endpoint; optional: start background scheduler on app startup |
| `requirements.txt` | Add `twilio`, `apscheduler` |
| `.env.example` | Add Twilio env var placeholders |

## Implementation details

### `src/notify.py`

```python
from __future__ import annotations

import os
from twilio.rest import Client
from notion_client import list_todos

TWILIO_SID = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_TOKEN = os.environ["TWILIO_AUTH_TOKEN"]
TWILIO_FROM = os.environ["TWILIO_FROM_NUMBER"]
TWILIO_TO = os.environ["TWILIO_TO_NUMBER"]


def format_todo_list(todos: list[dict]) -> str:
    undone = [t for t in todos if not t["done"]]
    if not undone:
        return ""
    lines = [f"- {t['title']}" for t in undone]
    return f"Today's Todos ({len(undone)})\n\n" + "\n".join(lines)


def send_todo_sms() -> dict:
    todos = list_todos()
    body = format_todo_list(todos)
    if not body:
        return {"sent": False, "reason": "no_todos"}
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    message = client.messages.create(
        to=TWILIO_TO,
        from_=TWILIO_FROM,
        body=body,
    )
    return {"sent": True, "count": body.count("\n- "), "sid": message.sid}
```

### Server endpoint

```python
@app.post("/api/notifications/send-todos")
async def send_todos():
    from notify import send_todo_sms
    result = send_todo_sms()
    return result
```

Protected by existing `API_SECRET` auth — only callable by the scheduler or manual curl.

### Scheduling

Two options (choose one):

**Option A: APScheduler in-process (simpler)**
- Add a background scheduler that starts with the FastAPI app
- `CronTrigger(hour=NOTIFICATION_HOUR, timezone=NOTIFICATION_TZ)`
- Runs inside the same Railway service, no extra cost
- Downside: if the app restarts at exactly the scheduled time, it might miss a send

**Option B: Railway Cron Job**
- Add a cron service in Railway that curls the endpoint daily
- More robust, but adds slight config overhead

Recommendation: **Option A** — for a single daily SMS, APScheduler is fine. If it misses one day due to a restart, not a big deal.

### SMS formatting

Keep it concise for SMS (160 char segments):

```
Today's Todos (3)

- Review PR for auth changes
- Grocery run
- Call dentist
```

If the list exceeds 1600 chars (~10 SMS segments), truncate with "... and N more" to keep costs predictable.

## Verification

1. Set up Twilio account and add env vars
2. Manual test: `curl -X POST .../api/notifications/send-todos -H "Authorization: Bearer $API_SECRET"`
3. Confirm SMS received with formatted todo list
4. Verify scheduler fires at configured hour
5. Test edge case: no undone todos (should skip sending)
6. Test edge case: very long todo list (should truncate)
