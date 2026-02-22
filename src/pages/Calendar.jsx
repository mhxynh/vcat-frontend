import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import '../styles/pages/Calendar.css';

const STATUS_LABELS = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  testing: 'Testing',
  addressing: 'Addressing',
  completed: 'Completed',
};

const EVENTS_BY_DAY = {
  3: {
    badge: 1,
    bars: ['notStarted'],
    items: [
      { id: 'VG-1023', title: 'Access control walkthrough', assignee: 'MH', status: 'notStarted' },
    ],
  },
  5: {
    badge: 1,
    bars: ['testing'],
    items: [{ id: 'VG-2208', title: 'Evidence collection', assignee: 'AN', status: 'testing' }],
  },
  7: {
    badge: 1,
    bars: ['completed'],
    items: [
      { id: 'VG-3150', title: 'Identity governance check', assignee: 'MH', status: 'completed' },
    ],
  },
  8: {
    badge: 1,
    bars: ['addressing'],
    items: [
      { id: 'VG-4119', title: 'Remediation validation', assignee: 'AN', status: 'addressing' },
    ],
  },
  10: {
    badge: 1,
    bars: ['testing'],
    items: [{ id: 'VG-2877', title: 'Quarterly sample review', assignee: 'MH', status: 'testing' }],
  },
  14: {
    badge: 2,
    bars: ['notStarted', 'notStarted'],
    items: [
      { id: 'VG-1180', title: 'Risk acceptance update', assignee: 'MH', status: 'notStarted' },
      { id: 'VG-1189', title: 'Control owner signoff', assignee: 'AN', status: 'notStarted' },
    ],
  },
  17: {
    badge: 1,
    bars: ['addressing'],
    items: [
      { id: 'VG-5522', title: 'Issue tracking review', assignee: 'AN', status: 'addressing' },
    ],
  },
  18: {
    badge: 1,
    bars: ['addressing'],
    items: [
      { id: 'VG-7310', title: 'Testing checklist update', assignee: 'MH', status: 'addressing' },
    ],
  },
  21: {
    badge: 1,
    bars: ['notStarted'],
    items: [{ id: 'VG-8844', title: 'API security review', assignee: 'AN', status: 'notStarted' }],
  },
  23: {
    badge: 1,
    bars: ['addressing'],
    items: [
      { id: 'VG-6502', title: 'Audit trail gap closure', assignee: 'MH', status: 'addressing' },
    ],
  },
  28: {
    badge: 1,
    bars: ['addressing'],
    items: [
      { id: 'VG-9014', title: 'Post-test findings review', assignee: 'AN', status: 'addressing' },
    ],
  },
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = new Date();

const CalendarView = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('Calendar');
  const [currentDate, setCurrentDate] = useState(
    () => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  );

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const selectedEvents = selectedDay ? (EVENTS_BY_DAY[selectedDay]?.items ?? []) : [];

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
    <div className="calendar-container">
      <PageHeader
        title="Controls Tracker"
        actions={
          <>
            <button className="btn btn--white calendar-export-btn" type="button">
              ⤴ Export
            </button>
            <button className="btn btn--blue calendar-refresh-btn" type="button">
              ↻ Refresh
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
              const dayData = day ? EVENTS_BY_DAY[day] : null;
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
    </div>
  );
};

export default CalendarView;
