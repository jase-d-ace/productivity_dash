"""FastAPI backend for Inkwell."""

from __future__ import annotations

import hmac
import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Union

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.requests import Request

import notion_client as nc

logger = logging.getLogger("inkwell")

API_SECRET = os.environ.get("API_SECRET")

# --- Scheduler setup ---

NOTIFICATION_HOUR = int(os.environ.get("NOTIFICATION_HOUR", "7"))
NOTIFICATION_TZ = os.environ.get("NOTIFICATION_TZ", "America/New_York")
TWILIO_CONFIGURED = all(
    os.environ.get(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "TWILIO_TO_NUMBER")
)

scheduler = None

if TWILIO_CONFIGURED:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger

    from notify import send_todo_sms

    def _scheduled_send():
        try:
            result = send_todo_sms()
            logger.info("Scheduled SMS: %s", result)
        except Exception:
            logger.exception("Failed to send scheduled SMS")

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _scheduled_send,
        CronTrigger(hour=NOTIFICATION_HOUR, timezone=NOTIFICATION_TZ),
        id="daily_todo_sms",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if scheduler:
        scheduler.start()
        logger.info("Scheduler started — daily SMS at %s:00 %s", NOTIFICATION_HOUR, NOTIFICATION_TZ)
    yield
    if scheduler:
        scheduler.shutdown()

if not API_SECRET and os.environ.get("RAILWAY_ENVIRONMENT"):
    raise RuntimeError("API_SECRET must be set in production")

CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app = FastAPI(
    title="Inkwell",
    openapi_url=None if API_SECRET else "/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_api_key(request: Request):
    if API_SECRET is None:
        return
    # Browsers send Sec-Fetch-Site automatically (can't be spoofed by JS).
    # same-origin = the React frontend served from this same server.
    if request.headers.get("Sec-Fetch-Site") == "same-origin":
        return
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth[len("Bearer "):]
    if not hmac.compare_digest(token, API_SECRET):
        raise HTTPException(status_code=401, detail="Invalid bearer token")

TODO_ORDER_FILE = Path(__file__).resolve().parent.parent / "data" / "todo_order.json"


def _load_todo_order() -> List[str]:
    if TODO_ORDER_FILE.exists():
        return json.loads(TODO_ORDER_FILE.read_text())
    return []


def _save_todo_order(order: List[str]):
    TODO_ORDER_FILE.parent.mkdir(parents=True, exist_ok=True)
    TODO_ORDER_FILE.write_text(json.dumps(order))


# --- Notes ---


@app.get("/api/notes")
def list_notes(start_cursor: Optional[str] = None, page_size: int = 20, tag: Optional[str] = None, _auth=Depends(verify_api_key)):
    return nc.list_notes(start_cursor=start_cursor, page_size=page_size, tag=tag)


@app.get("/api/notes/archived")
def list_archived_notes(_auth=Depends(verify_api_key)):
    return {"results": nc.list_archived_notes()}


@app.get("/api/notes/pinned")
def list_pinned_notes(_auth=Depends(verify_api_key)):
    return {"results": nc.list_pinned_notes()}


@app.get("/api/notes/search")
def search_notes(q: str, _auth=Depends(verify_api_key)):
    return {"results": nc.search_notes(q)}


@app.get("/api/notes/{note_id}")
def get_note(note_id: str, _auth=Depends(verify_api_key)):
    try:
        return nc.get_page(note_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


class CreateNoteBody(BaseModel):
    title: str
    tags: Optional[Union[List[str], str]] = None
    body: Optional[str] = None


@app.post("/api/notes", status_code=201)
def create_note(payload: CreateNoteBody, _auth=Depends(verify_api_key)):
    tags = payload.tags
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    return nc.create_page(payload.title, tags=tags, body=payload.body)


class UpdateNoteBody(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    done: Optional[bool] = None
    pinned: Optional[bool] = None


@app.patch("/api/notes/{note_id}")
def update_note(note_id: str, payload: UpdateNoteBody, _auth=Depends(verify_api_key)):
    properties: dict = {}
    if payload.title is not None:
        properties["Name"] = {"title": [{"text": {"content": payload.title}}]}
    if payload.tags is not None:
        properties["Tags"] = {"multi_select": [{"name": t} for t in payload.tags]}
    if payload.notes is not None:
        properties["Notes"] = {"rich_text": [{"text": {"content": payload.notes}}]}
    if payload.done is not None:
        properties["Done"] = {"checkbox": payload.done}
    if payload.pinned is not None:
        properties["Pinned"] = {"checkbox": payload.pinned}
    if not properties:
        raise HTTPException(status_code=400, detail="No fields to update")
    return nc.update_page(note_id, properties)


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str, _auth=Depends(verify_api_key)):
    return nc.update_page(note_id, {"Archived": {"checkbox": True}})


@app.post("/api/notes/{note_id}/restore")
def restore_note(note_id: str, _auth=Depends(verify_api_key)):
    return nc.update_page(note_id, {"Archived": {"checkbox": False}})


@app.delete("/api/notes/{note_id}/permanent")
def permanent_delete_note(note_id: str, _auth=Depends(verify_api_key)):
    return nc.archive_page(note_id)


ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")


@app.post("/api/notes/{note_id}/expand")
def expand_note(note_id: str, _auth=Depends(verify_api_key)):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=501, detail="AI expansion not configured")
    import anthropic
    page = nc.get_page(note_id)
    context = f"Title: {page['title']}"
    if page.get("tags"):
        context += f"\nTags: {', '.join(page['tags'])}"
    if page.get("notes"):
        context += f"\nNotes: {page['notes']}"
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=512,
        system=(
            "You are a thought partner helping someone develop an idea. "
            "Given the note title and any existing context, generate 4-5 specific, "
            "open-ended questions that help explore the idea deeper. Be specific to "
            "the topic. Do not be generic. Return only the questions, one per line, "
            "without numbering or bullets."
        ),
        messages=[{"role": "user", "content": context}],
    )
    raw = message.content[0].text.strip()
    prompts = [q.strip() for q in raw.split("\n") if q.strip()]
    return {"prompts": prompts}


