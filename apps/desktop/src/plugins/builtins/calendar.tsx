import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plugin, PluginAPI } from '@notes-app/shared';
import { Icons } from '@notes-app/ui';

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  hasNote: boolean;
}

interface CalendarViewProps {
  onClose: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDailyNoteTitle(date: Date): string {
  return `Daily Note - ${formatDateKey(date)}`;
}

function getDailyNoteContent(date: Date): string {
  const formattedDate = formatDateKey(date);
  return `# Daily Note - ${formattedDate}

## Today's Goals
- [ ] 

## Notes


## Tasks
- [ ] 

## Tomorrow


`;
}

export function CalendarPluginView({ onClose }: CalendarViewProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const notes = window.__NOTES__ || [];
  const createNote = window.__CREATE_NOTE__ || (async (title: string) => {
    console.log('Creating note:', title);
    return { id: title, title };
  });
  const updateNote = window.__UPDATE_NOTE__ || (async () => {});

  const today = useMemo(() => new Date(), []);

  const dailyNoteTitles = useMemo(() => {
    return new Set(
      notes
        .filter((note: { title: string }) => note.title.startsWith('Daily Note - '))
        .map((note: { title: string }) => note.title)
    );
  }, [notes]);

  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      days.push({
        date,
        day,
        isToday,
        hasNote: dailyNoteTitles.has(formatDailyNoteTitle(date)),
      });
    }
    
    return days;
  }, [currentDate, today, dailyNoteTitles]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  const handleDateClick = useCallback(async (day: CalendarDay) => {
    setSelectedDate(day.date);
    
    const title = formatDailyNoteTitle(day.date);
    const existingNote = notes.find((n: { title: string }) => n.title === title);
    
    if (existingNote) {
      navigate(`/note/${existingNote.id}`);
      onClose();
    } else {
      const newNote = await createNote(title);
      if (newNote) {
        await updateNote(newNote.id, { content: getDailyNoteContent(day.date) });
        navigate(`/note/${newNote.id}`);
        onClose();
      }
    }
  }, [notes, createNote, updateNote, navigate, onClose]);

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="plugin-modal-overlay" onClick={onClose}>
      <div className="plugin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-modal-header">
          <h2>Daily Notes Calendar</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        <div className="plugin-modal-content">
          <div className="calendar-plugin">
            <div className="calendar-header">
              <button
                className="calendar-nav-btn"
                onClick={() => navigateMonth('prev')}
              >
                <Icons.ChevronRight style={{ transform: 'rotate(180deg)' }} />
              </button>
              <span className="calendar-month-year">{monthYear}</span>
              <button
                className="calendar-nav-btn"
                onClick={() => navigateMonth('next')}
              >
                <Icons.ChevronRight />
              </button>
            </div>

            <div className="calendar-weekdays">
              {WEEKDAYS.map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                const isSelected =
                  selectedDate &&
                  day.date.getDate() === selectedDate.getDate() &&
                  day.date.getMonth() === selectedDate.getMonth() &&
                  day.date.getFullYear() === selectedDate.getFullYear();

                return (
                  <button
                    key={index}
                    className={`calendar-day ${day.isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${day.hasNote ? 'has-note' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <span className="calendar-day-number">{day.day}</span>
                    {day.hasNote && <span className="calendar-day-dot" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

let calendarViewKey = 0;

export const calendarPlugin: Plugin = {
  id: 'calendar',
  name: 'Daily Notes Calendar',
  version: '1.0.0',
  description: 'Calendar view for daily notes navigation',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'open-calendar',
      name: 'Open Daily Notes Calendar',
      shortcut: ['⌘', 'Shift', 'D'],
      action: () => {
        calendarViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `calendar-${calendarViewKey}`,
          component: 'CalendarPluginView',
        });
      },
    });

    api.addTopBarButton({
      id: 'calendar',
      icon: 'calendar',
      title: 'Daily Notes Calendar',
      action: () => {
        calendarViewKey++;
        window.__OPEN_PLUGIN_VIEW__?.({
          key: `calendar-${calendarViewKey}`,
          component: 'CalendarPluginView',
        });
      },
      position: 'right',
    });
  },
};

declare global {
  interface Window {
    __NOTES__: { id: string; title: string; content: string }[];
    __CREATE_NOTE__: (title: string) => Promise<{ id: string; title: string } | null>;
    __UPDATE_NOTE__: (id: string, updates: { content?: string }) => Promise<void>;
    __OPEN_PLUGIN_VIEW__?: (view: { key: string; component: string }) => void;
  }
}
