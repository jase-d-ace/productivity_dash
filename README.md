# nn — Quick Capture to Notion

A lightweight tool for capturing thoughts to a Notion database. Access your entries via the terminal CLI, a web dashboard, or a Raycast hotkey.

## Features

- **Capture** thoughts with optional tags and notes
- **Search** entries by keyword
- **Read** recent entries from the terminal
- **Todos** — tag entries with `#todo` to track them as tasks with drag-and-drop reordering; delete from either list
- **Pomodoro timer** — built-in timer widget with 10/15/20/30-minute presets; focus on any todo to associate it with the timer
- **Page editor** — click any note to open a CMS-style editor, write markdown content, and publish it as a child page in Notion
  - Full markdown support: headings, bullets, numbered lists, blockquotes, dividers, checklists, bold, italic, strikethrough, code, and links
  - Auto-continuation for bullets, numbers, blockquotes, and checklists
  - Keyboard shortcuts: Ctrl+B bold, Ctrl+I italic, Ctrl+K link
  - Live preview with rendered formatting
  - Integrated Pomodoro timer with the current note as the active task
- **Pages widget** — dashboard widget listing all published child pages with direct links to Notion
- **Web dashboard** — single-page UI with Notes, Pomodoro, Todos, and Pages widgets
- **Raycast integration** for GUI capture via hotkey

## Setup

### 1. Notion

1. Create a [Notion integration](https://www.notion.so/my-integrations) and copy the API key
2. Create a Notion database with these columns:
   - **Name** (title)
   - **Tags** (multi-select)
   - **Notes** (rich text)
   - **Done** (checkbox)
3. Share the database with your integration (click "..." > "Connections" > add your integration)
4. Copy the database ID from the URL: `notion.so/<DATABASE_ID>?v=...`

See [docs/setup-guide.md](docs/setup-guide.md) for detailed instructions.

### 2. Install dependencies

```bash
# CLI / backend
pip install httpx python-dotenv fastapi uvicorn

# Web dashboard
cd web && npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your Notion API key and database ID
```

## Usage

### CLI

```bash
# Capture a thought
nn "buy milk"

# Capture with tags
nn "try rust for CLI tools" -t ideas,dev

# Capture with tags and a body
nn "project idea" -t ideas -b "A CLI dashboard for Notion entries"

# Show last 5 entries
nn

# Show last N entries
nn --last 10

# Search by keyword
nn --search "milk"
```

If you haven't set up the `nn` alias, use `python3 src/nn.py` instead.

See [docs/cli-usage.md](docs/cli-usage.md) for full CLI reference.

### Web dashboard

```bash
# Start the backend API
nn --web

# In another terminal, start the frontend
cd web && npm run dev
```

Open http://localhost:5173 to view the dashboard. Notes, Pomodoro, Todos, and Pages appear as widgets on a single page. Click any note to open the page editor. The frontend proxies API requests to the backend on port 8000.

### Raycast

1. Open Raycast Settings > Extensions > Script Commands > Add Script Directory
2. Select the `raycast/` folder
3. Assign a hotkey (e.g. Cmd+Ctrl+N) to "Quick Capture to Notion"

See [docs/raycast-usage.md](docs/raycast-usage.md) for details.

## Project Structure

```
src/nn.py              # CLI tool (capture, search, read)
src/notion_client.py   # Notion API client
src/server.py          # FastAPI backend (/api endpoints)
web/                   # Vite + React + TypeScript frontend
raycast/nn.sh          # Raycast script command
docs/                  # Setup guides, usage docs, roadmap
.env.example           # Template for environment variables
```

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features.
