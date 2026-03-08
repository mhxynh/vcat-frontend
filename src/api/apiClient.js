import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

async function getAuthHeaders() {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Not authenticated — proceed without token
  }
  return {};
}

/**
 * Authenticated fetch wrapper.
 * @param {string} pathOrUrl - Relative path (e.g. '/controls') or full URL string
 * @param {RequestInit} options - Standard fetch options
 */
export async function authFetch(pathOrUrl, options = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });
}

export { API_BASE };
