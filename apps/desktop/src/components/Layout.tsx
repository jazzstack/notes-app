import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useNotesStore, FileEntry } from '../store/notesStore';
import { useTheme } from '@notes-app/ui';
import { CommandPalette, Icons } from '@notes-app/ui';
import { SidebarCalendar } from './SidebarCalendar';

interface FolderState {
  [key: string]: boolean;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notes = useNotesStore((state) => state.notes);
  const vaultInitialized = useNotesStore((state) => state.vaultInitialized);
  const fileTree = useNotesStore((state) => state.fileTree);
  const createNote = useNotesStore((state) => state.createNote);
  const loadDirectory = useNotesStore((state) => state.loadDirectory);
  const vaultPath = useNotesStore((state) => state.vaultPath);
  const selectVault = useNotesStore((state) => state.selectVault);
  const { resolvedTheme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [history, setHistory] = useState<string[]>(['/']);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<FolderState>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileEntry } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (vaultInitialized && vaultPath) {
      loadDirectory(vaultPath);
    }
  }, [vaultInitialized, vaultPath, loadDirectory]);

  useEffect(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== location.pathname) {
        newHistory.push(location.pathname);
        return newHistory;
      }
      return prev;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, history.length));
  }, [location.pathname]);

  const handleGoBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex]);
    }
  }, [historyIndex, history, navigate]);

  const handleGoForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigate(history[newIndex]);
    }
  }, [historyIndex, history, navigate]);

  const handleGoHome = useCallback(() => {
    navigate('/');
    const newHistory = [...history.slice(0, historyIndex + 1), '/'];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [navigate, history, historyIndex]);

  const handleCreateNote = useCallback(async () => {
    const note = await createNote('Untitled');
    if (note) {
      navigate(`/note/${note.id}`);
    }
  }, [createNote, navigate]);

  const handleCreateFolder = useCallback(async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        const { createFolder } = useNotesStore.getState();
        await createFolder(name);
      } catch (e) {
        console.error('Failed to create folder:', e);
      }
    }
  }, []);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const newState = { ...prev };
      newState[path] = !newState[path];
      return newState;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (sidebarCollapsed) return;
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
  }, [sidebarCollapsed, sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(180, Math.min(500, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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
      id: 'new-folder',
      title: 'New Folder',
      description: 'Create a new folder',
      shortcut: ['⌘', 'Shift', 'N'],
      category: 'Notes',
      action: handleCreateFolder,
    },
    {
      id: 'open-vault',
      title: 'Open Vault',
      description: 'Select a vault folder',
      shortcut: ['⌘', 'O'],
      category: 'Vault',
      action: selectVault,
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
      id: 'settings',
      title: 'Open Settings',
      shortcut: ['⌘', ','],
      category: 'Navigation',
      action: () => navigate('/settings'),
    },
  ];

  return (
    <div className="app-layout">
      <TopBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onToggleTheme={toggleTheme}
        resolvedTheme={resolvedTheme}
        onNavigateSettings={() => navigate('/settings')}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onGoHome={handleGoHome}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        width={sidebarWidth}
        onResizeStart={handleMouseDown}
        fileTree={fileTree}
        notes={notes}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onContextMenu={handleContextMenu}
        currentNoteId={location.pathname.includes('/note/') ? location.pathname.split('/note/')[1] : null}
        onSelectNote={(id) => navigate(`/note/${id}`)}
        onSelectVault={selectVault}
        vaultInitialized={vaultInitialized}
      />

      <main 
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ marginLeft: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <Outlet />
      </main>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={async () => {
            const newName = prompt('Enter new name:', contextMenu.item.name);
            if (newName && newName !== contextMenu.item.name) {
              if (contextMenu.item.is_dir) {
                await useNotesStore.getState().renameFolder(contextMenu.item.path, newName);
              } else {
                const title = newName.replace(/\.(md|markdown)$/, '');
                await useNotesStore.getState().renameNote(contextMenu.item.path, title);
              }
            }
            closeContextMenu();
          }}
          onDelete={async () => {
            const confirmed = confirm(`Are you sure you want to delete "${contextMenu.item.name}"?`);
            if (confirmed) {
              if (contextMenu.item.is_dir) {
                await useNotesStore.getState().deleteFolder(contextMenu.item.path);
              } else {
                await useNotesStore.getState().deleteNote(contextMenu.item.path);
              }
            }
            closeContextMenu();
          }}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={commandItems}
        placeholder="Search or run command..."
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

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  onNavigateSettings: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoHome: () => void;
}

function TopBar({ onOpenCommandPalette, onToggleTheme, resolvedTheme, onNavigateSettings, onToggleSidebar, sidebarCollapsed, canGoBack, canGoForward, onGoBack, onGoForward, onGoHome }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Icons.PanelLeft className={`sidebar-toggle-icon ${sidebarCollapsed ? 'collapsed' : ''}`} />
        </button>

        <div className="nav-buttons">
          <button
            className="nav-btn"
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Go back"
          >
            <Icons.ArrowLeft />
          </button>
          <button
            className="nav-btn"
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Go forward"
          >
            <Icons.ArrowRight />
          </button>
          <button
            className="nav-btn"
            onClick={onGoHome}
            title="Go home"
          >
            <Icons.Home />
          </button>
        </div>
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
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  fileTree: FileEntry[];
  notes: { id: string; title: string; updatedAt: Date | string; path: string }[];
  expandedFolders: FolderState;
  onToggleFolder: (path: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onContextMenu: (e: React.MouseEvent, item: FileEntry) => void;
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
  onSelectVault: () => void;
  vaultInitialized: boolean;
}

function Sidebar({
  collapsed,
  width,
  onResizeStart,
  fileTree,
  notes,
  expandedFolders,
  onToggleFolder,
  onCreateNote,
  onCreateFolder,
  onContextMenu,
  currentNoteId,
  onSelectNote,
  onSelectVault,
  vaultInitialized
}: SidebarProps) {
  const noteByPath = new Map(notes.map((n) => [n.path, n]));

  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-icon" onClick={onCreateNote} title="New Note">
            <Icons.Plus />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onSelectVault} title="Open Vault">
            <Icons.FolderOpen />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar" style={{ width }}>
      <div className="sidebar-header">
        <span className="sidebar-title">Explorer</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCreateNote} title="New Note">
            <Icons.Plus />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCreateFolder} title="New Folder">
            <Icons.Folder />
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {!vaultInitialized ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              No vault selected
            </p>
            <button className="btn btn-primary btn-sm" onClick={onSelectVault}>
              <Icons.FolderOpen />
              Open Vault
            </button>
          </div>
        ) : (
          <FileExplorer
            items={fileTree}
            noteByPath={noteByPath}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
            onContextMenu={onContextMenu}
            currentNoteId={currentNoteId}
            onSelectNote={onSelectNote}
          />
        )}
      </div>

      <SidebarCalendar collapsed={collapsed} />

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          <Icons.Folder style={{ width: '12px', height: '12px', color: 'var(--color-text-tertiary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {notes.length} notes
          </span>
        </div>
      </div>

      <div
        className="sidebar-resize-handle"
        onMouseDown={onResizeStart}
      />
    </aside>
  );
}

