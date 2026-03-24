import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useAppStore } from '../store/appStore';
import { Icons } from '@notes-app/ui';
import { SearchFilter } from '../components/SearchFilter';

export function HomePage() {
  const navigate = useNavigate();
  const { 
    notes, 
    createNote, 
    vaultInitialized, 
    selectVault, 
    initializeVault,
    allTags,
    filterNotes 
  } = useNotesStore();
  const { settings } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'createdAt'>('updatedAt');

  useEffect(() => {
    initializeVault();
  }, [initializeVault]);

  const filteredNotes = useMemo(() => {
    return filterNotes({
      query: searchQuery,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sortBy,
      sortOrder: 'desc',
    });
  }, [notes, searchQuery, selectedTags, sortBy, filterNotes]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleCreateNote = useCallback(async () => {
    const note = await createNote('Untitled');
    if (note) {
      navigate(`/note/${note.id}`);
    }
  }, [createNote, navigate]);

  if (!vaultInitialized || !settings.vaultPath) {
    return (
      <div style={{ 
        padding: 'var(--space-8)', 
        maxWidth: '600px', 
        margin: '0 auto',
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Icons.FolderOpen style={{ width: '80px', height: '80px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-6)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-3)' }}>
          Welcome to Notes
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '400px' }}>
          Select a folder on your computer to use as your vault. All your notes will be stored as Markdown files in this folder.
        </p>
        <button className="btn btn-primary btn-lg" onClick={selectVault}>
          <Icons.FolderOpen />
          Open Vault Folder
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            All Notes
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? 's' : ''} in your vault
          </p>
        </div>

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          allTags={allTags}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button className="btn btn-primary" onClick={handleCreateNote}>
            <Icons.Plus />
            New Note
          </button>
        </div>

        {filteredNotes.length === 0 ? (
          <EmptyState 
            onCreateNote={handleCreateNote} 
            hasNotes={notes.length > 0}
            hasFilters={searchQuery.length > 0 || selectedTags.length > 0}
          />
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onClick={() => navigate(`/note/${note.id}`)}
                onDelete={() => {
                  if (confirm('Are you sure you want to delete this note?')) {
                    useNotesStore.getState().deleteNote(note.path);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: { id: string; title: string; content: string; updatedAt: Date | string };
  onClick: () => void;
  onDelete: () => void;
}

function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  const preview = note.content.slice(0, 120) + (note.content.length > 120 ? '...' : '');
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      style={{
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {note.title || 'Untitled'}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-error)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Icons.Trash style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        marginBottom: 'var(--space-3)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {preview || 'No content'}
      </p>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
        {formattedDate}
      </span>
    </div>
  );
}

interface EmptyStateProps {
  onCreateNote: () => void;
  hasNotes: boolean;
  hasFilters?: boolean;
}

function EmptyState({ onCreateNote, hasNotes, hasFilters }: EmptyStateProps) {
  return (
    <div className="home-empty-state">
      <Icons.FileText className="empty-state-icon" style={{ width: '64px', height: '64px' }} />
      <h2 className="empty-state-title">
        {hasFilters ? 'No matching notes' : 'Welcome to Notes'}
      </h2>
      <p className="empty-state-description">
        {hasFilters
          ? 'Try adjusting your search terms or filters'
          : 'Create your first note to start organizing your thoughts'}
      </p>
      {!hasNotes && !hasFilters && (
        <button className="btn btn-primary btn-lg" onClick={onCreateNote}>
          <Icons.Plus />
          Create your first note
        </button>
      )}
    </div>
  );
}
