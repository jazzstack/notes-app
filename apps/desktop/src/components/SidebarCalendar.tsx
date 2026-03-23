import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { Icons } from '@notes-app/ui';

interface SidebarCalendarProps {
  collapsed: boolean;
}

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  hasJournal: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatJournalTitle(date: Date): string {
  return `Journal - ${formatDateKey(date)}`;
}

function getJournalContent(date: Date): string {
  const formattedDate = formatDateKey(date);
  return `# Journal Entry - ${formattedDate}

## Thoughts



## Tasks
- [ ] 

## Highlights

`;
}

export function SidebarCalendar({ collapsed }: SidebarCalendarProps) {
  const navigate = useNavigate();
  const notes = useNotesStore((state) => state.notes);
  const createNote = useNotesStore((state) => state.createNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [animating, setAnimating] = useState(false);

  const today = useMemo(() => new Date(), []);

  const journalTitles = useMemo(() => {
    return new Set(
      notes
        .filter((note) => note.title.startsWith('Journal - '))
        .map((note) => note.title)
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
        hasJournal: journalTitles.has(formatJournalTitle(date)),
      });
    }
    
    return days;
  }, [currentDate, today, journalTitles]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        return newDate;
      });
      setAnimating(false);
    }, 150);
  }, []);

  const handleDateClick = useCallback(async (day: CalendarDay) => {
    setSelectedDate(day.date);
    
    const title = formatJournalTitle(day.date);
    const existingNote = notes.find((n) => n.title === title);
    
    if (existingNote) {
      navigate(`/note/${existingNote.id}`);
    } else {
      const newNote = await createNote(title);
      if (newNote) {
        await updateNote(newNote.id, { content: getJournalContent(day.date) });
        navigate(`/note/${newNote.id}`);
      }
    }
  }, [notes, createNote, updateNote, navigate]);

  if (collapsed) {
    return null;
  }

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="sidebar-calendar">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={() => navigateMonth('prev')}
          title="Previous month"
        >
          <Icons.ChevronRight style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span className="calendar-month-year">{monthYear}</span>
        <button
          className="calendar-nav-btn"
          onClick={() => navigateMonth('next')}
          title="Next month"
        >
          <Icons.ChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className={`calendar-grid ${animating ? 'animating' : ''}`}>
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedDate &&
            day.date.getDate() === selectedDate.getDate() &&
            day.date.getMonth() === selectedDate.getMonth() &&
            day.date.getFullYear() === selectedDate.getFullYear();

          return (
            <button
              key={index}
              className={`calendar-day ${day.isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${day.hasJournal ? 'has-journal' : ''}`}
              onClick={() => handleDateClick(day)}
              title={day.hasJournal ? 'Open journal entry' : 'Create journal entry'}
            >
              <span className="calendar-day-number">{day.day}</span>
              {day.hasJournal && <span className="calendar-day-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
