import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/components/DetailsControlModal.css';
import { deleteControl } from '../api/ControlsAPI';
import {
  buildRequestHistoryForControl,
  fetchRequestById,
  fetchRequestsByIds,
  mapRequestRowToUi,
} from '../api/RequestsAPI';
import {
  fetchTestsByControlId,
  fetchTestsByRequestId,
  mapTestRowToRequestControlCard,
} from '../api/TestsAPI';
import EditControlModal from './EditControlModal';
import DetailsRequestModal from './DetailsRequestModal';
import ConfirmActionModal from './ConfirmActionModal';
import Icon from './common/Icon';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import RestrictedAction from './RestrictedAction';
import { ACTIONS } from '../auth';
import {
  ActionButton,
  Badge,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MetadataItem,
  Modal,
  ModalCloseButton,
  Panel,
} from './ui';

function formatDisplayDate(value) {
  if (!value || value === '-') return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

/** Request history: format once from raw API date; avoid reparsing localized `date` strings. */
function formatRequestHistoryTableDate(row) {
  if (row?.dateRaw != null && row.dateRaw !== '') {
    return formatDisplayDate(row.dateRaw);
  }
  if (!row?.date || row.date === '-') return '-';
  return row.date;
}

/** Numeric backend request_id for API calls; supports rows from fetch path or `control.requestHistory` fallback. */
function getHistoryRowRequestId(historyRow) {
  const keyValue = historyRow?.key;
  if (keyValue != null) {
    const numericKey = Number(keyValue);
    if (!Number.isNaN(numericKey)) return numericKey;
  }

  const requestIdValue = historyRow?.requestId;
  if (requestIdValue == null) return null;

  const normalized =
    typeof requestIdValue === 'string'
      ? requestIdValue.replace(/^REQ-/i, '').trim()
      : requestIdValue;
  const numericRequestId = Number(normalized);
  return Number.isNaN(numericRequestId) ? null : numericRequestId;
}

export default function DetailsControlModal({ isOpen, onClose, control, onDeleted, onUpdated }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);
  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);

  const [fetchedRequestHistory, setFetchedRequestHistory] = useState([]);
  const [requestHistoryLoading, setRequestHistoryLoading] = useState(false);
  const [requestHistoryError, setRequestHistoryError] = useState('');

  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetailsError, setRequestDetailsError] = useState('');
  const requestDetailsSeq = useRef(0);

  const closeDeleteConfirm = useCallback(() => {
    if (deleting) return;
    setIsDeleteConfirmOpen(false);
  }, [deleting]);

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isDeleteConfirmOpen) {
        closeDeleteConfirm();
        return;
      }
      if (isRequestDetailsOpen) {
        setIsRequestDetailsOpen(false);
        setSelectedRequest(null);
        setRequestDetailsError('');
        requestDetailsSeq.current += 1;
        return;
      }
      onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, isDeleteConfirmOpen, isRequestDetailsOpen, closeDeleteConfirm]);

  useEffect(() => {
    if (!isOpen) return;
    setDeleting(false);
  }, [isOpen, control]);

  useEffect(() => {
    if (!isOpen) {
      requestDetailsSeq.current += 1;
      setIsEditOpen(false);
      setIsDeleteConfirmOpen(false);
      setIsRequestDetailsOpen(false);
      setSelectedRequest(null);
      setRequestDetailsError('');
    }
  }, [isOpen]);

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
        const tests = await fetchTestsByControlId(control.controlId);
        if (cancelled) return;

        const ids = Array.from(
          new Set(
            (Array.isArray(tests) ? tests : [])
              .map((t) => t?.request_id)
              .filter((x) => x != null)
              .map((x) => Number(x))
              .filter((n) => !Number.isNaN(n))
          )
        );

        if (ids.length === 0) {
          setFetchedRequestHistory([]);
          return;
        }

        const requests = await fetchRequestsByIds(ids);
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
  const testing =
    control?.testing && control.testing !== 'Not Tested Yet'
      ? `Last Tested ${formatDisplayDate(control.testing)}`
      : (control?.testing ?? 'Not Tested Yet');
  const description = control?.description ?? 'No description yet.';
  const owner = control?.owner;
  const sme = control?.sme ?? '-';
  const dateCreated = formatDisplayDate(control?.dateCreated);
  const lastTested = formatDisplayDate(control?.lastTested);
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

  async function openRequestDetails(historyRow) {
    const requestId = getHistoryRowRequestId(historyRow);
    if (requestId == null) return;

    const seq = (requestDetailsSeq.current += 1);
    try {
      setRequestDetailsError('');

      const [rawRequest, rawTests] = await Promise.all([
        fetchRequestById(requestId),
        fetchTestsByRequestId(requestId, { details: true }),
      ]);

      if (seq !== requestDetailsSeq.current) return;

      const ui = mapRequestRowToUi(rawRequest || {});
      const controls = Array.isArray(rawTests) ? rawTests.map(mapTestRowToRequestControlCard) : [];

      setSelectedRequest({ ...ui, controls });
      setIsRequestDetailsOpen(true);
    } catch (e) {
      if (seq === requestDetailsSeq.current) {
        setRequestDetailsError(e?.message || 'Failed to open request details');
      }
    }
  }

  function closeRequestDetails() {
    requestDetailsSeq.current += 1;
    setIsRequestDetailsOpen(false);
    setSelectedRequest(null);
    setRequestDetailsError('');
  }

  async function handleDelete() {
    if (!id || deleting) return;

    try {
      setDeleting(true);

      await deleteControl(id, { hard: true });

      await onDeleted?.(id);

      showSuccessToast({
        title: 'Control Deleted',
        message: `${id} has been deleted successfully.`,
      });

      setIsDeleteConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to delete control';

      setIsDeleteConfirmOpen(false);

      showErrorToast({
        title: 'Control Delete Failed',
        message: `An error occurred while deleting the control: ${errorMessage}`,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Modal className="dcm-modal" overlayClassName="dcm-overlay" onClose={onClose}>
        <Modal.Section className="dcm-section-header">
          <div className="dcm-header">
            <div className="dcm-title">{id}</div>

            <ModalCloseButton className="dcm-close" onClick={onClose} />
          </div>

          <div className="dcm-status-row">
            <Badge tone={status === 'Active' ? 'active' : 'retired'}>{status}</Badge>
            <Badge tone="neutral">{testing}</Badge>
          </div>
        </Modal.Section>

        <Modal.Divider className="dcm-divider" />

        <Modal.Section className="dcm-section-description">
          <div className="dcm-section">
            <Modal.SectionTitle className="dcm-section-title">Description</Modal.SectionTitle>
            <div className="dcm-description">{description}</div>
          </div>
        </Modal.Section>

        <Modal.Section className="dcm-section-details">
          <Panel className="dcm-details-card" tone="subtle">
            <MetadataItem
              className="dcm-detail-item"
              labelClassName="dcm-detail-label"
              valueClassName="dcm-detail-value"
              label="Owner"
              value={owner}
            />
            <MetadataItem
              className="dcm-detail-item"
              labelClassName="dcm-detail-label"
              valueClassName="dcm-detail-value"
              label="SME"
              value={sme}
            />
            <MetadataItem
              className="dcm-detail-item"
              labelClassName="dcm-detail-label"
              valueClassName="dcm-detail-value"
              label="Date Created"
              value={dateCreated}
            />
            <MetadataItem
              className="dcm-detail-item"
              labelClassName="dcm-detail-label"
              valueClassName="dcm-detail-value"
              label="Last Tested"
              value={lastTested}
            />
            <MetadataItem
              className="dcm-detail-item dcm-detail-item--full"
              labelClassName="dcm-detail-label"
              valueClassName="dcm-detail-value"
              label="Escalation"
              value={escalationRequired}
            />
          </Panel>
        </Modal.Section>

        <Modal.Divider className="dcm-divider" />

        <Modal.Section className="dcm-section-request-history">
          <div className="dcm-section">
            <Modal.SectionTitle
              className="dcm-section-title dcm-section-title--withicon"
              icon={<Icon name="documents" category="deco" className="dcm-icon--doc" />}
            >
              Request History
            </Modal.SectionTitle>

            <DataTable.Wrap className="dcm-request-table-wrap">
              {requestHistoryError ? (
                <ErrorState className="dcm-empty" prefix="">
                  {requestHistoryError}
                </ErrorState>
              ) : requestHistoryLoading ? (
                <LoadingState className="dcm-empty">Loading request history…</LoadingState>
              ) : requestHistory.length === 0 ? (
                <EmptyState className="dcm-empty">No request history found.</EmptyState>
              ) : (
                <DataTable className="dcm-request-table">
                  <DataTable.Head>
                    <DataTable.Row>
                      <DataTable.HeaderCell>Request ID</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Date</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Requester</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Status</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Description</DataTable.HeaderCell>
                    </DataTable.Row>
                  </DataTable.Head>
                  <DataTable.Body>
                    {requestHistory.map((r) => (
                      <DataTable.Row key={r.key ?? r.requestId}>
                        <DataTable.Cell className="dcm-request-id">
                          {getHistoryRowRequestId(r) != null ? (
                            <button
                              type="button"
                              className="dcm-link"
                              onClick={() => openRequestDetails(r)}
                              title="Open request details"
                            >
                              {r.requestId}
                            </button>
                          ) : (
                            <span>{r.requestId}</span>
                          )}
                        </DataTable.Cell>
                        <DataTable.Cell>{formatRequestHistoryTableDate(r)}</DataTable.Cell>
                        <DataTable.Cell>{r.requester ?? '-'}</DataTable.Cell>
                        <DataTable.Cell>
                          <span
                            className={`dcm-request-status-badge ${requestStatusBadgeClass(
                              r.status
                            )}`}
                          >
                            {r.status ?? '-'}
                          </span>
                        </DataTable.Cell>
                        <DataTable.Cell>{r.description ?? '-'}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable.Body>
                </DataTable>
              )}
            </DataTable.Wrap>
            {requestDetailsError ? (
              <ErrorState
                className="dcm-empty"
                prefix=""
                style={{ paddingLeft: 0, paddingRight: 0 }}
              >
                {requestDetailsError}
              </ErrorState>
            ) : null}
          </div>
        </Modal.Section>

        <Modal.Divider className="dcm-divider" />

        <Modal.Section className="dcm-section-logs">
          <div className="dcm-section">
            <Modal.SectionTitle
              className="dcm-section-title dcm-section-title--withicon"
              icon={<Icon name="history" category="deco" />}
            >
              History & Logs
            </Modal.SectionTitle>

            {logs.length === 0 ? (
              <EmptyState className="dcm-empty">No logs found.</EmptyState>
            ) : (
              <div className="dcm-logs">
                {logs.map((log, idx) => (
                  <div className="dcm-log-item" key={`${log.title}-${idx}`}>
                    <div className="dcm-log-dot" aria-hidden="true" />
                    <div className="dcm-log-content">
                      <div className="dcm-log-top">
                        <div className="dcm-log-title">{log.title}</div>
                        <div className="dcm-log-date">{formatDisplayDate(log.date ?? '')}</div>
                      </div>
                      {log.subtitle && <div className="dcm-log-subtitle">{log.subtitle}</div>}
                      {log.actor && <div className="dcm-log-actor">by {log.actor}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Section>

        <Modal.Section className="dcm-section-footer">
          <div className="dcm-footer">
            <button className="dcm-btn dcm-btn--ghost" type="button" onClick={onClose}>
              Close
            </button>

            <div className="dcm-footer-right">
              <div
                onClick={(e) => {
                  const blockedWrapper = e.target.closest('.restricted-action--blocked');
                  if (blockedWrapper) {
                    e.preventDefault();
                    e.stopPropagation();
                    showPermissionDeniedToast();
                  }
                }}
              >
                <RestrictedAction action={ACTIONS.DELETE_CONTROL_HARD}>
                  <ActionButton
                    className="dcm-btn dcm-btn--outline"
                    variant="cancel"
                    type="button"
                    onClick={openDeleteConfirm}
                    disabled={deleting || !id}
                    title={!id ? 'No control selected' : 'Delete this control'}
                  >
                    Delete Control
                  </ActionButton>
                </RestrictedAction>
              </div>

              <ActionButton
                className="dcm-btn dcm-btn--primary"
                type="button"
                onClick={openEdit}
                disabled={!control?.id}
              >
                Edit Control
              </ActionButton>
            </div>
          </div>
        </Modal.Section>
      </Modal>

      <ConfirmActionModal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Control?"
        message="Are you sure you want to permanently delete this control?"
        itemName={id}
        warning="Deleted controls will be permanently removed and cannot be recovered."
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        confirmDisabled={deleting}
      />

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
