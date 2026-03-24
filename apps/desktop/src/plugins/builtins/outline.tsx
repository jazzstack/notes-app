import { useMemo } from 'react';
import { Plugin, PluginAPI } from '@notes-app/shared';
import { Icons } from '@notes-app/ui';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface OutlineViewProps {
  noteId?: string;
  onClose?: () => void;
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;
  let idCounter = 0;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: `heading-${idCounter++}`,
    });
  }
  
  return headings;
}

export function OutlinePluginView({ noteId }: OutlineViewProps) {
  const notes = window.__NOTES__ || [];
  const currentNote = noteId ? notes.find((n: { id: string }) => n.id === noteId) : null;
  
  const headings = useMemo(() => {
    if (!currentNote) return [];
    return extractHeadings(currentNote.content);
  }, [currentNote]);

  const navigateToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!currentNote) {
    return (
      <div className="outline-panel">
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', padding: 'var(--space-2)' }}>
          Open a note to see its outline
        </p>
      </div>
    );
  }

  if (headings.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-header">
          <Icons.List style={{ width: 14, height: 14 }} />
          <span>Outline</span>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', padding: 'var(--space-2)' }}>
          No headings found in this note
        </p>
      </div>
    );
  }

  return (
    <div className="outline-panel">
      <div className="outline-header">
        <Icons.List style={{ width: 14, height: 14 }} />
        <span>Outline</span>
      </div>
      <div className="outline-list">
        {headings.map((heading) => (
          <div
            key={heading.id}
            className={`outline-item outline-item-h${heading.level}`}
            onClick={() => navigateToHeading(heading.id)}
          >
            <a
              href={`#${heading.id}`}
              className="outline-link"
              onClick={(e) => {
                e.preventDefault();
                navigateToHeading(heading.id);
              }}
            >
              {heading.text}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export const outlinePlugin: Plugin = {
  id: 'outline',
  name: 'Outline Panel',
  version: '1.0.0',
  description: 'Show table of contents based on note headings',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'show-outline',
      name: 'Show Outline Panel',
      shortcut: ['⌘', 'Shift', 'O'],
      action: () => {
        window.__OPEN_PLUGIN_VIEW__?.({
          key: 'outline-panel',
          component: 'OutlinePluginView',
        });
      },
    });

    api.addEditorHook({
      onContentChange: (content: string) => {
        const headings = extractHeadings(content);
        console.log('[Outline Plugin] Headings:', headings.length);
      },
    });
  },
};
