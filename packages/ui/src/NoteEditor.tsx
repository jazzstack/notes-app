import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Icons } from './Icons';

type EditorMode = 'edit' | 'preview' | 'split';

interface NoteEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  onDropImage?: (file: File) => Promise<string | null>;
  onExport?: (format: 'markdown' | 'html' | 'json' | 'pdf') => void;
  onShowHistory?: () => void;
  lastSaved?: Date | null;
}

export function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onDelete,
  onDropImage,
  onExport,
  onShowHistory,
  lastSaved,
}: NoteEditorProps) {
  const [mode, setMode] = useState<EditorMode>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveHandlerRef = useRef<() => void>(() => {});
  const dragCounterRef = useRef(0);

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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (!onDropImage) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    for (const file of imageFiles) {
      const imagePath = await onDropImage(file);
      if (imagePath) {
        const imageMarkdown = `\n![${file.name}](${imagePath})\n`;
        const cursorPos = contentRef.current?.selectionStart ?? content.length;
        const newContent = content.slice(0, cursorPos) + imageMarkdown + content.slice(cursorPos);
        onContentChange(newContent);
      }
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
          onExport={onExport}
          onShowHistory={onShowHistory}
          isSaving={isSaving}
          hasDelete={!!onDelete}
        />

        <div 
          className="editor" 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
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
              placeholder="Start writing... (drag & drop images here)"
              autoFocus
            />
          )}

          {mode === 'preview' && (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          {mode === 'split' && (
            <div className="split-view">
              <div className="split-editor">
                <textarea
                  ref={contentRef}
                  className="editor-content"
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                  placeholder="Start writing... (drag & drop images here)"
                />
              </div>
              <div className="split-divider" />
              <div className="split-preview">
                <div className="markdown-preview">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const inline = !match && !className;
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <Icons.Image />
                <span>Drop images here</span>
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
  onExport?: (format: 'markdown' | 'html' | 'json' | 'pdf') => void;
  onShowHistory?: () => void;
  isSaving: boolean;
  hasDelete: boolean;
}

function EditorToolbar({ mode, onModeChange, onSave, onDelete, onExport, onShowHistory, isSaving, hasDelete }: EditorToolbarProps) {
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
        {onShowHistory && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onShowHistory}
            title="History"
          >
            <Icons.List style={{ width: 16, height: 16 }} />
          </button>
        )}
        {onExport && (
          <div className="dropdown">
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="Export"
              onClick={() => onExport('markdown')}
            >
              <Icons.Save style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
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
          <span className="save-indicator saving">
            <span className="save-dot" />
            Saving...
          </span>
        ) : lastSaved ? (
          <span className="save-indicator saved">
            <span className="save-dot" />
            Saved {formatRelativeTime(lastSaved)}
          </span>
        ) : (
          <span className="save-indicator">Not saved</span>
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
