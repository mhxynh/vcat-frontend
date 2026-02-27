const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function normalizeStatus(status) {
  const raw = (status || '').toUpperCase();
  switch (raw) {
    case 'NOT_STARTED':
      return { status: 'Not Started', statusType: 'not-started' };
    case 'IN_PROGRESS':
      return { status: 'In Progress', statusType: 'in-progress' };
    case 'IN_REVIEW':
      return { status: 'In Review', statusType: 'in-review' };
    case 'COMPLETED':
      return { status: 'Completed', statusType: 'completed' };
    case 'BLOCKED':
      return { status: 'Blocked', statusType: 'blocked' };
    default:
      return { status: status || 'Unknown', statusType: 'not-started' };
  }
}

function formatStep(stepValue) {
  if (!stepValue) return 'Not Started';
  return stepValue
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function formatTestType(test) {
  if (test.requires_dat && test.requires_oet) return 'DAT & OET';
  if (test.requires_dat) return 'DAT Only';
  if (test.requires_oet) return 'OET Only';
  return 'Unspecified';
}

export function mapTestRowToDashboardRow(test) {
  const statusMeta = normalizeStatus(test.status);
  const progressStep = test.oet_step || test.dat_step || null;
  return {
    id: test.test_id,
    vgcpid: test.vgcpid,
    tester: test.assigned_tester_name || 'Unassigned',
    testType: formatTestType(test),
    status: statusMeta.status,
    statusType: statusMeta.statusType,
    progressStep,
    step: formatStep(test.oet_step || test.dat_step),
    dateUpdated: formatDate(test.updated_at || test.created_at),
    dueDate: formatDate(test.due_date),
    etaDate: formatDate(test.estimated_date),
  };
}

export async function fetchTests() {
  const resp = await fetch(`${API_BASE}/tests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch tests (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) return [];

  return data.filter((test) => (test.status || '').toUpperCase() !== 'ARCHIVED');
}
