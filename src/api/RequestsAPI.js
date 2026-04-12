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

/** Request-level status for display (requests table / control request history). */
export function formatRequestStatusLabel(status) {
  const s = String(status || 'NOT_STARTED').toUpperCase();
  const labels = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DAT_IN_PROGRESS: 'DAT In Progress',
    OET_IN_PROGRESS: 'OET In Progress',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
    ARCHIVED: 'Archived',
  };
  if (labels[s]) return labels[s];
  return s
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Best-effort batch fetch for request rows by ID.
 * Falls back to per-id fetches if backend doesn't support `ids` query.
 * @param {number[]} ids
 */
export async function fetchRequestsByIds(ids) {
  const unique = Array.from(
    new Set((ids || []).map((n) => Number(n)).filter((n) => !Number.isNaN(n)))
  );
  if (unique.length === 0) return [];

  try {
    const url = new URL(`${API_BASE}/requests`);
    url.searchParams.set('ids', unique.join(','));

    const resp = await authFetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (resp.ok) {
      const data = await resp.json().catch(() => []);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // ignore and fall back
  }

  /** Limit concurrent per-id calls to avoid bursting the network when many request_ids exist. */
  const CHUNK = 6;
  const rows = [];
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const results = await Promise.allSettled(chunk.map((rid) => fetchRequestById(rid)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) rows.push(r.value);
    }
  }
  return rows;
}

/**
 * Unique requests for a control from tests, joined to request rows (one row per request even if multiple tests).
 * @param {Array<{ request_id?: number }>} tests
 * @param {Array<{ request_id?: number, requestor?: string, status?: string, description?: string, start_date?: string, created_at?: string }>} requestRows
 */
export function buildRequestHistoryForControl(tests, requestRows) {
  const seen = new Set();
  const ids = [];
  for (const t of tests) {
    const rid = t?.request_id;
    if (rid == null) continue;
    const n = Number(rid);
    if (Number.isNaN(n) || seen.has(n)) continue;
    seen.add(n);
    ids.push(n);
  }
  ids.sort((a, b) => b - a);

  const byId = new Map();
  for (const row of requestRows) {
    const id = row?.request_id;
    if (id != null) byId.set(Number(id), row);
  }

  return ids.map((rid) => {
    const row = byId.get(rid);
    const ui = row ? mapRequestRowToUi(row) : null;
    const dateRaw =
      row && (row.start_date != null || row.created_at != null)
        ? (row.start_date ?? row.created_at)
        : null;
    return {
      key: String(rid),
      requestId: `REQ-${String(rid).padStart(4, '0')}`,
      /** Localized display string (e.g. Requests table); prefer `dateRaw` + one format pass in UI. */
      date: ui?.requestDate ?? '-',
      /** ISO-ish raw value safe for `new Date()` / `formatDisplayDate` in the control modal */
      dateRaw,
      requester: ui?.requestedBy ?? (row?.requestor ? String(row.requestor) : '-'),
      status: formatRequestStatusLabel(ui?.status ?? row?.status),
      description: String(ui?.description ?? row?.description ?? '').trim() || '-',
    };
  });
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
