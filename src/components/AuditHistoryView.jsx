import React, { useEffect, useState } from 'react';
import '../styles/components/AuditHistoryView.css';

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
        return (
          <div className="ahv-entry" key={log.audit_id}>
            <div className="ahv-header">
              <div className="ahv-avatar">{String(log.action || '?').slice(0, 1)}</div>
              <div className="ahv-meta">
                <span className="ahv-action">
                  {formatAuditAction(log, { vgcpid, requestId: contextRequestId })}
                </span>
                {log.actor_user_id != null && (
                  <span className="ahv-actor"> · User {log.actor_user_id}</span>
                )}
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
              <button
                type="button"
                className="ahv-overlay-close"
                onClick={() => setShowExpanded(false)}
                aria-label="Close"
              >
                ×
              </button>
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

function formatPriorityLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value).toUpperCase();
  if (raw === 'CRITICAL') return 'Critical Priority';
  if (raw === 'HIGH') return 'High Priority';
  if (raw === 'MEDIUM') return 'Medium Priority';
  if (raw === 'LOW') return 'Low Priority';
  return formatScreamingSnakeLabel(value);
}

function formatAuditValue(field, value) {
  if (value === null || value === undefined) return '—';
  if (field === 'status') return formatTestRowStatusLabel(value);
  if (field === 'dat_step' || field === 'oet_step') return formatScreamingSnakeLabel(value);
  if (field === 'priority') return formatPriorityLabel(value);
  if (DATE_FIELDS.includes(field)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(undefined, DATE_FORMAT);
  }
  return String(value);
}
