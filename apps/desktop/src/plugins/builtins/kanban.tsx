import { Plugin, PluginAPI } from '@notes-app/shared';
import { Icons } from '@notes-app/ui';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  notes: { id: string; title: string; content: string }[];
}

interface KanbanViewProps {
  onClose: () => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280', notes: [] },
  { id: 'todo', title: 'To Do', color: '#3b82f6', notes: [] },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b', notes: [] },
  { id: 'done', title: 'Done', color: '#10b981', notes: [] },
];

function extractTag(content: string, tag: string): boolean {
  const regex = new RegExp(`\\[${tag}\\]|\\[x\\]`, 'i');
  return regex.test(content);
}

function getColumnFromContent(content: string): string {
  if (extractTag(content, 'done')) return 'done';
  if (extractTag(content, 'in-progress') || extractTag(content, 'in progress')) return 'in-progress';
  if (extractTag(content, 'todo')) return 'todo';
  return 'backlog';
}

export function KanbanPluginView({ onClose }: KanbanViewProps) {
  const notes = window.__NOTES__ || [];
  
  const columns = useMemo(() => {
    const cols: KanbanColumn[] = DEFAULT_COLUMNS.map(col => ({
      ...col,
      notes: []
    }));
    
    notes.forEach((note: { id: string; title: string; content: string }) => {
      const columnId = getColumnFromContent(note.content);
      const col = cols.find(c => c.id === columnId);
      if (col) {
        col.notes.push(note);
      }
    });
    
    return cols;
  }, [notes]);

  const navigate = (noteId: string) => {
    window.location.hash = `#/note/${noteId}`;
    onClose();
  };

  return (
    <div className="plugin-modal-overlay" onClick={onClose}>
      <div className="plugin-modal kanban-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-modal-header">
          <h2>Kanban Board</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        <div className="plugin-modal-content kanban-content">
          <div className="kanban-board">
            {columns.map((column) => (
              <div key={column.id} className="kanban-column">
                <div className="kanban-column-header" style={{ borderColor: column.color }}>
                  <span className="kanban-column-title">{column.title}</span>
                  <span className="kanban-column-count">{column.notes.length}</span>
                </div>
                <div className="kanban-column-content">
                  {column.notes.map((note) => (
                    <div
                      key={note.id}
                      className="kanban-card"
                      onClick={() => navigate(note.id)}
                    >
                      <div className="kanban-card-title">{note.title}</div>
                      <div className="kanban-card-preview">
                        {note.content.slice(0, 100)}...
                      </div>
                    </div>
                  ))}
                  {column.notes.length === 0 && (
                    <div className="kanban-empty">No notes</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';

let kanbanViewKey = 0;

export const kanbanPlugin: Plugin = {
  id: 'kanban',
  name: 'Kanban Board',
  version: '1.0.0',
  description: 'Organize notes in a Kanban board based on task status',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'open-kanban',
      name: 'Open Kanban Board',
      shortcut: ['⌘', 'Shift', 'K'],
      action: () => {
        kanbanViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `kanban-${kanbanViewKey}`,
          component: 'KanbanPluginView',
        });
      },
    });

    api.addTopBarButton({
      id: 'kanban',
      icon: 'list',
      title: 'Kanban Board',
      action: () => {
        kanbanViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `kanban-${kanbanViewKey}`,
          component: 'KanbanPluginView',
        });
      },
      position: 'right',
    });
  },
};
