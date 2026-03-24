# Phase 10: Versioning & Export

## Goal
Provide reliability through note versioning and portability through export options.

## Implemented Features

### 1. Note History (Version Control)

Located in `apps/desktop/src/versioning/noteHistory.ts`:

- Automatic versioning on every save
- History stored in localStorage per note
- Up to 50 versions per note
- View history timeline
- Restore previous versions

```typescript
import * as history from './versioning/noteHistory';

// Add current note to history
history.addNoteToHistory(note);

// Get all history for a note
const entries = history.getNoteHistory(noteId);

// Restore a specific version
const restored = history.restoreVersion(noteId, versionId);
```

### 2. History Panel UI

Located in `apps/desktop/src/versioning/HistoryPanel.tsx`:

- List of all versions with timestamps
- Preview selected version content
- One-click restore
- Relative time display (e.g., "5m ago")

### 3. Export Formats

Located in `apps/desktop/src/versioning/export.ts`:

**Supported Formats:**
- **Markdown** (.md) - Plain text markdown
- **HTML** (.html) - Styled HTML with themes
- **JSON** (.json) - Full note data with metadata
- **PDF** (via HTML) - Print-ready HTML

```typescript
import { exportNote } from './versioning/export';

// Export to different formats
await exportNote(note, 'markdown');
await exportNote(note, 'html');
await exportNote(note, 'json');
await exportNote(note, 'pdf');
```

### 4. Export Options

```typescript
const options = {
  includeMetadata: true,    // Include created/updated dates
  includeBacklinks: false, // Include backlink info
  includeFrontmatter: false, // Include YAML frontmatter
  theme: 'light',          // 'light' or 'dark'
};

await exportNote(note, 'html', options);
```

### 5. Integration

**Note Editor:**
- History button in toolbar opens history panel
- Export button in toolbar exports current note
- Automatic versioning on save

**Usage:**
1. Open a note
2. Click the history icon (list icon) to view history
3. Click the export icon to export in your preferred format

## File Structure

```
apps/desktop/src/
└── versioning/
    ├── noteHistory.ts      # History storage
    ├── export.ts           # Export functionality
    ├── store.ts            # Versioning store
    └── HistoryPanel.tsx    # History UI
```

## History Features

- **Automatic Tracking**: Every save creates a history entry
- **Deduplication**: Identical content is not saved as new version
- **Storage**: Up to 50 versions per note in localStorage
- **Preview**: View any historical version before restoring
- **Restore**: One-click restore to any previous version

## Export Features

### Markdown Export
- Plain markdown content
- Includes title as H1
- No styling

### HTML Export
- Full styling with light/dark theme
- Responsive design
- Code block syntax highlighting
- Clean typography

### JSON Export
- Full note data
- Metadata included
- Machine-readable

### PDF Export
- Uses HTML export
- Open in browser and print to PDF

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | Cmd+S |
| Export | Via toolbar |

## Data Storage

History is stored in localStorage with keys like:
- `notes-app-history-{noteId}`

Each note has its own history limited to 50 entries.

## Limitations

- History stored locally only (not synced)
- PDF export requires browser print
- Maximum 50 versions per note
