import { create } from 'zustand';
import { Plugin, PluginAPI, PluginCommand, PluginTopBarButton, EditorHookCallbacks, NoteContext, AppSettings } from '@notes-app/shared';
import { useAppStore } from './appStore';

interface PluginsState {
  plugins: Plugin[];
  commands: PluginCommand[];
  topBarButtons: PluginTopBarButton[];
  editorHooks: EditorHookCallbacks[];
  noteContext: NoteContext;
  enabledPlugins: Set<string>;
  
  registerPlugin: (plugin: Plugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  registerCommand: (command: PluginCommand) => void;
  unregisterCommand: (commandId: string) => void;
  addTopBarButton: (button: PluginTopBarButton) => void;
  removeTopBarButton: (buttonId: string) => void;
  addEditorHook: (hook: EditorHookCallbacks) => void;
  removeEditorHook: () => void;
  setNoteContext: (context: NoteContext) => void;
  getPluginAPI: (pluginId: string) => PluginAPI;
}

const PLUGINS_STORAGE_KEY = 'notes-app-plugins-enabled';

function loadEnabledPlugins(): Set<string> {
  try {
    const data = localStorage.getItem(PLUGINS_STORAGE_KEY);
    if (data) {
      return new Set(JSON.parse(data));
    }
  } catch (e) {
    console.error('Failed to load enabled plugins:', e);
  }
  return new Set();
}

function saveEnabledPlugins(plugins: Set<string>): void {
  try {
    localStorage.setItem(PLUGINS_STORAGE_KEY, JSON.stringify([...plugins]));
  } catch (e) {
    console.error('Failed to save enabled plugins:', e);
  }
}

export const usePluginsStore = create<PluginsState>((set, get) => ({
  plugins: [],
  commands: [],
  topBarButtons: [],
  editorHooks: [],
  noteContext: { noteId: null, title: '', content: '' },
  enabledPlugins: loadEnabledPlugins(),

  registerPlugin: (plugin: Plugin) => {
    set((state) => {
      const exists = state.plugins.find((p) => p.id === plugin.id);
      if (exists) return state;
      return { plugins: [...state.plugins, plugin] };
    });
  },

  unregisterPlugin: (pluginId: string) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === pluginId);
    if (plugin?.onUnload) {
      plugin.onUnload();
    }
    set((state) => ({
      plugins: state.plugins.filter((p) => p.id !== pluginId),
      commands: state.commands.filter((c) => !c.id.startsWith(`${pluginId}:`)),
      topBarButtons: state.topBarButtons.filter((b) => !b.id.startsWith(`${pluginId}:`)),
    }));
  },

  enablePlugin: async (pluginId: string) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === pluginId);
    if (!plugin) return;

    const newEnabled = new Set(state.enabledPlugins);
    newEnabled.add(pluginId);
    saveEnabledPlugins(newEnabled);

    plugin.enabled = true;
    if (plugin.onLoad) {
      const api = state.getPluginAPI(pluginId);
      await plugin.onLoad(api);
    }

    set({ enabledPlugins: newEnabled });
  },

  disablePlugin: async (pluginId: string) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === pluginId);
    if (!plugin) return;

    if (plugin.onUnload) {
      await plugin.onUnload();
    }

    plugin.enabled = false;
    const newEnabled = new Set(state.enabledPlugins);
    newEnabled.delete(pluginId);
    saveEnabledPlugins(newEnabled);

    set((state) => ({
      enabledPlugins: newEnabled,
      commands: state.commands.filter((c) => !c.id.startsWith(`${pluginId}:`)),
      topBarButtons: state.topBarButtons.filter((b) => !b.id.startsWith(`${pluginId}:`)),
    }));
  },

  registerCommand: (command: PluginCommand) => {
    set((state) => ({
      commands: [...state.commands.filter((c) => c.id !== command.id), command],
    }));
  },

  unregisterCommand: (commandId: string) => {
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== commandId),
    }));
  },

  addTopBarButton: (button: PluginTopBarButton) => {
    set((state) => ({
      topBarButtons: [...state.topBarButtons.filter((b) => b.id !== button.id), button],
    }));
  },

  removeTopBarButton: (buttonId: string) => {
    set((state) => ({
      topBarButtons: state.topBarButtons.filter((b) => b.id !== buttonId),
    }));
  },

  addEditorHook: (hook: EditorHookCallbacks) => {
    set((state) => ({
      editorHooks: [...state.editorHooks, hook],
    }));
  },

  removeEditorHook: () => {
    set((state) => ({
      editorHooks: state.editorHooks.slice(0, -1),
    }));
  },

  setNoteContext: (context: NoteContext) => {
    set({ noteContext: context });
  },

  getPluginAPI: (pluginId: string): PluginAPI => ({
    registerCommand: (command: PluginCommand) => {
      get().registerCommand({ ...command, id: `${pluginId}:${command.id}` });
    },
    unregisterCommand: (commandId: string) => {
      get().unregisterCommand(`${pluginId}:${commandId}`);
    },
    addTopBarButton: (button: PluginTopBarButton) => {
      get().addTopBarButton({ ...button, id: `${pluginId}:${button.id}` });
    },
    removeTopBarButton: (buttonId: string) => {
      get().removeTopBarButton(`${pluginId}:${buttonId}`);
    },
    addEditorHook: (hook: EditorHookCallbacks) => {
      get().addEditorHook(hook);
    },
    removeEditorHook: () => {
      get().removeEditorHook();
    },
    getNoteContext: () => get().noteContext,
    app: {
      get settings() {
        return useAppStore.getState().settings;
      },
      updateSettings: (updates: Partial<AppSettings>) => {
        useAppStore.getState().updateSettings(updates);
      },
    },
  }),
}));
