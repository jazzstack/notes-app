import { useParams, useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { NoteEditor } from '@notes-app/ui';
import { useState, useEffect, useCallback, useRef } from 'react';

export function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote } = useNotesStore();
  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = useCallback(() => {
    if (id) {
      updateNote(id, { title, content });
      setLastSaved(new Date());
    }
  }, [id, title, content, updateNote]);

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
    <NoteEditor
      title={title}
      content={content}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSave={handleSave}
      onDelete={handleDelete}
      lastSaved={lastSaved}
    />
  );
}
