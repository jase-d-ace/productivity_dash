"""FastAPI backend for the Notion Quick Capture web dashboard."""

import json
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import notion_client as nc

app = FastAPI(title="Notion Quick Capture")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def list_notes(start_cursor: Optional[str] = None, page_size: int = 20):
    return nc.list_notes(start_cursor=start_cursor, page_size=page_size)


@app.get("/api/notes/search")
def search_notes(q: str):
    return {"results": nc.search_notes(q)}


@app.get("/api/notes/{note_id}")
def get_note(note_id: str):
    try:
        return nc.get_page(note_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


class CreateNoteBody(BaseModel):
    title: str
    tags: Optional[List[str]] = None
    body: Optional[str] = None


@app.post("/api/notes", status_code=201)
def create_note(payload: CreateNoteBody):
    return nc.create_page(payload.title, tags=payload.tags, body=payload.body)


class UpdateNoteBody(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    done: Optional[bool] = None


@app.patch("/api/notes/{note_id}")
def update_note(note_id: str, payload: UpdateNoteBody):
    properties: dict = {}
    if payload.title is not None:
        properties["Name"] = {"title": [{"text": {"content": payload.title}}]}
    if payload.tags is not None:
        properties["Tags"] = {"multi_select": [{"name": t} for t in payload.tags]}
    if payload.notes is not None:
        properties["Notes"] = {"rich_text": [{"text": {"content": payload.notes}}]}
    if payload.done is not None:
        properties["Done"] = {"checkbox": payload.done}
    if not properties:
        raise HTTPException(status_code=400, detail="No fields to update")
    return nc.update_page(note_id, properties)


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str):
    return nc.archive_page(note_id)


class PublishPageBody(BaseModel):
    title: str
    content: str


@app.post("/api/notes/{note_id}/publish", status_code=201)
def publish_page(note_id: str, payload: PublishPageBody):
    blocks = nc.parse_content_to_blocks(payload.content)
    if not blocks:
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    return nc.create_child_page(note_id, payload.title, blocks)


# --- Pages ---


@app.get("/api/pages")
def list_pages():
    return {"results": nc.list_child_pages()}


# --- Todos ---


@app.get("/api/todos")
def list_todos():
    todos = nc.list_todos()
    order = _load_todo_order()
    order_map = {pid: i for i, pid in enumerate(order)}
    todos.sort(key=lambda t: order_map.get(t["id"], len(order)))
    return {"results": todos}


class TodoOrderBody(BaseModel):
    order: List[str]


@app.patch("/api/todos/order")
def update_todo_order(payload: TodoOrderBody):
    _save_todo_order(payload.order)
    return {"ok": True}


# --- Static files (production) ---

DIST_DIR = Path(__file__).resolve().parent.parent / "web" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")
