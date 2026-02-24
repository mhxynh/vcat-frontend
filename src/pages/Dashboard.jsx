import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';

const summaryCards = [
  { label: 'Total Controls', value: 54, delta: '-', tone: 'teal', icon: 'clipboard' },
  { label: 'Not Started', value: 23, delta: '-', tone: 'red', icon: 'flag' },
  { label: 'Open Requests', value: 16, delta: '↑ 3', tone: 'amber', icon: 'cube' },
  { label: 'Completion', value: 11, delta: '', tone: 'green', icon: 'medal' },
  { label: 'Blocked Controls', value: 67, delta: '↓ 4', tone: 'blue', icon: 'clock' },
];

const oetDistribution = [
  { label: 'Not Started', value: 23, color: '#d8212f' },
  { label: 'Testing Completed', value: 18, color: '#dc5b66' },
  { label: 'Completed', value: 9, color: '#e48c95' },
  { label: 'Addressing Comments', value: 6, color: '#efbec3' },
  { label: 'In Progress', value: 4, color: '#f3dfe2' },
];

const datDistribution = [
  { label: 'Not Started', value: 21, color: '#d8212f' },
  { label: 'Testing Completed', value: 16, color: '#dc5b66' },
  { label: 'Completed', value: 11, color: '#e48c95' },
  { label: 'Addressing Comments', value: 7, color: '#efbec3' },
  { label: 'In Progress', value: 5, color: '#f3dfe2' },
];

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const BASE_PROGRESS_ITEMS = [
  'VG-4067',
  'VG-4021',
  'VG-5033',
  'VG-5034',
  'VG-6969',
  'VG-7012',
  'VG-7110',
];

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const teamCapacity = [
  { initials: 'MH', name: 'Monique Huynh', progress: 62, color: '#a6131f' },
  { initials: 'AN', name: 'Andrew Nguyen', progress: 31, color: '#139a47' },
];

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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="5" width="10" height="15" rx="2" {...common} />
        <path d="M9 5.5h6M10 3.5h4" {...common} />
      </svg>
    );
  }

  if (kind === 'flag') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 20V4" {...common} />
        <path d="M7 5h9l-2 3 2 3H7" {...common} />
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4h6l-1.5 5h-3z" {...common} />
        <circle cx="12" cy="15" r="4.5" {...common} />
        <path d="M10.7 15.2l1-1.1 1.6 1.7 2.2-2.5" {...common} />
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
  const today = useMemo(() => new Date(), []);
  const [centerProgressDate, setCenterProgressDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [slideDirection, setSlideDirection] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [disableSlideTransition, setDisableSlideTransition] = useState(false);

  const progressCalendarDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const date = addDays(centerProgressDate, offset);
      return {
        key: dateKey(date),
        date,
        day: date.getDate(),
        weekday: WEEKDAY_LABELS[date.getDay()],
        hasAlert: offset > 0,
        offset,
      };
    });
  }, [centerProgressDate]);

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

  const progressItems = useMemo(() => {
    const shift = centerProgressDate.getDate() % BASE_PROGRESS_ITEMS.length;
    return BASE_PROGRESS_ITEMS.map((_, index) => {
      return BASE_PROGRESS_ITEMS[(index + shift) % BASE_PROGRESS_ITEMS.length];
    }).slice(0, 5);
  }, [centerProgressDate]);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={
          <div className="dashboard-header-title">
            <span>Overview Dashboard</span>
            <span className="dashboard-last-updated">Last Updated 06:07:67 PM</span>
          </div>
        }
        actions={
          <>
            <button className="btn btn--white" type="button">
              Export
            </button>
            <button className="btn btn--blue" type="button">
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
          <DonutChart title="OET Distribution" total={23} series={oetDistribution} />
          <DonutChart title="DAT Distribution" total={21} series={datDistribution} />
        </div>

        <div className="dashboard-main-grid__right">
          <article className="dashboard-panel">
            <div className="dashboard-panel__title">Test Progress</div>
            <div className="dashboard-calendar">
              <div className="dashboard-calendar__month">{monthLabel}</div>
              <div className="dashboard-calendar__viewport">
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

                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`dashboard-calendar__day ${isSelected ? 'dashboard-calendar__day--active' : ''}`}
                        onClick={() => {
                          if (item.offset > 0) triggerDaySlide(1);
                          if (item.offset < 0) triggerDaySlide(-1);
                        }}
                        disabled={isSliding || item.offset === 0}
                      >
                        <span className="dashboard-calendar__weekday">{item.weekday}</span>
                        <span className="dashboard-calendar__date">{item.day}</span>
                        {item.hasAlert ? <span className="dashboard-calendar__dot" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="dashboard-progress-list">
              {progressItems.map((itemCode) => (
                <div key={itemCode} className="dashboard-progress-item">
                  <span className="dashboard-progress-item__code">{itemCode}</span>
                  <span className="dashboard-progress-item__text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod...
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__title">Team Capacity</div>
            <div className="dashboard-capacity-list">
              {teamCapacity.map((member) => (
                <div key={member.name} className="dashboard-capacity-item">
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
