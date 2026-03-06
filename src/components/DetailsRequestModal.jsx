import React, { useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsRequestModal.css';
import { deleteRequest } from '../api/RequestsAPI';
import { fetchAuditLogsByRequestId } from '../api/AuditAPI';

export default function DetailsRequestModal({ isOpen, onClose, request, onDeleted, onArchived }) {
  const [activeTab, setActiveTab] = useState('Comments');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);

  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [localStatus, setLocalStatus] = useState(null);

  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('Comments');
    setCommentText('');
    setLocalComments(Array.isArray(request?.comments) ? request.comments : []);
    setArchiving(false);
    setDeleting(false);
    setDeleteError('');
    setLocalStatus(null);
    setHistoryLogs([]);
    setHistoryError('');
  }, [isOpen, request]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'History' || !request?.requestId) return;

    const status = String(localStatus ?? request?.status ?? '').toUpperCase();
    if (status !== 'IN_PROGRESS' && status !== 'COMPLETED') {
      setHistoryLogs([]);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');

    fetchAuditLogsByRequestId({ requestId: request.requestId })
      .then((logs) => {
        if (!cancelled) setHistoryLogs(logs);
      })
      .catch((e) => {
        if (!cancelled) setHistoryError(e?.message || 'Failed to load history');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, request?.requestId, request?.status, localStatus]);

  const controls = useMemo(() => {
    return Array.isArray(request?.controls) ? request.controls : [];
  }, [request?.controls]);

  const progress = useMemo(() => {
    const total = controls.length;
    const completed = controls.filter((c) => String(c.status) === 'Completed').length;
    return { completed, total };
  }, [controls]);

  if (!isOpen) return null;

  const requestTitle = request?.id ?? 'Request Details';
  const backendStatus = request?.status ?? 'NOT_STARTED';
  const status = localStatus ?? backendStatus;

  const priority = request?.priority ?? 'MEDIUM';
  const description = request?.description ?? 'No description.';
  const requestedBy = request?.requestedBy ?? request?.requestor ?? '-';
  const requestDate = request?.requestDate ?? '-';
  const dueDate = request?.dueDate ?? '-';

  const requestId = request?.requestId;

  const stop = (e) => e.stopPropagation();

  function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: `local-${Date.now()}`,
      author: 'You',
      text,
      date: new Date().toLocaleString(),
    };

    setLocalComments((prev) => [newComment, ...prev]);
    setCommentText('');
  }

  async function handleArchiveRequest() {
    if (requestId == null) return;

    const ok = window.confirm(
      `Archive request ${requestTitle}?\n\nThis will set status to ARCHIVED.`
    );
    if (!ok) return;

    try {
      setArchiving(true);
      setDeleteError('');

      await deleteRequest(requestId, { hard: false });

      setLocalStatus('ARCHIVED');

      onArchived?.(requestId);

      onClose?.();
    } catch (e) {
      setDeleteError(e?.message || 'Failed to archive request');
    } finally {
      setArchiving(false);
    }
  }

  async function handleHardDeleteRequest() {
    if (requestId == null) return;

    const ok = window.confirm(
      `Hard delete request ${requestTitle}?\n\nThis is permanent and cannot be undone.`
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteRequest(requestId, { hard: true });

      onDeleted?.(requestId);
      onClose?.();
    } catch (e) {
      setDeleteError(e?.message || 'Failed to delete request');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="drm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="drm-modal" onMouseDown={stop}>
        {/* header */}
        <section className="drm-section-header">
          <div className="drm-header">
            <div className="drm-title">Request Details: {requestTitle}</div>
            <button className="drm-close" type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </section>

        <div className="drm-divider" />

        {/* status bar */}
        <section className="drm-section-statusbar">
          <div className="drm-statusbar">
            <span className={`drm-pill ${priorityBadgeClass(priority)}`}>
              {formatPriority(priority)}
            </span>

            <div className="drm-statusbar-mid">
              <span className="drm-status-label">Status:</span>
              <span className={`drm-pill ${statusBadgeClass(status)}`}>{formatStatus(status)}</span>
            </div>

            <div className="drm-statusbar-right">
              <span className="drm-progress">
                {progress.completed} / {progress.total}
              </span>
              <span className="drm-progress-label">Controls Completed</span>
            </div>
          </div>
        </section>

        <div className="drm-divider" />

        {/* description + details */}
        <section className="drm-section-description-details">
          <div className="drm-section">
            <div className="drm-section-title">Description</div>
            <div className="drm-description">{description}</div>

            <div className="drm-details-card">
              <div className="drm-detail-item">
                <div className="drm-detail-label">Requested By</div>
                <div className="drm-detail-value">{requestedBy}</div>
              </div>

              <div className="drm-detail-item">
                <div className="drm-detail-label">Priority Level</div>
                <div className="drm-detail-value">{formatPriority(priority)}</div>
              </div>

              <div className="drm-detail-item">
                <div className="drm-detail-label">Request Date</div>
                <div className="drm-detail-value">{requestDate}</div>
              </div>

              <div className="drm-detail-item">
                <div className="drm-detail-label">Due Date</div>
                <div className="drm-detail-value drm-date-warn">{dueDate}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="drm-divider" />

        {/* associated controls/tests */}
        <section className="drm-section-associated">
          <div className="drm-section">
            <div className="drm-section-title drm-section-title--withicon">
              <span className="drm-icon" aria-hidden="true">
                ✓
              </span>
              Associated Controls ({controls.length})
            </div>

            {controls.length === 0 ? (
              <div className="drm-empty">No tests found for this request.</div>
            ) : (
              <div className="drm-table-wrap">
                <table className="drm-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map((c) => (
                      <tr key={c.id}>
                        <td className="drm-mono">{c.id}</td>
                        <td>{c.title ?? '-'}</td>
                        <td>
                          <span className={`drm-pill ${testStatusBadgeClass(c.status)}`}>
                            {c.status ?? '-'}
                          </span>
                        </td>
                        <td>{c.assignee ?? '-'}</td>
                        <td>{c.eta ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="drm-divider" />

        {/* comments/history tabs */}
        <section className="drm-section-tabs">
          <div className="drm-tabs">
            <button
              type="button"
              className={`drm-tab ${activeTab === 'Comments' ? 'drm-tab--active' : ''}`}
              onClick={() => setActiveTab('Comments')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`drm-tab ${activeTab === 'History' ? 'drm-tab--active' : ''}`}
              onClick={() => setActiveTab('History')}
            >
              History
            </button>
          </div>

          <div className="drm-tab-content">
            {activeTab === 'Comments' ? (
              <div className="drm-comments">
                {localComments.length === 0 ? (
                  <div className="drm-empty">No comments found.</div>
                ) : (
                  localComments.map((c) => (
                    <div className="drm-comment" key={c.id}>
                      <div className="drm-comment-left">
                        <div className="drm-avatar" aria-hidden="true">
                          {String(c.author || '?')
                            .trim()
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      </div>

                      <div className="drm-comment-main">
                        <div className="drm-comment-top">
                          <div className="drm-comment-author">{c.author ?? '-'}</div>
                          <div className="drm-comment-date">{c.date ?? ''}</div>
                        </div>
                        <div className="drm-comment-text">{c.text ?? ''}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === 'History' ? (
              <HistoryTabContent
                status={status}
                logs={historyLogs}
                loading={historyLoading}
                error={historyError}
              />
            ) : null}
          </div>
        </section>

        {/* add comment */}
        {activeTab === 'Comments' ? (
          <section className="drm-section-addcomment">
            <div className="drm-addcomment">
              <input
                className="drm-comment-input"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                }}
              />
              <button
                className="drm-send"
                type="button"
                onClick={handleAddComment}
                aria-label="Send"
              >
                ➤
              </button>
            </div>
          </section>
        ) : null}

        <div className="drm-divider" />

        {/* footer */}
        <section className="drm-section-footer">
          <div className="drm-footer">
            <button className="drm-btn drm-btn--ghost" type="button" onClick={onClose}>
              Close
            </button>

            <div className="drm-footer-right">
              <button
                className="drm-btn drm-btn--outline"
                type="button"
                onClick={handleArchiveRequest}
                disabled={archiving || deleting || requestId == null}
                title={requestId == null ? 'No request selected' : 'Archive this request'}
              >
                {archiving ? 'Archiving…' : 'Archive Request'}
              </button>

              <button
                className="drm-btn drm-btn--outline"
                type="button"
                onClick={handleHardDeleteRequest}
                disabled={deleting || archiving || requestId == null}
                title={
                  requestId == null ? 'No request selected' : 'Permanently delete this request'
                }
              >
                {deleting ? 'Deleting…' : 'Delete Request'}
              </button>

              <button
                className="drm-btn drm-btn--primary"
                type="button"
                onClick={() => alert('Edit (TODO)')}
              >
                Edit Request
              </button>
            </div>
          </div>

          {deleteError ? <div className="drm-delete-error">Error: {deleteError}</div> : null}
        </section>
      </div>
    </div>
  );
}

function HistoryTabContent({ status, logs, loading, error }) {
  const s = String(status || '').toUpperCase();
  const showHistory = s === 'IN_PROGRESS' || s === 'COMPLETED';

  if (!showHistory) {
    return (
      <div className="drm-empty">
        History is available when the request is in progress or completed.
      </div>
    );
  }

  if (loading) {
    return <div className="drm-empty">Loading history…</div>;
  }

  if (error) {
    return <div className="drm-empty drm-delete-error">Error: {error}</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="drm-empty">No history found.</div>;
  }

  return (
    <div className="drm-history">
      {logs.map((log) => {
        const changes = getAuditChanges(log);
        return (
          <div className="drm-history-entry" key={log.audit_id}>
            <div className="drm-history-header">
              <div className="drm-history-avatar">
                {String(log.action || '?').slice(0, 1)}
              </div>
              <div className="drm-history-meta">
                <span className="drm-history-action">{formatAuditAction(log)}</span>
                {log.actor_user_id != null && (
                  <span className="drm-history-actor"> · User {log.actor_user_id}</span>
                )}
                <span className="drm-history-date">{formatAuditDate(log.changed_at)}</span>
              </div>
            </div>
            {changes.length > 0 && (
              <div className="drm-history-changes">
                {changes.map((c) => (
                  <div className="drm-history-row" key={c.field}>
                    <div className="drm-history-cell">
                      <span className="drm-history-cell-label">What was updated</span>
                      <span className="drm-history-cell-value">{c.label}</span>
                    </div>
                    <div className="drm-history-cell">
                      <span className="drm-history-cell-label">Before</span>
                      <span className="drm-history-cell-value">{c.fromStr}</span>
                    </div>
                    <div className="drm-history-cell">
                      <span className="drm-history-cell-label">After</span>
                      <span className="drm-history-cell-value">{c.toStr}</span>
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
}

function formatAuditAction(log) {
  const action = String(log.action || '').toUpperCase();
  const entity = String(log.entity_type || '').toUpperCase();
  if (entity === 'REQUEST') {
    if (action === 'CREATE') return 'Request created';
    if (action === 'UPDATE') return 'Request updated';
    if (action === 'DELETE') return 'Request archived';
  }
  if (entity === 'TEST') {
    if (action === 'CREATE') return 'Test created';
    if (action === 'UPDATE') return 'Test updated';
    if (action === 'DELETE') return 'Test archived';
  }
  return `${entity} ${action}`;
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
  return labels[field] || field.replace(/_/g, ' ');
}

function formatAuditValue(field, value) {
  if (value === null || value === undefined) return '—';
  if (field === 'status') return formatStatusValue(value);
  const dateFields = ['updated_at', 'due_date', 'estimated_date', 'start_date', 'complete_date', 'created_at'];
  if (dateFields.includes(field)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

/* helpers */
function formatStatus(s) {
  const v = String(s || '')
    .replaceAll('_', ' ')
    .toLowerCase();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '-';
}

function formatPriority(p) {
  const v = String(p || '').toUpperCase();
  if (v === 'CRITICAL') return 'Critical Priority';
  if (v === 'HIGH') return 'High Priority';
  if (v === 'MEDIUM') return 'Medium Priority';
  if (v === 'LOW') return 'Low Priority';
  return 'Medium Priority';
}

function statusBadgeClass(status) {
  const v = String(status || '').toUpperCase();
  if (v === 'COMPLETED') return 'drm-pill--good';
  if (v === 'IN_PROGRESS') return 'drm-pill--info';
  if (v === 'BLOCKED') return 'drm-pill--bad';
  if (v === 'ARCHIVED') return 'drm-pill--neutral';
  return 'drm-pill--neutral';
}

function priorityBadgeClass(priority) {
  const v = String(priority || '').toUpperCase();
  if (v === 'LOW') return 'drm-pill--low';
  if (v === 'MEDIUM') return 'drm-pill--medium';
  if (v === 'HIGH') return 'drm-pill--high';
  if (v === 'CRITICAL') return 'drm-pill--critical';
  return 'drm-pill--medium';
}

function testStatusBadgeClass(status) {
  const low = String(status || '').toLowerCase();
  if (low.includes('complete')) return 'drm-pill--good';
  if (low.includes('progress') || low.includes('review')) return 'drm-pill--info';
  if (low.includes('block')) return 'drm-pill--bad';
  return 'drm-pill--neutral';
}
