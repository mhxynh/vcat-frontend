import React, { useEffect, useMemo, useState } from 'react';
import { fetchTests } from '../../api/TestsAPI';
import DetailsTestModal from '../../components/DetailsTestModal';
import Icon from '../../components/common/Icon';
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
const MAX_BARS_PER_DAY = 4;

function parseDateOnly(value) {
  if (!value) return null;
  const str = typeof value === 'string' ? value.slice(0, 10) : String(value).slice(0, 10);
  const [year, month, day] = str.split('-').map(Number);
  if (!year || !month || !day || Number.isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

function mapApiStatusToCalendarStatus(status) {
  switch (status) {
    case 'NOT_STARTED':
      return 'notStarted';
    case 'DAT_IN_PROGRESS':
    case 'OET_IN_PROGRESS':
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

function getAssigneeInfo(test) {
  const fullName = test.assigned_tester_name || '';
  if (!fullName) {
    return { initials: '--', fullName: 'Unassigned' };
  }

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return { initials: initials || '--', fullName };
}

const DATE_FILTER_OPTIONS = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'eta', label: 'ETA' },
  { value: 'both', label: 'Both' },
];

function CalendarNavChevron({ direction }) {
  const d = direction === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6';
  return (
    <svg className="calendar-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildEventsByDay(tests, month, year, dateFilter) {
  return tests.reduce((acc, test) => {
    const entriesToAdd = [];
    const dueDate = parseDateOnly(test.due_date);
    const etaDate = parseDateOnly(test.estimated_date);

    if (dateFilter === 'due_date' || dateFilter === 'both') {
      if (dueDate) entriesToAdd.push({ date: dueDate, dateType: 'due_date' });
    }

    if (dateFilter === 'eta' || dateFilter === 'both') {
      if (
        etaDate &&
        (dateFilter !== 'both' || !dueDate || etaDate.getTime() !== dueDate.getTime())
      ) {
        entriesToAdd.push({ date: etaDate, dateType: 'eta' });
      }
    }

    const status = mapApiStatusToCalendarStatus(test.status);
    const assignee = getAssigneeInfo(test);

    for (const { date, dateType } of entriesToAdd) {
      if (date.getFullYear() !== year || date.getMonth() !== month) continue;

      const day = date.getDate();
      const item = {
        id: `${test.test_id ?? test.vgcpid}-${day}-${dateType}`,
        displayId: test.vgcpid || `TEST-${test.test_id}`,
        title: test.description || 'No description',
        assigneeInitials: assignee.initials,
        assigneeName: assignee.fullName,
        status,
        dateType,
        test,
      };

      if (!acc[day]) {
        acc[day] = { badge: 0, bars: [], items: [] };
      }

      acc[day].items.push(item);
      acc[day].badge = acc[day].items.length;
      acc[day].bars = acc[day].items.slice(0, MAX_BARS_PER_DAY).map((event) => event.status);
    }

    return acc;
  }, {});
}

const CalendarView = ({ refreshKey = 0 }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDate, setCurrentDate] = useState(
    () => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  );
  const [dateFilter, setDateFilter] = useState('due_date');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    let isMounted = true;

    async function loadCalendarData() {
      try {
        setLoading(true);
        setError('');
        const testRows = await fetchTests();
        if (!isMounted) return;

        setTests(testRows);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load calendar tests.');
        setTests([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    loadCalendarData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const eventsByDay = useMemo(
    () => buildEventsByDay(tests, currentMonth, currentYear, dateFilter),
    [currentMonth, currentYear, tests, dateFilter]
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

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate),
    [currentDate]
  );

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

  const openTestDetails = (test) => {
    if (!test) return;
    setSelectedTest(test);
    setIsTestDetailsOpen(true);
  };

  const closeTestDetails = () => {
    setIsTestDetailsOpen(false);
    setSelectedTest(null);
  };

  if (loading) {
    return <div className="no-results">Loading calendar...</div>;
  }

  return (
    <div className="calendar-shell">
      <div className="calendar-month-row">
        <button
          className="calendar-nav-btn"
          type="button"
          aria-label="Previous month"
          onClick={() => goToMonth(-1)}
        >
          <CalendarNavChevron direction="prev" />
        </button>
        <h3 className="calendar-month-title">{monthLabel}</h3>
        <button
          className="calendar-nav-btn"
          type="button"
          aria-label="Next month"
          onClick={() => goToMonth(1)}
        >
          <CalendarNavChevron direction="next" />
        </button>
      </div>

      <div className="calendar-status-legend">
        <div className="calendar-status-legend-inner">
          <div className="calendar-filter-row">
            <label htmlFor="calendar-date-filter" className="calendar-filter-label">
              Show by:
            </label>
            <select
              id="calendar-date-filter"
              className="calendar-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              {DATE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="calendar-legend-status-group">
            <span className="legend-label">Status:</span>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <span key={status} className="legend-item">
                <span className={`legend-dot status-${status}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="calendar-left-body">
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

            const dayCellClass = [
              'calendar-day-cell',
              !day && 'calendar-day-cell--blank',
              isSelected && 'calendar-day-cell--selected',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={`${day ?? 'empty'}-${index}`}
                type="button"
                className={dayCellClass}
                onClick={() => day && setSelectedDay(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <span className="calendar-day-number">{day}</span>

                    {dayData?.badge ? (
                      <span className="calendar-day-badge">
                        <span className="calendar-day-badge-text">{dayData.badge}</span>
                      </span>
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

      <div className="calendar-detail-slot">
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
                        <div className="detail-title-row">
                          <button
                            type="button"
                            className="detail-title-btn"
                            onClick={() => openTestDetails(event.test)}
                            title="View test details"
                          >
                            <span className="detail-title">{event.displayId}</span>
                          </button>
                          {dateFilter === 'both' && (
                            <span
                              className={`detail-date-type-badge detail-date-type-badge--${event.dateType}`}
                              title={event.dateType === 'due_date' ? 'Due date' : 'Estimated date'}
                            >
                              {event.dateType === 'due_date' ? 'Due' : 'ETA'}
                            </span>
                          )}
                        </div>
                        <div className="detail-desc">{event.title}</div>
                        <div className="detail-meta">
                          <span className="detail-assignee-wrap">
                            <span className="detail-assignee">{event.assigneeInitials}</span>
                            <span className="detail-assignee-name">{event.assigneeName}</span>
                          </span>
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
              <div className="detail-empty-icon" aria-hidden="true">
                <Icon
                  name="calendar"
                  category="deco"
                  viewBox="0 0 14 14"
                  color="var(--color-brand-red, #8a1a23)"
                />
              </div>
              <div className="detail-empty-title">Select a Date</div>
              <div className="detail-empty-sub">
                Click on any date to view scheduled control tests
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailsTestModal
        isOpen={isTestDetailsOpen}
        onClose={closeTestDetails}
        test={selectedTest}
        onArchived={(testId, updatedTest) => {
          setTests((prev) =>
            prev.map((x) =>
              x.test_id === testId
                ? updatedTest
                  ? { ...x, ...updatedTest }
                  : { ...x, status: 'ARCHIVED' }
                : x
            )
          );
        }}
        onDeleted={(testId) => {
          setTests((prev) => prev.filter((x) => x.test_id !== testId));
          setSelectedTest((prev) => (prev?.test_id === testId ? null : prev));
          setIsTestDetailsOpen(false);
        }}
        onEdit={(updatedTest) => {
          if (!updatedTest?.test_id) return;
          setTests((prev) =>
            prev.map((x) => (x?.test_id === updatedTest.test_id ? { ...x, ...updatedTest } : x))
          );
          setSelectedTest((prev) =>
            prev?.test_id === updatedTest.test_id ? { ...prev, ...updatedTest } : prev
          );
        }}
      />
    </div>
  );
};

export default CalendarView;
