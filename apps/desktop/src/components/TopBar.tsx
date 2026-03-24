import { useState, useEffect, useRef } from 'react';
import { Icons } from '@notes-app/ui';

type MenuItem = {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
};

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  onNavigateSettings: () => void;
  onCreateNote: () => void;
  onNavigateHome: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function TopBar({
  onOpenCommandPalette,
  onToggleTheme,
  resolvedTheme,
  onNavigateSettings,
  onCreateNote,
  onNavigateHome,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
}: TopBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  const menus: { label: string; items: MenuItem[] }[] = [
    {
      label: 'File',
      items: [
        { label: 'New Note', shortcut: '⌘N', action: onCreateNote },
        { label: 'Save', shortcut: '⌘S', action: () => {}, disabled: true },
        { divider: true, label: '' },
        { label: 'Exit', shortcut: 'Alt+F4', action: () => window.close() },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: '⌘Z', action: () => document.execCommand('undo') },
        { label: 'Redo', shortcut: '⌘⇧Z', action: () => document.execCommand('redo') },
        { divider: true, label: '' },
        { label: 'Cut', shortcut: '⌘X', action: () => document.execCommand('cut') },
        { label: 'Copy', shortcut: '⌘C', action: () => document.execCommand('copy') },
        { label: 'Paste', shortcut: '⌘V', action: () => document.execCommand('paste') },
        { divider: true, label: '' },
        { label: 'Select All', shortcut: '⌘A', action: () => document.execCommand('selectAll') },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Sidebar', shortcut: '⌘B', action: () => {} },
        { label: 'Toggle Fullscreen', shortcut: 'F11', action: () => {} },
        { divider: true, label: '' },
        { label: 'Zoom In', shortcut: '⌘+', action: () => {} },
        { label: 'Zoom Out', shortcut: '⌘-', action: () => {} },
        { label: 'Reset Zoom', shortcut: '⌘0', action: () => {} },
      ],
    },
    {
      label: 'Go',
      items: [
        { label: 'Go to Home', shortcut: '⌘⇧H', action: () => {} },
        { label: 'Go to Settings', shortcut: '⌘,', action: onNavigateSettings },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'About Notes App', action: onNavigateSettings },
        { label: 'Keyboard Shortcuts', shortcut: '⌘K ⌘S', action: onOpenCommandPalette },
      ],
    },
  ];

  return (
    <nav className="topbar" ref={menuRef}>
      <div className="topbar-section topbar-left">
        <button
          className="topbar-icon-btn"
          onClick={onGoBack}
          disabled={!canGoBack}
          title="Go Back"
        >
          <Icons.ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <button
          className="topbar-icon-btn"
          onClick={onGoForward}
          disabled={!canGoForward}
          title="Go Forward"
        >
          <Icons.ArrowRight style={{ width: 16, height: 16 }} />
        </button>
        <div className="topbar-divider" />
        <button className="topbar-icon-btn" onClick={onNavigateHome} title="Go Home">
          <Icons.Home style={{ width: 16, height: 16 }} />
        </button>
        <div className="topbar-divider" />
        <div className="topbar-logo" onClick={onNavigateSettings} title="Notes App">
          <Icons.FileText style={{ width: 16, height: 16 }} />
        </div>

        {menus.map((menu) => (
          <div key={menu.label} className="topbar-menu-wrapper">
            <button
              className={`topbar-menu-btn ${activeMenu === menu.label ? 'active' : ''}`}
              onClick={() => handleMenuClick(menu.label)}
              onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
            >
              {menu.label}
            </button>
            {activeMenu === menu.label && (
              <div className="topbar-dropdown">
                {menu.items.map((item, idx) =>
                  item.divider ? (
                    <div key={idx} className="topbar-dropdown-divider" />
                  ) : (
                    <button
                      key={item.label}
                      className={`topbar-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!item.disabled && item.action) {
                          item.action();
                        }
                        setActiveMenu(null);
                      }}
                      disabled={item.disabled}
                    >
                      <span className="topbar-dropdown-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="topbar-dropdown-shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="topbar-section topbar-center">
        <button className="topbar-search" onClick={onOpenCommandPalette}>
          <Icons.Search style={{ width: 14, height: 14 }} />
          <span className="topbar-search-text">Search or type a command...</span>
          <kbd className="topbar-search-kbd">⌘K</kbd>
        </button>
      </div>

      <div className="topbar-section topbar-right">
        <button
          className="topbar-icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          {resolvedTheme === 'light' ? (
            <Icons.Moon style={{ width: 16, height: 16 }} />
          ) : (
            <Icons.Sun style={{ width: 16, height: 16 }} />
          )}
        </button>
        <button
          className="topbar-icon-btn"
          onClick={onNavigateSettings}
          title="Settings"
        >
          <Icons.Settings style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </nav>
  );
}
