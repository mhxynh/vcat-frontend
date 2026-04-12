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

export async function fetchUserByEmail(email) {
  if (!email) throw new Error('email is required');

  const url = new URL(`${API_BASE}/users`);
  url.searchParams.set('email', String(email));

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch user by email (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json();
}

export async function fetchUserById(userId) {
  if (userId == null) throw new Error('userId is required');

  const resp = await authFetch(`${API_BASE}/users/${encodeURIComponent(String(userId))}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch user (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json();
}
