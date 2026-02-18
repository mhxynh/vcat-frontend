import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import '../styles/pages/calendar.css';

const STATUS_LABELS = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  testing: 'Testing',
  addressing: 'Addressing',
  completed: 'Completed',
};

const EVENTS_BY_DAY = {
  3: [
    { id: 'VG-1893', title: 'User access review completed', assignee: 'AN', status: 'completed' },
  ],
  7: [
    { id: 'VG-1893', title: 'User access review completed', assignee: 'AN', status: 'completed' },
  ],
  14: [
    { id: 'VG-7721', title: 'Privileged access testing', assignee: 'MH', status: 'testing' },
    { id: 'VG-8844', title: 'API security review', assignee: 'AN', status: 'addressing' },
  ],
  21: [
    { id: 'VG-7721', title: 'Database encryption audit', assignee: 'MH', status: 'inProgress' },
    { id: 'VG-8844', title: 'API security review', assignee: 'AN', status: 'notStarted' },
  ],
};

const CalendarView = () => {
  const [selectedDay, setSelectedDay] = useState(7);
  const [activeTab, setActiveTab] = useState('Calendar');

  const monthDate = new Date(2026, 0, 1);
  const daysInMonth = new Date(2026, 1, 0).getDate();
  const firstDay = monthDate.getDay();
  const totalCells = 42;

  const dayCells = useMemo(() => {
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstDay + 1;
      return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
    });
  }, [daysInMonth, firstDay]);

  const selectedEvents = selectedDay ? (EVENTS_BY_DAY[selectedDay] ?? []) : [];

  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) return '';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date(2026, 0, selectedDay));
  }, [selectedDay]);

  return (
    <div className="calendar-container">
      <PageHeader
        title="Controls Calendar"
        actions={
          <>
            <button className="btn btn--white calendar-export-btn" type="button">
              Export
            </button>
            <button className="btn btn--blue calendar-refresh-btn" type="button">
              Refresh
            </button>
          </>
        }
      />

      <div className="calendar-tabs pill-group">
        {['Controls', 'Requests', 'Kanban', 'Calendar'].map((label) => (
          <button
            key={label}
            className={`pill ${activeTab === label ? 'pill--active' : ''}`}
            type="button"
            onClick={() => setActiveTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="calendar-shell">
        <div className="calendar-panel">
          <div className="calendar-month-bar">
            <button className="calendar-nav" type="button" aria-label="Previous month">
              {'<'}
            </button>
            <div className="calendar-month">January 2026</div>
            <button className="calendar-nav" type="button" aria-label="Next month">
              {'>'}
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {dayCells.map((dayNumber, index) => {
              if (!dayNumber) {
                return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />;
              }

              const events = EVENTS_BY_DAY[dayNumber] ?? [];
              const isSelected = dayNumber === selectedDay;

              return (
                <button
                  key={dayNumber}
                  type="button"
                  className={`calendar-day ${isSelected ? 'calendar-day--selected' : ''}`}
                  onClick={() => setSelectedDay(dayNumber)}
                >
                  <span className="calendar-day__number">{dayNumber}</span>
                  {events.length > 0 && (
                    <span className="calendar-day__count">{events.length}</span>
                  )}
                  <div className="calendar-day__bars">
                    {events.slice(0, 3).map((event, idx) => (
                      <span
                        key={`${event.id}-${idx}`}
                        className={`calendar-day__bar status-${event.status}`}
                      />
                    ))}
                  </div>
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
            {selectedDay ? (
              <>
                <div className="detail-header">
                  <div className="detail-date">{selectedDateLabel}</div>
                  <div className="detail-sub">{selectedEvents.length} control tests due</div>
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
                            <span className={`detail-status status-${event.status}`}>
                              {STATUS_LABELS[event.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="detail-empty-state">
                <div className="detail-empty-title">Select a Date</div>
                <div className="detail-empty-sub">
                  Click on any date to view scheduled control tests.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
