import React, { useMemo, useState, useCallback, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import InfoTooltipIcon from '../components/InfoTooltipIcon';
import ExportButton from '../components/ExportButton';
import { fetchTests, mapTestRowToDashboardRow } from '../api/TestsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { exportTable } from '../api/ExportAPI';
import DetailsTestModal from '../components/DetailsTestModal';
import { showErrorToast } from '../utils/toast';
import { triggerBrowserDownload } from '../utils/download';
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
  { key: 'openRequests', label: 'Open', tone: 'amber', icon: 'cube' },
  { key: 'completion', label: 'Completed', tone: 'green', icon: 'medal' },
  { key: 'blockedControls', label: 'Blocked', tone: 'blue', icon: 'clock' },
];

const DISTRIBUTION_STATUS_META = [
  { key: 'NOT_STARTED', label: 'Not Started' },
  { key: 'TESTING_READY', label: 'Testing Ready' },
  { key: 'WALKTHROUGH_SCHEDULED', label: 'Walkthrough Scheduled' },
  { key: 'WALKTHROUGH_COMPLETED', label: 'Walkthrough Completed' },
  { key: 'TESTING_IN_PROGRESS', label: 'Testing In Progress' },
  { key: 'ADDRESSING_COMMENTS', label: 'Addressing Comments' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'TESTING_BLOCKED', label: 'Testing Blocked' },
  { key: 'TESTING_CANCELED', label: 'Testing Canceled' },
];
const OET_EXCLUDED_STATUS_KEYS = new Set(['WALKTHROUGH_SCHEDULED', 'WALKTHROUGH_COMPLETED']);

const STATUS_DISTRIBUTION_COLORS = {
  NOT_STARTED: '#4B5563',
  TESTING_READY: '#7A0F16',
  WALKTHROUGH_SCHEDULED: '#932029',
  WALKTHROUGH_COMPLETED: '#AD343C',
  TESTING_IN_PROGRESS: '#C64D55',
  ADDRESSING_COMMENTS: '#D96D74',
  COMPLETED: '#E89499',
  TESTING_BLOCKED: '#F2BCC0',
  TESTING_CANCELED: '#9CA3AF',
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
const TEAM_CAPACITY_COLOR = '#96151d';
const TEAM_CAPACITY_ROLES = new Set(['TESTER', 'MANAGER']);

function userCapacityDisplayName(user) {
  if (!user) return 'Unknown';
  return user.display_name || user.displayName || user.email || 'Unknown';
}

function toInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}

function statusBucketFromStep(stepValue, allowedStatusKeys) {
  const step = (stepValue || '').toUpperCase();
  if (allowedStatusKeys.has(step)) {
    return step;
  }
  return allowedStatusKeys.has('NOT_STARTED') ? 'NOT_STARTED' : null;
}

const getTeamColor = () => TEAM_CAPACITY_COLOR;

function supportsTestType(control, type) {
  const requiresDat = Boolean(control.requires_dat ?? control.requiresDat);
  const requiresOet = Boolean(control.requires_oet ?? control.requiresOet);

  if (type === 'DAT') {
    return requiresDat || (control.testType || '').toUpperCase().includes('DAT');
  }
  if (type === 'OET') {
    return requiresOet || (control.testType || '').toUpperCase().includes('OET');
  }
  return false;
}

