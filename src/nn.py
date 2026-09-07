#!/usr/bin/env python3
"""nn — Quick capture to Notion. Jot a thought, read it back.

Usage: see docs/cli-usage.md
"""

import argparse
import subprocess
import sys
from datetime import datetime, timezone

from notion_client import (
    create_page,
    list_notes,
    search_notes,
)

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


def format_entry(entry):
    """Format a serialized entry dict for terminal display."""
    text = entry["title"] or "(empty)"
    date = friendly_date(entry["created_time"])
    tags = entry.get("tags", [])
    tag_str = "  " + " ".join(f"{CYAN}#{t}{RESET}" for t in tags) if tags else ""
    return f"  {DIM}{MUTED_PURPLE}[{date}]{RESET}  {BOLD}{text}{RESET}{tag_str}"


def capture(text, tags=None, body=None):
    """Add a new entry to the Quick Capture database."""
    create_page(text, tags=tags, body=body)
    parts = [f"{GREEN}Captured:{RESET} {BOLD}{text}{RESET}"]
    if tags:
        parts.append("  " + " ".join(f"{CYAN}#{t}{RESET}" for t in tags))
    print("".join(parts))


def read_recent(n=5):
    """Show the last N entries."""
    data = list_notes(page_size=n)
    if not data["results"]:
        print("No entries yet.")
        return
    for entry in data["results"]:
        print(format_entry(entry))


def search(query):
    """Search entries by keyword."""
    results = search_notes(query)
    if not results:
        print(f"No results for '{query}'.")
        return
    for entry in results:
        print(format_entry(entry))


def start_web():
    """Launch the web dashboard."""
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "server:app", "--reload", "--port", "8000"],
        cwd=str(__import__("pathlib").Path(__file__).resolve().parent),
    )


def main():
    parser = argparse.ArgumentParser(prog="nn", description="Quick capture to Notion")
    parser.add_argument("thought", nargs="*", help="Text to capture")
    parser.add_argument("-t", "--tag", action="append", default=[], help="Tag (repeatable, or comma-separated)")
    parser.add_argument("-b", "--body", type=str, default=None, help="Extended body text")
    parser.add_argument("--search", type=str, default=None, help="Search entries by keyword")
    parser.add_argument("--last", type=int, default=None, help="Show last N entries")
    parser.add_argument("--web", action="store_true", help="Launch web dashboard")

    args = parser.parse_args()

    if args.web:
        start_web()
    elif args.search:
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
