import React, { useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsRequestModal.css';
import EditRequestModal from './EditRequestModal';
import { deleteRequest, fetchRequestById, mapRequestRowToUi } from '../api/RequestsAPI';
import { fetchTestsByRequestId, mapTestRowToRequestControlCard } from '../api/TestsAPI';

export default function DetailsRequestModal({
  isOpen,
  onClose,
  request,
  onUpdated,
  onDeleted,
  onArchived,
}) {
  const [activeTab, setActiveTab] = useState('Comments');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [localRequest, setLocalRequest] = useState(request || null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [localStatus, setLocalStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setIsEditOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('Comments');
    setCommentText('');
    setLocalRequest(request || null);
    setLocalComments(Array.isArray(request?.comments) ? request.comments : []);
    setArchiving(false);
    setDeleting(false);
    setDeleteError('');
    setLocalStatus(null);
  }, [isOpen, request]);

  const controls = useMemo(() => {
    return Array.isArray(localRequest?.controls) ? localRequest.controls : [];
  }, [localRequest?.controls]);

  const progress = useMemo(() => {
    const total = controls.length;
    const completed = controls.filter((c) => String(c.status) === 'Completed').length;
    return { completed, total };
  }, [controls]);

  if (!isOpen) return null;

  const requestTitle = localRequest?.id ?? 'Request Details';
  const backendStatus = localRequest?.status ?? 'NOT_STARTED';
  const status = localStatus ?? backendStatus;

  const priority = localRequest?.priority ?? 'MEDIUM';
  const description = localRequest?.description ?? 'No description.';
  const requestedBy = localRequest?.requestedBy ?? localRequest?.requestor ?? '-';
  const requestDate = localRequest?.requestDate ?? '-';
  const dueDate = localRequest?.dueDate ?? '-';

  const requestId = localRequest?.requestId ?? request?.requestId;

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

  async function refreshLocalRequest() {
    const rid = requestId;
    if (rid == null) return;
    try {
      const raw = await fetchRequestById(rid);
      const ui = mapRequestRowToUi(raw);

      let items = [];
      try {
        const rows = await fetchTestsByRequestId(rid, { details: true });
        items = Array.isArray(rows) ? rows.map(mapTestRowToRequestControlCard) : [];
      } catch (e) {
        console.warn('Failed to refresh tests for request', rid, e);
      }

      setLocalRequest({ ...ui, controls: items });
      setLocalComments(Array.isArray(ui.comments) ? ui.comments : []);

      try {
        onUpdated?.(rid, ui, items);
      } catch (e) {
        console.warn('Parent onUpdated handler failed', e);
      }
    } catch (e) {
      console.warn('Failed to refresh request', requestId, e);
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

            {activeTab === 'History' ? <div className="drm-empty">No history found.</div> : null}
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
                onClick={openEdit}
                disabled={!requestId}
              >
                Edit Request
              </button>
            </div>
          </div>

          {deleteError ? <div className="drm-delete-error">Error: {deleteError}</div> : null}
        </section>
      </div>

      <EditRequestModal
        isOpen={isEditOpen}
        onClose={closeEdit}
        requestId={requestId}
        onUpdated={async () => {
          await refreshLocalRequest();
          closeEdit();
        }}
      />
    </div>
  );
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
