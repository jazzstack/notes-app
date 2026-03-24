import { Note, NoteVersion, NoteConflict } from '@notes-app/shared';

export type ConflictResolution = 'local' | 'remote' | 'merged';

export interface ConflictResolutionResult {
  resolved: boolean;
  note?: Note;
  conflict?: NoteConflict;
}

export function detectConflict(
  localNote: Note,
  remoteNote: NoteVersion
): boolean {
  const localTime = new Date(localNote.updatedAt).getTime();
  return remoteNote.updatedAt > localTime;
}

export function createConflict(
  noteId: string,
  localNote: Note,
  remoteNote: NoteVersion
): NoteConflict {
  return {
    noteId,
    localVersion: {
      id: localNote.id,
      title: localNote.title,
      content: localNote.content,
      updatedAt: new Date(localNote.updatedAt).getTime(),
      deviceId: 'local',
    },
    remoteVersion: {
      id: remoteNote.id,
      title: remoteNote.title,
      content: remoteNote.content,
      updatedAt: remoteNote.updatedAt,
      deviceId: remoteNote.deviceId,
    },
  };
}

export function resolveConflict(
  conflict: NoteConflict,
  resolution: ConflictResolution,
  mergedContent?: { title: string; content: string }
): Note {
  let title: string;
  let content: string;

  switch (resolution) {
    case 'local':
      title = conflict.localVersion.title;
      content = conflict.localVersion.content;
      break;
    case 'remote':
      title = conflict.remoteVersion.title;
      content = conflict.remoteVersion.content;
      break;
    case 'merged':
      title = mergedContent?.title ?? conflict.localVersion.title;
      content = mergedContent?.content ?? conflict.localVersion.content;
      break;
    default:
      title = conflict.localVersion.title;
      content = conflict.localVersion.content;
  }

  return {
    id: conflict.noteId,
    title,
    content,
    path: '',
    createdAt: new Date(Math.min(
      conflict.localVersion.updatedAt,
      conflict.remoteVersion.updatedAt
    )),
    updatedAt: new Date(),
    tags: [],
    metadata: {
      resolvedAt: Date.now(),
      resolution,
    },
  };
}

export function autoResolve(
  localNote: Note,
  remoteNote: NoteVersion
): { shouldAutoResolve: boolean; resolution?: ConflictResolution } {
  const localTime = new Date(localNote.updatedAt).getTime();
  const remoteTime = remoteNote.updatedAt;
  
  const timeDiff = Math.abs(remoteTime - localTime);
  
  if (timeDiff < 5000) {
    return { shouldAutoResolve: true, resolution: 'merged' };
  }
  
  if (localNote.content === remoteNote.content) {
    return { shouldAutoResolve: true, resolution: 'remote' };
  }
  
  const localChanged = localTime > remoteTime;
  const remoteChanged = remoteTime > localTime;
  
  if (localChanged && !remoteNote.content.includes(localNote.content.slice(0, 50))) {
    return { shouldAutoResolve: false };
  }
  
  if (remoteChanged && !localNote.content.includes(remoteNote.content.slice(0, 50))) {
    return { shouldAutoResolve: false };
  }
  
  return { shouldAutoResolve: true, resolution: 'merged' };
}

export function mergeContent(
  localContent: string,
  remoteContent: string
): string {
  const localLines = localContent.split('\n');
  const remoteLines = remoteContent.split('\n');
  
  const merged: string[] = [];
  const localSet = new Set(localLines);
  
  for (const line of remoteLines) {
    if (!localSet.has(line)) {
      merged.push(line);
    }
  }
  
  for (const line of localLines) {
    if (!merged.includes(line)) {
      merged.push(line);
    }
  }
  
  return merged.join('\n');
}
