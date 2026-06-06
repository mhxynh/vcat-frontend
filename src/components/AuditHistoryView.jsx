import React, { useEffect, useMemo, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { fetchUsers } from '../api/UsersAPI';
import '../styles/components/AuditHistoryView.css';
import { ModalCloseButton } from './ui';
import { formatPriorityLabel as formatDisplayPriorityLabel } from '../utils/displayLabels';

const DATE_FORMAT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/** Look up vgcpid from testId->vgcpid map (handles number/string keys). */
export function getVgcpidFromMap(map, entityId) {
  if (!map || entityId == null) return null;
  return map[entityId] ?? map[String(entityId)] ?? map[Number(entityId)] ?? null;
}

function resolveVgcpid(log, contextVgcpid, contextTestIdToVgcpid) {
  return log.vgcpid ?? contextVgcpid ?? getVgcpidFromMap(contextTestIdToVgcpid, log.entity_id);
}

function logActorDisplayNameRaw(log) {
  const v = log.actor_display_name ?? log.actorDisplayName;
  return v != null ? String(v).trim() : '';
}

function logActorUserIdRaw(log) {
  const v = log.actor_user_id ?? log.actorUserId;
  if (v === null || v === undefined || v === '') return null;
  return v;
}

/** Map user_id -> display label from GET /users (same source as assignee modals). */
function buildActorDisplayNameLookup(users) {
  const map = Object.create(null);
  for (const u of users || []) {
    const id = u.user_id ?? u.userId ?? u.id;
    if (id == null) continue;
    const raw = u.display_name ?? u.displayName ?? u.email ?? '';
    const name = String(raw).trim();
    if (name) map[String(id)] = name;
  }
  return map;
}

/** Decode Cognito ID token payload (browser); UTF-8 safe for Unicode claims. */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const binary = atob(b64 + pad);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function getActorLookupSessionKey() {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();
    const payload = token ? decodeJwtPayload(token) : null;
    const userKey = payload?.sub ?? payload?.['cognito:username'] ?? null;
    return userKey != null && userKey !== '' ? String(userKey) : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

/** Per signed-in user: avoids cross-session reuse of GET /users within the same tab. */
let actorLookupCacheBySession = Object.create(null);
let actorLookupInFlightBySession = Object.create(null);
let actorLookupLastFailureAtBySession = Object.create(null);

function resetActorLookupModuleCache() {
  actorLookupCacheBySession = Object.create(null);
  actorLookupInFlightBySession = Object.create(null);
  actorLookupLastFailureAtBySession = Object.create(null);
}

function loadActorLookupMap() {
  return getActorLookupSessionKey().then((sessionKey) => {
    if (actorLookupCacheBySession[sessionKey]) {
      return Promise.resolve(actorLookupCacheBySession[sessionKey]);
    }
    if (actorLookupInFlightBySession[sessionKey]) {
      return actorLookupInFlightBySession[sessionKey];
    }
    if (Date.now() - (actorLookupLastFailureAtBySession[sessionKey] ?? 0) < 10_000) {
      return Promise.resolve(Object.create(null));
    }
    // Full org list: needed to resolve historical actor_user_ids. A future API could return
    // display names on audit rows or accept a set of user ids to narrow this call.
    actorLookupInFlightBySession[sessionKey] = fetchUsers()
      .then((users) => {
        actorLookupCacheBySession[sessionKey] = buildActorDisplayNameLookup(users);
        return actorLookupCacheBySession[sessionKey];
      })
      .catch(() => {
        actorLookupLastFailureAtBySession[sessionKey] = Date.now();
        return Object.create(null);
      })
      .finally(() => {
        delete actorLookupInFlightBySession[sessionKey];
      });
    return actorLookupInFlightBySession[sessionKey];
  });
}

function displayNameFromIdTokenPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const name = payload.name || payload.given_name || payload.preferred_username;
  if (name && String(name).trim()) return String(name).trim();
  const email = payload.email;
  if (email && typeof email === 'string') {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return null;
}

/**
 * Prefer API `actor_display_name`, then /users lookup by `actor_user_id`, then `User {id}`.
 * With no `actor_user_id`, production shows "Unknown" so viewers are not misattributed.
 * In development only, fall back to the signed-in Cognito user when the backend omits actor (local).
 */
function resolveActorLabel(log, sessionDisplayNameFallback, actorLookup, isDev) {
  const fromApi = logActorDisplayNameRaw(log);
  if (fromApi) return fromApi;
  const uid = logActorUserIdRaw(log);
  if (uid != null && actorLookup && actorLookup[String(uid)]) {
    return actorLookup[String(uid)];
  }
  if (uid != null) return `User ${uid}`;
  if (isDev && sessionDisplayNameFallback) return sessionDisplayNameFallback;
  return 'Unknown';
}

/** Up to two characters: first letter of first two words, or first two letters of a single word (e.g. "MH"). */
function historyAvatarInitials(name) {
  const s = String(name || '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase())
      .join('');
  }
  const one = parts[0] || '';
  if (one.length >= 2) return one.slice(0, 2).toUpperCase();
  return one.slice(0, 1).toUpperCase();
}

function auditEntryAvatarInitial(log, sessionDisplayNameFallback, actorLookup, isDev) {
  const label = resolveActorLabel(log, sessionDisplayNameFallback, actorLookup, isDev);
  if (label === 'Unknown') return '?';
  if (label) {
    const badge = historyAvatarInitials(label);
    if (badge) return badge;
  }
  return '?';
}

/**
 * Shared audit history view: scrollable list, expand button, full overlay.
 * Used by DetailsRequestModal and DetailsTestModal.
 *
 * @param {Object} props
 * @param {Array} props.logs - Audit log entries
 * @param {boolean} props.loading
 * @param {string} props.error
 * @param {string} props.overlayTitle - Title for the expand overlay (e.g. "Request History", "Test History")
 * @param {boolean} [props.showContent] - If false, show statusMessage instead of history (for request: only when IN_PROGRESS/COMPLETED)
 * @param {string} [props.statusMessage] - Message when showContent is false (e.g. "History is available when the request is in progress or completed.")
 * @param {string} [props.contextVgcpid] - VGCP ID of the current test (when viewing single test history). Shown with each "Test updated" entry.
 * @param {string} [props.contextRequestId] - Request display ID (e.g. "REQ-0001") when viewing request history. Shown with each "Request updated" entry.
 * @param {Object} [props.contextTestIdToVgcpid] - Map of test_id -> vgcpid for tests under a request. Used when viewing request history to show "Test: VGCP-xxx Updated" for each test.
 */
export default function AuditHistoryView({
  logs,
  loading,
  error,
  overlayTitle = 'History',
  showContent = true,
  statusMessage = 'History is available when the request is in progress or completed.',
  contextVgcpid = null,
  contextRequestId = null,
  contextTestIdToVgcpid = null,
}) {
  const [showExpanded, setShowExpanded] = useState(false);
  const [sessionDisplayName, setSessionDisplayName] = useState(null);
  const [actorLookup, setActorLookup] = useState(() => Object.create(null));

  const isDev = process.env.NODE_ENV === 'development';

  const needsActorLookup = useMemo(() => {
    if (!showContent || !logs?.length) return false;
    return logs.some((log) => logActorUserIdRaw(log) != null && !logActorDisplayNameRaw(log));
  }, [showContent, logs]);

  /** Dev fallback when backend omits actor_user_id + actor_display_name — only then read Cognito. */
  const needsDevSessionFallback = useMemo(() => {
    if (!isDev || !showContent || !logs?.length) return false;
    return logs.some((log) => !logActorDisplayNameRaw(log) && logActorUserIdRaw(log) == null);
  }, [isDev, showContent, logs]);

  useEffect(() => {
    if (!needsDevSessionFallback) {
      setSessionDisplayName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        const payload = token ? decodeJwtPayload(token) : null;
        const name = displayNameFromIdTokenPayload(payload);
        if (!cancelled) setSessionDisplayName(name);
      } catch {
        if (!cancelled) setSessionDisplayName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsDevSessionFallback]);

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload?.event === 'signedOut') {
        resetActorLookupModuleCache();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!needsActorLookup) {
      setActorLookup((currentLookup) =>
        Object.keys(currentLookup).length > 0 ? Object.create(null) : currentLookup
      );
      return;
    }
    let cancelled = false;
    loadActorLookupMap().then((map) => {
      if (!cancelled) setActorLookup(map);
    });
    return () => {
      cancelled = true;
    };
  }, [needsActorLookup]);

  useEffect(() => {
    if (!showExpanded) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showExpanded]);

  if (!showContent) return <div className="ahv-empty">{statusMessage}</div>;
  if (loading) return <div className="ahv-empty">Loading history…</div>;
  if (error) return <div className="ahv-empty ahv-error">Error: {error}</div>;
  if (!logs?.length) return <div className="ahv-empty">No history found.</div>;

  const historyContent = (
    <div className="ahv-history">
      {logs.map((log) => {
        const changes = getAuditChanges(log);
        const vgcpid = resolveVgcpid(log, contextVgcpid, contextTestIdToVgcpid);
        const actorLabel = resolveActorLabel(log, sessionDisplayName, actorLookup, isDev);
        return (
          <div className="ahv-entry" key={log.audit_id}>
            <div className="ahv-header">
              <div className="ahv-avatar" aria-hidden="true">
                <span className="ahv-avatar-text">
                  {auditEntryAvatarInitial(log, sessionDisplayName, actorLookup, isDev)}
                </span>
              </div>
              <div className="ahv-meta">
                <span className="ahv-action">
                  {formatAuditAction(log, { vgcpid, requestId: contextRequestId })}
                </span>
                {actorLabel && <span className="ahv-actor"> · {actorLabel}</span>}
                <span className="ahv-date">{formatDate(log.changed_at)}</span>
              </div>
            </div>
            {changes.length > 0 && (
              <div className="ahv-changes">
                {changes.map((c) => (
                  <div className="ahv-row" key={c.field}>
                    <div className="ahv-cell">
                      <span className="ahv-cell-label">What was updated</span>
                      <span className="ahv-cell-value">{c.label}</span>
                    </div>
                    <div className="ahv-cell">
                      <span className="ahv-cell-label">Before</span>
                      <span className="ahv-cell-value">{c.fromStr}</span>
                    </div>
                    <div className="ahv-cell">
                      <span className="ahv-cell-label">After</span>
                      <span className="ahv-cell-value">{c.toStr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="ahv-scroll-wrap">
        <div className="ahv-scroll">{historyContent}</div>
        <button
          type="button"
          className="ahv-expand-btn"
          onClick={() => setShowExpanded(true)}
          aria-label="View full history"
        >
          View full history
        </button>
      </div>
      {showExpanded && (
        <div className="ahv-overlay" role="dialog" aria-modal="true" aria-label="Full history">
          <div className="ahv-overlay-backdrop" onClick={() => setShowExpanded(false)} />
          <div className="ahv-overlay-box">
            <div className="ahv-overlay-header">
              <h3 className="ahv-overlay-title">{overlayTitle}</h3>
              <ModalCloseButton
                className="ahv-overlay-close"
                onClick={() => setShowExpanded(false)}
              />
            </div>
            <div className="ahv-overlay-body">{historyContent}</div>
          </div>
        </div>
      )}
    </>
  );
}

function formatAuditAction(log, { vgcpid, requestId } = {}) {
  const action = String(log.action || '').toUpperCase();
  const entity = String(log.entity_type || '').toUpperCase();
  const reqId = requestId ? `: ${requestId}` : '';
  const vgcp = vgcpid ? `: ${vgcpid}` : '';
  if (entity === 'REQUEST') {
    if (action === 'CREATE') return `Request${reqId} Created`;
    if (action === 'UPDATE') return `Request${reqId} Updated`;
    if (action === 'DELETE') return `Request${reqId} Archived`;
  }
  if (entity === 'TEST') {
    if (action === 'CREATE') return `Test${vgcp} Created`;
    if (action === 'UPDATE') return `Test${vgcp} Updated`;
    if (action === 'DELETE') return `Test${vgcp} Archived`;
  }
  return `${entity}${reqId || vgcp} ${action}`;
}

function getAuditChanges(log) {
  const action = String(log.action || '').toUpperCase();
  const after = log.after_snapshot || {};
  const before = log.before_snapshot || {};
  const changed = log.changed_fields || [];

  if (action === 'UPDATE') {
    const diff = after.changed || {};
    return changed
      .filter((field) => {
        const entry = diff[field];
        if (!entry) return false;
        if (field === 'updated_at') return false;
        if (entry.from === entry.to) return false;
        return true;
      })
      .map((field) => {
        const entry = diff[field];
        const label = formatFieldLabel(field);
        const fromStr = formatAuditValue(field, entry?.from);
        const toStr = formatAuditValue(field, entry?.to);
        return { field, label, fromStr, toStr };
      });
  }

  if (action === 'DELETE' && before.status) {
    return [
      {
        field: 'status',
        label: 'Status',
        fromStr: formatTestRowStatusLabel(before.status),
        toStr: 'Archived',
      },
    ];
  }

  return [];
}

function formatFieldLabel(field) {
  /* eslint-disable camelcase -- API field names use snake_case */
  const labels = {
    status: 'Status',
    dat_step: 'DAT Step',
    oet_step: 'OET Step',
    updated_at: 'Updated',
    due_date: 'Due date',
    estimated_date: 'ETA',
    start_date: 'Start date',
    complete_date: 'Complete date',
    description: 'Description',
    priority: 'Priority',
    requestor: 'Requestor',
    assigned_tester_id: 'Assignee',
  };
  /* eslint-enable camelcase */
  return labels[field] || field.replace(/_/g, ' ');
}

const DATE_FIELDS = [
  'updated_at',
  'due_date',
  'estimated_date',
  'start_date',
  'complete_date',
  'created_at',
];

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, DATE_FORMAT);
}

/**
 * Title-case each token (matches `humanStep` in DetailsTestModal) — e.g. TESTING_READY → Testing Ready.
 */
function formatScreamingSnakeLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/**
 * Test/request row status — matches TestsAPI.normalizeStatus labels shown in the app.
 */
function formatTestRowStatusLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value).toUpperCase();
  const map = {
    NOT_STARTED: 'Not Started',
    DAT_IN_PROGRESS: 'DAT In Progress',
    OET_IN_PROGRESS: 'OET In Progress',
    IN_REVIEW: 'In Review',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
    ARCHIVED: 'Archived',
  };
  if (map[raw]) return map[raw];
  return formatScreamingSnakeLabel(value);
}

function formatAuditPriorityLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  return formatDisplayPriorityLabel(value);
}

function formatAuditValue(field, value) {
  if (value === null || value === undefined) return '—';
  if (field === 'status') return formatTestRowStatusLabel(value);
  if (field === 'dat_step' || field === 'oet_step') return formatScreamingSnakeLabel(value);
  if (field === 'priority') return formatAuditPriorityLabel(value);
  if (DATE_FIELDS.includes(field)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(undefined, DATE_FORMAT);
  }
  return String(value);
}
