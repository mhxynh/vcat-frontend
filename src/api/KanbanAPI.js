import { authFetch, API_BASE } from './apiClient';

export async function fetchKanban({ requestId, controlId, details } = {}) {
  const buildUrl = ({ requestId, controlId, details } = {}) => {
    const u = new URL(`${API_BASE}/tests`);
    if (requestId !== undefined && requestId !== null)
      u.searchParams.set('request_id', String(requestId));
    if (controlId !== undefined && controlId !== null)
      u.searchParams.set('control_id', String(controlId));
    if (details) u.searchParams.set('details', 'true');
    return u.toString();
  };

  let resp = await authFetch(buildUrl({ requestId, controlId, details }), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (resp.status === 400 && requestId == null && controlId == null) {
    resp = await authFetch(buildUrl({ requestId: 0, details }), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  }

  if (!resp.ok) {
    throw new Error(`Failed to fetch kanban data (HTTP ${resp.status})`);
  }
  const data = await resp.json();
  if (!Array.isArray(data)) return [];
  return data;
}

export function mapTestRowToCard(test) {
  const statusRaw = test.status || '';
  const statusKey = normalizeStatus(statusRaw);

  const id = test.vgcpid || test.test_id || String(test.control_id || '');

  let dueDate = test.due_date || test.due || test.dueDate || '';
  if (dueDate) {
    try {
      dueDate = new Date(dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {}
  }
  return {
    id,
    desc: test.control_description || test.description || '',
    assignee: test.assigned_tester_name || test.tester_name || test.assigned_tester_id || '',
    due: dueDate,
    status: statusKey,
    dot: statusColor(statusKey),
  };
}

function normalizeStatus(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function statusColor(statusKey) {
  switch (statusKey) {
    case 'not_started':
      return '#c62828';
    case 'dat_in_progress':
    case 'oet_in_progress':
      return '#eab308';
    case 'in_review':
      return '#14b8a6';
    case 'completed':
      return '#2e7d32';
    default:
      return '#9ca3af';
  }
}
