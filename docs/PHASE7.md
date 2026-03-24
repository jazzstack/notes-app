# Phase 7: Built-in Plugins

## Goal
Add essential features via plugins to make the app more useful out of the box.

## Implemented Plugins

### 1. Daily Notes Calendar

**Plugin ID:** `calendar`

A calendar view for creating and navigating daily notes.

- **Command:** "Open Daily Notes Calendar" (Cmd+Shift+D)
- **TopBar Button:** Calendar icon on the right
- **Features:**
  - Monthly calendar view
  - Click any date to create/open daily note
  - Dots indicate days with notes
  - Notes saved in format: "Daily Note - YYYY-MM-DD"

**Daily Note Template:**
```markdown
# Daily Note - YYYY-MM-DD

## Today's Goals
- [ ] 

## Notes


## Tasks
- [ ] 

## Tomorrow


```

### 2. Kanban Board

**Plugin ID:** `kanban`

Organize notes in a Kanban board based on task status in note content.

- **Command:** "Open Kanban Board" (Cmd+Shift+K)
- **TopBar Button:** List icon on the right
- **Columns:**
  - Backlog (no task markers)
  - To Do (`- [ ]`)
  - In Progress (`- [in-progress]` or `- [in progress]`)
  - Done (`- [x]`)

**Usage:**
Add task markers in your notes:
```markdown
# My Project

- [ ] This is a todo item
- [in-progress] This is in progress
- [x] This is done
```

### 3. Task Manager

**Plugin ID:** `tasks`

View and manage all tasks across all notes in one place.

- **Command:** "Open Task Manager" (Cmd+Shift+T)
- **TopBar Button:** List icon on the right
- **Features:**
  - Shows all tasks from all notes
  - Filter by: All, Pending, Completed
  - Task statistics (total, pending, completed)
  - Click task to navigate to source note

### 4. Outline Panel

**Plugin ID:** `outline`

Shows table of contents based on markdown headings in the current note.

- **Command:** "Show Outline Panel" (Cmd+Shift+O)
- **Features:**
  - Auto-detects headings (# to ######)
  - Click heading to navigate (scroll to view)
  - Updates on content change via editor hook
  - Hierarchical indentation based on heading level

## File Structure

```
apps/desktop/src/
├── plugins/
│   ├── builtins/
│   │   ├── calendar.tsx    # Daily notes calendar
│   │   ├── kanban.tsx     # Kanban board
│   │   ├── tasks.tsx      # Task manager
│   │   └── outline.tsx    # Outline panel
│   └── viewManager.tsx    # Plugin view rendering
```

## CSS Styles

Plugin views have dedicated styles in `apps/desktop/src/styles/plugins.css`:

- `.plugin-modal-overlay` - Modal backdrop
- `.plugin-modal` - Modal container
- `.calendar-plugin` - Calendar styles
- `.kanban-board`, `.kanban-column`, `.kanban-card` - Kanban styles
- `.tasks-stats`, `.tasks-filter`, `.tasks-list` - Task manager styles
- `.outline-panel`, `.outline-item` - Outline styles

## Keyboard Shortcuts

| Plugin | Shortcut |
|--------|----------|
| Calendar | Cmd+Shift+D |
| Kanban | Cmd+Shift+K |
| Tasks | Cmd+Shift+T |
| Outline | Cmd+Shift+O |

## Enabling Plugins

All built-in plugins are disabled by default. Enable them in:
**Settings > Plugins**

Once enabled:
- Commands appear in Command Palette (Cmd+K)
- TopBar buttons appear on the right side
- Views can be opened via commands or buttons
