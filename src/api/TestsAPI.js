const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

export async function fetchTests() {
  const resp = await fetch(`${API_BASE}/tests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch tests (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}
