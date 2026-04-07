import { parseLocalDate } from '../utils/date';
import { authFetch, API_BASE } from './apiClient';

/** Maps API priority to a CSS suffix; colors are `var(--priority-*)` in base.css (global) */
function priorityVariant(priorityRaw) {
  const v = String(priorityRaw || '')
    .toUpperCase()
    .trim();
  if (v === 'CRITICAL') return 'critical';
  if (v === 'HIGH') return 'high';
  if (v === 'MEDIUM') return 'medium';
  if (v === 'LOW') return 'low';
  return 'medium';
}

function priorityLabel(priorityRaw) {
  const v = String(priorityRaw || '')
    .toUpperCase()
    .trim();
  if (v === 'CRITICAL') return 'Critical';
  if (v === 'HIGH') return 'High';
  if (v === 'MEDIUM') return 'Medium';
  if (v === 'LOW') return 'Low';
  return 'Medium';
}

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

export function mapTestRowToCard(test, options = {}) {
  const statusRaw = test.status || '';
  const statusKey = normalizeStatus(statusRaw);

  const id = test.vgcpid || test.test_id || String(test.control_id || '');

  let dueDate = test.due_date || test.due || test.dueDate || '';
  if (dueDate) {
    const d = parseLocalDate(dueDate);
    dueDate = d
      ? d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : '';
  }

  const priorityRaw =
    options.requestPriority ?? test.request_priority ?? test.priority_request ?? '';

  return {
    id,
    desc: test.control_description || test.description || '',
    assignee: test.assigned_tester_name || test.tester_name || test.assigned_tester_id || '',
    due: dueDate,
    status: statusKey,
    priorityVariant: priorityVariant(priorityRaw),
    priorityLabel: priorityLabel(priorityRaw),
  };
}

function normalizeStatus(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}
