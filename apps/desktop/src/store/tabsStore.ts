import { create } from 'zustand';

export interface Tab {
  id: string;
  noteId: string;
  title: string;
  isActive: boolean;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  
  openTab: (noteId: string, title: string) => void;
  closeTab: (noteId: string) => void;
  setActiveTab: (noteId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  getActiveNoteId: () => string | null;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (noteId: string, title: string) => {
    const { tabs } = get();
    
    const existingTab = tabs.find(t => t.noteId === noteId);
    if (existingTab) {
      set({
        tabs: tabs.map(t => ({
          ...t,
          isActive: t.noteId === noteId,
        })),
        activeTabId: noteId,
      });
      return;
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      noteId,
      title,
      isActive: true,
    };

    set({
      tabs: [...tabs.map(t => ({ ...t, isActive: false })), newTab],
      activeTabId: noteId,
    });
  },

  closeTab: (noteId: string) => {
    const { tabs } = get();
    const activeTabId = get().activeTabId;
    
    if (tabs.length === 1 && tabs[0].noteId === noteId) {
      set({ tabs: [], activeTabId: null });
      return;
    }

    const closingIndex = tabs.findIndex(t => t.noteId === noteId);
    const newTabs = tabs.filter(t => t.noteId !== noteId);

    let newActiveId = activeTabId;
    if (activeTabId === noteId) {
      const newActiveIndex = Math.min(closingIndex, newTabs.length - 1);
      newActiveId = newTabs[newActiveIndex]?.noteId ?? null;
    }

    set({
      tabs: newTabs.map((t, i) => ({
        ...t,
        isActive: i === (newActiveId ? newTabs.findIndex(nt => nt.noteId === newActiveId) : -1),
      })),
      activeTabId: newActiveId,
    });
  },

  setActiveTab: (noteId: string) => {
    set((state) => ({
      tabs: state.tabs.map(t => ({
        ...t,
        isActive: t.noteId === noteId,
      })),
      activeTabId: noteId,
    }));
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      return { tabs: newTabs };
    });
  },

  getActiveNoteId: () => get().activeTabId,
}));
