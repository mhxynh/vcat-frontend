import { parseLocalDate } from '../utils/date';
import { objectToSnakeCase } from '../utils/transformer';
import { authFetch, API_BASE } from './apiClient';

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
    case 'DAT_IN_PROGRESS':
      return { status: 'DAT In Progress', statusType: 'in-progress' };
    case 'OET_IN_PROGRESS':
      return { status: 'OET In Progress', statusType: 'in-progress' };
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
  const modalFields = objectToSnakeCase({
    testId: test.test_id,
    requestId: test.request_id ?? null,
    controlId: test.control_id ?? null,
    assignedTesterName: test.assigned_tester_name || 'Unassigned',
    requiresDat: !!test.requires_dat,
    requiresOet: !!test.requires_oet,
    datStep: test.dat_step || null,
    oetStep: test.oet_step || null,
    updatedAt: test.updated_at ?? null,
    dueDate: test.due_date ?? null,
    estimatedDate: test.estimated_date ?? null,
  });

  return {
    id: test.test_id,
    vgcpid: test.vgcpid,
    tester: test.assigned_tester_name || 'Unassigned',
    testType: formatTestType(test),
    status: statusMeta.status,
    statusType: statusMeta.statusType,
    progressStep,
    datStep: test.dat_step || null,
    oetStep: test.oet_step || null,
    step: formatStep(test.oet_step || test.dat_step),
    description: test.control_description ?? test.description ?? '',
    dateUpdated: formatDate(test.updated_at || test.created_at),
    dueDate: formatDate(test.due_date),
    etaDate: formatDate(test.estimated_date),
    ...modalFields,
  };
}

export async function fetchTests() {
  const tests = await fetchAllTests();
  return tests.filter((test) => (test.status || '').toUpperCase() !== 'ARCHIVED');
}

export async function fetchAllTests() {
  const resp = await authFetch(`${API_BASE}/tests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch tests (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTestsByRequestId(requestId, { details = true } = {}) {
  if (requestId == null) return [];

  const url = new URL(`${API_BASE}/tests`);
  url.searchParams.set('request_id', String(requestId));
  if (details) url.searchParams.set('details', 'true');

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch tests (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

/** GET /tests?control_id= — all tests for a control (dedupe requests in the UI if multiple tests share a request). */
export async function fetchTestsByControlId(controlId) {
  if (controlId == null) return [];

  const url = new URL(`${API_BASE}/tests`);
  url.searchParams.set('control_id', String(controlId));

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch tests (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

export async function deleteTest(testId, { hard = false, archive = true } = {}) {
  if (testId == null) throw new Error('Test ID is required');

  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);
  if (hard) url.searchParams.set('hard', 'true');
  if (!archive) url.searchParams.set('archive', 'false');

  const resp = await authFetch(url.toString(), {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Delete failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function archiveTest(testId) {
  return deleteTest(testId, { hard: false, archive: true });
}

export async function hardDeleteTest(testId) {
  return deleteTest(testId, { hard: true });
}

export async function unarchiveTest(testId) {
  return deleteTest(testId, { hard: false, archive: false });
}

export function mapTestRowToRequestControlCard(test) {
  const statusLabel = mapTestStatusToUi(test?.status);
  const testId = test?.test_id ?? test?.testId ?? null;
  const controlId = test?.control_id ?? test?.controlId ?? null;

  return {
    ...test,
    id: test?.vgcpid ?? (controlId != null ? `CONTROL-${controlId}` : 'UNKNOWN'),
    testId,
    title:
      test?.control_description ??
      test?.controlDescription ??
      test?.description ??
      'No description',
    assignee:
      test?.assigned_tester_name ??
      test?.assignedTesterName ??
      test?.tester_name ??
      test?.testerName ??
      '-',
    eta: formatShortDate(
      test?.estimated_date ?? test?.estimatedDate ?? test?.due_date ?? test?.dueDate ?? null
    ),
    statusLabel,
  };
}

function mapTestStatusToUi(s) {
  const v = String(s || '').toUpperCase();
  if (v === 'COMPLETED') return 'Completed';
  if (v === 'IN_REVIEW') return 'In Review';
  if (v === 'DAT_IN_PROGRESS') return 'DAT In Progress';
  if (v === 'OET_IN_PROGRESS') return 'OET In Progress';
  if (v === 'BLOCKED') return 'Blocked';
  if (v === 'ARCHIVED') return 'Archived';
  return 'Not Started';
}

function formatShortDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export async function createTest(payload) {
  const resp = await authFetch(`${API_BASE}/tests`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  if (!resp.ok) {
    let msg = `Failed to create test (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json();
}

export async function updateTest(testId, payload) {
  if (testId == null) throw new Error('Test ID is required');

  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  if (!resp.ok) {
    let msg = `Failed to update test (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function startTest(testId) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase({ action: 'start' })),
  });

  if (!resp.ok) {
    let msg = `Start failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function reviewTest(testId) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase({ action: 'review' })),
  });

  if (!resp.ok) {
    let msg = `Review failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function completeTest(testId) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase({ action: 'complete' })),
  });

  if (!resp.ok) {
    let msg = `Complete failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function updateDat(testId, datStep, status) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase({ action: 'update_dat', datStep: datStep, status })),
  });

  if (!resp.ok) {
    let msg = `DAT update failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function updateOet(testId, oetStep, status) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(objectToSnakeCase({ action: 'update_oet', oetStep: oetStep, status })),
  });

  if (!resp.ok) {
    let msg = `OET update failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function fetchTestById(testId) {
  if (testId == null) throw new Error('Test ID is required');

  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch test (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}
