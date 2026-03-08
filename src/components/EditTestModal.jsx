import React, { useEffect, useMemo, useState } from 'react';
import { updateTest } from '../api/TestsAPI';
import '../styles/components/EditTestModal.css';
import '../styles/components/EditControlModal.css';
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
  const originalTestId = test?.test_id ?? '';

  const initial = useMemo(() => {
    let testType = '';
    if (test) {
      if (test.requires_dat && test.requires_oet) testType = 'DAT & OET';
      else if (test.requires_dat) testType = 'DAT Only';
      else if (test.requires_oet) testType = 'OET Only';
    }

    return {
      selectedControlId: test?.control_id != null ? String(test.control_id) : '',
      selectedRequestId: test?.request_id != null ? String(test.request_id) : '',
      selectedTesterId: test?.assigned_tester_id != null ? String(test.assigned_tester_id) : '',
      testType,
      dueDate: test?.due_date || '',
      etaDate: test?.estimated_date || '',
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
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFieldErrors({});
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
      .map((c) => ({ controlId: c.control_id, vgcpid: c.vgcpid, description: c.description }))
      .sort((a, b) => String(a.vgcpid).localeCompare(String(b.vgcpid)));
  }, [controls]);

  const requestOptions = useMemo(() => {
    const toDateInput = (v) => {
      if (!v) return '';
      const s = typeof v === 'string' ? v.split('T')[0] : String(v).split('T')[0];
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
    };
    return requests
      .map((r) => ({
        requestId: r.request_id,
        requestor: r.requestor,
        dueDate: toDateInput(r.due_date ?? r.dueDate),
      }))
      .sort((a, b) => Number(b.requestId) - Number(a.requestId));
  }, [requests]);

  // Auto-update due date when request changes (test due date matches request)
  useEffect(() => {
    if (!selectedRequestId || !requestOptions.length) return;
    const req = requestOptions.find((r) => String(r.requestId) === String(selectedRequestId));
    if (req?.dueDate) setDueDate(req.dueDate);
  }, [selectedRequestId, requestOptions]);

  const testerOptions = useMemo(() => {
    return users
      .map((u) => ({
        userId: u.user_id,
        displayName: u.display_name ?? u.email ?? `User ${u.user_id}`,
      }))
      .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));
  }, [users]);

  const selectedControl = useMemo(() => {
    if (!selectedControlId) return null;
    const idNum = Number(selectedControlId);
    return controls.find((c) => Number(c.control_id) === idNum) || null;
  }, [controls, selectedControlId]);

  const selectedVgcpid = selectedControl?.vgcpid ?? '';

  async function handleSave() {
    setError('');
    setFieldErrors({});

    const errs = {};
    if (!selectedControlId) errs.selectedControlId = 'VGCPID is required.';
    if (!testType) errs.testType = 'Test Type is required.';
    if (!dueDate) errs.dueDate = 'Due Date is required.';
    if (!description.trim()) errs.description = 'Test description is a required field';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const flags = flagsFromTestType(testType);

    const payload = {
      action: 'update_details',
      vgcpid: selectedVgcpid,
      ...flags,
      dueDate: dueDate,
      description: description.trim() || ' ',
    };

    if (selectedRequestId) payload.requestId = Number(selectedRequestId);
    if (etaDate) payload.estimatedDate = etaDate;
    if (selectedTesterId) payload.assignedTesterId = Number(selectedTesterId);

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
              <label className="ctm-label">
                VGCPID <span className="ctm-req">*</span>{' '}
              </label>
              <select
                className="ctm-select"
                value={selectedControlId}
                onChange={(e) => setSelectedControlId(e.target.value)}
                aria-invalid={fieldErrors.selectedControlId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Select VGCPID
                </option>
                {controlOptions.map((c) => (
                  <option key={c.controlId} value={String(c.controlId)}>
                    {c.vgcpid}
                  </option>
                ))}
              </select>
              {fieldErrors.selectedControlId ? (
                <div className="field-error">{fieldErrors.selectedControlId}</div>
              ) : null}
            </div>

            <div className="ctm-field">
              <label className="ctm-label">Link to Request</label>
              <select
                className="ctm-select"
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                aria-invalid={fieldErrors.selectedRequestId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Select request
                </option>
                {requestOptions.map((r) => (
                  <option
                    key={r.requestId}
                    value={String(r.requestId)}
                  >{`REQ-${String(r.requestId).padStart(4, '0')} • ${r.requestor ?? '-'} • ${r.dueDate ?? '-'}`}</option>
                ))}
              </select>
              {fieldErrors.selectedRequestId ? (
                <div className="field-error">{fieldErrors.selectedRequestId}</div>
              ) : null}
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
                  <option key={u.userId} value={String(u.userId)}>
                    {u.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label">
                Test Type <span className="ctm-req">*</span>
              </label>
              <select
                className="ctm-select"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
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
              <label className="ctm-label">
                Due Date <span className="ctm-req">*</span>
              </label>
              <input
                className="ctm-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                readOnly={!!selectedRequestId}
                title={selectedRequestId ? 'Matches the selected request' : undefined}
                aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
              />
              {fieldErrors.dueDate ? (
                <div className="field-error">{fieldErrors.dueDate}</div>
              ) : null}
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
              <label className="ctm-label">
                Description <span className="ctm-req">*</span>{' '}
              </label>
              <textarea
                className="ctm-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={fieldErrors.description ? 'true' : 'false'}
              />
              {fieldErrors.description ? (
                <div className="field-error">{fieldErrors.description}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ctm-footer">
          <button
            type="button"
            className="ecm-btn ecm-btn--outline"
            onClick={onClose}
            disabled={submitting}
          >
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
