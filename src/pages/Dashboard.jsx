import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { controlsData } from '../context/TestData';

const SUMMARY_CARD_META = [
  { key: 'totalControls', label: 'Total Controls', tone: 'teal', icon: 'clipboard' },
  { key: 'notStarted', label: 'Not Started', tone: 'red', icon: 'flag' },
  { key: 'openRequests', label: 'Open Requests', tone: 'amber', icon: 'cube' },
  { key: 'completion', label: 'Completion', tone: 'green', icon: 'medal' },
  { key: 'blockedControls', label: 'Blocked Controls', tone: 'blue', icon: 'clock' },
];

const DISTRIBUTION_STATUS_META = [
  { key: 'notStarted', label: 'Not Started' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'addressingComments', label: 'Addressing Comments' },
  { key: 'testingCompleted', label: 'Testing Completed' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_DISTRIBUTION_COLORS = {
  notStarted: '#D22730',
  testingCompleted: '#DD5D64',
  completed: '#E99398',
  addressingComments: '#F4C9CB',
  inProgress: '#FBE9EA',
};

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const TEAM_CAPACITY_COLORS = ['#a6131f', '#139a47', '#1d4ed8', '#ea580c', '#7c3aed'];

function toInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}

function statusBucketFromControl(control) {
  const step = (control.step || '').toLowerCase();
  const statusType = (control.statusType || '').toLowerCase();

  if (step.includes('addressing comments')) return 'addressingComments';
  if (statusType === 'completed' || step === 'complete') return 'completed';
  if (statusType === 'not-started' || step === 'not started') return 'notStarted';
  if (statusType === 'in-review') return 'testingCompleted';
  if (statusType === 'in-progress' || statusType === 'blocked') return 'inProgress';

  return 'inProgress';
}

function supportsTestType(control, type) {
  return (control.testType || '').toUpperCase().includes(type);
}

function buildDistributionForType(controls, type) {
  const counts = {
    notStarted: 0,
    testingCompleted: 0,
    completed: 0,
    addressingComments: 0,
    inProgress: 0,
  };

  controls
    .filter((control) => supportsTestType(control, type))
    .forEach((control) => {
      const bucket = statusBucketFromControl(control);
      counts[bucket] += 1;
    });

  return DISTRIBUTION_STATUS_META.map((statusMeta) => ({
    label: statusMeta.label,
    value: counts[statusMeta.key],
    color: STATUS_DISTRIBUTION_COLORS[statusMeta.key],
  }));
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function parseDateUpdatedLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatLastUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function SummaryIcon({ kind }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (kind === 'clipboard') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 3h-2c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1H5c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 17H5V5h2v2h10V5h2z"
          {...common}
        />
      </svg>
    );
  }

  if (kind === 'flag') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 15.64c2-.87 4.28-.76 6.18.33 1.37.78 2.89 1.18 4.42 1.18 1.12 0 2.24-.21 3.32-.64l1.45-.58A1 1 0 0 0 21 15V4a1 1 0 0 0-1.37-.93l-1.45.58c-1.97.79-4.16.63-6-.42A8.9 8.9 0 0 0 3.77 3l-.21.1a1 1 0 0 0-.55.89v18h2v-6.36ZM5 4.63c2-.87 4.28-.75 6.18.34 2.37 1.36 5.19 1.55 7.74.54l.08-.03v8.85l-.82.33a6.85 6.85 0 0 1-6-.42 8.95 8.95 0 0 0-4.42-1.18c-.93 0-1.86.15-2.75.44V4.63Z"
          fill="#dc2626"
        />
      </svg>
    );
  }

  if (kind === 'cube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...common} />
        <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" {...common} />
      </svg>
    );
  }

  if (kind === 'medal') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m12,2c-4.41,0-8,3.59-8,8,0,2.52,1.17,4.77,3,6.24v4.77c0,.35.18.67.47.85.29.18.66.2.97.04l3.55-1.78,3.55,1.78c.14.07.29.11.45.11.18,0,.37-.05.53-.15.29-.18.47-.5.47-.85v-4.76c1.83-1.47,3-3.72,3-6.24,0-4.41-3.59-8-8-8Zm0,14c-3.31,0-6-2.69-6-6s2.69-6,6-6,6,2.69,6,6-2.69,6-6,6Z"
          {...common}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...common} />
      <path d="M12 8v4l2.5 1.5" {...common} />
    </svg>
  );
}

