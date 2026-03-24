import { create } from 'zustand';
import { SyncStatus, SyncConfig } from '@notes-app/shared';
import { SupabaseSyncProvider, configureSupabase, createSupabaseProvider } from '../sync/supabaseProvider';
import { getPendingChangesCount } from '../sync/changeTracker';

interface SyncState {
  status: SyncStatus;
  provider: SupabaseSyncProvider | null;
  config: SyncConfig;
  isConfigured: boolean;
  
  initialize: () => Promise<void>;
  configure: (url: string, anonKey: string) => void;
  sync: () => Promise<void>;
  setConfig: (config: Partial<SyncConfig>) => void;
  getStatus: () => SyncStatus;
}

const DEFAULT_CONFIG: SyncConfig = {
  provider: 'supabase',
  supabaseUrl: '',
  supabaseAnonKey: '',
  encryptionEnabled: true,
  autoSync: true,
  syncInterval: 30000,
};

function loadConfig(): SyncConfig {
  try {
    const data = localStorage.getItem('notes-app-sync-config');
    if (data) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load sync config:', e);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: SyncConfig): void {
  localStorage.setItem('notes-app-sync-config', JSON.stringify(config));
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: {
    state: 'idle',
    lastSyncedAt: null,
    pendingChanges: 0,
  },
  provider: null,
  config: loadConfig(),
  isConfigured: false,

  initialize: async () => {
    const config = get().config;
    
    if (config.supabaseUrl && config.supabaseAnonKey) {
      configureSupabase(config.supabaseUrl, config.supabaseAnonKey);
      
      const provider = await createSupabaseProvider((status) => {
        set({ status });
      });
      
      const isConfigured = provider.isConfigured();
      const pendingChanges = getPendingChangesCount();
      
      set({ 
        provider, 
        isConfigured,
        status: { 
          ...provider.getStatus(),
          pendingChanges 
        } 
      });
      
      if (config.autoSync) {
        setInterval(() => {
          get().sync();
        }, config.syncInterval);
      }
    } else {
      set({ isConfigured: false });
    }
  },

  configure: (url: string, anonKey: string) => {
    configureSupabase(url, anonKey);
    
    const config = get().config;
    const newConfig = { ...config, supabaseUrl: url, supabaseAnonKey: anonKey };
    saveConfig(newConfig);
    set({ config: newConfig });
    
    get().initialize();
  },

  sync: async () => {
    const { provider } = get();
    
    if (!provider) {
      set({ 
        status: { 
          state: 'error', 
          lastSyncedAt: null, 
          pendingChanges: 0,
          error: 'Sync provider not configured' 
        } 
      });
      return;
    }
    
    try {
      set({ 
        status: { 
          ...provider.getStatus(), 
          state: 'syncing',
          pendingChanges: getPendingChangesCount(),
        } 
      });
      
      await provider.sync();
      
      set({ 
        status: { 
          ...provider.getStatus(),
          pendingChanges: getPendingChangesCount(),
        } 
      });
    } catch (error) {
      set({ 
        status: { 
          state: 'error', 
          lastSyncedAt: get().status.lastSyncedAt, 
          pendingChanges: getPendingChangesCount(),
          error: error instanceof Error ? error.message : 'Sync failed' 
        } 
      });
    }
  },

  setConfig: (updates: Partial<SyncConfig>) => {
    const newConfig = { ...get().config, ...updates };
    saveConfig(newConfig);
    set({ config: newConfig });
  },

  getStatus: () => get().status,
}));
