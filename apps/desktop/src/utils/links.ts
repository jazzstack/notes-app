import { Note, WikiLink, Backlink } from '@notes-app/shared';

export type { WikiLink, Backlink } from '@notes-app/shared';

export function parseWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    links.push({
      raw: match[0],
      title: match[2] || match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return links;
}

export function extractLinkTitles(content: string): string[] {
  return parseWikiLinks(content).map(link => link.title);
}

export function resolveLinkToNote(linkTitle: string, notes: Note[]): Note | undefined {
  const normalizedTitle = linkTitle.toLowerCase().trim();
  return notes.find(
    note => note.title.toLowerCase().trim() === normalizedTitle
  );
}

export function buildBacklinksMap(notes: Note[]): Map<string, Backlink[]> {
  const backlinksMap = new Map<string, Backlink[]>();

  notes.forEach(note => {
    const linkTitles = extractLinkTitles(note.content);
    
    linkTitles.forEach(linkTitle => {
      const linkedNote = resolveLinkToNote(linkTitle, notes);
      
      if (linkedNote && linkedNote.id !== note.id) {
        const existingBacklinks = backlinksMap.get(linkedNote.id) || [];
        
        const contextStart = Math.max(0, note.content.indexOf(`[[${linkTitle}`) - 50);
        const contextEnd = Math.min(note.content.length, note.content.indexOf(`[[${linkTitle}`) + 100);
        const context = note.content.slice(contextStart, contextEnd).replace(/\n/g, ' ').trim();
        
        if (!existingBacklinks.some(bl => bl.noteId === note.id)) {
          existingBacklinks.push({
            noteId: note.id,
            noteTitle: note.title,
            notePath: note.path,
            context: (contextStart > 0 ? '...' : '') + context + (contextEnd < note.content.length ? '...' : ''),
          });
          backlinksMap.set(linkedNote.id, existingBacklinks);
        }
      }
    });
  });

  return backlinksMap;
}

export function contentToMarkdown(content: string, notes: Note[]): string {
  const links = parseWikiLinks(content);
  let result = content;
  
  links.forEach(link => {
    const linkedNote = resolveLinkToNote(link.title, notes);
    if (linkedNote) {
      result = result.replace(
        link.raw,
        `[${link.title}](note://${linkedNote.id})`
      );
    } else {
      result = result.replace(
        link.raw,
        `<span class="wikilink wikilink-missing">${link.title}</span>`
      );
    }
  });

  return result;
}

export function countLinks(content: string): number {
  return parseWikiLinks(content).length;
}

// Tag parsing utilities
export interface ParsedTag {
  raw: string;
  name: string;
  startIndex: number;
  endIndex: number;
}

export function parseTags(content: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  // Match #tag but not inside code blocks or URLs
  const regex = /(?:^|[^a-zA-Z0-9])(#[a-zA-Z][a-zA-Z0-9_-]*)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Check if this is inside a code block (simplified check)
    const beforeMatch = content.slice(0, match.index + match[1].length);
    const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
    if (codeBlockCount % 2 === 0) {
      tags.push({
        raw: match[1],
        name: match[1].slice(1), // Remove the # prefix
        startIndex: match.index + 1, // Skip the char before #
        endIndex: match.index + match[1].length,
      });
    }
  }

  return tags;
}

export function extractTags(content: string): string[] {
  return [...new Set(parseTags(content).map(tag => tag.name))];
}

export function extractAllTags(notes: Note[]): string[] {
  const allTags = new Set<string>();
  notes.forEach(note => {
    extractTags(note.content).forEach(tag => allTags.add(tag));
    note.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}

export function filterNotesByTag(notes: Note[], tag: string): Note[] {
  const normalizedTag = tag.toLowerCase();
  return notes.filter(note => {
    // Check explicit tags
    if (note.tags.some(t => t.toLowerCase() === normalizedTag)) {
      return true;
    }
    // Check tags in content
    const contentTags = extractTags(note.content);
    return contentTags.some(t => t.toLowerCase() === normalizedTag);
  });
}

export interface SearchOptions {
  query?: string;
  tags?: string[];
  sortBy?: 'title' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export function searchNotes(notes: Note[], options: SearchOptions): Note[] {
  let results = [...notes];
  
  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    results = results.filter(note => {
      const noteTags = new Set([
        ...note.tags,
        ...extractTags(note.content)
      ].map(t => t.toLowerCase()));
      return options.tags!.some(tag => noteTags.has(tag.toLowerCase()));
    });
  }
  
  // Filter by search query
  if (options.query && options.query.trim()) {
    const query = options.query.toLowerCase().trim();
    results = results.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || contentMatch || tagMatch;
    });
    
    // Sort by relevance (title matches first)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(query) ? 1 : 0;
      return bTitle - aTitle;
    });
  }
  
  // Sort results
  const sortBy = options.sortBy || 'updatedAt';
  const sortOrder = options.sortOrder || 'desc';
  
  results.sort((a, b) => {
    let comparison: number;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
      default:
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return results;
}
