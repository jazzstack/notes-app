import { Note, NoteHistoryEntry } from '@notes-app/shared';

const HISTORY_KEY = 'notes-app-history';
const MAX_HISTORY_PER_NOTE = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getHistoryKey(noteId: string): string {
  return `${HISTORY_KEY}-${noteId}`;
}

export function getAllHistoryKeys(): string[] {
  const keys = Object.keys(localStorage);
  return keys.filter(k => k.startsWith(HISTORY_KEY));
}

export function getNoteHistory(noteId: string): NoteHistoryEntry[] {
  try {
    const key = getHistoryKey(noteId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveNoteHistory(noteId: string, entries: NoteHistoryEntry[]): void {
  const limited = entries.slice(0, MAX_HISTORY_PER_NOTE);
  localStorage.setItem(getHistoryKey(noteId), JSON.stringify(limited));
}

export function createHistoryEntry(note: Note): NoteHistoryEntry {
  return {
    id: generateId(),
    noteId: note.id,
    title: note.title,
    content: note.content,
    timestamp: Date.now(),
    createdAt: new Date(),
  };
}

export function addNoteToHistory(note: Note): NoteHistoryEntry {
  const history = getNoteHistory(note.id);
  const entry = createHistoryEntry(note);
  
  const existingIndex = history.findIndex(
    h => h.title === entry.title && h.content === entry.content
  );
  
  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }
  
  history.unshift(entry);
  
  saveNoteHistory(note.id, history);
  
  return entry;
}

export function getVersion(noteId: string, versionId: string): NoteHistoryEntry | null {
  const history = getNoteHistory(noteId);
  return history.find(h => h.id === versionId) || null;
}

export function restoreVersion(noteId: string, versionId: string): Note | null {
  const version = getVersion(noteId, versionId);
  if (!version) return null;
  
  return {
    id: noteId,
    title: version.title,
    content: version.content,
    path: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    metadata: { restoredFrom: versionId },
  };
}

export function deleteNoteHistory(noteId: string): void {
  localStorage.removeItem(getHistoryKey(noteId));
}

export function getAllHistory(): NoteHistoryEntry[] {
  const allEntries: NoteHistoryEntry[] = [];
  const keys = getAllHistoryKeys();
  
  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const entries: NoteHistoryEntry[] = JSON.parse(data);
        allEntries.push(...entries);
      }
    } catch {
      // Skip invalid entries
    }
  }
  
  return allEntries.sort((a, b) => b.timestamp - a.timestamp);
}

export function clearAllHistory(): void {
  const keys = getAllHistoryKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function getHistoryStats(noteId: string): {
  total: number;
  oldest: Date | null;
  newest: Date | null;
} {
  const history = getNoteHistory(noteId);
  
  if (history.length === 0) {
    return { total: 0, oldest: null, newest: null };
  }
  
  return {
    total: history.length,
    oldest: new Date(history[history.length - 1].timestamp),
    newest: new Date(history[0].timestamp),
  };
}
