# Inkwell - Requirements & Workflow

## Vision

A central "brain dump" spot in Notion where random thoughts, ideas, and notes land instantly — without ever opening Notion in a browser or phone app.

---

## 1. Notion Setup (Prerequisites)

- [ ] Create a Notion account (free tier is fine)
- [ ] Create a workspace
- [ ] Create a **single database page** (e.g., "Inbox" or "Inkwell") with basic properties:
  - **Title** (text) — the thought/note
  - **Created** (date, auto) — when it was captured
  - **Tags** (multi-select, optional) — lightweight categorization
  - **Source** (select, optional) — how it was captured (cli, shortcut, siri, etc.)
- [ ] Create a **Notion Integration** (internal) at https://www.notion.so/my-integrations
  - Get the API key (secret token)
  - Share the database with the integration

---

## 2. Core Features

### 2a. Write (Capture)

Send a thought to Notion with minimal friction. The input is just text — it becomes a new row in the database.

### 2b. Read (Quick Glance)

Pull recent entries back. Useful for reviewing what you've captured — latest N items, or search by keyword/tag.

---

## 3. Frictionless Capture Methods (Ranked by Friction)

The whole point is: **thought → captured in under 5 seconds, no context switching.**

### Tier 1: Lowest Friction (no app switching at all)

| Method | How it works | Platform |
|--------|-------------|----------|
| **CLI one-liner** | `nn "buy milk"` — a shell alias/script that hits Notion API | Terminal (macOS) |
| **Raycast / Alfred extension** | Global hotkey → type thought → Enter → done | macOS |
| **Apple Shortcut + Siri** | "Hey Siri, capture 'buy milk'" → Shortcut calls Notion API | iOS / macOS |
| **Global keyboard shortcut** | Hotkey opens a tiny input window, type, Enter, gone | macOS |

### Tier 2: Low Friction (minimal app switching)

| Method | How it works | Platform |
|--------|-------------|----------|
| **iOS Share Sheet** | Highlight text anywhere → Share → "Send to Notion" | iOS |
| **Telegram / Slack bot** | Message a bot, it writes to Notion | Any |
| **Apple Shortcut widget** | Home screen widget → tap → type → done | iOS |
| **Email to Notion** | Forward/send email to a special address → parsed into Notion | Any |

### Tier 3: Nice to Have

| Method | How it works | Platform |
|--------|-------------|----------|
| **Watch complication** | Dictate from Apple Watch | watchOS |
| **Browser extension** | Clip selected text + URL to Notion | Chrome/Safari |

---

## 4. Recommended MVP Scope

Start small, expand later:

1. **Notion setup** — database + integration + API key
2. **CLI tool** (`nn`) — a single script that:
   - `nn "some thought"` → creates a new entry
   - `nn` (no args) → shows last 5 entries
   - `nn --search "keyword"` → searches entries
3. **Alfred workflow** — global hotkey for GUI capture without leaving current app

### Why CLI first?
- You're already in the terminal (you're using Claude Code right now)
- Zero dependencies beyond `curl` or a simple Python/Node script
- Foundation for everything else — the other methods can call the same API logic

---

## 5. Tech Decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| Language | **Python** | Mature `notion-client` SDK |
| GUI Capture | **Alfred workflow** | Global hotkey → type → Enter → done |
| Platform | **macOS first** | iOS scoped out for later |
| Auth | Environment variable (`NOTION_API_KEY`) | Stored in `.env` or shell profile |
| Config | `.env` file | Database ID, API key |
| Packaging | pip install (editable) + shell alias | `nn` alias points to Python script |

---

## 6. Project Structure (Proposed)

```
notion_connector/
  docs/              # This folder — planning & documentation
    requirements.md  # This file
    setup-guide.md   # Step-by-step Notion setup instructions
  src/               # Actual code lives here
  .env.example       # Template for secrets
  .gitignore
  README.md
```

---

## 7. Open Questions

- [x] ~~Python or Node or pure shell?~~ → **Python**
- [x] ~~Do you use Raycast or Alfred?~~ → **Alfred**
- [x] ~~iOS capture too?~~ → **macOS first, iOS later**
- [ ] Any specific tags/categories you already know you want?

---

## Next Steps

1. Align on these requirements
2. Set up Notion (account, database, integration)
3. Build the CLI tool
4. Add a GUI capture method