function buildDistributionForType(controls, type) {
  const statusMetaForType =
    type === 'OET'
      ? DISTRIBUTION_STATUS_META.filter((meta) => !OET_EXCLUDED_STATUS_KEYS.has(meta.key))
      : DISTRIBUTION_STATUS_META;
  const allowedStatusKeys = new Set(statusMetaForType.map((meta) => meta.key));
  const counts = Object.fromEntries(statusMetaForType.map((meta) => [meta.key, 0]));

  controls
    .filter((control) => supportsTestType(control, type))
    .forEach((control) => {
      const stepForType = type === 'DAT' ? control.datStep : control.oetStep;
      const bucket = statusBucketFromStep(stepForType, allowedStatusKeys);
      if (!bucket) return;
      counts[bucket] += 1;
    });

  return statusMetaForType.map((statusMeta) => ({
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

function formatCapacityProgress(inProgressTests, assignedTests) {
  const progressPercent = assignedTests ? (inProgressTests / assignedTests) * 100 : 0;
  return {
    progressPercent,
    progressLabel: `${progressPercent.toFixed(1)}% (${inProgressTests}/${assignedTests})`,
  };
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg / 180) * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSegment(cx, cy, innerR, outerR, startPercent, endPercent) {
  const percentSpan = endPercent - startPercent;
  if (percentSpan >= 99.999) {
    const outerStart = polarToCartesian(cx, cy, outerR, 0);
    const outerMid = polarToCartesian(cx, cy, outerR, 180);
    const innerStart = polarToCartesian(cx, cy, innerR, 0);
    const innerMid = polarToCartesian(cx, cy, innerR, 180);

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerMid.x} ${outerMid.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerMid.x} ${innerMid.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  const start = polarToCartesian(cx, cy, outerR, (startPercent / 100) * 360);
  const end = polarToCartesian(cx, cy, outerR, (endPercent / 100) * 360);
  const innerStart = polarToCartesian(cx, cy, innerR, (endPercent / 100) * 360);
  const innerEnd = polarToCartesian(cx, cy, innerR, (startPercent / 100) * 360);
  const largeArc = percentSpan > 50 ? 1 : 0;
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

  const hoveredSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;
  const hoveredSegmentPercent =
    hoveredSegment && totalValue > 0 ? Math.round((hoveredSegment.value / totalValue) * 100) : 0;

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
            {hoveredSegment && tooltipPos && (
              <g
                className="dashboard-donut__tooltip"
                transform={`translate(${tooltipPos.x}, ${tooltipPos.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <rect
                  x={-78}
                  y={-36}
                  width={156}
                  height={68}
                  rx={8}
                  fill="#2c2c2c"
                  className="dashboard-donut__tooltip-bg"
                />
                <text x={0} y={-17} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>
                  {hoveredSegment.label}
                </text>
                <text x={0} y={2} textAnchor="middle" fill="#fff" fontSize={16} fontWeight={700}>
                  {hoveredSegment.value}
                </text>
                <g transform="translate(0, 10)">
                  <rect x={-27} y={0} width={54} height={18} rx={4} fill={hoveredSegment.color} />
                  <text
                    x={0}
                    y={10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {hoveredSegmentPercent}%
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        <div className="dashboard-legend">
          {series.map((item, index) => (
            <div
              key={item.label}
              className={`dashboard-legend__item ${
                hoveredIndex === index ? 'dashboard-legend__item--active' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
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
  const [controls, setControls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [testRows, allUsers] = await Promise.all([
        fetchTests(),
        fetchUsers({ isActive: true }),
      ]);
      setControls(testRows.map(mapTestRowToDashboardRow));
      const capacityUsers = Array.isArray(allUsers)
        ? allUsers.filter((u) => TEAM_CAPACITY_ROLES.has(String(u.role || '').toUpperCase()))
        : [];
      setUsers(capacityUsers);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setLoadError(error?.message || 'Failed to load dashboard data');
      setControls([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleExport() {
    if (loading) return;

    setIsExporting(true);

    try {
      const { downloadUrl, filename } = await exportTable('dashboard', 'dashboard_export.csv');
      triggerBrowserDownload(downloadUrl, filename);
    } catch {
      showErrorToast({
        title: 'Export Failed',
        message: 'Failed to generate export. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }

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
      delta: '~',
    }));
  }, [controls]);

  const oetDistribution = useMemo(() => buildDistributionForType(controls, 'OET'), [controls]);
  const datDistribution = useMemo(() => buildDistributionForType(controls, 'DAT'), [controls]);

  const datDistributionDisplay = useMemo(
    () => datDistribution.filter((s) => s.value > 0),
    [datDistribution]
  );
  const oetDistributionDisplay = useMemo(
    () => oetDistribution.filter((s) => s.value > 0),
    [oetDistribution]
  );

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
      return [{ id: '—', vgcpid: null, description: 'No VGCP updates for this date.' }];
    }

    return updatesForDay
      .slice()
      .sort((left, right) => (left.vgcpid || '').localeCompare(right.vgcpid || ''))
      .map((control) => ({
        id: control.vgcpid,
        vgcpid: control.vgcpid,
        description: `${control.tester || 'Unassigned'} • ${control.step || 'Pending update'}`,
      }));
  }, [centerProgressDate, updatesByDateKey]);

  const testsByVgcpid = useMemo(() => {
    return controls.reduce((accumulator, test) => {
      if (!test?.vgcpid) return accumulator;
      accumulator.set(test.vgcpid, test);
      return accumulator;
    }, new Map());
  }, [controls]);

  const openTestDetailsByVgcpid = useCallback(
    (vgcpid) => {
      if (!vgcpid) return;
      const test = testsByVgcpid.get(vgcpid);
      if (!test) return;
      setSelectedTest(test);
      setIsTestDetailsOpen(true);
    },
    [testsByVgcpid]
  );

  const teamCapacity = useMemo(() => {
    const byTester = controls.reduce((accumulator, control) => {
      const testerName = control.tester || 'Unassigned';
      if (testerName === 'Unassigned') {
        return accumulator;
      }
      const current = accumulator.get(testerName) || { assigned: 0, inProgress: 0 };
      current.assigned += 1;
      if (control.statusType === 'in-progress') {
        current.inProgress += 1;
      }
      accumulator.set(testerName, current);
      return accumulator;
    }, new Map());

    const knownNames = new Set(users.map(userCapacityDisplayName));
    const extraFromAssignees = [];
    for (const control of controls) {
      const assigned = control.tester;
      if (!assigned || assigned === 'Unassigned') continue;
      if (!knownNames.has(assigned)) extraFromAssignees.push(assigned);
    }
    const extraAssigneeNamesSorted = [...new Set(extraFromAssignees)].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    const capacityRowNames = [...users.map(userCapacityDisplayName), ...extraAssigneeNamesSorted];

    return capacityRowNames.map((name) => {
      const counts = byTester.get(name) || { assigned: 0, inProgress: 0 };
      const { progressPercent, progressLabel } = formatCapacityProgress(
        counts.inProgress,
        counts.assigned
      );
      return {
        initials: toInitials(name),
        name,
        assignedTests: counts.assigned,
        inProgressTests: counts.inProgress,
        progress: progressPercent,
        progressLabel,
        color: getTeamColor(),
      };
    });
  }, [controls, users]);

  const header = (
    <PageHeader
      title={
        <div className="dashboard-header-title">
          <span>Overview Dashboard</span>
          <InfoTooltipIcon tooltip={`Last Updated ${lastUpdatedLabel}`} />
        </div>
      }
      actions={
        <>
          <ExportButton isLoading={isExporting} isPageLoading={loading} onClick={handleExport} />
          <button
            className="btn btn--blue"
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </button>
        </>
      }
    />
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        {header}
        <div className="no-results">Loading controls...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {header}

      {loadError ? <div className="dashboard-panel">Error: {loadError}</div> : null}

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
          <DonutChart title="DAT Distribution" total={datTotal} series={datDistributionDisplay} />
          <DonutChart title="OET Distribution" total={oetTotal} series={oetDistributionDisplay} />
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
                  <button
                    type="button"
                    className="dashboard-progress-item__code"
                    onClick={() => openTestDetailsByVgcpid(item.vgcpid)}
                    disabled={!item.vgcpid || !testsByVgcpid.has(item.vgcpid)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: item.vgcpid ? 'pointer' : 'default',
                    }}
                  >
                    {item.id}
                  </button>
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
              {teamCapacity.length === 0 ? (
                <div className="dashboard-capacity-item dashboard-capacity-item--empty">
                  <span className="dashboard-capacity-item__name">
                    No testers with assigned work
                  </span>
                </div>
              ) : (
                teamCapacity.map((member) => (
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
                          style={{
                            width: `${member.progress}%`,
                            backgroundColor: member.color,
                          }}
                        />
                        <span className="dashboard-capacity-item__bar-tooltip">
                          {member.progressLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <DetailsTestModal
        isOpen={isTestDetailsOpen}
        onClose={() => {
          setIsTestDetailsOpen(false);
          setSelectedTest(null);
        }}
        test={selectedTest}
        onArchived={(testId) => {
          setControls((prev) => prev.filter((test) => test.test_id !== testId));
        }}
        onDeleted={(testId) => {
          setControls((prev) => prev.filter((test) => test.test_id !== testId));
        }}
        onEdit={(updatedTest) => {
          if (!updatedTest?.test_id) return;
          setControls((prev) =>
            prev.map((test) =>
              test?.test_id === updatedTest.test_id ? mapTestRowToDashboardRow(updatedTest) : test
            )
          );
          setSelectedTest((prev) =>
            prev?.test_id === updatedTest.test_id ? mapTestRowToDashboardRow(updatedTest) : prev
          );
        }}
      />
    </div>
  );
}
