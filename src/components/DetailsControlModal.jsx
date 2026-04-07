import React, { useEffect, useLayoutEffect, useState } from 'react';
import '../styles/components/DetailsControlModal.css';
import { deleteControl } from '../api/ControlsAPI';
import {
  buildRequestHistoryForControl,
  fetchRequestById,
  fetchRequests,
  mapRequestRowToUi,
} from '../api/RequestsAPI';
import {
  fetchTestsByControlId,
  fetchTestsByRequestId,
  mapTestRowToRequestControlCard,
} from '../api/TestsAPI';
import EditControlModal from './EditControlModal';
import DetailsRequestModal from './DetailsRequestModal';

export default function DetailsControlModal({ isOpen, onClose, control, onDeleted, onUpdated }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);
  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);
  const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDeleteConfirmOpen) closeDeleteConfirm();
        else onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, isDeleteConfirmOpen]);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [fetchedRequestHistory, setFetchedRequestHistory] = useState([]);
  const [requestHistoryLoading, setRequestHistoryLoading] = useState(false);
  const [requestHistoryError, setRequestHistoryError] = useState('');

  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetailsError, setRequestDetailsError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDeleting(false);
    setDeleteError('');
  }, [isOpen, control]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditOpen(false);
      setIsDeleteConfirmOpen(false);
      setIsRequestDetailsOpen(false);
      setSelectedRequest(null);
      setRequestDetailsError('');
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && control?.controlId != null) {
      setRequestHistoryLoading(true);
    }
  }, [isOpen, control?.controlId]);

  useEffect(() => {
    if (!isOpen || control?.controlId == null) {
      setFetchedRequestHistory([]);
      setRequestHistoryLoading(false);
      setRequestHistoryError('');
      return;
    }

    let cancelled = false;

    async function loadRequestHistory() {
      setRequestHistoryLoading(true);
      setRequestHistoryError('');
      try {
        const [tests, requests] = await Promise.all([
          fetchTestsByControlId(control.controlId),
          fetchRequests(),
        ]);
        if (cancelled) return;
        setFetchedRequestHistory(buildRequestHistoryForControl(tests, requests));
      } catch (e) {
        if (!cancelled) {
          setFetchedRequestHistory([]);
          setRequestHistoryError(e?.message || 'Failed to load request history');
        }
      } finally {
        if (!cancelled) setRequestHistoryLoading(false);
      }
    }

    loadRequestHistory();
    return () => {
      cancelled = true;
    };
  }, [isOpen, control?.controlId]);

  if (!isOpen) return null;

  const id = control?.id ?? '';
  const status = control?.status ?? 'Active';
  const testing = control?.testing ?? 'Not Tested Yet';
  const description = control?.description ?? 'No description yet.';

  const owner = control?.owner;
  const sme = control?.sme ?? '-';
  const dateCreated = control?.dateCreated ?? '-';
  const lastTested = control?.lastTested ?? '-';
  const escalationRequired = control?.escalationRequired ?? '-';

  const requestHistory =
    control?.controlId != null
      ? fetchedRequestHistory
      : Array.isArray(control?.requestHistory)
        ? control.requestHistory
        : [];
  const logs =
    (Array.isArray(control?.logs) && control.logs) ||
    (Array.isArray(control?.historyLogs) && control.historyLogs) ||
    [];

  const stop = (e) => e.stopPropagation();

  async function openRequestDetails(historyRow) {
    const rid = historyRow?.key ?? null;
    if (rid == null) return;

    try {
      setRequestDetailsError('');
      const requestId = Number(rid);
      if (Number.isNaN(requestId)) throw new Error('Invalid request id');

      const [rawRequest, rawTests] = await Promise.all([
        fetchRequestById(requestId),
        fetchTestsByRequestId(requestId, { details: true }),
      ]);

      const ui = mapRequestRowToUi(rawRequest || {});
      const controls = Array.isArray(rawTests) ? rawTests.map(mapTestRowToRequestControlCard) : [];

      setSelectedRequest({ ...ui, controls });
      setIsRequestDetailsOpen(true);
    } catch (e) {
      setRequestDetailsError(e?.message || 'Failed to open request details');
    }
  }

  function closeRequestDetails() {
    setIsRequestDetailsOpen(false);
    setSelectedRequest(null);
  }

  async function handleDelete() {
    if (!id) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteControl(id, { hard: true });

      onDeleted?.(id);
      onClose?.();
    } catch (e) {
      setDeleteError(e?.message || 'Failed to delete control');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="dcm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
        <div className="dcm-modal" onMouseDown={stop}>
          {/* header */}
          <section className="dcm-section-header">
            <div className="dcm-header">
              <div className="dcm-title">{id}</div>

              <button className="dcm-close" type="button" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="dcm-status-row">
              <span className={`badge ${status === 'Active' ? 'badge--active' : 'badge--retired'}`}>
                {status}
              </span>
              <span className="badge badge--neutral">{testing}</span>
            </div>
          </section>

          <div className="dcm-divider" />

          {/* descriptions */}
          <section className="dcm-section-description">
            <div className="dcm-section">
              <div className="dcm-section-title">Description</div>
              <div className="dcm-description">{description}</div>
            </div>
          </section>

          {/* details */}
          <section className="dcm-section-details">
            <div className="dcm-details-card">
              <div className="dcm-detail-item">
                <div className="dcm-detail-label">Owner</div>
                <div className="dcm-detail-value">{owner}</div>
              </div>

              <div className="dcm-detail-item">
                <div className="dcm-detail-label">SME</div>
                <div className="dcm-detail-value">{sme}</div>
              </div>

              <div className="dcm-detail-item">
                <div className="dcm-detail-label">Date Created</div>
                <div className="dcm-detail-value">{dateCreated}</div>
              </div>

              <div className="dcm-detail-item">
                <div className="dcm-detail-label">Last Tested</div>
                <div className="dcm-detail-value">{lastTested}</div>
              </div>

              <div className="dcm-detail-item dcm-detail-item--full">
                <div className="dcm-detail-label">Escalation</div>
                <div className="dcm-detail-value">{escalationRequired}</div>
              </div>
            </div>
          </section>

          <div className="dcm-divider" />

          {/* request history */}
          <section className="dcm-section-request-history">
            <div className="dcm-section">
              <div className="dcm-section-title dcm-section-title--withicon">
                <span className="dcm-icon dcm-icon--doc" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 3.75h7.25L18.25 7.75V20.25c0 .966-.784 1.75-1.75 1.75H7c-.966 0-1.75-.784-1.75-1.75V5.5c0-.966.784-1.75 1.75-1.75Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.25 3.75V7c0 .966.784 1.75 1.75 1.75h2.25"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.25 11h7.5M8.25 14.5h7.5M8.25 18h5.25"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Request History
              </div>

              <div className="dcm-request-table-wrap">
                {requestHistoryError ? (
                  <div className="dcm-empty">{requestHistoryError}</div>
                ) : requestHistoryLoading ? (
                  <div className="dcm-empty">Loading request history…</div>
                ) : requestHistory.length === 0 ? (
                  <div className="dcm-empty">No request history found.</div>
                ) : (
                  <table className="dcm-request-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Date</th>
                        <th>Requester</th>
                        <th>Status</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestHistory.map((r) => (
                        <tr key={r.key ?? r.requestId}>
                          <td className="dcm-request-id">
                            <button
                              type="button"
                              className="dcm-link"
                              onClick={() => openRequestDetails(r)}
                              title="Open request details"
                            >
                              {r.requestId}
                            </button>
                          </td>
                          <td>{r.date ?? '-'}</td>
                          <td>{r.requester ?? '-'}</td>
                          <td>
                            <span
                              className={`dcm-request-status-badge ${requestStatusBadgeClass(
                                r.status
                              )}`}
                            >
                              {r.status ?? '-'}
                            </span>
                          </td>
                          <td>{r.description ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {requestDetailsError ? (
                <div className="dcm-empty" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  {requestDetailsError}
                </div>
              ) : null}
            </div>
          </section>

          <div className="dcm-divider" />

          {/* logs */}
          <section className="dcm-section-logs">
            <div className="dcm-section">
              <div className="dcm-section-title dcm-section-title--withicon">
                <span className="dcm-icon" aria-hidden="true">
                  🕘
                </span>
                Logs
              </div>

              {logs.length === 0 ? (
                <div className="dcm-empty">No logs found.</div>
              ) : (
                <div className="dcm-logs">
                  {logs.map((log, idx) => (
                    <div className="dcm-log-item" key={`${log.title}-${idx}`}>
                      <div className="dcm-log-dot" aria-hidden="true" />
                      <div className="dcm-log-content">
                        <div className="dcm-log-top">
                          <div className="dcm-log-title">{log.title}</div>
                          <div className="dcm-log-date">{log.date ?? ''}</div>
                        </div>
                        {log.subtitle && <div className="dcm-log-subtitle">{log.subtitle}</div>}
                        {log.actor && <div className="dcm-log-actor">by {log.actor}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* footer buttons */}
          <section className="dcm-section-footer">
            <div className="dcm-footer">
              <button className="dcm-btn dcm-btn--ghost" type="button" onClick={onClose}>
                Close
              </button>

              <div className="dcm-footer-right">
                <button
                  className="dcm-btn dcm-btn--outline"
                  type="button"
                  onClick={openDeleteConfirm}
                  disabled={deleting || !id}
                  title={!id ? 'No control selected' : 'Delete this control'}
                >
                  {deleting ? 'Deleting…' : 'Delete Control'}
                </button>

                <button
                  className="dcm-btn dcm-btn--primary"
                  type="button"
                  onClick={openEdit}
                  disabled={!control?.id}
                >
                  Edit Control
                </button>
              </div>
            </div>

            {deleteError ? <div className="dcm-delete-error">Error: {deleteError}</div> : null}
          </section>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {isDeleteConfirmOpen && (
        <div
          className="dcm-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dcm-confirm-title"
          onMouseDown={(e) => e.target === e.currentTarget && closeDeleteConfirm()}
        >
          <div className="dcm-confirm-modal" onMouseDown={stop}>
            <h2 id="dcm-confirm-title" className="dcm-confirm-title">
              Delete Control?
            </h2>
            <div className="dcm-confirm-message">
              <p className="dcm-confirm-question">
                Are you sure you want to{' '}
                <strong className="dcm-confirm-bold-black">permanently delete</strong> control?
              </p>
              <p className="dcm-confirm-id">{id}</p>
              <p className="dcm-confirm-warning">
                <strong>This will hard-delete it from the database and cannot be undone.</strong>
              </p>
            </div>
            <div className="dcm-confirm-actions">
              <button
                type="button"
                className="dcm-confirm-btn dcm-confirm-btn--cancel"
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dcm-confirm-btn dcm-confirm-btn--delete"
                onClick={async () => {
                  closeDeleteConfirm();
                  await handleDelete();
                }}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal is mounted by details modal */}
      <EditControlModal
        isOpen={isEditOpen}
        onClose={closeEdit}
        control={control}
        onUpdated={async () => {
          await onUpdated?.();
          closeEdit();
          onClose?.();
        }}
      />

      <DetailsRequestModal
        isOpen={isRequestDetailsOpen}
        onClose={closeRequestDetails}
        request={selectedRequest}
        onUpdated={() => {
          // keep as no-op for now; request modal self-refreshes on edits
        }}
      />
    </>
  );
}

function requestStatusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return 'dcm-request-status-badge--good';
  if (s.includes('pending') || s.includes('progress') || s.includes('review'))
    return 'dcm-request-status-badge--warn';
  if (s.includes('block')) return 'dcm-request-status-badge--bad';
  return 'dcm-request-status-badge--neutral';
}
