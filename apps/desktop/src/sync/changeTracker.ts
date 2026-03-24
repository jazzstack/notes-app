import { Note, NoteChange, ChangeType } from '@notes-app/shared';

const CHANGES_KEY = 'notes-app-changes';
const DEVICE_ID_KEY = 'notes-app-device-id';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getLocalChanges(): NoteChange[] {
  try {
    const data = localStorage.getItem(CHANGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalChanges(changes: NoteChange[]): void {
  localStorage.setItem(CHANGES_KEY, JSON.stringify(changes));
}

export function clearLocalChanges(): void {
  localStorage.removeItem(CHANGES_KEY);
}

export function trackChange(
  noteId: string,
  type: ChangeType,
  data?: { title?: string; content?: string; path?: string }
): NoteChange {
  const changes = getLocalChanges();
  
  const contentHash = data?.content 
    ? generateHash(data.content) 
    : data?.title 
      ? generateHash(data.title) 
      : generateHash('');

  const change: NoteChange = {
    id: generateId(),
    noteId,
    type,
    timestamp: Date.now(),
    data,
    hash: contentHash,
  };

  const existingIndex = changes.findIndex(c => c.noteId === noteId);
  if (existingIndex >= 0) {
    const existing = changes[existingIndex];
    if (type === 'delete') {
      changes.splice(existingIndex, 1);
    } else if (existing.type === 'create') {
      changes[existingIndex] = { ...change, type: 'create' };
    } else {
      changes[existingIndex] = change;
    }
  } else if (type !== 'delete') {
    changes.push(change);
  }

  saveLocalChanges(changes);
  return change;
}

export function createNoteChange(note: Note): NoteChange {
  return trackChange(note.id, 'create', {
    title: note.title,
    content: note.content,
    path: note.path,
  });
}

export function updateNoteChange(noteId: string, updates: Partial<Note>): NoteChange {
  return trackChange(noteId, 'update', {
    title: updates.title,
    content: updates.content,
    path: updates.path,
  });
}

export function deleteNoteChange(noteId: string): NoteChange {
  return trackChange(noteId, 'delete');
}

export function getNoteHash(note: Pick<Note, 'title' | 'content'>): string {
  return generateHash(`${note.title}|${note.content}`);
}

export function hasPendingChanges(): boolean {
  return getLocalChanges().length > 0;
}

export function getPendingChangesCount(): number {
  return getLocalChanges().length;
}
