# Phase 8: Sync System (Offline-First)

## Goal
Enable cross-device sync with offline-first architecture and end-to-end encryption.

## Architecture

### Offline-First Design
1. All changes are tracked locally first
2. Changes are synced when online
3. Conflict resolution handles merge scenarios
4. Offline changes are queued for later sync

### Sync Flow
```
Local Change → Track Change → Queue for Sync → Push to Cloud
                                    ↓
Remote Change ← Pull from Cloud ← Merge Conflicts
```

## Implementation

### Sync Types

Located in `packages/shared/src/types.ts`:

```typescript
interface NoteChange {
  id: string;
  noteId: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  data?: { title?: string; content?: string; path?: string };
  hash: string;
}

interface NoteConflict {
  noteId: string;
  localVersion: NoteVersion;
  remoteVersion: NoteVersion;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged';
}

interface SyncConfig {
  provider: 'supabase' | 'firebase' | 'custom';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  autoSync: boolean;
  syncInterval: number;
}
```

### Change Tracker

Located in `apps/desktop/src/sync/changeTracker.ts`:

- Tracks all local changes (create, update, delete)
- Generates unique IDs and content hashes
- Persists pending changes to localStorage
- Provides change history

```typescript
// Track a change
createNoteChange(note);
updateNoteChange(noteId, updates);
deleteNoteChange(noteId);

// Query changes
getLocalChanges();
hasPendingChanges();
getPendingChangesCount();
```

### Conflict Resolution

Located in `apps/desktop/src/sync/conflictResolver.ts`:

- Detects conflicts between local and remote versions
- Auto-resolves simple conflicts (content unchanged)
- Provides manual resolution options

```typescript
// Detect conflict
detectConflict(localNote, remoteNote);

// Auto-resolve if possible
autoResolve(localNote, remoteNote);

// Manual resolution
resolveConflict(conflict, 'local' | 'remote' | 'merged');
```

### End-to-End Encryption

Located in `apps/desktop/src/sync/encryption.ts`:

- Uses AES-256-GCM encryption
- Keys generated and stored locally
- All notes encrypted before cloud sync
- Zero-knowledge architecture

```typescript
// Initialize encryption
const key = await initializeEncryption();

// Encrypt note
const encrypted = await encryptNote(note, key);
// { encryptedTitle, encryptedContent }

// Decrypt note
const decrypted = await decryptNote(encryptedTitle, encryptedContent, key);
```

### Supabase Provider

Located in `apps/desktop/src/sync/supabaseProvider.ts`:

- Pulls remote changes
- Pushes local changes
- Handles encryption/decryption
- Manages sync state

```typescript
const provider = await createSupabaseProvider();

// Sync all changes
await provider.sync();

// Pull only
const notes = await provider.pull();

// Push only
await provider.push();
```

### Sync Store

Located in `apps/desktop/src/store/syncStore.ts`:

- Manages sync configuration
- Provides sync status
- Handles auto-sync intervals

```typescript
const { status, config, sync, configure, setConfig } = useSyncStore();

// Configure Supabase
configure(supabaseUrl, supabaseAnonKey);

// Trigger manual sync
await sync();

// Configure settings
setConfig({ autoSync: true, syncInterval: 30000 });
```

## Features

### Supabase Configuration
1. Create a Supabase project
2. Create a table called `notes` with columns:
   - `id` (uuid, primary key)
   - `user_id` (text)
   - `encrypted_title` (jsonb)
   - `encrypted_content` (jsonb)
   - `updated_at` (bigint)
   - `device_id` (text)
   - `deleted` (boolean)
3. Get your Supabase URL and anon key
4. Configure in Settings > Sync

### Sync Status Indicators
- **Idle**: No sync in progress
- **Syncing**: Currently syncing
- **Error**: Sync failed
- **Offline**: No internet connection

### Conflict Resolution Strategies
1. **Local**: Keep local version, discard remote
2. **Remote**: Keep remote version, discard local
3. **Merged**: Attempt to merge both versions

## File Structure

```
apps/desktop/src/
├── sync/
│   ├── index.ts              # Exports
│   ├── changeTracker.ts     # Local change tracking
│   ├── conflictResolver.ts  # Conflict handling
│   ├── encryption.ts        # E2E encryption
│   └── supabaseProvider.ts # Supabase sync
└── store/
    └── syncStore.ts         # Sync state management
```

## Settings

Configure sync in **Settings > Sync**:

- **Status**: View sync state and pending changes
- **Sync Now**: Manually trigger sync
- **Supabase URL**: Your Supabase project URL
- **Supabase Key**: Your Supabase anon key
- **E2E Encryption**: Toggle end-to-end encryption
- **Auto Sync**: Enable automatic background sync

## Keyboard Shortcut

| Action | Shortcut |
|--------|----------|
| Sync Notes | Cmd+Shift+S |

## Security

### Encryption
- AES-256-GCM for content encryption
- Keys generated using Web Crypto API
- Keys stored in localStorage (browser)
- Each note encrypted with unique IV

### Privacy
- Only encrypted data sent to cloud
- Server never sees plaintext
- Device IDs used for conflict resolution

## Limitations

- Supabase is default provider (Firebase optional)
- No real-time subscriptions (polling-based)
- No offline detection UI
- Single user per vault
