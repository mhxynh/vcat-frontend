import { objectToSnakeCase } from '../utils/transformer';
import { authFetch, API_BASE } from './apiClient';
import { exportTable } from './ExportAPI';

export async function deleteControl(vgcpid, { hard = false } = {}) {
  const url = new URL(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`);
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
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

export async function fetchControls() {
  const resp = await authFetch(`${API_BASE}/controls`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch controls (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) return [];

  return data;
}

export async function exportCatalog() {
  return exportTable('controls', 'control_export.csv');
}

//schemas are: control_id, vgcpid, description, control_owner, control_sme, escalation, is_active, date_created, last_tested

export function mapControlRowToUi(control) {
  const lastTested = control.last_tested ?? null;

  return {
    id: control.vgcpid,
    controlId: control.control_id ?? null,
    status: control.is_active ? 'Active' : 'Retired',
    testing: lastTested ? `Last Tested on ${lastTested}` : 'Not Tested Yet',
    description: control.description ?? null,
    dateCreated: control.date_created ?? null,
    lastTested: lastTested,
    owner: control.control_owner,
    sme: control.control_sme ?? null,
    escalationRequired: control.escalation ? 'Yes' : 'No',
  };
}

export async function createControl(payload) {
  const resp = await authFetch(`${API_BASE}/controls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      data?.error ||
      (Array.isArray(data?.missing) ? `Missing: ${data.missing.join(', ')}` : null) ||
      `Failed to create control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function updateControl(vgcpid, updates) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(updates)),
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to update control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function retireControl(vgcpid) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to retire control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function fetchControlByVgcpid(vgcpid) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to fetch control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}