interface FileExplorerProps {
  items: FileEntry[];
  noteByPath: Map<string, { id: string; title: string; updatedAt: Date | string; path: string }>;
  expandedFolders: FolderState;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, item: FileEntry) => void;
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
}

function FileExplorer({
  items,
  noteByPath,
  expandedFolders,
  onToggleFolder,
  onContextMenu,
  currentNoteId,
  onSelectNote
}: FileExplorerProps) {
  const folders = items.filter((item) => item.is_dir);
  const files = items.filter((item) => item.is_note);

  return (
    <div className="file-explorer">
      {folders.map((folder) => (
        <div key={folder.path} className="folder">
          <div
            className="folder-header"
            onClick={() => onToggleFolder(folder.path)}
            onContextMenu={(e) => onContextMenu(e, folder)}
          >
            <Icons.ChevronRight
              className="folder-icon"
              style={{ transform: expandedFolders[folder.path] ? 'rotate(90deg)' : undefined }}
            />
            <Icons.Folder className="file-item-icon" />
            <span className="file-item-name">{folder.name}</span>
          </div>
          {expandedFolders[folder.path] && (
            <FolderContents
              path={folder.path}
              noteByPath={noteByPath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onContextMenu={onContextMenu}
              currentNoteId={currentNoteId}
              onSelectNote={onSelectNote}
            />
          )}
        </div>
      ))}

      {files.map((file) => {
        const note = noteByPath.get(file.path);
        const isActive = note && currentNoteId === note.id;

        return (
          <div
            key={file.path}
            className={`file-item ${isActive ? 'active' : ''}`}
            onClick={() => note && onSelectNote(note.id)}
            onContextMenu={(e) => onContextMenu(e, file)}
          >
            <Icons.FileText className="file-item-icon" />
            <span className="file-item-name">{note?.title || file.name.replace(/\.(md|markdown)$/, '')}</span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="file-item" style={{ color: 'var(--color-text-tertiary)', cursor: 'default' }}>
          <span style={{ marginLeft: '24px', fontSize: 'var(--text-xs)' }}>No notes yet</span>
        </div>
      )}
    </div>
  );
}

interface FolderContentsProps {
  path: string;
  noteByPath: Map<string, { id: string; title: string; updatedAt: Date | string; path: string }>;
  expandedFolders: FolderState;
  onToggleFolder: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, item: FileEntry) => void;
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
}

function FolderContents({
  path,
  noteByPath,
  expandedFolders,
  onToggleFolder,
  onContextMenu,
  currentNoteId,
  onSelectNote
}: FolderContentsProps) {
  const [contents, setContents] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContents = async () => {
      try {
        const entries = await useNotesStore.getState().loadDirectory(path);
        setContents(entries);
      } catch (e) {
        console.error('Failed to load folder contents:', e);
      } finally {
        setLoading(false);
      }
    };
    loadContents();
  }, [path]);

  if (loading) {
    return (
      <div className="folder-children" style={{ paddingLeft: 'var(--space-6)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  const folders = contents.filter((item) => item.is_dir);
  const files = contents.filter((item) => item.is_note);

  return (
    <div className="folder-children">
      {folders.map((folder) => (
        <div key={folder.path} className="folder">
          <div
            className="folder-header"
            onClick={() => onToggleFolder(folder.path)}
            onContextMenu={(e) => onContextMenu(e, folder)}
          >
            <Icons.ChevronRight
              className="folder-icon"
              style={{ transform: expandedFolders[folder.path] ? 'rotate(90deg)' : undefined }}
            />
            <Icons.Folder className="file-item-icon" />
            <span className="file-item-name">{folder.name}</span>
          </div>
          {expandedFolders[folder.path] && (
            <FolderContents
              path={folder.path}
              noteByPath={noteByPath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onContextMenu={onContextMenu}
              currentNoteId={currentNoteId}
              onSelectNote={onSelectNote}
            />
          )}
        </div>
      ))}

      {files.map((file) => {
        const note = noteByPath.get(file.path);
        const isActive = note && currentNoteId === note.id;

        return (
          <div
            key={file.path}
            className={`file-item ${isActive ? 'active' : ''}`}
            onClick={() => note && onSelectNote(note.id)}
            onContextMenu={(e) => onContextMenu(e, file)}
          >
            <Icons.FileText className="file-item-icon" />
            <span className="file-item-name">{note?.title || file.name.replace(/\.(md|markdown)$/, '')}</span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="file-item" style={{ color: 'var(--color-text-tertiary)', cursor: 'default' }}>
          <span style={{ marginLeft: '24px', fontSize: 'var(--text-xs)' }}>Empty folder</span>
        </div>
      )}
    </div>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
}

function ContextMenu({ x, y, onRename, onDelete }: ContextMenuProps) {
  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
      }}
    >
      <div className="context-menu-item" onClick={onRename}>
        <Icons.FileText style={{ width: '14px', height: '14px' }} />
        Rename
      </div>
      <div className="context-menu-item context-menu-item-danger" onClick={onDelete}>
        <Icons.Trash style={{ width: '14px', height: '14px' }} />
        Delete
      </div>
    </div>
  );
}
