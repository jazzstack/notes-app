// Core types for the notes application

export interface Note {
  id: string;
  title: string;
  content: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Vault {
  id: string;
  name: string;
  path: string;
  notes: Note[];
  createdAt: Date;
}

export interface WikiLink {
  raw: string;
  title: string;
  startIndex: number;
  endIndex: number;
}

export interface Backlink {
  noteId: string;
  noteTitle: string;
  notePath: string;
  context: string;
}

export interface SearchResult {
  note: Note;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  text: string;
  indices: [number, number][];
}

export interface PluginCommand {
  id: string;
  name: string;
  shortcut?: string[];
  action: () => void | Promise<void>;
}

export interface PluginTopBarButton {
  id: string;
  icon: string;
  title: string;
  action: () => void;
  position?: 'left' | 'right';
}

export interface EditorHookCallbacks {
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onSave?: () => void;
  onReady?: (editor: unknown) => void;
}

export interface NoteContext {
  noteId: string | null;
  title: string;
  content: string;
}

export interface PluginAPI {
  registerCommand: (command: PluginCommand) => void;
  unregisterCommand: (commandId: string) => void;
  addTopBarButton: (button: PluginTopBarButton) => void;
  removeTopBarButton: (buttonId: string) => void;
  addEditorHook: (callback: EditorHookCallbacks) => void;
  removeEditorHook: () => void;
  getNoteContext: () => NoteContext;
  app: {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
  onLoad?: (api: PluginAPI) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncedAt: Date | null;
  pendingChanges: number;
  error?: string;
}

export interface SyncProvider {
  id: string;
  name: string;
  sync(): Promise<void>;
  pull(): Promise<Note[]>;
  push(): Promise<void>;
}

export type ChangeType = 'create' | 'update' | 'delete';

export interface NoteChange {
  id: string;
  noteId: string;
  type: ChangeType;
  timestamp: number;
  data?: {
    title?: string;
    content?: string;
    path?: string;
  };
  hash: string;
}

export interface SyncState {
  deviceId: string;
  lastSyncedAt: number;
  localChanges: NoteChange[];
  remoteChanges: NoteChange[];
  conflicts: NoteConflict[];
}

export interface NoteConflict {
  noteId: string;
  localVersion: NoteVersion;
  remoteVersion: NoteVersion;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
}

export interface NoteVersion {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  deviceId: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt?: string;
}

export interface SyncConfig {
  provider: 'supabase' | 'firebase' | 'custom';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  autoSync: boolean;
  syncInterval: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  vaultPath: string;
  syncEnabled: boolean;
  syncProvider?: string;
  editorFontSize: number;
  editorFontFamily: string;
}

export interface NoteHistoryEntry {
  id: string;
  noteId: string;
  title: string;
  content: string;
  timestamp: number;
  createdAt: Date;
}

export interface ExportFormat {
  type: 'pdf' | 'html' | 'markdown' | 'json';
  name: string;
  extension: string;
  mimeType: string;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeBacklinks: boolean;
  includeFrontmatter: boolean;
  theme?: 'light' | 'dark';
}
