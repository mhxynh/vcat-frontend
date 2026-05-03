import { authFetch, API_BASE } from './apiClient';

export async function exportTable(table, fallbackFilename) {
  const url = new URL(`${API_BASE}/export`);
  url.searchParams.set('table', table);

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to generate export (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  const downloadUrl = data?.downloadUrl || data?.download_url;
  if (!downloadUrl) {
    throw new Error('Export response did not include a download URL');
  }

  return {
    downloadUrl,
    filename: data?.filename || fallbackFilename,
  };
}
