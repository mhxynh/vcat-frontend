import { authFetch, API_BASE } from './apiClient';

export async function fetchUsers({ isActive } = {}) {
  const url = new URL(`${API_BASE}/users`);
  if (isActive != null) url.searchParams.set('is_active', String(isActive));

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch users (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}
