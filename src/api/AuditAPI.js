const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3001';

/**
 * Fetch audit logs for a request (includes request + all associated tests).
 * Use when request status is IN_PROGRESS or COMPLETED (Option A display filter).
 *
 * @param {Object} opts
 * @param {number} opts.requestId - Request ID to fetch history for
 * @param {number} [opts.limit=50]
 * @param {number} [opts.offset=0]
 * @returns {Promise<Array>} Audit log entries
 */
export async function fetchAuditLogsByRequestId({ requestId, limit = 50, offset = 0 }) {
  if (requestId == null) return [];

  const params = new URLSearchParams();
  params.set('request_id', String(requestId));
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const resp = await fetch(`${API_BASE}/audit?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    const msg = `Failed to fetch audit logs (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      throw new Error(data?.error || data?.message || msg);
    } catch (e) {
      if (e instanceof Error && e.message !== msg) throw e;
      throw new Error(msg);
    }
  }

  const data = await resp.json();
  return Array.isArray(data?.data) ? data.data : [];
}
