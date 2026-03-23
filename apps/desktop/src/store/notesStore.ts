import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Note } from '@notes-app/shared';
import { useAppStore } from './appStore';

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_note: boolean;
}

interface VaultState {
  path: string;
  initialized: boolean;
}

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  vaultPath: string;
  vaultInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  fileTree: FileEntry[];
  initializeVault: () => Promise<void>;
  selectVault: () => Promise<void>;
  loadNotes: () => Promise<void>;
  createNote: (title: string, content?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (path: string) => Promise<void>;
  renameNote: (oldPath: string, newTitle: string) => Promise<string>;
  setCurrentNote: (note: Note | null) => void;
  selectNoteByPath: (path: string) => Promise<Note | null>;
  searchNotes: (query: string) => Promise<Note[]>;
  loadDirectory: (path: string) => Promise<FileEntry[]>;
  createFolder: (name: string) => Promise<string>;
  deleteFolder: (path: string) => Promise<void>;
  renameFolder: (oldPath: string, newName: string) => Promise<string>;
  getNotesCount: () => number;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  vaultPath: '',
  vaultInitialized: false,
  isLoading: false,
  error: null,
  fileTree: [],

  initializeVault: async () => {
    set({ isLoading: true, error: null });
    try {
      const state = await invoke<VaultState>('get_vault_state');
      set({ 
        vaultPath: state.path, 
        vaultInitialized: state.initialized 
      });
      
      if (state.initialized && state.path) {
        await get().loadNotes();
        await get().loadDirectory(state.path);
      }
    } catch (error) {
      console.error('Failed to initialize vault:', error);
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  selectVault: async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Vault Folder',
      });

      if (selected && typeof selected === 'string') {
        await invoke('set_vault_path', { path: selected });
        set({ vaultPath: selected, vaultInitialized: true });
        useAppStore.getState().updateSettings({ vaultPath: selected });
        await get().loadNotes();
        await get().loadDirectory(selected);
      }
    } catch (error) {
      console.error('Failed to select vault:', error);
      set({ error: String(error) });
    }
  },

  loadNotes: async () => {
    const { vaultPath } = get();
    if (!vaultPath) return;

    set({ isLoading: true, error: null });
    try {
      const notes = await invoke<Note[]>('load_all_notes', { vaultPath });
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  createNote: async (title: string, _content?: string) => {
    const { vaultPath } = get();
    if (!vaultPath) {
      set({ error: 'No vault selected' });
      return null;
    }

    try {
      const note = await invoke<Note>('create_note', { vaultPath, title });
      set((state) => ({
        notes: [note, ...state.notes],
      }));
      await get().loadDirectory(vaultPath);
      return note;
    } catch (error) {
      console.error('Failed to create note:', error);
      set({ error: String(error) });
      return null;
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    try {
      await invoke('save_note', {
        path: note.path,
        title: updates.title ?? note.title,
        content: updates.content ?? note.content,
      });

      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id
            ? { ...n, ...updates, updatedAt: new Date() }
            : n
        ),
        currentNote:
          state.currentNote?.id === id
            ? { ...state.currentNote, ...updates, updatedAt: new Date() }
            : state.currentNote,
      }));
    } catch (error) {
      console.error('Failed to update note:', error);
      set({ error: String(error) });
    }
  },

  deleteNote: async (path: string) => {
    try {
      await invoke('delete_note', { path });
      set((state) => ({
        notes: state.notes.filter((n) => n.path !== path),
        currentNote: state.currentNote?.path === path ? null : state.currentNote,
      }));
      await get().loadDirectory(get().vaultPath);
    } catch (error) {
      console.error('Failed to delete note:', error);
      set({ error: String(error) });
    }
  },

  renameNote: async (oldPath: string, newTitle: string) => {
    try {
      const newPath = await invoke<string>('rename_note', { oldPath, newTitle });
      
      set((state) => ({
        notes: state.notes.map((n) =>
          n.path === oldPath
            ? { ...n, path: newPath, title: newTitle, updatedAt: new Date() }
            : n
        ),
        currentNote:
          state.currentNote?.path === oldPath
            ? { ...state.currentNote, path: newPath, title: newTitle, updatedAt: new Date() }
            : state.currentNote,
      }));
      
      await get().loadDirectory(get().vaultPath);
      return newPath;
    } catch (error) {
      console.error('Failed to rename note:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note });
  },

  selectNoteByPath: async (path: string) => {
    try {
      const note = await invoke<Note>('read_note', { path });
      set({ currentNote: note });
      return note;
    } catch (error) {
      console.error('Failed to read note:', error);
      set({ error: String(error) });
      return null;
    }
  },

  searchNotes: async (query: string) => {
    const { vaultPath } = get();
    if (!vaultPath) return [];

    try {
      const results = await invoke<Note[]>('search_notes', { vaultPath, query });
      return results;
    } catch (error) {
      console.error('Failed to search notes:', error);
      return [];
    }
  },

  loadDirectory: async (path: string) => {
    try {
      const entries = await invoke<FileEntry[]>('list_directory', { path, recursive: false });
      set({ fileTree: entries });
      return entries;
    } catch (error) {
      console.error('Failed to load directory:', error);
      return [];
    }
  },

  createFolder: async (name: string) => {
    const { vaultPath } = get();
    if (!vaultPath) throw new Error('No vault selected');

    try {
      const folderPath = await invoke<string>('create_folder', { vaultPath, name });
      await get().loadDirectory(vaultPath);
      return folderPath;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  },

  deleteFolder: async (path: string) => {
    try {
      await invoke('delete_folder', { path });
      await get().loadDirectory(get().vaultPath);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  renameFolder: async (oldPath: string, newName: string) => {
    try {
      const newPath = await invoke<string>('rename_folder', { oldPath, newName });
      await get().loadDirectory(get().vaultPath);
      return newPath;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }
  },

  getNotesCount: () => get().notes.length,
}));
