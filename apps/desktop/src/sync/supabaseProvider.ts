import { Note, SyncProvider, SyncStatus, EncryptedData } from '@notes-app/shared';
import { getDeviceId, getLocalChanges, clearLocalChanges } from './changeTracker';
import { encryptNote, decryptNote, initializeEncryption } from './encryption';

interface SupabaseNote {
  id: string;
  user_id: string;
  encrypted_title: EncryptedData;
  encrypted_content: EncryptedData;
  updated_at: number;
  device_id: string;
  deleted: boolean;
}

interface SyncState {
  lastSyncedAt: number;
}

const SUPABASE_URL_KEY = 'notes-app-supabase-url';
const SUPABASE_ANON_KEY = 'notes-app-supabase-anon-key';
const SYNC_STATE_KEY = 'notes-app-sync-state';

export function configureSupabase(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url);
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey);
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = localStorage.getItem(SUPABASE_URL_KEY);
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY);
  
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getSyncState(): SyncState {
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY);
    return data ? JSON.parse(data) : { lastSyncedAt: 0 };
  } catch {
    return { lastSyncedAt: 0 };
  }
}

function saveSyncState(state: SyncState): void {
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

async function supabaseRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase not configured');
  }
  
  return fetch(`${config.url}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
}

export class SupabaseSyncProvider implements SyncProvider {
  id = 'supabase';
  name = 'Supabase';
  private status: SyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingChanges: 0,
  };
  private encryptionKey: CryptoKey | null = null;
  private onStatusChange?: (status: SyncStatus) => void;

  constructor(onStatusChange?: (status: SyncStatus) => void) {
    this.onStatusChange = onStatusChange;
  }

  private setStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.onStatusChange?.(this.status);
  }

  async initialize(): Promise<void> {
    const config = getSupabaseConfig();
    if (!config) {
      this.setStatus({ state: 'error', error: 'Supabase not configured' });
      return;
    }
    
    try {
      this.encryptionKey = await initializeEncryption();
      this.setStatus({ state: 'idle' });
    } catch (error) {
      this.setStatus({ state: 'error', error: 'Failed to initialize encryption' });
    }
  }

  async sync(): Promise<void> {
    await this.pull();
    await this.push();
  }

  async pull(): Promise<Note[]> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    this.setStatus({ state: 'syncing' });
    
    try {
      const syncState = getSyncState();
      
      const response = await supabaseRequest(
        `notes?user_id=eq.*&updated_at=gt.${syncState.lastSyncedAt}&select=*`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to pull: ${response.statusText}`);
      }
      
      const remoteNotes: SupabaseNote[] = await response.json();
      const localChanges = getLocalChanges();
      
      const mergedNotes: Note[] = [];
      
      for (const remoteNote of remoteNotes) {
        if (remoteNote.deleted && !localChanges.find(c => c.noteId === remoteNote.id)) {
          continue;
        }
        
        try {
          const decrypted = await decryptNote(
            remoteNote.encrypted_title,
            remoteNote.encrypted_content,
            this.encryptionKey!
          );
          
          mergedNotes.push({
            id: remoteNote.id,
            title: decrypted.title,
            content: decrypted.content,
            path: '',
            createdAt: new Date(remoteNote.updated_at - 1000),
            updatedAt: new Date(remoteNote.updated_at),
            tags: [],
            metadata: { deviceId: remoteNote.device_id },
          });
        } catch (error) {
          console.error('Failed to decrypt note:', remoteNote.id, error);
        }
      }
      
      saveSyncState({ lastSyncedAt: Date.now() });
      this.setStatus({ 
        state: 'idle', 
        lastSyncedAt: new Date(),
        pendingChanges: getLocalChanges().length 
      });
      
      return mergedNotes;
    } catch (error) {
      this.setStatus({ 
        state: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed' 
      });
      throw error;
    }
  }

  async push(): Promise<void> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    this.setStatus({ state: 'syncing' });
    
    try {
      const localChanges = getLocalChanges();
      const deviceId = getDeviceId();
      
      for (const change of localChanges) {
        let noteData: { title: string; content: string } | null = null;
        
        if (change.type !== 'delete' && change.data) {
          noteData = {
            title: change.data.title || '',
            content: change.data.content || '',
          };
        }
        
        const payload: Partial<SupabaseNote> = {
          id: change.noteId,
          user_id: '*',
          device_id: deviceId,
          updated_at: change.timestamp,
          deleted: change.type === 'delete',
        };
        
        if (noteData && this.encryptionKey) {
          const encrypted = await encryptNote(noteData, this.encryptionKey);
          payload.encrypted_title = encrypted.encryptedTitle;
          payload.encrypted_content = encrypted.encryptedContent;
        }
        
        const response = await supabaseRequest(
          `notes?id=eq.${change.noteId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        
        if (!response.ok) {
          console.error('Failed to push note:', await response.text());
        }
      }
      
      clearLocalChanges();
      saveSyncState({ lastSyncedAt: Date.now() });
      
      this.setStatus({ 
        state: 'idle', 
        lastSyncedAt: new Date(),
        pendingChanges: 0,
      });
    } catch (error) {
      this.setStatus({ 
        state: 'error', 
        error: error instanceof Error ? error.message : 'Sync failed' 
      });
      throw error;
    }
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  isConfigured(): boolean {
    return getSupabaseConfig() !== null;
  }

  async testConnection(): Promise<boolean> {
    try {
      const config = getSupabaseConfig();
      if (!config) return false;
      
      const response = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
        },
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

export async function createSupabaseProvider(
  onStatusChange?: (status: SyncStatus) => void
): Promise<SupabaseSyncProvider> {
  const provider = new SupabaseSyncProvider(onStatusChange);
  await provider.initialize();
  return provider;
}
