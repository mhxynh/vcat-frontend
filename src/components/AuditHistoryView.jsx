import React, { useEffect, useState } from 'react';
import '../styles/components/AuditHistoryView.css';

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

  if (!showContent) {
    return <div className="ahv-empty">{statusMessage}</div>;
  }

  if (loading) {
    return <div className="ahv-empty">Loading history…</div>;
  }

  if (error) {
    return <div className="ahv-empty ahv-error">Error: {error}</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="ahv-empty">No history found.</div>;
  }

  const historyContent = (
    <div className="ahv-history">
      {logs.map((log) => {
        const changes = getAuditChanges(log);
        return (
          <div className="ahv-entry" key={log.audit_id}>
            <div className="ahv-header">
              <div className="ahv-avatar">{String(log.action || '?').slice(0, 1)}</div>
              <div className="ahv-meta">
                <span className="ahv-action">
                  {formatAuditAction(log, {
                    vgcpid:
                      log.vgcpid ??
                      contextVgcpid ??
                      (contextTestIdToVgcpid && log.entity_id != null
                        ? (contextTestIdToVgcpid[log.entity_id] ??
                          contextTestIdToVgcpid[String(log.entity_id)] ??
                          contextTestIdToVgcpid[Number(log.entity_id)])
                        : null),
                    requestId: contextRequestId,
                  })}
                </span>
                {log.actor_user_id != null && (
                  <span className="ahv-actor"> · User {log.actor_user_id}</span>
                )}
                <span className="ahv-date">{formatAuditDate(log.changed_at)}</span>
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
        fromStr: formatStatusValue(before.status),
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
    dat_step: 'DAT step',
    oet_step: 'OET step',
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

function formatAuditValue(field, value) {
  if (value === null || value === undefined) return '—';
  if (field === 'status') return formatStatusValue(value);
  const dateFields = [
    'updated_at',
    'due_date',
    'estimated_date',
    'start_date',
    'complete_date',
    'created_at',
  ];
  if (dateFields.includes(field)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }
  return String(value);
}

function formatStatusValue(v) {
  const s = String(v || '')
    .replace(/_/g, ' ')
    .toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

function formatAuditDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
