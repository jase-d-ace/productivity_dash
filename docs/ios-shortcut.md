# iOS Shortcut: Quick Capture to Notion

Capture thoughts from your iPhone or iPad with a single tap.

## Prerequisites

- The server must be publicly accessible (e.g. deployed to a VPS, Fly.io, Railway, etc.)
- `API_SECRET` must be set in your server's environment variables (see below)

## Setting up API_SECRET

`API_SECRET` is a password you make up yourself. It's a shared secret between your server and your iOS Shortcut so that only you can create notes.

1. Generate a random secret (or just pick a long, hard-to-guess string):

   ```bash
   openssl rand -hex 32
   ```

2. Add it to your server's `.env` file:

   ```
   API_SECRET=your-generated-secret-here
   ```

3. Use that same value in your iOS Shortcut's `Authorization` header as `Bearer your-generated-secret-here`

Without this, anyone who discovers your server URL could create notes in your Notion database.

## Create the Shortcut

1. Open the **Shortcuts** app on your iPhone/iPad
2. Tap **+** in the top-right to create a new shortcut
3. Tap the name at the top and rename it to **Quick Capture to Notion**
4. Add the following actions in order:

### Action 1: Ask for Input

- Search for **Ask for Input** and add it
- Set Type to **Text**
- Set Prompt to `What's on your mind?`

### Action 2: Get Contents of URL

- Search for **Get Contents of URL** and add it
- Set URL to `https://your-server.com/api/notes` (replace with your actual server URL)
- Tap **Show More** and configure:
  - **Method**: POST
  - **Headers**: add one header:
    - Key: `Authorization`
    - Value: `Bearer YOUR_API_SECRET` (replace with your actual secret)
  - **Request Body**: JSON
    - Add a field: Key = `title`, Type = Text, Value = select **Provided Input** from the variable list

### Action 3: Show Notification

- Search for **Show Notification** and add it
- Set the message to `Saved to Notion`

5. Tap **Done**

## Add to Home Screen

1. Open the shortcut's settings (tap the **...** icon on the shortcut tile)
2. Tap the **share icon** (bottom of the screen)
3. Select **Add to Home Screen**
4. Choose an icon and tap **Add**

Now you have a one-tap capture button on your home screen.

## Troubleshooting

- **"401 Unauthorized"** -- Double-check that the `Authorization` header value matches `Bearer <your API_SECRET>` exactly. There must be a space after `Bearer`.
- **"Could not connect to the server"** -- Make sure the server URL is correct and the server is running. Try opening the URL in Safari first.
- **Nothing appears in Notion** -- Verify that `NOTION_API_KEY` and `NOTION_DB_ID` are set correctly on the server. Check the server logs for errors.
- **Shortcut stops working after a while** -- iOS may pause network requests for shortcuts that haven't been used recently. Just run it again and it should reconnect.
