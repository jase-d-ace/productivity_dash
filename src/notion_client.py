"""Notion API client — pure data, no CLI formatting."""

from __future__ import annotations

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_KEY = os.environ["NOTION_API_KEY"]
DATABASE_ID = os.environ["NOTION_DB_ID"]
BASE_URL = "https://api.notion.com/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


def _serialize_page(page: dict) -> dict:
    """Convert a Notion page object to a flat dict."""
    props = page["properties"]
    title_arr = props.get("Name", {}).get("title", [])
    tags_arr = props.get("Tags", {}).get("multi_select", [])
    notes_arr = props.get("Notes", {}).get("rich_text", [])
    done = props.get("Done", {}).get("checkbox", False)

    return {
        "id": page["id"],
        "title": title_arr[0]["plain_text"] if title_arr else "",
        "tags": [t["name"] for t in tags_arr],
        "notes": notes_arr[0]["plain_text"] if notes_arr else "",
        "created_time": page["created_time"],
        "done": done,
    }


def query_db(**kwargs) -> dict:
    """Query the database, returning raw Notion response."""
    resp = httpx.post(
        f"{BASE_URL}/databases/{DATABASE_ID}/query",
        headers=HEADERS,
        json=kwargs,
    )
    resp.raise_for_status()
    return resp.json()


def list_notes(start_cursor: str | None = None, page_size: int = 20) -> dict:
    """List notes with pagination. Returns {results, has_more, next_cursor}."""
    params: dict = {
        "sorts": [{"timestamp": "created_time", "direction": "descending"}],
        "page_size": page_size,
    }
    if start_cursor:
        params["start_cursor"] = start_cursor
    data = query_db(**params)
    return {
        "results": [_serialize_page(p) for p in data["results"]],
        "has_more": data.get("has_more", False),
        "next_cursor": data.get("next_cursor"),
    }


def search_notes(query: str) -> list[dict]:
    """Search entries by title keyword."""
    data = query_db(
        filter={"property": "Name", "title": {"contains": query}},
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
    )
    return [_serialize_page(p) for p in data["results"]]


def get_page(page_id: str) -> dict:
    """Get a single page by ID."""
    resp = httpx.get(f"{BASE_URL}/pages/{page_id}", headers=HEADERS)
    resp.raise_for_status()
    return _serialize_page(resp.json())


def create_page(title: str, tags: list[str] | None = None, body: str | None = None) -> dict:
    """Create a new entry. Returns serialized page."""
    properties: dict = {"Name": {"title": [{"text": {"content": title}}]}}
    if tags:
        properties["Tags"] = {"multi_select": [{"name": t} for t in tags]}
    if body:
        properties["Notes"] = {"rich_text": [{"text": {"content": body}}]}

    payload = {"parent": {"database_id": DATABASE_ID}, "properties": properties}
    resp = httpx.post(f"{BASE_URL}/pages", headers=HEADERS, json=payload)
    resp.raise_for_status()
    return _serialize_page(resp.json())


def update_page(page_id: str, properties: dict) -> dict:
    """Update page properties. Accepts Notion-format properties dict."""
    resp = httpx.patch(
        f"{BASE_URL}/pages/{page_id}",
        headers=HEADERS,
        json={"properties": properties},
    )
    resp.raise_for_status()
    return _serialize_page(resp.json())


def archive_page(page_id: str) -> dict:
    """Archive (soft-delete) a page."""
    resp = httpx.patch(
        f"{BASE_URL}/pages/{page_id}",
        headers=HEADERS,
        json={"archived": True},
    )
    resp.raise_for_status()
    return {"id": page_id, "archived": True}


def list_todos() -> list[dict]:
    """List notes tagged with todo/to-do/to do."""
    todo_variants = ["todo", "to-do", "to do"]
    all_results: dict[str, dict] = {}
    for variant in todo_variants:
        try:
            data = query_db(
                filter={"property": "Tags", "multi_select": {"contains": variant}},
                sorts=[{"timestamp": "created_time", "direction": "descending"}],
            )
        except httpx.HTTPStatusError as e:
            body = e.response.json() if e.response.status_code == 400 else {}
            if body.get("code") == "validation_error" and "not found" in body.get("message", ""):
                continue
            raise
        for p in data["results"]:
            page = _serialize_page(p)
            all_results[page["id"]] = page
    return list(all_results.values())
