import React, { useEffect, useMemo, useState } from 'react';
import { fetchTestById, updateTest } from '../api/TestsAPI';
import '../styles/components/EditTestModal.css';
import '../styles/components/EditControlModal.css';
import { fetchControls } from '../api/ControlsAPI';
import { fetchRequests } from '../api/RequestsAPI';
import { fetchUsers } from '../api/UsersAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { formatISOToDate, objectToCamelCase } from '../utils/transformer';
import { useRole, ACTIONS } from '../auth';
import { createRefreshHandlers } from '../utils/modalRefresh';

const MODAL_BODY_MIN_HEIGHT = 428;

function flagsFromTestType(v) {
  if (v === 'DAT Only') return { requiresDat: true, requiresOet: false };
  if (v === 'OET Only') return { requiresDat: false, requiresOet: true };
  if (v === 'DAT & OET') return { requiresDat: true, requiresOet: true };
  return { requiresDat: false, requiresOet: false };
}

function normalizeTest(test) {
  return objectToCamelCase(test ?? null);
}

function buildInitialState(test) {
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
    dueDate: formatISOToDate(test?.dueDate) || '',
    etaDate: formatISOToDate(test?.estimatedDate) || '',
    description: test?.description ?? '',
  };
}

export default function EditTestModal({ isOpen, onClose, test, onUpdated }) {
  const { isManager, restrictionMessage } = useRole();
  const normalizedPropTest = useMemo(() => normalizeTest(test), [test]);
  const [resolvedTest, setResolvedTest] = useState(normalizedPropTest);
  const originalTestId = resolvedTest?.testId ?? normalizedPropTest?.testId ?? '';
  const initial = useMemo(() => buildInitialState(resolvedTest), [resolvedTest]);

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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { refreshAndClose } = createRefreshHandlers({
    parentRefresh: onUpdated,
    close: onClose,
  });

  function syncForm(state) {
    setSelectedControlId(state.selectedControlId);
    setSelectedRequestId(state.selectedRequestId);
    setSelectedTesterId(state.selectedTesterId);
    setTestType(state.testType);
    setDueDate(state.dueDate);
    setEtaDate(state.etaDate);
    setDescription(state.description);
  }

  useEffect(() => {
    if (!isOpen) return;
    setResolvedTest(normalizedPropTest);
  }, [isOpen, normalizedPropTest]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const testId = normalizedPropTest?.testId;
    const seed = buildInitialState(normalizedPropTest);

    setFieldErrors({});
    setLoading(true);
    setSubmitting(false);
    syncForm(seed);

    (async () => {
      try {
        const [freshTest, c, r, u] = await Promise.all([
          testId ? fetchTestById(testId) : Promise.resolve(null),
          fetchControls(),
          fetchRequests(),
          fetchUsers({ isActive: true }),
        ]);
        if (cancelled) return;

        const normalizedFresh = freshTest ? normalizeTest(freshTest) : normalizedPropTest;
        const nextInitial = buildInitialState(normalizedFresh);

        setResolvedTest(normalizedFresh);
        setControls(Array.isArray(c) ? c : []);
        setRequests(Array.isArray(r) ? r : []);
        setUsers(Array.isArray(u) ? u : []);
        syncForm(nextInitial);
      } catch (e) {
        if (cancelled) return;
        const errorMessage = e?.message || 'Failed to load test details.';
        showErrorToast({
          title: 'Test Load Failed',
          message: `An error occurred while loading the test: ${errorMessage}`,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, normalizedPropTest]);

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

  const selectedVgcpid = selectedControl?.vgcpid ?? resolvedTest?.vgcpid ?? '';

  async function handleSave() {
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
    const vgcpidForPayload = (() => {
      if (isManager) return selectedVgcpid;
      const idNum = Number(initial.selectedControlId);
      const fromList = controls.find((c) => Number(c.control_id) === idNum);
      return fromList?.vgcpid ?? resolvedTest?.vgcpid ?? selectedVgcpid;
    })();

    const payload = {
      action: 'update_details',
      vgcpid: vgcpidForPayload,
      ...flags,
      dueDate: dueDate,
      description: description.trim() || ' ',
    };

    if (isManager) {
      if (selectedRequestId) payload.requestId = Number(selectedRequestId);
      if (selectedTesterId) payload.assignedTesterId = Number(selectedTesterId);
    } else {
      if (initial.selectedRequestId) payload.requestId = Number(initial.selectedRequestId);
      if (initial.selectedTesterId) payload.assignedTesterId = Number(initial.selectedTesterId);
    }
    if (etaDate) payload.estimatedDate = etaDate;

    try {
      setSubmitting(true);
      await updateTest(originalTestId, payload);

      await refreshAndClose();

      showSuccessToast({
        title: 'Control Test Saved',
        message: `${vgcpidForPayload} has been saved successfully.`,
      });
    } catch (e) {
      const errorMessage = e?.message || 'Failed to update test.';
      showErrorToast({
        title: 'Control Test Save Failed',
        message: `An error occurred while saving the control test: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const controlSelectTitle = !isManager
    ? restrictionMessage(ACTIONS.CHANGE_TEST_CONTROL_VGCPID)
    : undefined;
  const requestSelectTitle = !isManager ? restrictionMessage(ACTIONS.UPDATE_REQUEST) : undefined;
  const testerSelectTitle = !isManager ? restrictionMessage(ACTIONS.ASSIGN_TESTER) : undefined;

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
            Edit Control Test: {selectedVgcpid || '-'}
          </h2>

          <button type="button" className="ctm-close" aria-label="Close" onClick={onClose}>
            x
          </button>
        </div>

        <div
          className="ctm-body ctm-body--stable"
          style={{ minHeight: `${MODAL_BODY_MIN_HEIGHT}px` }}
        >
          {loading ? (
            <div className="ctm-loading" style={{ minHeight: `${MODAL_BODY_MIN_HEIGHT}px` }}>
              Loading test details...
            </div>
          ) : (
            <>
              <div className="ctm-grid">
                <div className="ctm-field">
                  <label className="ctm-label">
                    VGCPID <span className="ctm-req">*</span>{' '}
                  </label>
                  <select
                    className="ctm-select"
                    value={selectedControlId}
                    onChange={(e) => setSelectedControlId(e.target.value)}
                    disabled={!isManager}
                    title={controlSelectTitle}
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
                    disabled={!isManager}
                    title={requestSelectTitle}
                    aria-invalid={fieldErrors.selectedRequestId ? 'true' : 'false'}
                  >
                    <option value="" disabled>
                      Select request
                    </option>
                    {requestOptions.map((r) => (
                      <option
                        key={r.requestId}
                        value={String(r.requestId)}
                      >{`REQ-${String(r.requestId).padStart(4, '0')} - ${r.requestor ?? '-'} - ${r.dueDate ?? '-'}`}</option>
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
                    disabled={!isManager}
                    title={testerSelectTitle}
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
                    disabled={!!selectedRequestId}
                    title={selectedRequestId ? 'Due date is synced from the selected request.' : ''}
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
            </>
          )}
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

          <button
            type="button"
            className="btn btn--red"
            onClick={handleSave}
            disabled={submitting || loading}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
