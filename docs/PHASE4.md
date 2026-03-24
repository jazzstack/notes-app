# Phase 4: Search & Tags

## Overview

This phase adds full-text search and a tag system to enable fast retrieval of notes. Users can now search across all notes, use #tags to organize content, and filter notes by tags.

## Features

### 1. Full-Text Search
- Search across note titles, content, and tags
- Instant results as you type
- Clear search button
- Results sorted by relevance (title matches first)

### 2. Tag System
- Syntax: `#tagname` in note content
- Tags are automatically extracted from content
- Tags displayed in note cards and editor
- Clickable tag filter buttons

### 3. Filtering
- Filter notes by one or more tags
- Multiple tags = AND logic (notes must have all selected tags)
- Sort by: Last Modified, Created, or Title
- Combined search + tag filtering

## File Structure

```
src/
├── utils/
│   └── links.ts           # Tag parsing & search utilities
├── components/
│   └── SearchFilter.tsx   # Search & filter UI component
└── store/
    └── notesStore.ts      # Enhanced with tags & filtering
```

## Implementation Details

### Tag Parsing (`src/utils/links.ts`)

```typescript
// Parse #tags from content
parseTags(content: string): ParsedTag[]

// Extract unique tags from content
extractTags(content: string): string[]

// Get all tags from all notes
extractAllTags(notes: Note[]): string[]

// Filter notes by tag
filterNotesByTag(notes: Note[], tag: string): Note[]

// Advanced search with multiple filters
searchNotes(notes: Note[], options: SearchOptions): Note[]
```

### Store Integration (`src/store/notesStore.ts`)

- `allTags: string[]` - all unique tags across vault
- `getAllTags()` - get list of all tags
- `filterNotes(options: SearchOptions)` - search with filters
- Auto-rebuild tags on note create/update/delete

### SearchFilter Component (`src/components/SearchFilter.tsx`)

```typescript
interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  allTags: string[];
  sortBy: 'title' | 'updatedAt' | 'createdAt';
  onSortChange: (sort: SortBy) => void;
}
```

## Usage Examples

### Searching Notes

1. Go to the home page
2. Type in the search box
3. Results update instantly as you type
4. Click X to clear search

### Tagging Notes

Add #tags anywhere in your note content:

```
# Project Alpha

This is my project note with #important and #todo tags.

## Tasks
- #in-progress task
- #completed task

#meetings #planning
```

### Filtering by Tags

1. Tags are automatically extracted and shown as filter buttons
2. Click a tag to filter notes
3. Click again to remove filter
4. Select multiple tags (AND logic)

### Sorting Notes

Use the dropdown to sort by:
- **Last Modified** (default) - most recently edited
- **Created** - newest first
- **Title** - alphabetical

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.search-filter` | Container for search UI |
| `.search-filter-row` | Row with search input and sort |
| `.search-input-wrapper` | Search input container |
| `.search-input` | Search text input |
| `.search-clear-btn` | Clear search button |
| `.sort-select` | Sort dropdown |
| `.tags-filter` | Tag filter section |
| `.tags-filter-label` | "Filter by tags" label |
| `.tags-filter-list` | List of tag buttons |
| `.tag-filter-btn` | Individual tag filter button |
| `.note-card-tags` | Tags shown in note cards |
| `.note-tag` | Individual tag pill |

## Search Options

```typescript
interface SearchOptions {
  query?: string;          // Text to search
  tags?: string[];          // Tags to filter by
  sortBy?: 'title' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

## Future Enhancements

- [ ] Tag autocomplete while typing
- [ ] Tag management (rename, merge, delete tags)
- [ ] Tag colors/customization
- [ ] Full-text search highlighting in results
- [ ] Search within specific folder
- [ ] Search operators (AND, OR, NOT)
- [ ] Search history
- [ ] Saved searches
