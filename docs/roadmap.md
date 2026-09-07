# Roadmap

What's done and what's next. Items are roughly ordered within each section. Check off as completed.

---

## Done

- [x] Notion database + integration setup
- [x] CLI tool (`nn`) — capture, read recent, search
- [x] Raycast script command with hotkey support

---

## Write: Richer Capture

### 1. Tags support
Add optional tags to captures for easier filtering later.

```
nn "buy milk" -t errands
nn "try rust for CLI tools" -t ideas,dev
```

- Add a `--tag` / `-t` flag to `nn.py` that maps to the Notion **Tags** multi-select property
- Update Raycast script to accept an optional second argument for tags
- Auto-create new tag values in Notion on first use

### 2. Extended body / notes
Capture a short title plus a longer body for more fleshed-out thoughts.

```
nn "project idea" -b "A CLI dashboard that shows Notion entries in a TUI with colors and interactive CRUD"
```

- Add a `--body` / `-b` flag that writes to a **paragraph block** inside the Notion page (not just the title)
- In Raycast, consider a second text field or a "press Tab for details" flow

### 3. Source tracking
Automatically tag where a capture came from.

- Set the **Source** select property to `cli`, `raycast`, etc. based on how `nn.py` was invoked
- Pass source via an env var or flag so each capture method identifies itself

---

## Read: Better CLI Output

### 4. Human-readable dates
Show relative or friendly dates instead of raw ISO strings.

```
  [today, 2:30 PM]  buy milk
  [yesterday]        try rust for CLI tools
  [Sep 3]            project idea
```

- Use `datetime` to format created_time relative to now
- Show time-of-day for today's entries, day for this week, date for older

### 5. Styled terminal output
Make `nn` output more scannable and pleasant.

- Add color using ANSI codes (or `rich` library): dim dates, bold titles, colored tags
- Show tags inline: `[today] buy milk  #errands`
- Add a `--compact` / `--verbose` flag to control detail level
- Clean up spacing and alignment

---

## Read: GUI Dashboard

### 6. TUI dashboard (terminal-based)
An interactive terminal UI for browsing and managing captures.

```
nn --dashboard
```

- Use `textual` or `rich` for a terminal dashboard
- Features:
  - Scrollable list of entries with dates, titles, tags
  - Filter/search bar
  - Keyboard shortcuts: `n` new, `e` edit, `d` delete, `/` search, `q` quit
  - Detail pane showing the full body of a selected entry

### 7. CRUD operations
Full create/read/update/delete from the dashboard and CLI.

- `nn edit <id>` — update title, body, or tags of an existing entry
- `nn delete <id>` — archive or delete an entry
- Dashboard inline editing: press Enter on an entry to edit, `d` to delete with confirmation
- Use Notion's page ID (or a short hash of it) as the identifier

### 8. Web dashboard (stretch)
A local web UI for a more visual experience.

- Simple Flask/FastAPI app serving a single-page dashboard
- Same CRUD operations as the TUI
- Runs locally: `nn --web` opens `localhost:8080`

---

## Future Ideas

_Add your own ideas here as they come up._

- [ ] iOS capture via Apple Shortcuts
- [ ] Slack/Telegram bot integration
- [ ] Browser extension for clipping text + URL
- [ ] Daily digest email of recent captures
- [ ] Export/backup to markdown files
- [ ] Multiple databases / notebooks
- [ ] RAG operations to fetch and synthesize information
- [ ] Writing full notion pages to expand on notes
