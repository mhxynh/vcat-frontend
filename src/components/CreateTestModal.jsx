import React, { useEffect, useMemo, useState } from 'react';
import '../styles/components/CreateTestModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchRequests } from '../api/RequestsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { createTest } from '../api/TestsAPI';

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requires_dat: true, requires_oet: false };
  if (v === 'OET Only') return { requires_dat: false, requires_oet: true };
  if (v === 'DAT & OET') return { requires_dat: true, requires_oet: true };
  return { requires_dat: false, requires_oet: false };
}

export default function CreateTestModal({ isOpen, onClose, onCreated }) {
  const [controls, setControls] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selectedControlId, setSelectedControlId] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedTesterId, setSelectedTesterId] = useState('');

  const [testType, setTestType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setLoadError('');
    setSubmitError('');
    setSelectedControlId('');
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

    (async () => {
      try {
        setLoading(true);
        const [c, r, u] = await Promise.all([
          fetchControls(),
          fetchRequests(),
          fetchUsers({ isActive: true }),
        ]);
        setControls(Array.isArray(c) ? c : []);
        setRequests(Array.isArray(r) ? r : []);
        setUsers(Array.isArray(u) ? u : []);
      } catch (e) {
        setLoadError(e?.message || 'Failed to load dropdown data.');
      } finally {
        setLoading(false);
      }
    })();

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const controlOptions = useMemo(() => {
    return controls
      .map((c) => ({
        control_id: c.control_id,
        vgcpid: c.vgcpid,
        description: c.description,
        is_active: c.is_active,
      }))
      .sort((a, b) => String(a.vgcpid).localeCompare(String(b.vgcpid)));
  }, [controls]);

  const requestOptions = useMemo(() => {
    return requests
      .map((r) => ({
        request_id: r.request_id,
        requestor: r.requestor,
        due_date: r.due_date,
        priority: r.priority,
        status: r.status,
      }))
      .sort((a, b) => Number(b.request_id) - Number(a.request_id));
  }, [requests]);

  const testerOptions = useMemo(() => {
    return users
      .map((u) => ({
        user_id: u.user_id,
        display_name: u.display_name ?? u.email ?? `User ${u.user_id}`,
        is_active: u.is_active,
      }))
      .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)));
  }, [users]);

  const selectedControl = useMemo(() => {
    if (!selectedControlId) return null;
    const idNum = Number(selectedControlId);
    return controls.find((c) => Number(c.control_id) === idNum) || null;
  }, [controls, selectedControlId]);

  const selectedVgcpid = selectedControl?.vgcpid ?? '';

  if (!isOpen) return null;

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!selectedControlId) return setSubmitError('VGCPID is required.');
    if (!selectedRequestId) return setSubmitError('Link to Request is required.');
    if (!testType) return setSubmitError('Test Type is required.');
    if (!dueDate) return setSubmitError('Due Date is required.');
    if (!selectedVgcpid) return setSubmitError('VGCPID is required.');

    const flags = flagsFromTestType(testType);
    if (!flags.requires_dat && !flags.requires_oet) return setSubmitError('Invalid Test Type.');

    const payload = {
      vgcpid: selectedVgcpid,
      control_id: Number(selectedControlId),
      request_id: Number(selectedRequestId),
      ...flags,
      due_date: dueDate,
      description: description.trim() || ' ', // backend requires description
    };

    if (etaDate) payload.estimated_date = etaDate;
    if (selectedTesterId) payload.assigned_tester_id = Number(selectedTesterId);

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

  return (
    <div className="ctm-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div className="ctm-modal" role="dialog" aria-modal="true" aria-label="Create Control Test">
        <div className="ctm-header">
          <h2 className="ctm-title">Create Control Test</h2>
          <button className="ctm-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="ctm-body">
          {loadError ? <div className="ctm-error">{loadError}</div> : null}

          <div className="ctm-grid">
            <div className="ctm-field">
              <label className="ctm-label" htmlFor="vgcpid">
                VGCPID<span className="ctm-req">*</span>
              </label>
              <select
                id="vgcpid"
                className="ctm-select"
                value={selectedControlId}
                onChange={(e) => setSelectedControlId(e.target.value)}
                disabled={loading || !!loadError}
              >
                <option value="" disabled>
                  {loading ? 'Loading controls...' : 'Select VGCPID'}
                </option>
                {controlOptions.map((c) => (
                  <option key={c.control_id} value={String(c.control_id)}>
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
                  {loading ? 'Loading requests...' : 'Select request'}
                </option>
                {requestOptions.map((r) => (
                  <option key={r.request_id} value={String(r.request_id)}>
                    {`REQ-${String(r.request_id).padStart(4, '0')} • ${r.requestor ?? '-'} • ${r.priority ?? '-'} • ${r.due_date ?? '-'}`}
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
                {testerOptions.map((u) => (
                  <option key={u.user_id} value={String(u.user_id)}>
                    {u.display_name}
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

            {submitError ? (
              <div className="ctm-field ctm-field--full">
                <div className="ctm-error">{submitError}</div>
              </div>
            ) : null}
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
