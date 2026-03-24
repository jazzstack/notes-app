import { useState, useEffect } from 'react';
import { useVersioningStore } from '../versioning/store';
import { Icons } from '@notes-app/ui';
import { NoteHistoryEntry } from '@notes-app/shared';

interface HistoryPanelProps {
  noteId: string;
  onRestore: (entry: NoteHistoryEntry) => void;
  onClose: () => void;
}

export function HistoryPanel({ noteId, onRestore, onClose }: HistoryPanelProps) {
  const { history, loadHistory } = useVersioningStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory(noteId);
  }, [noteId, loadHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const selectedEntry = history.find(h => h.id === selectedId);

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Note History</h3>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <Icons.X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <p>No history yet</p>
          <p className="history-empty-hint">Changes will be tracked automatically</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-list">
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`history-item ${selectedId === entry.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(entry.id)}
              >
                <div className="history-item-header">
                  <span className="history-item-time">{formatRelativeTime(entry.timestamp)}</span>
                  <span className="history-item-date">{formatDate(entry.timestamp)}</span>
                </div>
                <div className="history-item-preview">
                  {entry.content.slice(0, 100)}...
                </div>
              </div>
            ))}
          </div>

          {selectedEntry && (
            <div className="history-preview">
              <div className="history-preview-header">
                <h4>{selectedEntry.title || 'Untitled'}</h4>
                <span className="history-preview-date">
                  {formatDate(selectedEntry.timestamp)}
                </span>
              </div>
              <div className="history-preview-content">
                <pre>{selectedEntry.content}</pre>
              </div>
              <div className="history-preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onRestore(selectedEntry);
                    onClose();
                  }}
                >
                  Restore this version
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

let historyPanelKey = 0;

export function openHistoryPanel(_noteId: string, _onRestore: (entry: NoteHistoryEntry) => void) {
  historyPanelKey++;
  window.__OPEN_PLUGIN_VIEW__?.({
    key: `history-${historyPanelKey}`,
    component: 'HistoryPanel',
  });
}
