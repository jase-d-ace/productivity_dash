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
    pinned = props.get("Pinned", {}).get("checkbox", False)
    archived = props.get("Archived", {}).get("checkbox", False)

    return {
        "id": page["id"],
        "title": title_arr[0]["plain_text"] if title_arr else "",
        "tags": [t["name"] for t in tags_arr],
        "notes": notes_arr[0]["plain_text"] if notes_arr else "",
        "created_time": page["created_time"],
        "done": done,
        "pinned": pinned,
        "archived": archived,
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
    """List notes with pagination, excluding pinned and archived. Returns {results, has_more, next_cursor}."""
    params: dict = {
        "filter": {"and": [
            {"property": "Pinned", "checkbox": {"equals": False}},
            {"property": "Archived", "checkbox": {"equals": False}},
        ]},
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


def list_pinned_notes() -> list[dict]:
    """List notes where Pinned is checked, excluding archived."""
    data = query_db(
        filter={"and": [
            {"property": "Pinned", "checkbox": {"equals": True}},
            {"property": "Archived", "checkbox": {"equals": False}},
        ]},
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
    )
    return [_serialize_page(p) for p in data["results"]]


def list_archived_notes() -> list[dict]:
    """List notes where Archived is checked."""
    data = query_db(
        filter={"property": "Archived", "checkbox": {"equals": True}},
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
    )
    return [_serialize_page(p) for p in data["results"]]


def search_notes(query: str) -> list[dict]:
    """Search entries by title keyword, excluding archived."""
    data = query_db(
        filter={"and": [
            {"property": "Name", "title": {"contains": query}},
            {"property": "Archived", "checkbox": {"equals": False}},
        ]},
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


def _parse_inline(text: str) -> list[dict]:
    """Parse inline markdown into Notion rich_text spans."""
    import re
    spans: list[dict] = []
    # Pattern matches: [text](url), **bold**, *italic*, ~~strike~~, `code`
    pattern = re.compile(
        r'\[([^\]]+)\]\(([^)]+)\)'   # link
        r'|\*\*(.+?)\*\*'            # bold
        r'|\*(.+?)\*'                # italic
        r'|~~(.+?)~~'                # strikethrough
        r'|`(.+?)`'                  # code
    )
    last = 0
    for m in pattern.finditer(text):
        if m.start() > last:
            spans.append({"type": "text", "text": {"content": text[last:m.start()]}})
        if m.group(1) is not None:
            spans.append({"type": "text", "text": {"content": m.group(1), "link": {"url": m.group(2)}}})
        elif m.group(3) is not None:
            spans.append({"type": "text", "text": {"content": m.group(3)}, "annotations": {"bold": True}})
        elif m.group(4) is not None:
            spans.append({"type": "text", "text": {"content": m.group(4)}, "annotations": {"italic": True}})
        elif m.group(5) is not None:
            spans.append({"type": "text", "text": {"content": m.group(5)}, "annotations": {"strikethrough": True}})
        elif m.group(6) is not None:
            spans.append({"type": "text", "text": {"content": m.group(6)}, "annotations": {"code": True}})
        last = m.end()
    if last < len(text):
        spans.append({"type": "text", "text": {"content": text[last:]}})
    if not spans:
        spans.append({"type": "text", "text": {"content": text}})
    return spans


def _block(block_type: str, text: str, **extra: object) -> dict:
    """Build a Notion block dict with inline markdown parsing."""
    return {"object": "block", "type": block_type, block_type: {"rich_text": _parse_inline(text), **extra}}


def parse_content_to_blocks(content: str) -> list[dict]:
    """Parse markdown content into Notion blocks."""
    import re
    blocks: list[dict] = []
    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped == "---" or stripped == "***" or stripped == "___":
            blocks.append({"object": "block", "type": "divider", "divider": {}})
        elif stripped.startswith("### "):
            blocks.append(_block("heading_3", stripped[4:]))
        elif stripped.startswith("## "):
            blocks.append(_block("heading_2", stripped[3:]))
        elif stripped.startswith("# "):
            blocks.append(_block("heading_1", stripped[2:]))
        elif stripped.startswith("> "):
            blocks.append(_block("quote", stripped[2:]))
        elif stripped.startswith("- [x] ") or stripped.startswith("* [x] "):
            blocks.append(_block("to_do", stripped[6:], checked=True))
        elif stripped.startswith("- [ ] ") or stripped.startswith("* [ ] "):
            blocks.append(_block("to_do", stripped[6:], checked=False))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            blocks.append(_block("bulleted_list_item", stripped[2:]))
        elif re.match(r"^\d+\.\s", stripped):
            blocks.append(_block("numbered_list_item", re.sub(r"^\d+\.\s", "", stripped)))
        else:
            blocks.append(_block("paragraph", stripped))
    return blocks


def create_child_page(parent_page_id: str, title: str, blocks: list[dict]) -> dict:
    """Create a child page under an existing page."""
    payload = {
        "parent": {"page_id": parent_page_id},
        "properties": {"title": [{"text": {"content": title}}]},
        "children": blocks,
    }
    resp = httpx.post(f"{BASE_URL}/pages", headers=HEADERS, json=payload)
    resp.raise_for_status()
    page = resp.json()
    title_arr = page.get("properties", {}).get("title", {}).get("title", [])
    return {
        "id": page["id"],
        "title": title_arr[0]["plain_text"] if title_arr else title,
        "url": page.get("url", ""),
        "created_time": page["created_time"],
    }


def list_child_pages() -> list[dict]:
    """List all child pages created under database entries."""
    # Get all DB entries first to know which page IDs are parents
    db_pages = query_db(page_size=100)
    parent_ids = {p["id"] for p in db_pages["results"]}

    # Search for all pages, filter to those parented by our DB entries
    results: list[dict] = []
    start_cursor = None
    while True:
        body: dict = {"filter": {"value": "page", "property": "object"}, "page_size": 100}
        if start_cursor:
            body["start_cursor"] = start_cursor
        resp = httpx.post(f"{BASE_URL}/search", headers=HEADERS, json=body)
        resp.raise_for_status()
        data = resp.json()
        for page in data["results"]:
            parent = page.get("parent", {})
            if parent.get("type") == "page_id" and parent.get("page_id") in parent_ids:
                title_arr = page.get("properties", {}).get("title", {}).get("title", [])
                results.append({
                    "id": page["id"],
                    "title": title_arr[0]["plain_text"] if title_arr else "",
                    "url": page.get("url", ""),
                    "created_time": page["created_time"],
                    "parent_id": parent["page_id"],
                })
        if not data.get("has_more"):
            break
        start_cursor = data.get("next_cursor")
    results.sort(key=lambda p: p["created_time"], reverse=True)
    return results


def list_todos() -> list[dict]:
    """List notes tagged with todo/to-do/to do."""
    todo_variants = ["todo", "to-do", "to do"]
    all_results: dict[str, dict] = {}
    for variant in todo_variants:
        try:
            data = query_db(
                filter={"and": [
                    {"property": "Tags", "multi_select": {"contains": variant}},
                    {"property": "Archived", "checkbox": {"equals": False}},
                ]},
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
