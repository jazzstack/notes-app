import { Plugin } from '@notes-app/shared';
import { usePluginsStore } from '../store/pluginsStore';
import { wordCountPlugin } from './wordCount';
import { timestampPlugin } from './timestamp';
import { calendarPlugin } from './builtins/calendar';
import { kanbanPlugin } from './builtins/kanban';
import { tasksPlugin } from './builtins/tasks';
import { outlinePlugin } from './builtins/outline';

const builtInPlugins: Plugin[] = [
  wordCountPlugin,
  timestampPlugin,
  calendarPlugin,
  kanbanPlugin,
  tasksPlugin,
  outlinePlugin,
];

export async function loadPlugin(plugin: Plugin): Promise<void> {
  const store = usePluginsStore.getState();
  store.registerPlugin(plugin);
  
  if (store.enabledPlugins.has(plugin.id) && !plugin.enabled) {
    await store.enablePlugin(plugin.id);
  }
}

export async function unloadPlugin(pluginId: string): Promise<void> {
  const store = usePluginsStore.getState();
  await store.disablePlugin(pluginId);
  store.unregisterPlugin(pluginId);
}

export async function initializePlugins(): Promise<void> {
  const store = usePluginsStore.getState();
  
  for (const plugin of builtInPlugins) {
    store.registerPlugin(plugin);
    
    if (store.enabledPlugins.has(plugin.id)) {
      await store.enablePlugin(plugin.id);
    }
  }
}

export function registerBuiltInPlugin(plugin: Plugin): void {
  builtInPlugins.push(plugin);
}
