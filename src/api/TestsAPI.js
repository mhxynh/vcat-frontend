const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

export async function fetchAllTests() {
  const resp = await fetch(`${API_BASE}/tests`, {
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

  const resp = await fetch(url.toString(), {
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

export async function createTest(payload) {
  const resp = await fetch(`${API_BASE}/tests`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to create test (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function deleteTest(testId, { hard = false } = {}) {
  if (testId == null) throw new Error('Test ID is required');

  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);
  if (hard) url.searchParams.set('hard', 'true');

  const resp = await fetch(url.toString(), {
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
  return deleteTest(testId, { hard: false });
}

export async function hardDeleteTest(testId) {
  return deleteTest(testId, { hard: true });
}

export function mapTestRowToRequestControlCard(test) {
  const status = mapTestStatusToUi(test?.status);
  const note = pickNote(test);

  return {
    id: test?.vgcpid ?? (test?.control_id != null ? `CONTROL-${test.control_id}` : 'UNKNOWN'),
    title: test?.control_description ?? test?.description ?? 'No description',
    assignee: test?.assigned_tester_name ?? test?.tester_name ?? '-',
    eta: formatShortDate(test?.estimated_date ?? test?.due_date ?? null),
    status,
    note,
  };
}

function mapTestStatusToUi(s) {
  const v = String(s || '').toUpperCase();
  if (v === 'COMPLETED') return 'Completed';
  if (v === 'IN_REVIEW') return 'In Review';
  if (v === 'IN_PROGRESS') return 'In Progress';
  if (v === 'BLOCKED') return 'Blocked';
  if (v === 'ARCHIVED') return 'Archived';
  return 'Not Started';
}

function pickNote(test) {
  const dat = test?.dat_step ? `DAT: ${String(test.dat_step).replaceAll('_', ' ')}` : '';
  const oet = test?.oet_step ? `OET: ${String(test.oet_step).replaceAll('_', ' ')}` : '';
  const parts = [dat, oet].filter(Boolean);
  return parts.length ? parts.join(' • ') : '';
}

function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatShortDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export async function startTest(testId) {
  const url = new URL(`${API_BASE}/tests/${encodeURIComponent(String(testId))}`);

  const resp = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start' }),
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

  const resp = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'review' }),
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

  const resp = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete' }),
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

  const resp = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_dat', ['dat_step']: datStep, status }),
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

  const resp = await fetch(url.toString(), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_oet', ['oet_step']: oetStep, status }),
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

  const resp = await fetch(url.toString(), {
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
