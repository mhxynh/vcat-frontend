import { authFetch, API_BASE } from './apiClient';

async function fetchAuditLogs(params) {
  const search = new URLSearchParams(params);
  const resp = await authFetch(`${API_BASE}/audit?${search}`, {
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

/**
 * Fetch audit logs for a request (includes request + all associated tests).
 * @param {Object} opts
 * @param {number} opts.requestId - Request ID to fetch history for
 * @param {number} [opts.limit=50]
 * @param {number} [opts.offset=0]
 * @returns {Promise<Array>} Audit log entries
 */
export async function fetchAuditLogsByRequestId({ requestId, limit = 50, offset = 0 }) {
  if (requestId == null) return [];
  return fetchAuditLogs({
    /* eslint-disable-next-line camelcase */
    request_id: String(requestId),
    limit: String(limit),
    offset: String(offset),
  });
}

/**
 * Fetch audit logs for a single entity (e.g. REQUEST or TEST).
 * @param {Object} opts
 * @param {string} opts.entityType - Entity type (e.g. 'REQUEST', 'TEST')
 * @param {number|string} opts.entityId - Entity ID
 * @param {number} [opts.limit=50]
 * @param {number} [opts.offset=0]
 * @returns {Promise<Array>} Audit log entries
 */
export async function fetchAuditLogsByEntity({ entityType, entityId, limit = 50, offset = 0 }) {
  if (entityType == null || entityId == null) return [];
  return fetchAuditLogs({
    /* eslint-disable-next-line camelcase */
    entity_type: String(entityType),
    /* eslint-disable-next-line camelcase */
    entity_id: String(entityId),
    limit: String(limit),
    offset: String(offset),
  });
}

/**
 * Fetch audit logs for a single test (control test).
 * @param {Object} opts
 * @param {number} opts.testId - Test ID to fetch history for
 * @param {number} [opts.limit=50]
 * @param {number} [opts.offset=0]
 * @returns {Promise<Array>} Audit log entries
 */
export async function fetchAuditLogsByTestId({ testId, limit = 50, offset = 0 }) {
  if (testId == null) return [];
  return fetchAuditLogsByEntity({ entityType: 'TEST', entityId: testId, limit, offset });
}
