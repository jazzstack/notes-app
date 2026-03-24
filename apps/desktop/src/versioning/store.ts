import { create } from 'zustand';
import { Note, NoteHistoryEntry } from '@notes-app/shared';
import * as history from './noteHistory';

interface VersioningState {
  history: NoteHistoryEntry[];
  isLoading: boolean;
  
  loadHistory: (noteId: string) => void;
  saveToHistory: (note: Note) => void;
  restoreVersion: (noteId: string, versionId: string) => Note | null;
  deleteHistory: (noteId: string) => void;
}

export const useVersioningStore = create<VersioningState>((set) => ({
  history: [],
  isLoading: false,

  loadHistory: (noteId: string) => {
    set({ isLoading: true });
    const entries = history.getNoteHistory(noteId);
    set({ history: entries, isLoading: false });
  },

  saveToHistory: (note: Note) => {
    history.addNoteToHistory(note);
    const entries = history.getNoteHistory(note.id);
    set({ history: entries });
  },

  restoreVersion: (noteId: string, versionId: string) => {
    const note = history.restoreVersion(noteId, versionId);
    if (note) {
      const entries = history.getNoteHistory(noteId);
      set({ history: entries });
    }
    return note;
  },

  deleteHistory: (noteId: string) => {
    history.deleteNoteHistory(noteId);
    set({ history: [] });
  },
}));
