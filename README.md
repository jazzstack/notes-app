---
title: "README"
---

# Notes App

A modern, local-first note-taking application built with Tauri and React. Features Obsidian-style vault management, Markdown editing with live preview, knowledge graph linking, and visual graph exploration.

## Features

### Core Features
- **Local Vault System** - Use any folder as your notes vault
- **Markdown Editor** - Full GFM support with split view and live preview
- **Syntax Highlighting** - Code blocks with language detection
- **Auto-Save** - Notes save automatically after editing

### Knowledge Management
- **Wikilinks** - Link notes with `[[Note Title]]` syntax
- **Backlinks Panel** - See all notes linking to the current note
- **Tags** - Organize with `#tags` throughout content
- **Graph View** - Visual exploration of note connections

### Search & Organization
- **Full-Text Search** - Instant search across all notes
- **Tag Filtering** - Filter notes by tags
- **Sorting** - Sort by modified date, created date, or title
- **File Explorer** - Sidebar with folder tree navigation

### Desktop Features
- **Native Window** - Uses OS native title bar and controls
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 2.x (Rust) |
| Frontend | React 18 + TypeScript |
| Build | Vite |
| State | Zustand |
| Routing | React Router 6 |
| Markdown | react-markdown + remark-gfm |
| Syntax | react-syntax-highlighter |
| Monorepo | Turborepo |

## Project Structure

```
notes-app/
├── apps/
│   └── desktop/                  # Tauri desktop application
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── pages/           # Page components
│       │   ├── store/           # Zustand stores
│       │   ├── styles/          # CSS styles
│       │   ├── utils/           # Utility functions
│       │   └── main.tsx         # App entry point
│       └── src-tauri/           # Rust backend
├── packages/
│   ├── shared/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components
├── docs/                       # Phase documentation
│   ├── PHASE1.md              # Vault System
│   ├── PHASE2.md              # Markdown Editor
│   ├── PHASE3.md              # Linking & Backlinks
│   ├── PHASE4.md              # Search & Tags
│   └── PHASE5.md              # Graph View
└── package.json                # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Run desktop app in development |
| `npm run tauri build` | Build desktop app for production |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

## Usage

### Creating a Vault

1. Launch the app
2. Click "Open Vault Folder"
3. Select any folder on your computer
4. Your vault is ready!

### Writing Notes

1. Click "New Note" or press `⌘N`
2. Write in Markdown with live preview
3. Notes auto-save after you stop typing

### Linking Notes

Use wikilink syntax to connect notes:

```
This relates to [[Another Note]]
```

### Using Tags

Add tags anywhere in your notes:

```
#important #project
```

### Exploring the Graph

Click the graph icon in the top bar to visualize how your notes connect.

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ | Local Vault System |
| Phase 2 | ✅ | Markdown Editor |
| Phase 3 | ✅ | Linking & Knowledge Graph |
| Phase 4 | ✅ | Search & Tags |
| Phase 5 | ✅ | Graph View |
| Phase 6 | 🚧 | Future: Sync & Collaboration |
| Phase 7 | 🚧 | Future: Plugin System |

See `docs/` directory for detailed phase documentation.

## Configuration

### App Settings

Settings are stored in the app data directory:
- **Windows**: `%APPDATA%/Notes App/`
- **macOS**: `~/Library/Application Support/Notes App/`
- **Linux**: `~/.config/Notes App/`

### Note Format

Notes are stored as `.md` files with YAML frontmatter:

```yaml
---
title: "Note Title"
created: 2026-03-24T00:00:00Z
---
```

## License

MIT
