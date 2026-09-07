# Inkwell — CLI Usage

A terminal command for capturing thoughts to Notion.

## Setup

The `nn` alias is added to `~/.zshrc`:

```bash
alias nn="python3 /Users/jase/playground/notion_connector/src/nn.py"
```

After adding, run `source ~/.zshrc` or open a new terminal tab.

## Commands

```bash
# Capture a thought
nn "buy milk"
nn remember to call dentist

# Show last 5 entries
nn

# Show last N entries
nn --last 10

# Search by keyword
nn --search "milk"

# Help
nn --help
```

## Notes

- Quotes around the thought are optional but recommended for text with special characters.
- Without quotes, all arguments are joined into a single entry.
- Search matches against the title/name of entries.

## Configuration

Requires a `.env` file in the project root with:

```
NOTION_API_KEY=ntn_...
NOTION_DB_ID=...
```

See [setup-guide.md](setup-guide.md) for how to get these values.
