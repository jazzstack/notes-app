import { useParams, useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { usePluginsStore } from '../store/pluginsStore';
import { useVersioningStore } from '../versioning/store';
import { NoteEditor, BacklinksPanel } from '@notes-app/ui';
import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { exportNote } from '../versioning/export';

export function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote, vaultPath, getBacklinks } = useNotesStore();
  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [backlinksExpanded, setBacklinksExpanded] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const editorHooks = usePluginsStore((state) => state.editorHooks);
  const setNoteContext = usePluginsStore((state) => state.setNoteContext);
  const saveToHistory = useVersioningStore((state) => state.saveToHistory);

  const backlinks = id ? getBacklinks(id) : [];

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setNoteContext({ noteId: note.id, title: note.title, content: note.content });
    }
  }, [note, setNoteContext]);

  useEffect(() => {
    editorHooks.forEach((hook) => {
      if (hook.onTitleChange) {
        hook.onTitleChange(title);
      }
    });
  }, [title, editorHooks]);

  useEffect(() => {
    editorHooks.forEach((hook) => {
      if (hook.onContentChange) {
        hook.onContentChange(content);
      }
    });
  }, [content, editorHooks]);

  const handleSave = useCallback(() => {
    if (id) {
      if (note) {
        saveToHistory(note);
      }
      updateNote(id, { title, content });
      setLastSaved(new Date());
      editorHooks.forEach((hook) => {
        if (hook.onSave) {
          hook.onSave();
        }
      });
    }
  }, [id, title, content, updateNote, editorHooks, note, saveToHistory]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (title || content) {
        handleSave();
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content]);

  const handleDelete = useCallback(() => {
    if (note && confirm('Are you sure you want to delete this note?')) {
      deleteNote(note.path);
      navigate('/');
    }
  }, [note, deleteNote, navigate]);

  const handleExport = useCallback(async (format: 'markdown' | 'html' | 'json' | 'pdf') => {
    if (note) {
      await exportNote(note, format);
    }
  }, [note]);

  const handleShowHistory = useCallback(() => {
    const historyKey = `history-${note?.id}`;
    window.__OPEN_PLUGIN_VIEW__?.({
      key: historyKey,
      component: 'HistoryPanel',
    });
  }, [note?.id]);

  const handleDropImage = useCallback(async (file: File): Promise<string | null> => {
    if (!vaultPath) return null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const imagePath = await invoke<string>('copy_image_to_vault', {
        vaultPath,
        fileName: file.name,
        data: Array.from(uint8Array),
      });
      return imagePath;
    } catch (error) {
      console.error('Failed to copy image:', error);
      return null;
    }
  }, [vaultPath]);

  if (!note) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <h2 className="empty-state-title">Note not found</h2>
        <p className="empty-state-description">
          This note may have been deleted or doesn't exist
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="note-page-layout">
      <div className="note-page-content">
        <NoteEditor
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onSave={handleSave}
          onDelete={handleDelete}
          onDropImage={handleDropImage}
          onExport={handleExport}
          onShowHistory={handleShowHistory}
          lastSaved={lastSaved}
        />
      </div>
      <div className="note-page-sidebar">
        <BacklinksPanel
          backlinks={backlinks}
          onBacklinkClick={(noteId) => navigate(`/note/${noteId}`)}
          isExpanded={backlinksExpanded}
          onToggle={() => setBacklinksExpanded(!backlinksExpanded)}
        />
      </div>
    </div>
  );
}
