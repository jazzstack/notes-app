import { Plugin, PluginAPI } from '@notes-app/shared';

export const timestampPlugin: Plugin = {
  id: 'timestamp',
  name: 'Timestamp',
  version: '1.0.0',
  description: 'Insert current timestamp into notes',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'insert-timestamp',
      name: 'Insert Timestamp',
      shortcut: ['⌘', 'Shift', 'T'],
      action: () => {
        const now = new Date();
        const timestamp = now.toISOString();
        const readable = now.toLocaleString();
        
        const context = api.getNoteContext();
        console.log('[Timestamp Plugin] Current note:', context.noteId, 'Content length:', context.content.length);
        
        alert(`Current timestamp: ${readable}\nISO: ${timestamp}`);
      },
    });

    api.registerCommand({
      id: 'insert-date',
      name: 'Insert Date',
      action: () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        alert(`Current date: ${dateStr}`);
      },
    });

    api.addEditorHook({
      onSave: () => {
        const context = api.getNoteContext();
        console.log('[Timestamp Plugin] Note saved:', context.noteId);
      },
    });
  },
};
