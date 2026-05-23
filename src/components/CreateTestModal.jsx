import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/components/CreateTestModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchRequests } from '../api/RequestsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { createTest } from '../api/TestsAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { formatRequestDisplayId } from '../utils/requestDisplayId';
import { createRefreshHandlers } from '../utils/modalRefresh';
import { ActionButton } from './ui';

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requiresDat: true, requiresOet: false };
  if (v === 'OET Only') return { requiresDat: false, requiresOet: true };
  if (v === 'DAT & OET') return { requiresDat: true, requiresOet: true };
  return { requiresDat: false, requiresOet: false };
}

function isNetworkFetchError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = String(error.message || '').trim();

  if (error instanceof TypeError) {
    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage === 'failed to fetch' ||
      normalizedMessage.startsWith('failed to fetch ') ||
      normalizedMessage.includes('networkerror')
    );
  }

  return message.includes('NetworkError');
}

export default function CreateTestModal({ isOpen, onClose, onCreated, defaultRequestId }) {
  const [controls, setControls] = useState([]);
  const [requests, setRequests] = useState([]);
  const [testers, setTesters] = useState([]);

  const [selectedVgcpid, setSelectedVgcpid] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [testType, setTestType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { refreshAndClose } = createRefreshHandlers({
    parentRefresh: onCreated,
    close: onClose,
  });

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const handleClose = useCallback(() => {
    if (submittingRef.current) return;
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setLoadError('');
    setFieldErrors({});
    setSelectedVgcpid('');
    setSelectedRequestId('');
    setSelectedTesterId('');
    setTestType('');
    setDueDate('');
    setEtaDate('');
    setDescription('');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    const loadData = async () => {
      setLoading(true);
      try {
        const [rawControls, rawRequests, rawUsers] = await Promise.all([
          fetchControls(),
          fetchRequests(),
          fetchUsers({ isActive: true }),
        ]);

        const cleanControls = (Array.isArray(rawControls) ? rawControls : [])
          .map((c) => {
            const id = Number(c.id ?? c.controlId ?? c.control_id ?? c.ControlID ?? c.control_id);
            const vgcpid =
              c.vgcpid ??
              c.vgcpId ??
              c.vgcp_id ??
              c.VGCPID ??
              (Number.isFinite(id) ? `CONTROL-${id}` : 'UNKNOWN');
            return { id, vgcpid };
          })
          .filter((c) => Number.isFinite(c.id))
          .sort((a, b) => String(a.vgcpid).localeCompare(String(b.vgcpid)));

        const toDateInput = (v) => {
          if (!v) return '';
          const s = typeof v === 'string' ? v.split('T')[0] : String(v).split('T')[0];
          return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
        };

        const cleanRequests = (Array.isArray(rawRequests) ? rawRequests : [])
          .map((r) => {
            const id = Number(r.id ?? r.requestId ?? r.request_id ?? r.RequestId);
            const createdAt = r.start_date ?? r.created_at ?? r.createdAt ?? r.startDate ?? null;
            const dueDateRaw = r.due_date ?? r.dueDate;
            const dueDateDisplay = dueDateRaw
              ? new Date(dueDateRaw).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-';
            const requester = r.requestor ?? r.requester ?? r.requestedBy ?? '-';
            return {
              id,
              label: `${formatRequestDisplayId(id, createdAt)} • ${requester} • ${dueDateDisplay}`,
              dueDate: toDateInput(dueDateRaw),
            };
          })
          .filter((r) => Number.isFinite(r.id))
          .sort((a, b) => b.id - a.id);

        const cleanTesters = (Array.isArray(rawUsers) ? rawUsers : [])
          .map((u) => ({
            id: Number(u.id || u.user_id || u.userId),
            name: u.displayName || u.email || `User ${u.id || u.userId}`,
          }))
          .filter((u) => !Number.isNaN(u.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setControls(cleanControls);
        setRequests(cleanRequests);
        if (defaultRequestId) setSelectedRequestId(String(defaultRequestId));
        setTesters(cleanTesters);
      } catch (e) {
        if (!isNetworkFetchError(e)) {
          setLoadError(e?.message || 'Failed to load dropdown data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, defaultRequestId, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultRequestId) setSelectedRequestId(String(defaultRequestId));
  }, [isOpen, defaultRequestId]);

  useEffect(() => {
    if (!selectedRequestId || !requests.length) return;
    const req = requests.find((r) => String(r.id) === String(selectedRequestId));
    if (req?.dueDate) setDueDate(req.dueDate);
  }, [selectedRequestId, requests]);

  const handleSubmit = async () => {
    if (submitting || loading || loadError) return;

    setFieldErrors({});

    const errs = {};
    if (!selectedVgcpid) errs.selectedVgcpid = 'VGCPID is required.';
    if (!testType) errs.testType = 'Test Type is required.';
    if (!dueDate) errs.dueDate = 'Due Date is required.';
    if (!description.trim()) errs.description = 'Test description is a required field';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const flags = flagsFromTestType(testType);
    const matchingControl = controls.find((c) => c.vgcpid === selectedVgcpid);

    const payload = {
      vgcpid: selectedVgcpid,
      controlId: matchingControl.id,
      ...flags,
      dueDate: dueDate,
      description: description.trim() || ' ',
    };

    if (selectedRequestId) payload.requestId = Number(selectedRequestId);
    if (etaDate) payload.estimatedDate = etaDate;
    if (selectedTesterId) payload.assignedTesterId = Number(selectedTesterId);

    try {
      setSubmitting(true);
      const created = await createTest(payload);

      await refreshAndClose(created);

      showSuccessToast({
        title: 'Control Test Created',
        message: `${selectedVgcpid} test has been created successfully.`,
      });
    } catch (e) {
      const errorMessage = e?.message || 'Failed to create test.';

      showErrorToast({
        title: 'Control Test Create Failed',
        message: `An error occurred while creating the control test: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ctm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
      role="presentation"
    >
      <div
        className="ctm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Create Control Test"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ctm-header">
          <h2 className="ctm-title">Create Control Test</h2>
          <button
            className="ctm-close"
            type="button"
            onClick={handleClose}
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="ctm-body">
          {loadError && <div className="ctm-error">{loadError}</div>}

          <div className="ctm-grid">
            <div className="ctm-field">
              <label className="ctm-label" htmlFor="vgcpid">
                VGCPID<span className="ctm-req">*</span>
              </label>
              <select
                id="vgcpid"
                className="ctm-select"
                value={selectedVgcpid}
                onChange={(e) => setSelectedVgcpid(e.target.value)}
                disabled={loading || !!loadError}
                aria-invalid={fieldErrors.selectedVgcpid ? 'true' : 'false'}
              >
                <option value="" disabled>
                  {loading ? 'Loading...' : 'Select VGCPID'}
                </option>
                {controls.map((c) => (
                  <option key={`ctrl-${c.id}`} value={c.vgcpid}>
                    {c.vgcpid}
                  </option>
                ))}
              </select>
              {fieldErrors.selectedVgcpid ? (
                <div className="field-error">{fieldErrors.selectedVgcpid}</div>
              ) : null}
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="requestId">
                Link to Request
              </label>
              <select
                id="requestId"
                className="ctm-select"
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                disabled={loading || !!loadError}
                aria-invalid={fieldErrors.selectedRequestId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  {loading ? 'Loading...' : 'Select request'}
                </option>
                {requests.map((r) => (
                  <option key={`req-${r.id}`} value={String(r.id)}>
                    {r.label}
                  </option>
                ))}
              </select>
              {fieldErrors.selectedRequestId ? (
                <div className="field-error">{fieldErrors.selectedRequestId}</div>
              ) : null}
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="tester">
                Tester
              </label>
              <select
                id="tester"
                className="ctm-select"
                value={selectedTesterId}
                onChange={(e) => setSelectedTesterId(e.target.value)}
                disabled={loading || !!loadError}
              >
                <option value="">Unassigned</option>
                {testers.map((t) => (
                  <option key={`tester-${t.id}`} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="testType">
                Test Type<span className="ctm-req">*</span>
              </label>
              <select
                id="testType"
                className="ctm-select"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                disabled={!!loadError}
                aria-invalid={fieldErrors.testType ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Select test type
                </option>
                <option value="DAT Only">DAT Only</option>
                <option value="OET Only">OET Only</option>
                <option value="DAT & OET">DAT &amp; OET</option>
              </select>
              {fieldErrors.testType ? (
                <div className="field-error">{fieldErrors.testType}</div>
              ) : null}
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="dueDate">
                Due Date<span className="ctm-req">*</span>
              </label>
              <input
                id="dueDate"
                className="ctm-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!!loadError}
                readOnly={!!selectedRequestId}
                title={selectedRequestId ? 'Matches the selected request' : undefined}
                aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
              />
              {fieldErrors.dueDate ? (
                <div className="field-error">{fieldErrors.dueDate}</div>
              ) : null}
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="etaDate">
                ETA Date
              </label>
              <input
                id="etaDate"
                className="ctm-input"
                type="date"
                value={etaDate}
                onChange={(e) => setEtaDate(e.target.value)}
                disabled={!!loadError}
              />
            </div>

            <div className="ctm-field ctm-field--full">
              <label className="ctm-label" htmlFor="description">
                Description<span className="ctm-req">*</span>
              </label>
              <textarea
                id="description"
                className="ctm-textarea"
                placeholder="Enter test description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!!loadError}
                aria-invalid={fieldErrors.description ? 'true' : 'false'}
              />
              {fieldErrors.description ? (
                <div className="field-error">{fieldErrors.description}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ctm-footer">
          <ActionButton
            className="ctm-btn ctm-btn--ghost"
            variant="cancel"
            type="button"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </ActionButton>
          <ActionButton
            className="ctm-btn ctm-btn--primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading || !!loadError}
          >
            {submitting ? 'Creating...' : 'Create Control Test'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
