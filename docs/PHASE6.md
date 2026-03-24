# Phase 6: Plugin System

## Goal
Make the app extensible like Obsidian by implementing a plugin system.

## Implementation

### Plugin API Types

Located in `packages/shared/src/types.ts`:

```typescript
interface PluginCommand {
  id: string;
  name: string;
  shortcut?: string[];
  action: () => void | Promise<void>;
}

interface PluginTopBarButton {
  id: string;
  icon: string;
  title: string;
  action: () => void;
  position?: 'left' | 'right';
}

interface EditorHookCallbacks {
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
  onReady?: (editor: unknown) => void;
}

interface PluginAPI {
  registerCommand: (command: PluginCommand) => void;
  unregisterCommand: (commandId: string) => void;
  addTopBarButton: (button: PluginTopBarButton) => void;
  removeTopBarButton: (buttonId: string) => void;
  addEditorHook: (callback: EditorHookCallbacks) => void;
  removeEditorHook: () => void;
  getNoteContext: () => NoteContext;
  app: {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
  };
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
  onLoad?: (api: PluginAPI) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}
```

### Plugin Store

Located in `apps/desktop/src/store/pluginsStore.ts`:

- Manages plugin state (registered plugins, enabled plugins)
- Handles enable/disable lifecycle
- Persists enabled plugins to localStorage
- Provides API for plugins to register commands, buttons, and hooks

### Plugin Manager

Located in `apps/desktop/src/plugins/manager.ts`:

- Loads built-in plugins on app startup
- Provides `loadPlugin()`, `unloadPlugin()`, `initializePlugins()`

## Features

### Register Commands
Plugins can register commands that appear in the Command Palette (Cmd+K):

```typescript
api.registerCommand({
  id: 'my-command',
  name: 'My Command',
  shortcut: ['⌘', 'Shift', 'M'],
  action: () => { /* do something */ }
});
```

### Modify UI (TopBar)
Plugins can add buttons to the topbar:

```typescript
api.addTopBarButton({
  id: 'my-button',
  icon: 'zoom-in',
  title: 'My Button',
  action: () => { /* do something */ },
  position: 'right'
});
```

### Hook into Editor
Plugins can hook into editor events:

```typescript
api.addEditorHook({
  onContentChange: (content) => { /* handle change */ },
  onTitleChange: (title) => { /* handle change */ },
  onSave: () => { /* handle save */ },
  onReady: (editor) => { /* handle editor ready */ }
});
```

### Access Note Context
Plugins can get the current note context:

```typescript
const context = api.getNoteContext();
// { noteId: string, title: string, content: string }
```

### Access App Settings
Plugins can read and modify app settings:

```typescript
const settings = api.app.settings;
api.app.updateSettings({ theme: 'dark' });
```

## Built-in Plugins

### Word Count Plugin
- Adds "Insert Word Count" command
- Adds word count button to topbar
- Logs word count on content change

### Timestamp Plugin
- Adds "Insert Timestamp" command (Cmd+Shift+T)
- Adds "Insert Date" command
- Logs on note save

### Calendar Plugin (Daily Notes)
- Calendar view for daily notes navigation
- Click date to create/open daily note
- Format: "Daily Note - YYYY-MM-DD"

### Kanban Board Plugin
- Organize notes in columns based on task status
- Columns: Backlog, To Do, In Progress, Done
- Uses markdown task syntax: - [ ] - [x]

### Task Manager Plugin
- View all tasks across all notes
- Filter by: All, Pending, Completed
- Shows task stats

### Outline Panel Plugin
- Shows table of contents based on markdown headings
- Click heading to navigate

## Plugin View Manager

Plugins can open modal views using:

```typescript
window.__OPEN_PLUGIN_VIEW__({
  key: 'unique-view-key',
  component: 'CalendarPluginView', // or KanbanPluginView, TasksPluginView, OutlinePluginView
});
```

## Plugin Management

Plugins can be enabled/disabled in Settings > Plugins. The enabled state is persisted to localStorage.

## File Structure

```
apps/desktop/src/
├── plugins/
│   ├── manager.ts           # Plugin loading/unloading
│   ├── viewManager.tsx      # Plugin view rendering
│   ├── wordCount.ts         # Word count plugin
│   ├── timestamp.ts         # Timestamp plugin
│   └── builtins/
│       ├── calendar.tsx     # Daily notes calendar
│       ├── kanban.tsx       # Kanban board
│       ├── tasks.tsx        # Task manager
│       └── outline.tsx      # Outline panel
└── store/
    └── pluginsStore.ts      # Plugin state management
```

## Usage

1. Commands appear in Command Palette (Cmd+K)
2. TopBar buttons appear on the right side
3. Editor hooks fire automatically on events
4. Manage plugins in Settings > Plugins
