"""Send daily todo list via Twilio SMS."""

from __future__ import annotations

import os

from twilio.rest import Client

import notion_client as nc

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_FROM_NUMBER", "")
TWILIO_TO = os.environ.get("TWILIO_TO_NUMBER", "")

MAX_SMS_LENGTH = 1600  # ~10 segments, keeps cost predictable


def format_todo_list(todos: list[dict]) -> str:
    undone = [t for t in todos if not t["done"]]
    if not undone:
        return ""
    lines = [f"- {t['title']}" for t in undone]
    header = f"Today's Todos ({len(undone)})\n\n"
    body = "\n".join(lines)
    full = header + body
    if len(full) <= MAX_SMS_LENGTH:
        return full
    # Truncate and indicate remaining count
    truncated = header
    included = 0
    for line in lines:
        candidate = truncated + line + "\n"
        suffix = f"\n... and {len(undone) - included - 1} more"
        if len(candidate + suffix) > MAX_SMS_LENGTH:
            truncated += suffix
            break
        truncated = candidate
        included += 1
    return truncated.rstrip()


def send_todo_sms() -> dict:
    todos = nc.list_todos()
    body = format_todo_list(todos)
    if not body:
        return {"sent": False, "reason": "no_todos"}
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    message = client.messages.create(
        to=TWILIO_TO,
        from_=TWILIO_FROM,
        body=body,
    )
    return {"sent": True, "count": len([t for t in todos if not t["done"]]), "sid": message.sid}
