# Raycast: Inkwell Quick Capture

## Installation

1. Open Raycast Settings (Cmd+,) > Extensions > Script Commands > Add Script Directory
2. Select the `raycast/` folder in this project
3. The "Inkwell — Quick Capture" command appears immediately

## Usage

### Command

Open Raycast and type:

```
Inkwell — Quick Capture
```

Then type your thought and press Enter.

### Hotkey

1. Open Raycast Settings > Extensions > Script Commands
2. Find "Inkwell — Quick Capture"
3. Click the hotkey field and press your preferred shortcut (e.g. Cmd+Ctrl+N)

Now pressing the hotkey opens the command with the text input ready.

## Troubleshooting

- **"python3 not found"** — Edit `raycast/nn.sh` and adjust the PATH for your Python setup.
- **Notion API errors** — Ensure `.env` exists at the project root with valid `NOTION_API_KEY` and `NOTION_DB_ID`.
