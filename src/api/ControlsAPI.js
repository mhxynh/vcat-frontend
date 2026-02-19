const API_BASE = 'http://127.0.0.1:3001'; //change this when we stop doing local

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
    owner: control.control_owner ?? null,
    sme: control.control_sme ?? null,
    escalationRequired: control.escalation ? 'Yes' : 'No',
  };
}
