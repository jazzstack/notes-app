import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Icons } from './Icons';

type EditorMode = 'edit' | 'preview' | 'split';

interface NoteEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  lastSaved?: Date | null;
}

export function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onDelete,
  lastSaved,
}: NoteEditorProps) {
  const [mode, setMode] = useState<EditorMode>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveHandlerRef = useRef<() => void>(() => {});

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    onSave();
    setTimeout(() => setIsSaving(false), 300);
  }, [onSave]);

  saveHandlerRef.current = handleSave;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveHandlerRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      contentRef.current?.focus();
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this note?')) {
      onDelete();
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-wrapper">
        <EditorToolbar
          mode={mode}
          onModeChange={setMode}
          onSave={handleSave}
          onDelete={handleDelete}
          isSaving={isSaving}
          hasDelete={!!onDelete}
        />

        <div className="editor" style={{ marginTop: 'var(--space-4)' }}>
          <input
            ref={titleRef}
            type="text"
            className="editor-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="Note title..."
          />

          {mode === 'edit' && (
            <textarea
              ref={contentRef}
              className="editor-content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Start writing..."
              autoFocus
            />
          )}

          {mode === 'preview' && (
            <div className="markdown-preview">
              <MarkdownPreview content={content} />
            </div>
          )}

          {mode === 'split' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              <textarea
                className="editor-content"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start writing..."
              />
              <div className="markdown-preview" style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-6)' }}>
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>

        <EditorFooter lastSaved={lastSaved} isSaving={isSaving} />
      </div>
    </div>
  );
}

interface EditorToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onSave: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  hasDelete: boolean;
}

function EditorToolbar({ mode, onModeChange, onSave, onDelete, isSaving, hasDelete }: EditorToolbarProps) {
  return (
    <div className="editor-toolbar" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div className="editor-mode-toggle">
          <button
            className={`editor-mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => onModeChange('edit')}
          >
            Edit
          </button>
          <button
            className={`editor-mode-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => onModeChange('preview')}
          >
            Preview
          </button>
          <button
            className={`editor-mode-btn ${mode === 'split' ? 'active' : ''}`}
            onClick={() => onModeChange('split')}
          >
            Split
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onSave}
          disabled={isSaving}
          title="Save (⌘S)"
        >
          <Icons.Save />
        </button>
        {hasDelete && onDelete && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onDelete}
            title="Delete"
            style={{ color: 'var(--color-error)' }}
          >
            <Icons.Trash />
          </button>
        )}
      </div>
    </div>
  );
}

interface EditorFooterProps {
  lastSaved: Date | null | undefined;
  isSaving: boolean;
}

function EditorFooter({ lastSaved, isSaving }: EditorFooterProps) {
  return (
    <div className="editor-footer">
      <div className="editor-footer-meta">
        {isSaving ? (
          <span>Saving...</span>
        ) : lastSaved ? (
          <span>Saved {formatRelativeTime(lastSaved)}</span>
        ) : (
          <span>Not saved</span>
        )}
      </div>
      <div className="editor-footer-actions">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
          ⌘S to save
        </span>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

interface MarkdownPreviewProps {
  content: string;
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = parseMarkdown(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function parseMarkdown(text: string): string {
  if (!text) return '<p style="color: var(--color-text-tertiary)">Nothing to preview</p>';

  let html = text;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/^> (.*$)/gm, '<blockquote><p>$1</p></blockquote>');

  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/^(?!<[huplo]|<li|<blockquote)(.*$)/gm, '<p>$1</p>');

  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<[huplo])/g, '$1');
  html = html.replace(/(<\/[huplo][^>]*>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');

  return html;
}
