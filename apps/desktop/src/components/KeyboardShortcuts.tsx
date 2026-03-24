import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'cmd' | 'shift' | 'alt')[];
  action: () => void;
  description?: string;
  category?: string;
}

const registeredShortcuts: KeyboardShortcut[] = [];

export function registerShortcut(shortcut: KeyboardShortcut): void {
  const existing = registeredShortcuts.findIndex(s => s.id === shortcut.id);
  if (existing >= 0) {
    registeredShortcuts[existing] = shortcut;
  } else {
    registeredShortcuts.push(shortcut);
  }
}

export function unregisterShortcut(id: string): void {
  const index = registeredShortcuts.findIndex(s => s.id === id);
  if (index >= 0) {
    registeredShortcuts.splice(index, 1);
  }
}

export function getRegisteredShortcuts(): KeyboardShortcut[] {
  return [...registeredShortcuts];
}

export function useKeyboardShortcuts(enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const matchingShortcut = registeredShortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
      
      const hasCmd = shortcut.modifiers.includes('cmd') && isMac && e.metaKey;
      const hasCtrl = shortcut.modifiers.includes('ctrl') && e.ctrlKey && !isMac;
      const hasShift = shortcut.modifiers.includes('shift') && e.shiftKey;
      const hasAlt = shortcut.modifiers.includes('alt') && e.altKey;
      
      const hasRequiredModifiers = hasCmd || hasCtrl || hasShift || hasAlt;

      return keyMatch && hasRequiredModifiers;
    });

    if (matchingShortcut) {
      e.preventDefault();
      matchingShortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers.includes('ctrl') || shortcut.modifiers.includes('cmd')) {
    parts.push(navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl');
  }
  if (shortcut.modifiers.includes('shift')) {
    parts.push('⇧');
  }
  if (shortcut.modifiers.includes('alt')) {
    parts.push('Alt');
  }
  
  const key = shortcut.key.length === 1 
    ? shortcut.key.toUpperCase() 
    : shortcut.key;
  parts.push(key);
  
  return parts.join('+');
}

export function parseShortcutString(shortcutStr: string): { key: string; modifiers: ('ctrl' | 'cmd' | 'shift' | 'alt')[] } {
  const parts = shortcutStr.split('+').map(p => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const modifiers: ('ctrl' | 'cmd' | 'shift' | 'alt')[] = [];
  
  for (const part of parts.slice(0, -1)) {
    if (part === 'cmd' || part === '⌘') modifiers.push('cmd');
    if (part === 'ctrl' || part === 'control') modifiers.push('ctrl');
    if (part === 'shift' || part === '⇧') modifiers.push('shift');
    if (part === 'alt' || part === 'option') modifiers.push('alt');
  }
  
  return { key, modifiers };
}
