# Feature: Modular Widgets

**Branch:** `feat/modular-widgets`

## What

Allow users to reorder dashboard widgets via drag-and-drop or a control panel. Widget order persists across sessions.

## Design options

### Option A: Drag-and-drop (dnd-kit)
- Already have `@dnd-kit` as a dependency (used in TodoView)
- Each widget becomes a draggable item
- Visual drag handles on widget headers
- Most intuitive, but can be finicky with nested scrollable content (NoteList, TodoView)

### Option B: Control panel / settings
- A gear icon on the dashboard opens a modal or sidebar
- Simple list of widgets with up/down arrows or drag reorder
- Cleaner separation — no drag handles cluttering the UI
- Could also support show/hide toggles per widget

### Option C: Hybrid
- Control panel for ordering + show/hide
- Optional drag-and-drop on the dashboard itself

## Storage

Widget order needs to persist. Options:
- **localStorage** — simplest, per-browser, no backend changes
- **Server-side** (similar to `todo_order.json`) — persists across devices but adds an endpoint
- localStorage is probably fine since this is a single-user app

## Files to modify/create (rough, depends on approach)

| File | Change |
|---|---|
| `web/src/components/Dashboard.tsx` | Render widgets dynamically from an ordered config instead of hardcoded JSX |
| `web/src/components/WidgetSettings.tsx` | **New** — control panel modal/sidebar for reordering and toggling widgets |
| `web/src/hooks/useWidgetOrder.ts` | **New** — custom hook managing widget order state + localStorage persistence |

## Key considerations

- Both columns need to be considered — should users be able to move widgets between columns, or just reorder within their column?
- The Notes widget is full-height in the left column — moving it to the right column would break the layout
- Pinned widget conditionally renders — ordering must handle widgets that aren't always visible
- Adding new features (archive, weekly review) will add more widgets — this system should make that easy

## Verification

1. Reorder widgets via chosen mechanism
2. Refresh page — order should persist
3. Add/remove a conditional widget (e.g. pin something) — layout should adapt
4. Mobile layout should still stack correctly
