# Phase 1: Local Vault System

## Status: COMPLETED

## Summary

Implemented a complete Obsidian-style local vault system for the notes application.

## Features Implemented

### 1. Vault Folder Selection
- Users can select any folder on their computer as a "vault"
- Vault path is persisted in app config
- Welcome screen prompts for vault selection on first launch

### 2. File System Operations (Rust Backend)
- `set_vault_path` - Set the vault directory
- `get_vault_path` - Get current vault path
- `get_vault_state` - Get vault initialization state
- `list_directory` - List folder contents (with recursive option)
- `create_note` - Create new .md file with frontmatter
- `read_note` - Read and parse .md file
- `save_note` - Save note with frontmatter
- `delete_note` - Delete .md file
- `rename_note` - Rename note file
- `create_folder` - Create subfolder
- `delete_folder` - Delete folder
- `rename_folder` - Rename folder
- `load_all_notes` - Load all notes from vault recursively
- `search_notes` - Full-text search across notes

### 3. Markdown Frontmatter
Notes are stored with YAML frontmatter:
```yaml
---
title: "Note Title"
created: 2024-01-01T00:00:00Z
---
```

### 4. File Explorer UI
- Collapsible sidebar with folder tree
- Expand/collapse folders
- Create notes and folders
- Context menu (right-click) for rename/delete
- Notes count display

### 5. CRUD Operations
- **Create**: New note with default "Untitled" title
- **Read**: Notes loaded from .md files with frontmatter parsing
- **Update**: Auto-save with 1-second debounce
- **Delete**: Confirmation dialog before deletion

### 6. Search
- Search by title or content
- Real-time filtering in note list

## Key Files Changed

| File | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | Rust backend with file system operations |
| `src-tauri/Cargo.toml` | Added `walkdir` and `chrono` dependencies |
| `src-tauri/capabilities/default.json` | File system permissions |
| `src/store/notesStore.ts` | Zustand store with vault operations |
| `src/store/appStore.ts` | App settings with vault path |
| `src/components/Layout.tsx` | File explorer UI |
| `src/pages/HomePage.tsx` | Note list with vault selection |
| `src/pages/NotePage.tsx` | Note editor |
| `src/pages/SettingsPage.tsx` | Vault settings |
| `src/styles/tokens.css` | Added error-subtle color |
| `src/styles/components.css` | Context menu styles |

## API Commands

```
get_vault_state     → VaultState { path, initialized }
set_vault_path      → void
get_vault_path      → string
list_directory      → FileEntry[]
create_note         → Note
read_note           → Note
save_note           → Note
delete_note         → void
rename_note         → string (new path)
create_folder       → string (folder path)
delete_folder       → void
rename_folder       → string (new path)
load_all_notes      → Note[]
search_notes        → Note[]
```

## Next Steps (Phase 2)

1. Markdown preview/editor
2. Plugin system foundation
3. Tag management
4. Backlinks
