#!/usr/bin/env python3
"""nn — Quick capture to Notion. Jot a thought, read it back.

Usage: see docs/cli-usage.md
"""

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_KEY = os.environ["NOTION_API_KEY"]
DATABASE_ID = os.environ["NOTION_DB_ID"]
BASE_URL = "https://api.notion.com/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


DIM = "\033[2m"
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
MUTED_PURPLE = "\033[38;5;141m"


def friendly_date(iso_str):
    """Format an ISO timestamp into a human-readable relative date."""
    dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    local_dt = dt.astimezone()
    delta_days = (now.date() - dt.date()).days

    if delta_days == 0:
        return f"today, {local_dt.strftime('%-I:%M %p').lower()}"
    if delta_days == 1:
        return "yesterday"
    if delta_days < 7:
        return local_dt.strftime("%A").lower()
    if now.year == dt.year:
        return local_dt.strftime("%b %-d")
    return local_dt.strftime("%b %-d, %Y")


def format_entry(page):
    """Format a single database entry for terminal display."""
    title = page["properties"]["Name"]["title"]
    text = title[0]["plain_text"] if title else "(empty)"
    date = friendly_date(page["created_time"])

    tags_prop = page["properties"].get("Tags", {}).get("multi_select", [])
    tag_str = "  " + " ".join(f"{CYAN}#{t['name']}{RESET}" for t in tags_prop) if tags_prop else ""

    return f"  {DIM}{MUTED_PURPLE}[{date}]{RESET}  {BOLD}{text}{RESET}{tag_str}"


def capture(text, tags=None, body=None):
    """Add a new entry to the Quick Capture database."""
    properties = {"Name": {"title": [{"text": {"content": text}}]}}
    if tags:
        properties["Tags"] = {"multi_select": [{"name": t} for t in tags]}
    if body:
        properties["Notes"] = {"rich_text": [{"text": {"content": body}}]}

    payload = {"parent": {"database_id": DATABASE_ID}, "properties": properties}

    resp = httpx.post(f"{BASE_URL}/pages", headers=HEADERS, json=payload)
    resp.raise_for_status()
    parts = [f"{GREEN}Captured:{RESET} {BOLD}{text}{RESET}"]
    if tags:
        parts.append("  " + " ".join(f"{CYAN}#{t}{RESET}" for t in tags))
    print("".join(parts))


def query_db(**kwargs):
    """Query the database."""
    resp = httpx.post(
        f"{BASE_URL}/databases/{DATABASE_ID}/query",
        headers=HEADERS,
        json=kwargs,
    )
    resp.raise_for_status()
    return resp.json()


def read_recent(n=5):
    """Show the last N entries."""
    results = query_db(
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
        page_size=n,
    )
    if not results["results"]:
        print("No entries yet.")
        return

    for page in results["results"]:
        print(format_entry(page))


def search(query):
    """Search entries by keyword."""
    results = query_db(
        filter={"property": "Name", "title": {"contains": query}},
        sorts=[{"timestamp": "created_time", "direction": "descending"}],
    )
    if not results["results"]:
        print(f"No results for '{query}'.")
        return

    for page in results["results"]:
        print(format_entry(page))


def main():
    parser = argparse.ArgumentParser(prog="nn", description="Quick capture to Notion")
    parser.add_argument("thought", nargs="*", help="Text to capture")
    parser.add_argument("-t", "--tag", action="append", default=[], help="Tag (repeatable, or comma-separated)")
    parser.add_argument("-b", "--body", type=str, default=None, help="Extended body text")
    parser.add_argument("--search", type=str, default=None, help="Search entries by keyword")
    parser.add_argument("--last", type=int, default=None, help="Show last N entries")

    args = parser.parse_args()

    if args.search:
        search(args.search)
    elif args.last:
        read_recent(args.last)
    elif args.thought:
        tags = []
        for t in args.tag:
            tags.extend(part.strip() for part in t.split(",") if part.strip())
        capture(" ".join(args.thought), tags=tags or None, body=args.body)
    else:
        read_recent()


if __name__ == "__main__":
    main()
