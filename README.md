# nn — Quick Capture to Notion

A lightweight CLI tool for capturing thoughts to a Notion database. Includes a Raycast script command for hotkey-driven capture without leaving your current app.

## Features

- **Capture** thoughts with optional tags and notes
- **Search** entries by keyword
- **Read** recent entries from the terminal
- **Raycast integration** for GUI capture via hotkey

## Setup

### 1. Notion

1. Create a [Notion integration](https://www.notion.so/my-integrations) and copy the API key
2. Create a Notion database with these columns:
   - **Name** (title)
   - **Tags** (multi-select)
   - **Notes** (rich text)
3. Share the database with your integration (click "..." > "Connections" > add your integration)
4. Copy the database ID from the URL: `notion.so/<DATABASE_ID>?v=...`

See [docs/setup-guide.md](docs/setup-guide.md) for detailed instructions.

### 2. Install dependencies

```bash
pip install httpx python-dotenv
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
python3 src/nn.py "buy milk"

# Capture with tags
python3 src/nn.py "try rust for CLI tools" -t ideas,dev

# Capture with tags and a body
python3 src/nn.py "project idea" -t ideas -b "A CLI dashboard for Notion entries"

# Show last 5 entries
python3 src/nn.py

# Show last N entries
python3 src/nn.py --last 10

# Search by keyword
python3 src/nn.py --search "milk"
```

See [docs/cli-usage.md](docs/cli-usage.md) for full CLI reference.

### Raycast

1. Open Raycast Settings > Extensions > Script Commands > Add Script Directory
2. Select the `raycast/` folder
3. Assign a hotkey (e.g. Cmd+Ctrl+N) to "Quick Capture to Notion"

See [docs/raycast-usage.md](docs/raycast-usage.md) for details.

## Project Structure

```
src/nn.py          # Core CLI tool
raycast/nn.sh      # Raycast script command
docs/              # Setup guides, usage docs, roadmap
.env.example       # Template for environment variables
```

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features including styled output, a TUI dashboard, and CRUD operations.
