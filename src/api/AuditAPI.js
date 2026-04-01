import { authFetch, API_BASE } from './apiClient';

function findKeyIgnoreCase(obj, targetLower) {
  if (!obj || typeof obj !== 'object') return undefined;
  const key = Object.keys(obj).find((k) => k.toLowerCase() === targetLower);
  return key != null ? obj[key] : undefined;
}

/** Normalize actor fields (some gateways/clients vary casing). */
export function normalizeAuditLogEntry(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  /* eslint-disable camelcase -- mirrors REST audit log JSON */
  const actorUserId =
    raw.actor_user_id ?? raw.actorUserId ?? findKeyIgnoreCase(raw, 'actor_user_id');
  const actorDisplayName =
    raw.actor_display_name ?? raw.actorDisplayName ?? findKeyIgnoreCase(raw, 'actor_display_name');
  const out = { ...raw };
  if (actorUserId != null && actorUserId !== '') {
    out.actor_user_id = actorUserId;
  }
  if (actorDisplayName != null && String(actorDisplayName).trim() !== '') {
    out.actor_display_name = String(actorDisplayName).trim();
  }
  /* eslint-enable camelcase */
  return out;
}

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
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(normalizeAuditLogEntry);
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
