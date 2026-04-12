import { parseLocalDate } from '../utils/date';
import { objectToSnakeCase } from '../utils/transformer';
import { authFetch, API_BASE } from './apiClient';

export async function fetchRequests() {
  const resp = await authFetch(`${API_BASE}/requests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch requests (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchRequestById(requestId) {
  if (requestId == null) throw new Error('Request ID is required');

  const resp = await authFetch(`${API_BASE}/requests/${encodeURIComponent(String(requestId))}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch request (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json().catch(() => ({}));
}

export async function updateRequest(requestId, payload) {
  if (requestId == null) throw new Error('Request ID is required');

  const resp = await authFetch(`${API_BASE}/requests/${encodeURIComponent(String(requestId))}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      data?.error ||
      (Array.isArray(data?.missing) ? `Missing: ${data.missing.join(', ')}` : null) ||
      `Failed to update request (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export function mapRequestRowToUi(row) {
  const startDate = row.start_date ?? null;
  const dueDate = row.due_date ?? null;

  return {
    id: String(row.request_id).padStart(4, '0'),
    requestId: row.request_id,

    priority: formatPriority(row.priority),
    requestedBy: row.requestor ?? '-',

    requestDate: formatDate(startDate) || formatDate(row.created_at),

    dueDate: formatDate(dueDate) || '-',
    overdue: isOverdue(dueDate, row.status),

    status: row.status ?? 'NOT_STARTED',

    description: row.description ?? '',
  };
}

function isOverdue(dueDate, status) {
  const s = String(status || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'ARCHIVED') return false;
  if (!dueDate) return false;

  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function formatPriority(p) {
  const v = String(p || '').toUpperCase();
  if (v === 'CRITICAL') return 'Critical';
  if (v === 'HIGH') return 'High';
  if (v === 'MEDIUM') return 'Medium';
  if (v === 'LOW') return 'Low';
  return String(p || 'Medium');
}

function formatDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function deleteRequest(requestId, { hard = false } = {}) {
  if (requestId == null) throw new Error('Request ID is required');

  const url = new URL(`${API_BASE}/requests/${encodeURIComponent(String(requestId))}`);
  if (hard) url.searchParams.set('hard', 'true');

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

export async function createRequest(payload) {
  const resp = await authFetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      data?.error ||
      (Array.isArray(data?.missing) ? `Missing: ${data.missing.join(', ')}` : null) ||
      `Failed to create request (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}
