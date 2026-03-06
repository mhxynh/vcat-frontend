import React, { useEffect, useState } from 'react';
import '../styles/components/CreateTestModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchRequests } from '../api/RequestsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { createTest } from '../api/TestsAPI';

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requiresDat: true, requiresOet: false };
  if (v === 'OET Only') return { requiresDat: false, requiresOet: true };
  if (v === 'DAT & OET') return { requiresDat: true, requiresOet: true };
  return { requiresDat: false, requiresOet: false };
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
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setLoadError('');
    setSubmitError('');
    setSelectedVgcpid('');
    setSelectedRequestId('');
    setSelectedTesterId('');
    setTestType('');
    setDueDate('');
    setEtaDate('');
    setDescription('');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
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

        // Sanitize Controls
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

        // Sanitize Requests (include dueDate for auto-matching test due date to request)
        const toDateInput = (v) => {
          if (!v) return '';
          const s = typeof v === 'string' ? v.split('T')[0] : String(v).split('T')[0];
          return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
        };
        const cleanRequests = (Array.isArray(rawRequests) ? rawRequests : [])
          .map((r) => {
            const id = Number(r.id ?? r.requestId ?? r.request_id ?? r.RequestId);
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
              label: `REQ-${String(id).padStart(4, '0')} • ${requester} • ${dueDateDisplay}`,
              dueDate: toDateInput(dueDateRaw),
            };
          })
          .filter((r) => Number.isFinite(r.id))
          .sort((a, b) => b.id - a.id);

        // Sanitize Users/Testers
        const cleanTesters = (Array.isArray(rawUsers) ? rawUsers : [])
          .map((u) => ({
            id: Number(u.id || u.user_id || u.userId),
            name: u.displayName || u.email || `User ${u.id || u.userId}`,
          }))
          .filter((u) => !Number.isNaN(u.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setControls(cleanControls);
        setRequests(cleanRequests);
        // If a defaultRequestId was provided, preselect it after requests are loaded
        if (defaultRequestId) setSelectedRequestId(String(defaultRequestId));
        setTesters(cleanTesters);
      } catch (e) {
        setLoadError(e?.message || 'Failed to load dropdown data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, defaultRequestId]);

  // also ensure default request is pre-selected when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (defaultRequestId) setSelectedRequestId(String(defaultRequestId));
  }, [isOpen, defaultRequestId]);

  // Auto-populate due date from selected request (test due date matches request)
  useEffect(() => {
    if (!selectedRequestId || !requests.length) return;
    const req = requests.find((r) => String(r.id) === String(selectedRequestId));
    if (req?.dueDate) setDueDate(req.dueDate);
  }, [selectedRequestId, requests]);

  const handleSubmit = async () => {
    setSubmitError('');

    // Strict Validation
    if (!selectedVgcpid) return setSubmitError('VGCPID is required.');
    if (!selectedRequestId) return setSubmitError('Link to Request is required.');
    if (!testType) return setSubmitError('Test Type is required.');
    if (!dueDate) return setSubmitError('Due Date is required. Select a request first.');
    if (!description.trim()) return setSubmitError('Description is required.');

    const flags = flagsFromTestType(testType);
    if (!flags.requiresDat && !flags.requiresOet) return setSubmitError('Invalid Test Type.');

    // Find the mapped Control ID based on the chosen VGCPID
    const matchingControl = controls.find((c) => c.vgcpid === selectedVgcpid);
    if (!matchingControl) return setSubmitError('Invalid VGCPID selection.');

    const payload = {
      vgcpid: selectedVgcpid,
      controlId: matchingControl.id,
      requestId: Number(selectedRequestId),
      ...flags,
      dueDate: dueDate,
      description: description.trim() || ' ',
    };

    if (etaDate) payload.estimatedDate = etaDate;
    if (selectedTesterId) payload.assignedTesterId = Number(selectedTesterId);

    try {
      setSubmitting(true);
      const created = await createTest(payload);
      onCreated?.(created);
      onClose?.();
    } catch (e) {
      setSubmitError(e?.message || 'Failed to create test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ctm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
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
          <button className="ctm-close" type="button" onClick={onClose} aria-label="Close">
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
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="requestId">
                Link to Request<span className="ctm-req">*</span>
              </label>
              <select
                id="requestId"
                className="ctm-select"
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                disabled={loading || !!loadError}
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
              >
                <option value="" disabled>
                  Select test type
                </option>
                <option value="DAT Only">DAT Only</option>
                <option value="OET Only">OET Only</option>
                <option value="DAT & OET">DAT &amp; OET</option>
              </select>
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
              />
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
              />
            </div>

            {submitError && (
              <div className="ctm-field ctm-field--full">
                <div className="ctm-error">{submitError}</div>
              </div>
            )}
          </div>
        </div>

        <div className="ctm-footer">
          <button
            className="ctm-btn ctm-btn--ghost"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="ctm-btn ctm-btn--primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !!loadError}
          >
            {submitting ? 'Creating...' : 'Create Control Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
