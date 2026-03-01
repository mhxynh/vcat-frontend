import React, { useMemo, useState, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { controlsData } from '../context/TestData';
import { ReactComponent as ClipboardIcon } from '../assets/images/dashboard-icons/clipboard.svg';
import { ReactComponent as FlagIcon } from '../assets/images/dashboard-icons/flag.svg';
import { ReactComponent as CubeIcon } from '../assets/images/dashboard-icons/cube.svg';
import { ReactComponent as MedalIcon } from '../assets/images/dashboard-icons/medal.svg';
import { ReactComponent as ClockIcon } from '../assets/images/dashboard-icons/clock.svg';

const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const SUMMARY_CARD_META = [
  { key: 'totalControls', label: 'Total Controls', tone: 'teal', icon: 'clipboard' },
  { key: 'notStarted', label: 'Not Started', tone: 'red', icon: 'flag' },
  { key: 'openRequests', label: 'Open Requests', tone: 'amber', icon: 'cube' },
  { key: 'completion', label: 'Completion', tone: 'green', icon: 'medal' },
  { key: 'blockedControls', label: 'Blocked Controls', tone: 'blue', icon: 'clock' },
];

const DISTRIBUTION_STATUS_META = [
  { key: 'notStarted', label: 'Not Started' },
  { key: 'walkthroughScheduled', label: 'Walkthrough Scheduled' },
  { key: 'walkthroughCompleted', label: 'Walkthrough Completed' },
  { key: 'testingInProgress', label: 'Testing In Progress' },
  { key: 'testingCompleted', label: 'Testing Completed' },
];

const STATUS_DISTRIBUTION_COLORS = {
  notStarted: '#D22730',
  walkthroughScheduled: '#DD5D64',
  walkthroughCompleted: '#E99398',
  testingInProgress: '#F4C9CB',
  testingCompleted: '#FBE9EA',
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

const STATUS_BUCKET_RULES = [
  {
    check: (step) => step.includes('addressing comments'),
    value: 'testingInProgress',
  },
  { check: (_, statusType) => statusType === 'completed', value: 'walkthroughCompleted' },
  { check: (step) => step === 'complete', value: 'walkthroughCompleted' },
  { check: (_, statusType) => statusType === 'not-started', value: 'notStarted' },
  { check: (step) => step === 'not started', value: 'notStarted' },
  { check: (_, statusType) => statusType === 'in-review', value: 'walkthroughScheduled' },
  {
    check: (_, statusType) => statusType === 'in-progress' || statusType === 'blocked',
    value: 'testingCompleted',
  },
];

function statusBucketFromControl(control) {
  const step = (control.step || '').toLowerCase();
  const statusType = (control.statusType || '').toLowerCase();

  const rule = STATUS_BUCKET_RULES.find((r) => r.check(step, statusType));
  return rule ? rule.value : 'testingCompleted';
}

const getTeamColor = (index) => TEAM_CAPACITY_COLORS[index % TEAM_CAPACITY_COLORS.length];

function supportsTestType(control, type) {
  return (control.testType || '').toUpperCase().includes(type);
}

function buildDistributionForType(controls, type) {
  const counts = Object.fromEntries(DISTRIBUTION_STATUS_META.map((meta) => [meta.key, 0]));

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

const ICON_COMPONENTS = {
  clipboard: ClipboardIcon,
  flag: FlagIcon,
  cube: CubeIcon,
  medal: MedalIcon,
  clock: ClockIcon,
};

function SummaryIcon({ kind }) {
  const IconComponent = ICON_COMPONENTS[kind];
  return IconComponent ? <IconComponent aria-hidden="true" /> : null;
}

function InfoTooltipIcon({ tooltip }) {
  return (
    <span className="dashboard-info-icon" title={tooltip}>
      <span className="dashboard-info-icon__glyph">i</span>
      <span className="dashboard-info-tooltip">{tooltip}</span>
    </span>
  );
}

function formatCapacityProgress(completedTests, assignedTests) {
  const progressPercent = assignedTests ? (completedTests / assignedTests) * 100 : 0;
  return {
    progressPercent,
    progressLabel: `${progressPercent.toFixed(1)}% (${completedTests}/${assignedTests})`,
  };
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg / 180) * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSegment(cx, cy, innerR, outerR, startPercent, endPercent) {
  const start = polarToCartesian(cx, cy, outerR, (startPercent / 100) * 360);
  const end = polarToCartesian(cx, cy, outerR, (endPercent / 100) * 360);
  const innerStart = polarToCartesian(cx, cy, innerR, (endPercent / 100) * 360);
  const innerEnd = polarToCartesian(cx, cy, innerR, (startPercent / 100) * 360);
  const largeArc = endPercent - startPercent > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y} L ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;
}

function DonutChart({ title, total, series }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const totalValue = series.reduce((sum, item) => sum + item.value, 0);
  const cx = 105;
  const cy = 105;
  const innerR = 55;
  const outerR = 105;

  const segments = useMemo(() => {
    let runningPercent = 0;
    return series.map((item, index) => {
      const slicePercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      const fromPercent = runningPercent;
      runningPercent += slicePercent;
      return {
        ...item,
        index,
        fromPercent,
        toPercent: runningPercent,
        slicePercent,
        path: describeDonutSegment(cx, cy, innerR, outerR, fromPercent, runningPercent),
      };
    });
  }, [series, totalValue]);

  const tooltipPos = useMemo(() => {
    if (hoveredIndex === null) return null;
    const seg = segments[hoveredIndex];
    if (!seg) return null;
    const midPercent = seg.fromPercent + seg.slicePercent / 2;
    const angleDeg = (midPercent / 100) * 360;
    const dist = (innerR + outerR) / 2;
    const point = polarToCartesian(cx, cy, dist, angleDeg);
    return {
      x: point.x,
      y: point.y,
    };
  }, [hoveredIndex, segments, cx, cy, innerR, outerR]);

  return (
    <div className="dashboard-panel dashboard-panel--donut">
      <div className="dashboard-panel__title">{title}</div>
      <div className="dashboard-donut-row">
        <div className="dashboard-donut">
          <svg
            className="dashboard-donut__svg"
            viewBox="0 0 210 210"
            width={240}
            height={240}
            style={{ overflow: 'visible' }}
          >
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.index;
              return (
                <g
                  key={seg.label}
                  transform={isHovered ? `scale(1.08)` : 'scale(1)'}
                  style={{
                    transformOrigin: '105px 105px',
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  <path
                    d={seg.path}
                    fill={seg.color}
                    className="dashboard-donut__segment"
                    onMouseEnter={() => setHoveredIndex(seg.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={innerR} fill="#fff" className="dashboard-donut__hole" />
            <foreignObject
              x={cx - innerR}
              y={cy - innerR}
              width={innerR * 2}
              height={innerR * 2}
              className="dashboard-donut__center-wrap"
            >
              <div className="dashboard-donut__center">
                <span className="dashboard-donut__count">{total}</span>
                <span className="dashboard-donut__label">Controls</span>
              </div>
            </foreignObject>
            {hoveredIndex !== null && tooltipPos && (
              <g
                className="dashboard-donut__tooltip"
                transform={`translate(${tooltipPos.x}, ${tooltipPos.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <rect
                  x={-40}
                  y={-28}
                  width={80}
                  height={54}
                  rx={8}
                  fill="#2c2c2c"
                  className="dashboard-donut__tooltip-bg"
                />
                <text x={0} y={-10} textAnchor="middle" fill="#fff" fontSize={15} fontWeight={600}>
                  {segments[hoveredIndex].value}
                </text>
                <g>
                  <rect x={-22} y={0} width={44} height={20} rx={4} fill="#9f141e" />
                  <text
                    x={0}
                    y={10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {totalValue > 0
                      ? Math.round((segments[hoveredIndex].value / totalValue) * 100)
                      : 0}
                    %
                  </text>
                </g>
              </g>
            )}
          </svg>
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
    return [-2, -1, 0, 1, 2].map((offset) => {
      const date = addDays(centerProgressDate, offset);
      const key = dateKey(date);
      return {
        key,
        date,
        day: date.getDate(),
        weekday: WEEKDAY_LABELS[date.getDay()],
        shortWeekday: WEEKDAY_LABELS[date.getDay()].slice(0, 3),
        offset,
      };
    });
  }, [centerProgressDate]);

  const triggerDaySlide = useCallback((direction) => {
    setCenterProgressDate((prev) => addDays(prev, direction));
  }, []);

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
    const valuesByKey = {
      totalControls: controls.length,
      notStarted: controls.filter((c) => c.statusType === 'not-started').length,
      openRequests: controls.filter((c) => c.statusType !== 'completed').length,
      completion: controls.filter((c) => c.statusType === 'completed').length,
      blockedControls: controls.filter((c) => c.statusType === 'blocked').length,
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
        description: `${control.tester || 'Unassigned'} • ${control.step || 'Pending update'}`,
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

    return Array.from(byTester.entries()).map(([name, counts], index) => {
      const { progressPercent, progressLabel } = formatCapacityProgress(
        counts.completed,
        counts.assigned
      );
      return {
        initials: toInitials(name),
        name,
        assignedTests: counts.assigned,
        completedTests: counts.completed,
        progress: progressPercent,
        progressLabel,
        color: getTeamColor(index),
      };
    });
  }, [controls]);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={
          <div className="dashboard-header-title">
            <span>Overview Dashboard</span>
            <InfoTooltipIcon tooltip={`Last Updated ${lastUpdatedLabel}`} />
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
          <DonutChart title="DAT Distribution" total={datTotal} series={datDistribution} />
          <DonutChart title="OET Distribution" total={oetTotal} series={oetDistribution} />
        </div>

        <div className="dashboard-main-grid__right">
          <article className="dashboard-panel dashboard-panel--test-progress">
            <div className="dashboard-panel__title">Test Progress</div>
            <div className="dashboard-calendar">
              <div className="dashboard-calendar__header">
                <span className="dashboard-calendar__month">{monthLabel}</span>
                <div className="dashboard-calendar__nav">
                  <button
                    type="button"
                    className="dashboard-calendar__nav-btn"
                    onClick={() => triggerDaySlide(-1)}
                    aria-label="Previous day"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="dashboard-calendar__nav-btn"
                    onClick={() => triggerDaySlide(1)}
                    aria-label="Next day"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
              <div className="dashboard-calendar__viewport">
                <div className="dashboard-calendar__strip-track">
                  {progressCalendarDays.map((item) => {
                    const isSelected = item.offset === 0;
                    const isClickable = item.offset !== 0;
                    return (
                      <button
                        key={item.offset}
                        type="button"
                        className={`dashboard-calendar__day ${isSelected ? 'dashboard-calendar__day--active' : ''} ${isClickable ? 'dashboard-calendar__day--clickable' : ''}`}
                        onClick={() => isClickable && triggerDaySlide(item.offset > 0 ? 1 : -1)}
                        disabled={!isClickable}
                        aria-label={
                          isSelected
                            ? `Selected: ${item.weekday} ${item.day}`
                            : `Go to ${item.offset > 0 ? 'next' : 'previous'} day`
                        }
                      >
                        <span className="dashboard-calendar__weekday">{item.shortWeekday}</span>
                        <span className="dashboard-calendar__date">{item.day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="dashboard-progress-list" key={dateKey(centerProgressDate)}>
              {progressItems.map((item) => (
                <div key={`${item.id}-${item.description}`} className="dashboard-progress-item">
                  <span className="dashboard-progress-item__code">{item.id}</span>
                  <span className="dashboard-progress-item__text">{item.description}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__title dashboard-panel__title--with-info">
              <span>Team Capacity</span>
              <InfoTooltipIcon tooltip="In-Progress Test/Total Test Assigned" />
            </div>
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
                      <span className="dashboard-capacity-item__bar-tooltip">
                        {member.progressLabel}
                      </span>
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