class PublishPageBody(BaseModel):
    title: str
    content: str


@app.post("/api/notes/{note_id}/publish", status_code=201)
def publish_page(note_id: str, payload: PublishPageBody, _auth=Depends(verify_api_key)):
    blocks = nc.parse_content_to_blocks(payload.content)
    if not blocks:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    return nc.create_child_page(note_id, payload.title, blocks)


# --- Pages ---


@app.get("/api/pages")
def list_pages(_auth=Depends(verify_api_key)):
    return {"results": nc.list_child_pages()}


@app.delete("/api/pages/{page_id}")
def delete_page(page_id: str, _auth=Depends(verify_api_key)):
    return nc.archive_page(page_id)


# --- Todos ---


@app.get("/api/todos")
def list_todos(_auth=Depends(verify_api_key)):
    todos = nc.list_todos()
    order = _load_todo_order()
    order_map = {pid: i for i, pid in enumerate(order)}
    todos.sort(key=lambda t: order_map.get(t["id"], len(order)))
    return {"results": todos}


class TodoOrderBody(BaseModel):
    order: List[str]


@app.patch("/api/todos/order")
def update_todo_order(payload: TodoOrderBody, _auth=Depends(verify_api_key)):
    _save_todo_order(payload.order)
    return {"ok": True}


# --- Notifications ---


@app.post("/api/notifications/send-todos")
def send_todos(_auth=Depends(verify_api_key)):
    if not TWILIO_CONFIGURED:
        raise HTTPException(status_code=503, detail="Twilio not configured")
    from notify import send_todo_sms
    return send_todo_sms()


# --- Static files (production) ---

DIST_DIR = Path(__file__).resolve().parent.parent / "web" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")
