import { authFetch, API_BASE } from './apiClient';

const signedUrlCache = new Map();

function isRemoteUrl(src) {
  return /^https?:\/\//i.test(String(src || ''));
}

function shouldSignHelpMedia(src) {
  return Boolean(src) && !isRemoteUrl(src);
}

export async function getHelpMediaUrl(src) {
  if (!shouldSignHelpMedia(src)) return src;

  const cacheKey = String(src);
  const cached = signedUrlCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const url = new URL(`${API_BASE}/help-media`);
  url.searchParams.set('key', cacheKey);

  const resp = await authFetch(url.toString(), {
    method: 'GET',
  });

  if (!resp.ok) {
    throw new Error(`Failed to load help media URL (${resp.status})`);
  }

  const data = await resp.json();
  const ttlMs = Number(data.expires_in || 900) * 1000;
  signedUrlCache.set(cacheKey, {
    url: data.url,
    expiresAt: now + Math.max(ttlMs - 60000, 0),
  });

  return data.url;
}