function DonutChart({ title, total, series }) {
  const totalValue = series.reduce((sum, item) => sum + item.value, 0);
  let runningPercent = 0;
  const gradientStops = series
    .map((item) => {
      const slicePercent = (item.value / totalValue) * 100;
      const fromPercent = runningPercent;
      runningPercent += slicePercent;
      return `${item.color} ${fromPercent}% ${runningPercent}%`;
    })
    .join(', ');

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{title}</div>
      <div className="dashboard-donut-row">
        <div className="dashboard-donut" style={{ background: `conic-gradient(${gradientStops})` }}>
          <div className="dashboard-donut__center">
            <div className="dashboard-donut__count">{total}</div>
            <div className="dashboard-donut__label">Controls</div>
          </div>
        </div>

        <div className="dashboard-legend">
          {series.map((item) => (
            <div key={item.label} className="dashboard-legend__item">
              <span className="dashboard-legend__swatch" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const controls = controlsData;
  const today = useMemo(() => new Date(), []);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [centerProgressDate, setCenterProgressDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [slideDirection, setSlideDirection] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [disableSlideTransition, setDisableSlideTransition] = useState(false);

  const updatesByDateKey = useMemo(() => {
    return controls.reduce((accumulator, control) => {
      const parsedDate = parseDateUpdatedLabel(control.dateUpdated);
      if (!parsedDate) return accumulator;

      const key = dateKey(parsedDate);
      const current = accumulator.get(key) || [];
      current.push(control);
      accumulator.set(key, current);
      return accumulator;
    }, new Map());
  }, [controls]);

  const progressCalendarDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const date = addDays(centerProgressDate, offset);
      const key = dateKey(date);
      return {
        key,
        date,
        day: date.getDate(),
        weekday: WEEKDAY_LABELS[date.getDay()],
        offset,
      };
    });
  }, [centerProgressDate, updatesByDateKey]);

  const slideTransformPercent = slideDirection === 1 ? -40 : slideDirection === -1 ? 0 : -20;

  const triggerDaySlide = (direction) => {
    if (isSliding) return;
    setDisableSlideTransition(false);
    setSlideDirection(direction);
    setIsSliding(true);
  };

  const onDayTrackTransitionEnd = (event) => {
    if (!isSliding || event.propertyName !== 'transform') return;

    setCenterProgressDate((previousDate) => addDays(previousDate, slideDirection));
    setDisableSlideTransition(true);
    setSlideDirection(0);
    setIsSliding(false);

    requestAnimationFrame(() => {
      setDisableSlideTransition(false);
    });
  };

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      centerProgressDate
    );
  }, [centerProgressDate]);

  const lastUpdatedLabel = useMemo(() => {
    return formatLastUpdated(lastUpdatedAt);
  }, [lastUpdatedAt]);

  const refreshDashboard = () => {
    setLastUpdatedAt(new Date());
  };

  const summaryCards = useMemo(() => {
    const totalControls = controls.length;
    const notStarted = controls.filter((control) => control.statusType === 'not-started').length;
    const openRequests = controls.filter((control) => control.statusType !== 'completed').length;
    const completion = controls.filter((control) => control.statusType === 'completed').length;
    const blockedControls = controls.filter((control) => control.statusType === 'blocked').length;

    const valuesByKey = {
      totalControls,
      notStarted,
      openRequests,
      completion,
      blockedControls,
    };

    return SUMMARY_CARD_META.map((cardMeta) => ({
      ...cardMeta,
      value: valuesByKey[cardMeta.key] ?? 0,
      delta: '',
    }));
  }, [controls]);

  const oetDistribution = useMemo(() => buildDistributionForType(controls, 'OET'), [controls]);
  const datDistribution = useMemo(() => buildDistributionForType(controls, 'DAT'), [controls]);

  const oetTotal = useMemo(
    () => oetDistribution.reduce((sum, item) => sum + item.value, 0),
    [oetDistribution]
  );
  const datTotal = useMemo(
    () => datDistribution.reduce((sum, item) => sum + item.value, 0),
    [datDistribution]
  );

  const progressItems = useMemo(() => {
    const selectedDateKey = dateKey(centerProgressDate);
    const updatesForDay = updatesByDateKey.get(selectedDateKey) ?? [];

    if (!updatesForDay.length) {
      return [{ id: '—', description: 'No VGCP updates for this date.' }];
    }

    return updatesForDay
      .slice()
      .sort((left, right) => (left.vgcpid || '').localeCompare(right.vgcpid || ''))
      .map((control) => ({
        id: control.vgcpid,
        description: `${control.tester ?? 'Unassigned'} • ${control.step ?? 'Pending update'}`,
      }));
  }, [centerProgressDate, updatesByDateKey]);

  const teamCapacity = useMemo(() => {
    const byTester = controls.reduce((accumulator, control) => {
      const testerName = control.tester || 'Unassigned';
      const current = accumulator.get(testerName) || { assigned: 0, completed: 0 };
      current.assigned += 1;
      if (control.statusType === 'completed') {
        current.completed += 1;
      }
      accumulator.set(testerName, current);
      return accumulator;
    }, new Map());

    return Array.from(byTester.entries()).map(([name, counts], index) => ({
      initials: toInitials(name),
      name,
      assignedTests: counts.assigned,
      completedTests: counts.completed,
      progress: counts.assigned ? Math.round((counts.completed / counts.assigned) * 100) : 0,
      color: TEAM_CAPACITY_COLORS[index % TEAM_CAPACITY_COLORS.length],
    }));
  }, [controls]);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={
          <div className="dashboard-header-title">
            <span>Overview Dashboard</span>
            <span className="dashboard-last-updated">Last Updated {lastUpdatedLabel}</span>
          </div>
        }
        actions={
          <>
            <button className="btn btn--white" type="button">
              Export
            </button>
            <button className="btn btn--blue" type="button" onClick={refreshDashboard}>
              Refresh
            </button>
          </>
        }
      />

      <section className="dashboard-summary-grid" aria-label="Dashboard summary cards">
        {summaryCards.map((card) => (
          <article key={card.label} className="dashboard-summary-card">
            <div
              className={`dashboard-summary-card__icon dashboard-summary-card__icon--${card.tone}`}
            >
              <SummaryIcon kind={card.icon} />
            </div>
            <div>
              <div className="dashboard-summary-card__label">{card.label}</div>
              <div className="dashboard-summary-card__value-row">
                <span className="dashboard-summary-card__value">{card.value}</span>
                {card.delta ? (
                  <span className="dashboard-summary-card__delta">{card.delta}</span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-main-grid__left">
          <DonutChart title="OET Distribution" total={oetTotal} series={oetDistribution} />
          <DonutChart title="DAT Distribution" total={datTotal} series={datDistribution} />
        </div>

        <div className="dashboard-main-grid__right">
          <article className="dashboard-panel">
            <div className="dashboard-panel__title">Test Progress</div>
            <div className="dashboard-calendar">
              <div className="dashboard-calendar__month">{monthLabel}</div>
              <div
                className={`dashboard-calendar__viewport ${isSliding ? 'dashboard-calendar__viewport--sliding' : ''}`}
              >
                <div
                  className="dashboard-calendar__strip-track"
                  style={{
                    transform: `translateX(${slideTransformPercent}%)`,
                    transition: disableSlideTransition ? 'none' : 'transform 260ms ease',
                  }}
                  onTransitionEnd={onDayTrackTransitionEnd}
                >
                  {progressCalendarDays.map((item) => {
                    const isSelected = item.offset === 0;
                    const isIncoming = isSliding && item.offset === slideDirection;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`dashboard-calendar__day ${isSelected ? 'dashboard-calendar__day--active' : ''} ${isIncoming ? 'dashboard-calendar__day--incoming' : ''}`}
                        onClick={() => {
                          if (item.offset > 0) triggerDaySlide(1);
                          if (item.offset < 0) triggerDaySlide(-1);
                        }}
                        disabled={isSliding || item.offset === 0}
                      >
                        <span className="dashboard-calendar__weekday">{item.weekday}</span>
                        <span className="dashboard-calendar__date">{item.day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="dashboard-progress-list">
              {progressItems.map((item) => (
                <div key={`${item.id}-${item.description}`} className="dashboard-progress-item">
                  <span className="dashboard-progress-item__code">{item.id}</span>
                  <span className="dashboard-progress-item__text">{item.description}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__title">Team Capacity</div>
            <div className="dashboard-capacity-list">
              {teamCapacity.map((member) => (
                <div
                  key={member.name}
                  className="dashboard-capacity-item"
                  title={`${member.name} | Assigned tests: ${member.assignedTests} | Completed tests: ${member.completedTests}`}
                >
                  <span
                    className="dashboard-capacity-item__avatar"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </span>
                  <div className="dashboard-capacity-item__content">
                    <div className="dashboard-capacity-item__name">{member.name}</div>
                    <div className="dashboard-capacity-item__bar-track">
                      <span
                        className="dashboard-capacity-item__bar-fill"
                        style={{ width: `${member.progress}%`, backgroundColor: member.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
