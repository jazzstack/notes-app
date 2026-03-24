import { useState, useMemo } from 'react';
import { Plugin, PluginAPI } from '@notes-app/shared';
import { Icons } from '@notes-app/ui';

interface Task {
  id: string;
  noteId: string;
  noteTitle: string;
  content: string;
  completed: boolean;
}

interface TasksViewProps {
  onClose: () => void;
}

function parseTasks(content: string): { completed: boolean; text: string }[] {
  const taskRegex = /^- \[([ x])\] (.+)$/gm;
  const tasks: { completed: boolean; text: string }[] = [];
  let match;
  
  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push({
      completed: match[1].toLowerCase() === 'x',
      text: match[2],
    });
  }
  
  return tasks;
}

export function TasksPluginView({ onClose }: TasksViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const notes = window.__NOTES__ || [];

  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    
    notes.forEach((note: { id: string; title: string; content: string }) => {
      const parsedTasks = parseTasks(note.content);
      parsedTasks.forEach((task, idx) => {
        tasks.push({
          id: `${note.id}-${idx}`,
          noteId: note.id,
          noteTitle: note.title,
          content: task.text,
          completed: task.completed,
        });
      });
    });
    
    return tasks;
  }, [notes]);

  const filteredTasks = useMemo(() => {
    if (filter === 'pending') return allTasks.filter(t => !t.completed);
    if (filter === 'completed') return allTasks.filter(t => t.completed);
    return allTasks;
  }, [allTasks, filter]);

  const stats = useMemo(() => ({
    total: allTasks.length,
    completed: allTasks.filter(t => t.completed).length,
    pending: allTasks.filter(t => !t.completed).length,
  }), [allTasks]);

  const navigate = (noteId: string) => {
    window.location.hash = `#/note/${noteId}`;
    onClose();
  };

  return (
    <div className="plugin-modal-overlay" onClick={onClose}>
      <div className="plugin-modal tasks-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-modal-header">
          <h2>Task Manager</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        <div className="plugin-modal-content">
          <div className="tasks-stats">
            <div className="tasks-stat">
              <span className="tasks-stat-value">{stats.total}</span>
              <span className="tasks-stat-label">Total</span>
            </div>
            <div className="tasks-stat">
              <span className="tasks-stat-value">{stats.pending}</span>
              <span className="tasks-stat-label">Pending</span>
            </div>
            <div className="tasks-stat">
              <span className="tasks-stat-value">{stats.completed}</span>
              <span className="tasks-stat-label">Completed</span>
            </div>
          </div>

          <div className="tasks-filter">
            <button
              className={`tasks-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`tasks-filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`tasks-filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>

          <div className="tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="tasks-empty">No tasks found</div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                  onClick={() => navigate(task.noteId)}
                >
                  <span className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                    {task.completed && '✓'}
                  </span>
                  <div className="task-content">
                    <div className="task-text">{task.content}</div>
                    <div className="task-source">{task.noteTitle}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

let tasksViewKey = 0;

export const tasksPlugin: Plugin = {
  id: 'tasks',
  name: 'Task Manager',
  version: '1.0.0',
  description: 'View and manage tasks across all notes',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'open-tasks',
      name: 'Open Task Manager',
      shortcut: ['⌘', 'Shift', 'T'],
      action: () => {
        tasksViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `tasks-${tasksViewKey}`,
          component: 'TasksPluginView',
        });
      },
    });

    api.addTopBarButton({
      id: 'tasks',
      icon: 'list',
      title: 'Task Manager',
      action: () => {
        tasksViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `tasks-${tasksViewKey}`,
          component: 'TasksPluginView',
        });
      },
      position: 'right',
    });
  },
};
