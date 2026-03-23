import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useTheme } from '../hooks/useTheme';
import { CommandPalette } from './CommandPalette';
import { Icons } from './Icons';

interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
  isOpen?: boolean;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notes = useNotesStore((state) => state.notes);
  const createNote = useNotesStore((state) => state.createNote);
  const { resolvedTheme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [fileTree] = useState<FileTreeItem[]>([
    { id: 'notes', name: 'Notes', type: 'folder', isOpen: true },
  ]);

  const handleCreateNote = useCallback(async () => {
    const note = await createNote('Untitled');
    navigate(`/note/${note.id}`);
  }, [createNote, navigate]);

  const commandItems = [
    {
      id: 'new-note',
      title: 'New Note',
      description: 'Create a new note',
      shortcut: ['⌘', 'N'],
      category: 'Notes',
      action: handleCreateNote,
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${resolvedTheme === 'light' ? 'Dark' : 'Light'} Mode`,
      description: 'Toggle between light and dark theme',
      category: 'Appearance',
      action: toggleTheme,
    },
    {
      id: 'toggle-sidebar',
      title: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
      shortcut: ['⌘', '\\'],
      category: 'View',
      action: () => setSidebarCollapsed(!sidebarCollapsed),
    },
    {
      id: 'toggle-right-panel',
      title: showRightPanel ? 'Hide Right Panel' : 'Show Right Panel',
      shortcut: ['⌘', ';'],
      category: 'View',
      action: () => setShowRightPanel(!showRightPanel),
    },
    {
      id: 'settings',
      title: 'Open Settings',
      shortcut: ['⌘', ','],
      category: 'Navigation',
      action: () => navigate('/settings'),
    },
  ];

  const toggleFolder = useCallback((_id: string) => {
    // Folder toggle logic
  }, []);

  return (
    <div className="app-layout">
      <TopBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onToggleTheme={toggleTheme}
        resolvedTheme={resolvedTheme}
        onNavigateSettings={() => navigate('/settings')}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        fileTree={fileTree}
        onToggleFolder={toggleFolder}
        onCreateNote={handleCreateNote}
        currentNoteId={location.pathname.includes('/note/') ? location.pathname.split('/note/')[1] : null}
        onSelectNote={(id) => navigate(`/note/${id}`)}
        notes={notes}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={commandItems}
        placeholder="Search commands..."
      />
    </div>
  );
}

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  onNavigateSettings: () => void;
}

function TopBar({ onOpenCommandPalette, onToggleTheme, resolvedTheme, onNavigateSettings }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Notes</span>
      </div>

      <div className="topbar-center">
        <button className="search-bar" onClick={onOpenCommandPalette}>
          <Icons.Search className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search or run command..."
            readOnly
          />
          <span className="search-bar-shortcut">⌘K</span>
        </button>
      </div>

      <div className="topbar-right">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          {resolvedTheme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onNavigateSettings}
          title="Settings"
        >
          <Icons.Settings />
        </button>
      </div>
    </header>
  );
}

interface SidebarProps {
  collapsed: boolean;
  fileTree: FileTreeItem[];
  onToggleFolder: (id: string) => void;
  onCreateNote: () => void;
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
  notes: { id: string; title: string; updatedAt: Date }[];
  onToggleCollapse: () => void;
}

function Sidebar({ collapsed, fileTree, onToggleFolder, onCreateNote, currentNoteId, onSelectNote, notes, onToggleCollapse }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          <div className="sidebar-header">
            <span className="sidebar-title">Explorer</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onCreateNote} title="New Note">
              <Icons.Plus />
            </button>
          </div>

          <div className="sidebar-content">
            <FileExplorer
              items={fileTree}
              notes={notes}
              onToggleFolder={onToggleFolder}
              currentNoteId={currentNoteId}
              onSelectNote={onSelectNote}
            />
          </div>

          <div className="sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                {notes.length} notes
              </span>
            </div>
          </div>
        </>
      )}
      
      <button 
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <Icons.ChevronRight style={{ width: '14px', height: '14px', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
      </button>
    </aside>
  );
}

interface FileExplorerProps {
  items: FileTreeItem[];
  notes: { id: string; title: string; updatedAt: Date }[];
  onToggleFolder: (id: string) => void;
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
}

function FileExplorer({ items, notes, onToggleFolder, currentNoteId, onSelectNote }: FileExplorerProps) {
  return (
    <div className="file-explorer">
      {items.map(item => (
        <div key={item.id} className="folder">
          <div className="folder-header" onClick={() => onToggleFolder(item.id)}>
            <Icons.ChevronRight className="folder-icon" style={{ transform: item.isOpen ? 'rotate(90deg)' : undefined }} />
            <Icons.Folder className="file-item-icon" />
            <span className="file-item-name">{item.name}</span>
          </div>
          {item.isOpen && (
            <div className="folder-children">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`file-item ${currentNoteId === note.id ? 'active' : ''}`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <Icons.FileText className="file-item-icon" />
                  <span className="file-item-name">{note.title || 'Untitled'}</span>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="file-item" style={{ color: 'var(--color-text-tertiary)', cursor: 'default' }}>
                  <span style={{ marginLeft: '24px', fontSize: 'var(--text-xs)' }}>No notes yet</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
