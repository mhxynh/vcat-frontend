import React, { useEffect, useMemo, useState } from 'react';
import { updateTest } from '../api/TestsAPI';
import '../styles/components/EditTestModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchRequests } from '../api/RequestsAPI';
import { fetchUsers } from '../api/UsersAPI';

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requiresDat: true, requiresOet: false };
  if (v === 'OET Only') return { requiresDat: false, requiresOet: true };
  if (v === 'DAT & OET') return { requiresDat: true, requiresOet: true };
  return { requiresDat: false, requiresOet: false };
}

export default function EditTestModal({ isOpen, onClose, test, onUpdated }) {
  const originalTestId = test?.testId ?? '';

  const initial = useMemo(() => {
    let testType = '';
    if (test) {
      if (test.requiresDat && test.requiresOet) testType = 'DAT & OET';
      else if (test.requiresDat) testType = 'DAT Only';
      else if (test.requiresOet) testType = 'OET Only';
    }

    return {
      selectedControlId: test?.controlId != null ? String(test.controlId) : '',
      selectedRequestId: test?.requestId != null ? String(test.requestId) : '',
      selectedTesterId: test?.assignedTesterId != null ? String(test.assignedTesterId) : '',
      testType,
      dueDate: test?.dueDate || '',
      etaDate: test?.estimatedDate || '',
      description: test?.description ?? '',
    };
  }, [test]);

  const [controls, setControls] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedControlId, setSelectedControlId] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedTesterId, setSelectedTesterId] = useState('');
  const [testType, setTestType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setSelectedControlId(initial.selectedControlId);
    setSelectedRequestId(initial.selectedRequestId);
    setSelectedTesterId(initial.selectedTesterId);
    setTestType(initial.testType);
    setDueDate(initial.dueDate);
    setEtaDate(initial.etaDate);
    setDescription(initial.description);

    setError('');
    setSubmitting(false);

    (async () => {
      try {
        const [c, r, u] = await Promise.all([
          fetchControls(),
          fetchRequests(),
          fetchUsers({ isActive: true }),
        ]);
        setControls(Array.isArray(c) ? c : []);
        setRequests(Array.isArray(r) ? r : []);
        setUsers(Array.isArray(u) ? u : []);
      } catch (e) {
        setError(e?.message || 'Failed to load dropdown data.');
      }
    })();
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const controlOptions = useMemo(() => {
    return controls
      .map((c) => ({ controlId: c.controlId, vgcpid: c.vgcpid, description: c.description }))
      .sort((a, b) => String(a.vgcpid).localeCompare(String(b.vgcpid)));
  }, [controls]);

  const requestOptions = useMemo(() => {
    return requests
      .map((r) => ({ requestId: r.requestId, requestor: r.requestor, dueDate: r.dueDate }))
      .sort((a, b) => Number(b.requestId) - Number(a.requestId));
  }, [requests]);

  const testerOptions = useMemo(() => {
    return users
      .map((u) => ({
        userId: u.userId,
        displayName: u.displayName ?? u.email ?? `User ${u.userId}`,
      }))
      .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));
  }, [users]);

  const selectedControl = useMemo(() => {
    if (!selectedControlId) return null;
    const idNum = Number(selectedControlId);
    return controls.find((c) => Number(c.controlId) === idNum) || null;
  }, [controls, selectedControlId]);

  const selectedVgcpid = selectedControl?.vgcpid ?? '';

  async function handleSave() {
    setError('');

    if (!selectedControlId) return setError('VGCPID is required.');
    if (!selectedRequestId) return setError('Link to Request is required.');
    if (!testType) return setError('Test Type is required.');
    if (!dueDate) return setError('Due Date is required.');

    const flags = flagsFromTestType(testType);

    const payload = {
      action: 'update_details',
      vgcpid: selectedVgcpid,
      request_id: Number(selectedRequestId),
      ...flags,
      due_date: dueDate,
      description: description.trim() || ' ',
    };

    if (etaDate) payload.estimated_date = etaDate;
    if (selectedTesterId) payload.assigned_tester_id = Number(selectedTesterId);

    try {
      setSubmitting(true);
      await updateTest(originalTestId, payload);
      if (onUpdated) await onUpdated();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to update test.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="ctm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="ctm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-test-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ctm-header">
          <h2 className="ctm-title" id="edit-test-title">
            Edit Control Test: {selectedVgcpid || '—'}
          </h2>

          <button type="button" className="ctm-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ctm-body">
          {error && <div className="ctm-error">{error}</div>}

          <div className="ctm-grid">
            <div className="ctm-field">
              <label className="ctm-label">VGCPID *</label>
              <select
                className="ctm-select"
                value={selectedControlId}
                onChange={(e) => setSelectedControlId(e.target.value)}
              >
                <option value="" disabled>
                  Select VGCPID
                </option>
                {controlOptions.map((c) => (
                  <option key={c.control_id} value={String(c.control_id)}>
                    {c.vgcpid}
                  </option>
                ))}
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label">Link to Request *</label>
              <select
                className="ctm-select"
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
              >
                <option value="" disabled>
                  Select request
                </option>
                {requestOptions.map((r) => (
                  <option
                    key={r.request_id}
                    value={String(r.request_id)}
                  >{`REQ-${String(r.request_id).padStart(4, '0')} • ${r.requestor ?? '-'} • ${r.due_date ?? '-'}`}</option>
                ))}
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label">Tester</label>
              <select
                className="ctm-select"
                value={selectedTesterId}
                onChange={(e) => setSelectedTesterId(e.target.value)}
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
              <label className="ctm-label">Test Type *</label>
              <select
                className="ctm-select"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
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
              <label className="ctm-label">Due Date *</label>
              <input
                className="ctm-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="ctm-field">
              <label className="ctm-label">ETA Date</label>
              <input
                className="ctm-input"
                type="date"
                value={etaDate}
                onChange={(e) => setEtaDate(e.target.value)}
              />
            </div>

            <div className="ctm-field ctm-field--full">
              <label className="ctm-label">Description</label>
              <textarea
                className="ctm-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ctm-footer">
          <button type="button" className="btn btn--white" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button type="button" className="btn btn--red" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
