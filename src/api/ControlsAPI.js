const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

export async function fetchControls() {
  const resp = await fetch(`${API_BASE}/controls`, {
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

//schemas are: control_id, vgcpid, description, control_owner, control_sme, escalation, is_active, date_created, last_tested

export function mapControlRowToUi(control) {
  const lastTested = control.last_tested ?? null;

  return {
    id: control.vgcpid,
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
  const resp = await fetch(`${API_BASE}/controls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
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
  const resp = await fetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Failed to update control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}
