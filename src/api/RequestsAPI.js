const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

export async function fetchRequests() {
  const resp = await fetch(`${API_BASE}/requests`, {
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

export function mapRequestRowToUi(row) {
  const startDate = row.start_date ?? null;
  const dueDate = row.due_date ?? null;

  return {
    id: `REQ-${String(row.request_id).padStart(4, '0')}`,
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

function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
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

export async function createRequest(payload) {
  const resp = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
