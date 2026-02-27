import React, { useEffect, useMemo, useState } from 'react';
import { fetchTests } from '../../api/TestsAPI';
import '../../styles/pages/views/Calendar.css';

const STATUS_LABELS = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  testing: 'Testing',
  addressing: 'Addressing',
  completed: 'Completed',
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = new Date();
const MAX_BARS_PER_DAY = 3;

function parseDateOnly(value) {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function mapApiStatusToCalendarStatus(status) {
  switch (status) {
    case 'NOT_STARTED':
      return 'notStarted';
    case 'IN_PROGRESS':
      return 'inProgress';
    case 'IN_REVIEW':
      return 'testing';
    case 'COMPLETED':
      return 'completed';
    case 'BLOCKED':
    case 'ARCHIVED':
      return 'addressing';
    default:
      return 'notStarted';
  }
}

function getAssigneeLabel(test) {
  if (test.assigned_tester_name) {
    const initials = test.assigned_tester_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    return initials || '--';
  }
  return '--';
}

function buildEventsByDay(tests, month, year) {
  return tests.reduce((acc, test) => {
    const dueDate = parseDateOnly(test.due_date);
    if (!dueDate) return acc;
    if (dueDate.getFullYear() !== year || dueDate.getMonth() !== month) return acc;

    const day = dueDate.getDate();
    const status = mapApiStatusToCalendarStatus(test.status);
    const item = {
      id: test.vgcpid || `TEST-${test.test_id}`,
      title: test.description || 'No description',
      assignee: getAssigneeLabel(test),
      status,
    };

    if (!acc[day]) {
      acc[day] = { badge: 0, bars: [], items: [] };
    }

    acc[day].items.push(item);
    acc[day].badge = acc[day].items.length;
    acc[day].bars = acc[day].items.slice(0, MAX_BARS_PER_DAY).map((event) => event.status);
    return acc;
  }, {});
}

const CalendarView = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDate, setCurrentDate] = useState(
    () => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  );
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    let isMounted = true;

    async function loadTests() {
      try {
        const rows = await fetchTests();
        if (!isMounted) return;
        setTests(rows);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load calendar tests.');
        setTests([]);
      }
    }

    loadTests();

    return () => {
      isMounted = false;
    };
  }, []);

  const eventsByDay = useMemo(
    () => buildEventsByDay(tests, currentMonth, currentYear),
    [currentMonth, currentYear, tests]
  );

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay]?.items ?? []) : [];

  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) return '';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(currentYear, currentMonth, selectedDay));
  }, [currentMonth, currentYear, selectedDay]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  }, [currentDate]);

  const dayCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstWeekDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalCells = Math.ceil((firstWeekDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstWeekDay + 1;
      if (day < 1 || day > daysInMonth) {
        return null;
      }
      return day;
    });
  }, [currentMonth, currentYear]);

  const goToMonth = (offset) => {
    setCurrentDate(
      (previousDate) => new Date(previousDate.getFullYear(), previousDate.getMonth() + offset, 1)
    );
    setSelectedDay(null);
  };

  return (
    <div className="calendar-shell">
      <div className="calendar-left-panel">
        <div className="calendar-month-row">
          <button
            className="calendar-nav-btn"
            type="button"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            ‹
          </button>
          <h3 className="calendar-month-title">{monthLabel}</h3>
          <button
            className="calendar-nav-btn"
            type="button"
            aria-label="Next month"
            onClick={() => goToMonth(1)}
          >
            ›
          </button>
        </div>

        <div className="calendar-weekday-row">
          {WEEK_DAYS.map((dayLabel) => (
            <div key={dayLabel} className="calendar-weekday-cell">
              {dayLabel}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {dayCells.map((day, index) => {
            const dayData = day ? eventsByDay[day] : null;
            const isSelected = day && selectedDay === day;

            return (
              <button
                key={`${day ?? 'empty'}-${index}`}
                type="button"
                className={`calendar-day-cell ${day ? '' : 'calendar-day-cell--blank'} ${isSelected ? 'calendar-day-cell--selected' : ''}`}
                onClick={() => day && setSelectedDay(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <span className="calendar-day-number">{day}</span>

                    {dayData?.badge ? (
                      <span className="calendar-day-badge">{dayData.badge}</span>
                    ) : null}

                    <div className="calendar-day-bars">
                      {(dayData?.bars ?? []).map((status, statusIndex) => (
                        <span
                          key={`${day}-${status}-${statusIndex}`}
                          className={`calendar-day-bar status-${status}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-detail">
        <div className="calendar-status-legend">
          <span className="legend-label">Status:</span>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <span key={status} className="legend-item">
              <span className={`legend-dot status-${status}`} />
              {label}
            </span>
          ))}
        </div>

        <div className="calendar-detail-card">
          {error ? <div className="detail-empty">{error}</div> : null}
          {selectedDay ? (
            <>
              <div className="detail-header">
                <div className="detail-date">{selectedDateLabel}</div>
                <div className="detail-sub">{selectedEvents.length} scheduled control tests</div>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="detail-empty">No control tests due.</div>
              ) : (
                <div className="detail-list">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="detail-item">
                      <div className={`detail-bar status-${event.status}`} />
                      <div className="detail-body">
                        <div className="detail-title">{event.id}</div>
                        <div className="detail-desc">{event.title}</div>
                        <div className="detail-meta">
                          <span className="detail-assignee">{event.assignee}</span>
                          <span className="detail-status">{STATUS_LABELS[event.status]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-empty-state">
              <div className="detail-empty-icon">🗓</div>
              <div className="detail-empty-title">Select a Date</div>
              <div className="detail-empty-sub">
                Click on any date to view scheduled control tests
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
