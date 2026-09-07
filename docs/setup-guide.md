# Notion Setup Guide

Step-by-step instructions to get your Notion instance ready for Quick Capture.

---

## Step 1: Create a Notion Account

1. Go to https://www.notion.so/signup
2. Sign up (free plan works fine)
3. Create a workspace (or use the default one)

---

## Step 2: Create the Quick Capture Database

1. In your workspace, create a new **full-page database** (not inline)
   - Click "New page" in the sidebar
   - Choose "Table" as the database type
   - Name it **"Quick Capture"** (or "Inbox", whatever you prefer)

2. Set up these properties (columns):

| Property | Type | Notes |
|----------|------|-------|
| Name | Title | The thought/note itself (this is the default first column) |
| Tags | Multi-select | Optional categorization — add options as you go |
| Source | Select | How it was captured: `cli`, `alfred`, `siri`, `manual` |

The "Created time" is automatically tracked by Notion on every page, so no need to add it as a property.

3. **Copy the database ID** — you'll need this later:
   - Open the database as a full page
   - Look at the URL: `https://www.notion.so/yourworkspace/DATABASE_ID?v=...`
   - The `DATABASE_ID` is the 32-character hex string before the `?`
   - Example: `https://www.notion.so/jase/a1b2c3d4e5f6...` → the ID is `a1b2c3d4e5f6...`

---

## Step 3: Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"New integration"**
3. Fill in:
   - **Name**: `Quick Capture` (or anything you like)
   - **Associated workspace**: Select your workspace
   - **Capabilities**: Make sure **Read content**, **Insert content**, and **Update content** are checked
4. Click **Submit**
5. **Copy the Internal Integration Secret** (starts with `ntn_` or `secret_`)

---

## Step 4: Connect the Integration to Your Database

This is the step people often miss:

1. Go back to your Quick Capture database page in Notion
2. Click the **"..." menu** (top right)
3. Go to **"Connections"** (or "Add connections")
4. Search for your integration name ("Quick Capture")
5. Click **Confirm**

Without this step, the API will return 404 errors even with a valid key.

---

## Step 5: Configure the Project

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```
   NOTION_API_KEY=ntn_your_secret_here
   NOTION_DATABASE_ID=your_32_char_database_id_here
   ```

---

## Verification

Once the CLI tool is built, you can verify everything works:

```bash
# Add a test entry
nn "hello from quick capture"

# Read it back
nn
```

If you see errors, the most common issues are:
- Integration not connected to the database (Step 4)
- Wrong database ID (Step 2)
- API key typo (Step 3)
