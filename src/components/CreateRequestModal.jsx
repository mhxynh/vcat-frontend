import React, { useEffect, useMemo, useState } from 'react';
import '../styles/components/CreateRequestModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { createRequest } from '../api/RequestsAPI';
import { createTest } from '../api/TestsAPI';

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requires_dat: true, requires_oet: false };
  if (v === 'OET Only') return { requires_dat: false, requires_oet: true };
  if (v === 'DAT & OET') return { requires_dat: true, requires_oet: true };
  return { requires_dat: true, requires_oet: true };
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// NOTE: Backend requires `created_by` for POST /requests.
// We do not have authentication/account context yet, so we send a dummy "current user" id.
// Replace DUMMY_CURRENT_USER_ID with the logged-in user's user_id once auth is implemented.
const DUMMY_CURRENT_USER_ID = 1;

export default function CreateRequestModal({ isOpen, onClose, onCreated }) {
  const [controls, setControls] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [priority, setPriority] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [requestDate, setRequestDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const [controlSearch, setControlSearch] = useState('');
  const [pendingSelectedIds, setPendingSelectedIds] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]);

  const [testType, setTestType] = useState('DAT & OET');
  const [assignedTesterId, setAssignedTesterId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [createdRequestId, setCreatedRequestId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoadError('');
    setSubmitError('');
    setLoading(false);

    setPriority('');
    setRequestedBy('');
    setRequestDate(todayIso());
    setDueDate('');
    setDescription('');

    setControlSearch('');
    setPendingSelectedIds([]);
    setSelectedControls([]);

    setTestType('DAT & OET');
    setAssignedTesterId('');

    setCreatedRequestId(null);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    (async () => {
      try {
        setLoading(true);
        const [c, u] = await Promise.all([fetchControls(), fetchUsers({ isActive: true })]);
        setControls(Array.isArray(c) ? c : []);
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
    const q = controlSearch.trim().toLowerCase();
    const list = (controls || []).map((c) => ({
      control_id: c.control_id,
      vgcpid: c.vgcpid,
      description: c.description,
    }));

    const selectedIds = new Set(selectedControls.map((c) => Number(c.control_id)));

    return list
      .filter((c) => !selectedIds.has(Number(c.control_id)))
      .filter((c) => {
        if (!q) return true;
        return (
          String(c.vgcpid || '')
            .toLowerCase()
            .includes(q) ||
          String(c.description || '')
            .toLowerCase()
            .includes(q)
        );
      })
      .sort((a, b) => String(a.vgcpid).localeCompare(String(b.vgcpid)));
  }, [controls, controlSearch, selectedControls]);

  const userOptions = useMemo(() => {
    return (users || [])
      .map((u) => ({
        user_id: u.user_id,
        display_name: u.display_name ?? u.email ?? `User ${u.user_id}`,
      }))
      .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)));
  }, [users]);

  if (!isOpen) return null;

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const togglePending = (id) => {
    setPendingSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addSelectedControls = () => {
    if (pendingSelectedIds.length === 0) return;

    const idSet = new Set(pendingSelectedIds.map(Number));
    const toAdd = controlOptions.filter((c) => idSet.has(Number(c.control_id)));

    setSelectedControls((prev) => [...prev, ...toAdd]);
    setPendingSelectedIds([]);
    setControlSearch('');
  };

  const removeSelectedControl = (controlId) => {
    setSelectedControls((prev) => prev.filter((c) => Number(c.control_id) !== Number(controlId)));
  };

  // SAVE: creates the request but keeps the modal open
  const handleSave = async () => {
    setSubmitError('');

    if (createdRequestId != null) return;

    if (!priority) return setSubmitError('Priority is required.');
    if (!requestedBy.trim()) return setSubmitError('Requested By is required.');
    if (!dueDate) return setSubmitError('Due Date is required.');
    if (!description.trim()) return setSubmitError('Description is required.');

    try {
      setSubmitting(true);

      const createdReq = await createRequest({
        requestor: requestedBy.trim(),
        due_date: dueDate,
        priority: String(priority).toUpperCase(),
        description: description.trim(),
        created_by: DUMMY_CURRENT_USER_ID,
      });

      const requestId = createdReq?.request_id;
      if (requestId == null) throw new Error('Request created but missing request_id.');

      // Create associated tests (the “associate controls” behavior you had originally)
      if (selectedControls.length > 0) {
        const flags = flagsFromTestType(testType);
        await Promise.all(
          selectedControls.map((c) =>
            createTest({
              vgcpid: c.vgcpid,
              request_id: Number(requestId),
              ...flags,
              due_date: dueDate,
              description: `Test for ${c.vgcpid}`,
              assigned_tester_id: assignedTesterId ? Number(assignedTesterId) : undefined,
            })
          )
        );
      }

      setCreatedRequestId(Number(requestId));
      onCreated?.(createdReq);
      onClose?.();
    } catch (e) {
      setSubmitError(e?.message || 'Failed to save request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (createdRequestId == null) {
      await handleSave();
      if (createdRequestId == null) return;
    }
    onClose?.();
  };

  return (
    <div className="crm-overlay" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div className="crm-modal" role="dialog" aria-modal="true" aria-label="Create New Request">
        <div className="crm-header">
          <h2 className="crm-title">Create New Request</h2>
          <button className="crm-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="crm-body">
          {loadError ? <div className="crm-error">{loadError}</div> : null}

          <div className="crm-grid">
            <div className="crm-field">
              <label className="crm-label">
                Request ID<span className="crm-req">*</span>
              </label>
              <input
                className="crm-input"
                value={
                  createdRequestId != null
                    ? `REQ-${String(createdRequestId).padStart(4, '0')}`
                    : 'REQ-YYYY-###'
                }
                disabled
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Priority<span className="crm-req">*</span>
              </label>
              <select
                className="crm-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={loading || !!loadError || createdRequestId != null}
              >
                <option value="" disabled>
                  Select priority
                </option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="crm-field crm-field--full">
              <label className="crm-label">
                Requested By<span className="crm-req">*</span>
              </label>
              <input
                className="crm-input"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Enter requester name..."
                disabled={loading || !!loadError || createdRequestId != null}
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Request Date<span className="crm-req">*</span>
              </label>
              <input className="crm-input" type="date" value={requestDate} disabled />
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Due Date<span className="crm-req">*</span>
              </label>
              <input
                className="crm-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading || !!loadError || createdRequestId != null}
              />
            </div>

            <div className="crm-field crm-field--full">
              <label className="crm-label">
                Description<span className="crm-req">*</span>
              </label>
              <textarea
                className="crm-textarea"
                placeholder="Describe the purpose of this request..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || !!loadError || createdRequestId != null}
              />
            </div>
          </div>

          <div className="crm-divider" />

          <div className="crm-section">
            <div className="crm-section-title">Associate Control Tests</div>

            <div className="crm-assoc-box">
              <div className="crm-assoc-top">
                <div className="crm-search-wrap">
                  <span className="crm-search-icon">🔍</span>
                  <input
                    className="crm-search"
                    placeholder="Search controls to link..."
                    value={controlSearch}
                    onChange={(e) => setControlSearch(e.target.value)}
                    disabled={loading || !!loadError || createdRequestId != null}
                  />
                </div>
                <button
                  className="crm-btn crm-btn--outline"
                  type="button"
                  onClick={addSelectedControls}
                  disabled={
                    pendingSelectedIds.length === 0 ||
                    loading ||
                    !!loadError ||
                    createdRequestId != null
                  }
                >
                  Add Selected
                </button>
              </div>

              <div className="crm-picker">
                {controlOptions.length === 0 ? (
                  <div className="crm-picker-empty">No controls to add.</div>
                ) : (
                  controlOptions.slice(0, 8).map((c) => (
                    <label key={c.control_id} className="crm-pick-row">
                      <input
                        type="checkbox"
                        checked={pendingSelectedIds.includes(c.control_id)}
                        onChange={() => togglePending(c.control_id)}
                        disabled={createdRequestId != null}
                      />
                      <div className="crm-pick-text">
                        <div className="crm-pick-title">
                          {c.vgcpid}: {c.description}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="crm-selected">
                {selectedControls.map((c) => (
                  <div key={c.control_id} className="crm-selected-card">
                    <div className="crm-selected-main">
                      <div className="crm-selected-title">
                        {c.vgcpid}: {c.description}
                      </div>
                      <div className="crm-selected-sub">
                        Tester: {assignedTesterId ? 'Selected' : '-'}
                      </div>
                    </div>

                    <button
                      className="crm-x"
                      type="button"
                      onClick={() => removeSelectedControl(c.control_id)}
                      aria-label="Remove"
                      disabled={createdRequestId != null}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="crm-test-defaults">
                <div className="crm-field">
                  <label className="crm-label">Tester</label>
                  <select
                    className="crm-select"
                    value={assignedTesterId}
                    onChange={(e) => setAssignedTesterId(e.target.value)}
                    disabled={loading || !!loadError || createdRequestId != null}
                  >
                    <option value="">Unassigned</option>
                    {userOptions.map((u) => (
                      <option key={u.user_id} value={String(u.user_id)}>
                        {u.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-field">
                  <label className="crm-label">Test Type</label>
                  <select
                    className="crm-select"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    disabled={loading || !!loadError || createdRequestId != null}
                  >
                    <option value="DAT Only">DAT Only</option>
                    <option value="OET Only">OET Only</option>
                    <option value="DAT & OET">DAT &amp; OET</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {submitError ? (
            <div className="crm-error" style={{ marginTop: 12 }}>
              {submitError}
            </div>
          ) : null}
        </div>

        <div className="crm-footer">
          <button
            className="crm-btn crm-btn--ghost"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            className="crm-btn crm-btn--outline"
            type="button"
            onClick={handleSave}
            disabled={submitting || !!loadError || createdRequestId != null}
            title={createdRequestId != null ? 'Already saved.' : ''}
          >
            {createdRequestId != null ? 'Saved' : 'Save'}
          </button>

          <button
            className="crm-btn crm-btn--primary"
            type="button"
            onClick={handleFinalize}
            disabled={submitting || !!loadError}
          >
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}
