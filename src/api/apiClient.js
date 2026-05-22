import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';
const NETWORK_UNAVAILABLE_MESSAGE = 'Data is unavailable. Please try again later.';

export function getFriendlyHttpErrorMessage(status) {
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return 'You do not have permission to access this data.';
  if (status === 404) return 'Data is unavailable.';
  if (status >= 500) return 'Our server is having trouble. Please try again later.';
  return 'Something went wrong. Please try again.';
}

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
  try {
    return await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(NETWORK_UNAVAILABLE_MESSAGE);
  }
}

export { API_BASE };
