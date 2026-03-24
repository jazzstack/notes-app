import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { useNotesStore } from '../store/notesStore';

const CalendarPluginView = lazy(() => import('./builtins/calendar').then(m => ({ default: m.CalendarPluginView })));
const KanbanPluginView = lazy(() => import('./builtins/kanban').then(m => ({ default: m.KanbanPluginView })));
const TasksPluginView = lazy(() => import('./builtins/tasks').then(m => ({ default: m.TasksPluginView })));
const OutlinePluginView = lazy(() => import('./builtins/outline').then(m => ({ default: m.OutlinePluginView })));

function LoadingSpinner() {
  return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
      Loading...
    </div>
  );
}

interface PluginView {
  key: string;
  component: string;
}

interface PluginViewManagerProps {
  children: React.ReactNode;
}

const PluginViewContext = createContext<{
  openViews: PluginView[];
  closeView: (key: string) => void;
}>({
  openViews: [],
  closeView: () => {},
});

export function usePluginViews() {
  return useContext(PluginViewContext);
}

export function PluginViewManager({ children }: PluginViewManagerProps) {
  const [openViews, setOpenViews] = useState<PluginView[]>([]);
  const notes = useNotesStore((state) => state.notes);
  const createNote = useNotesStore((state) => state.createNote);
  const updateNote = useNotesStore((state) => state.updateNote);

  useEffect(() => {
    window.__NOTES__ = notes;
    window.__CREATE_NOTE__ = createNote;
    window.__UPDATE_NOTE__ = updateNote;
  }, [notes, createNote, updateNote]);

  useEffect(() => {
    const handler = (view: PluginView) => {
      setOpenViews((prev) => [...prev, view]);
    };

    window.__OPEN_PLUGIN_VIEW__ = handler;

    return () => {
      window.__OPEN_PLUGIN_VIEW__ = undefined;
    };
  }, []);

  const closeView = (key: string) => {
    setOpenViews((prev) => prev.filter((v) => v.key !== key));
  };

  const renderView = (view: PluginView) => {
    switch (view.component) {
      case 'CalendarPluginView': {
        return (
          <CalendarPluginView
            key={view.key}
            onClose={() => closeView(view.key)}
          />
        );
      }
      case 'KanbanPluginView': {
        return (
          <KanbanPluginView
            key={view.key}
            onClose={() => closeView(view.key)}
          />
        );
      }
      case 'TasksPluginView': {
        return (
          <TasksPluginView
            key={view.key}
            onClose={() => closeView(view.key)}
          />
        );
      }
      case 'OutlinePluginView': {
        return <OutlinePluginView key={view.key} />;
      }
      default:
        return null;
    }
  };

  return (
    <PluginViewContext.Provider value={{ openViews, closeView }}>
      {children}
      <Suspense fallback={<LoadingSpinner />}>
        {openViews.map(renderView)}
      </Suspense>
    </PluginViewContext.Provider>
  );
}
