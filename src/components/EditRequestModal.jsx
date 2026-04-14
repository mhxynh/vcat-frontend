import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/components/EditRequestModal.css';
import { fetchRequestById, updateRequest } from '../api/RequestsAPI';
import { fetchTestsByRequestId, fetchTests, updateTest } from '../api/TestsAPI';
import CreateTestModal from './CreateTestModal';
import { formatISOToDate, objectToCamelCase } from '../utils/transformer';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import RestrictedAction from './RestrictedAction';
import { ACTIONS, useRole } from '../auth';

function getRequestYearFromValue(value) {
  if (!value) return new Date().getFullYear();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().getFullYear();

  return parsed.getFullYear();
}

function formatRequestDisplayId(requestId, yearSource) {
  if (requestId == null || requestId === '') return '';
  return `REQ-${getRequestYearFromValue(yearSource)}-${String(requestId).padStart(4, '0')}`;
}
export default function EditRequestModal({ isOpen, onClose, requestId, onUpdated }) {
  const { isManager, restrictionMessage } = useRole();
  const [priority, setPriority] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [createdAtRaw, setCreatedAtRaw] = useState('');

  const [associatedTests, setAssociatedTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const searchWrapperRef = useRef(null);

  const normalizeTests = (tests) => (Array.isArray(tests) ? objectToCamelCase(tests) : []);

  useEffect(() => {
    if (!showSearchResults) return;

    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [showSearchResults]);

  useEffect(() => {
    if (!isOpen || !requestId) return;

    const loadRequestData = async () => {
      setLoading(true);
      setError('');
      setFieldErrors({});
      try {
        const reqData = objectToCamelCase(await fetchRequestById(requestId));

        setPriority(reqData.priority || 'MEDIUM');
        setRequestedBy(reqData.requestor);
        setCreatedAtRaw(reqData.createdAt || '');
        setRequestDate(formatISOToDate(reqData.createdAt) || '');
        setDueDate(formatISOToDate(reqData.dueDate) || '');
        setDescription(reqData.description);

        const [testsData, allTestsData] = await Promise.all([
          fetchTestsByRequestId(requestId, { details: true }),
          fetchTests(),
        ]);
        setAssociatedTests(normalizeTests(testsData));
        setAllTests(normalizeTests(allTestsData));
      } catch (e) {
        setError(e?.message || 'Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };

    loadRequestData();
  }, [isOpen, requestId]);

  const handleSaveChanges = async () => {
    setError('');
    setFieldErrors({});

    const errs = {};
    if (!priority) errs.priority = 'Priority is required.';
    if (!requestedBy.trim()) errs.requestedBy = 'Requested By is required.';
    if (!dueDate) errs.dueDate = 'Due Date is required.';
    if (!description.trim()) errs.description = 'Description is required.';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await updateRequest(requestId, {
        priority,
        requestor: requestedBy.trim(),
        dueDate,
        description: description.trim(),
      });

      await onUpdated?.();

      showSuccessToast({
        title: 'Request Saved',
        message: `${formattedReqId} has been saved successfully.`,
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to update request.';
      setError(errorMessage);

      showErrorToast({
        title: 'Request Save Failed',
        message: `An error occurred while saving the request: ${errorMessage}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const formattedReqId = formatRequestDisplayId(requestId, createdAtRaw || requestDate);

  const completedCount = associatedTests.filter(
    (t) => String(t.status).toUpperCase() === 'COMPLETED'
  ).length;

  const filteredTests = useMemo(() => associatedTests, [associatedTests]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return allTests;

    return allTests.filter((t) => {
      return (
        String(t.vgcpid || t.id || '')
          .toLowerCase()
          .includes(q) ||
        String(t.controlDescription || t.description || '')
          .toLowerCase()
          .includes(q) ||
        String(t.testerName || t.assignedTesterName || '')
          .toLowerCase()
          .includes(q) ||
        String(t.requestId || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [allTests, searchQuery]);

  const handleAddTest = async (test) => {
    const testId = test.testId ?? test.id;
    try {
      await updateTest(testId, {
        action: 'update_details',
        requestId: requestId,
        vgcpid: test.vgcpid,
        assignedTesterId: test.assignedTesterId ?? null,
        requiresDat: test.requiresDat ?? false,
        requiresOet: test.requiresOet ?? false,
        dueDate: test.dueDate ?? null,
        estimatedDate: test.estimatedDate ?? null,
        description: test.description ?? test.controlDescription ?? '',
      });

      setAssociatedTests((prev) => {
        const normalizedTest = { ...test, requestId };
        const testIdToMatch = test.testId ?? test.id;
        const withoutOld = prev.filter((t) => (t.testId ?? t.id) !== testIdToMatch);
        return [normalizedTest, ...withoutOld];
      });

      setAllTests((prev) =>
        prev.map((t) => ((t.testId ?? t.id) === testId ? { ...t, requestId } : t))
      );

      setSearchQuery('');
      setShowSearchResults(false);
      await onUpdated?.();

      showSuccessToast({
        title: 'Control Test Added to Request',
        message: `${test.vgcpid || testId} has been linked to ${formattedReqId} successfully.`,
      });
    } catch (e) {
      const errorMessage = e?.message || 'Failed to add control test.';
      setError(errorMessage);

      showErrorToast({
        title: 'Control Test Add to Request Failed',
        message: `An error occurred while adding the control test to the request: ${errorMessage}`,
      });
    }
  };

  const handleRemoveTest = async (test) => {
    const testId = test.testId ?? test.id;
    try {
      await updateTest(testId, {
        action: 'update_details',
        requestId: null,
        vgcpid: test.vgcpid,
        assignedTesterId: test.assignedTesterId ?? null,
        requiresDat: test.requiresDat ?? false,
        requiresOet: test.requiresOet ?? false,
        dueDate: test.dueDate ?? null,
        estimatedDate: test.estimatedDate ?? null,
        description: test.description ?? test.controlDescription ?? '',
      });
      setAssociatedTests((prev) => prev.filter((t) => (t.testId ?? t.id) !== testId));
      setAllTests((prev) =>
        prev.map((t) => ((t.testId ?? t.id) === testId ? { ...t, requestId: null } : t))
      );
      if (onUpdated) await onUpdated();
    } catch (e) {
      setError(e?.message || 'Failed to remove control test.');
    }
  };

  if (!isOpen) return null;

  const updateRequestRestriction = restrictionMessage(ACTIONS.UPDATE_REQUEST);
  const requestFieldsDisabled = saving || !isManager;
  const searchDisabled = saving || !isManager;

  return (
    <div
      className="erm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="erm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-request-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="erm-header">
          <h2 className="erm-title" id="edit-request-title">
            Edit Request
          </h2>
          <button
            type="button"
            className="erm-close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="erm-body">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              Loading request details...
            </div>
          ) : (
            <>
              {error && <div className="ecm-error">{error}</div>}

              <div className="erm-summary-card">
                <div className="erm-summary-left">
                  <div className="erm-summary-id">REQUEST ID</div>
                  <div className="erm-summary-sub">
                    {associatedTests.length} Controls • {completedCount} Completed
                  </div>
                </div>
                <div className="erm-summary-right">
                  <div className="erm-summary-val">{formattedReqId}</div>
                </div>
              </div>

              <div className="erm-grid">
                <div className="erm-field">
                  <label className="erm-label">Request ID*</label>
                  <input className="erm-input" value={formattedReqId} disabled />
                </div>

                <div className="erm-field">
                  <label className="erm-label">Priority*</label>
                  <select
                    className="erm-select"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      if (fieldErrors.priority) setFieldErrors({ ...fieldErrors, priority: null });
                    }}
                    disabled={requestFieldsDisabled}
                    title={!isManager ? updateRequestRestriction : undefined}
                    aria-invalid={fieldErrors.priority ? 'true' : 'false'}
                  >
                    <option value="CRITICAL">Critical Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                  {fieldErrors.priority && (
                    <div className="field-error">{fieldErrors.priority}</div>
                  )}
                </div>

                <div className="erm-field erm-field--full">
                  <label className="erm-label">Requested By*</label>
                  <input
                    className="erm-input"
                    value={requestedBy || ''}
                    onChange={(e) => {
                      setRequestedBy(e.target.value);
                      if (fieldErrors.requestedBy)
                        setFieldErrors({ ...fieldErrors, requestedBy: null });
                    }}
                    disabled={requestFieldsDisabled}
                    title={!isManager ? updateRequestRestriction : undefined}
                    aria-invalid={fieldErrors.requestedBy ? 'true' : 'false'}
                  />
                  {fieldErrors.requestedBy && (
                    <div className="field-error">{fieldErrors.requestedBy}</div>
                  )}
                </div>

                <div className="erm-field">
                  <label className="erm-label">Request Date*</label>
                  <input className="erm-input" type="date" value={requestDate} disabled />
                </div>

                <div className="erm-field">
                  <label className="erm-label">Due Date*</label>
                  <input
                    className="erm-input"
                    type="date"
                    value={dueDate || ''}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      if (fieldErrors.dueDate) setFieldErrors({ ...fieldErrors, dueDate: null });
                    }}
                    disabled={requestFieldsDisabled}
                    title={!isManager ? updateRequestRestriction : undefined}
                    aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
                  />
                  {fieldErrors.dueDate && <div className="field-error">{fieldErrors.dueDate}</div>}
                </div>

                <div className="erm-field erm-field--full">
                  <label className="erm-label">Description*</label>
                  <textarea
                    className="erm-textarea"
                    value={description || ''}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (fieldErrors.description)
                        setFieldErrors({ ...fieldErrors, description: null });
                    }}
                    disabled={requestFieldsDisabled}
                    title={!isManager ? updateRequestRestriction : undefined}
                    aria-invalid={fieldErrors.description ? 'true' : 'false'}
                  />
                  {fieldErrors.description && (
                    <div className="field-error">{fieldErrors.description}</div>
                  )}
                </div>
              </div>

              <div className="erm-divider" />

              <div className="erm-section erm-section--associated-controls">
                <h3 className="erm-section-title">Associated Controls*</h3>
                {!isManager ? (
                  <div className="erm-restriction-note">{updateRequestRestriction}</div>
                ) : null}

                <div className="erm-search-row">
                  <div className="erm-search-wrapper" ref={searchWrapperRef}>
                    <div
                      className={`erm-search-input-wrap ${searchDisabled ? 'erm-search-input-wrap--disabled' : ''}`}
                    >
                      <span className="erm-search-icon" aria-hidden="true">
                        🔍
                      </span>
                      <input
                        className="erm-search"
                        placeholder="Search Controls to add..."
                        value={searchQuery || ''}
                        onChange={(e) => {
                          if (!isManager) return;
                          setSearchQuery(e.target.value);
                          setShowSearchResults(true);
                        }}
                        onFocus={() => {
                          if (!isManager) return;
                          setShowSearchResults(true);
                        }}
                        disabled={searchDisabled}
                        title={!isManager ? updateRequestRestriction : undefined}
                      />
                    </div>

                    {isManager && showSearchResults && (
                      <div className="erm-search-dropdown">
                        {searchResults.length === 0 ? (
                          <div className="erm-search-empty">No matching controls found.</div>
                        ) : (
                          searchResults.map((test) => {
                            const id = test.testId ?? test.id;
                            return (
                              <div key={id} className="erm-search-result-item">
                                <div className="erm-search-result-info">
                                  <div className="erm-search-result-title">
                                    {test.vgcpid || id}:{' '}
                                    {test.controlDescription ||
                                      test.description ||
                                      'No Description'}
                                  </div>
                                  <div className="erm-search-result-meta">
                                    Tester:{' '}
                                    {test.testerName || test.assignedTesterName || 'Unassigned'}
                                    {' • '}
                                    Request:{' '}
                                    {test.requestId
                                      ? formatRequestDisplayId(
                                          test.requestId,
                                          (test.requestCreatedAt ??
                                            test.requestDate ??
                                            test.createdAt ??
                                            createdAtRaw) ||
                                            requestDate
                                        )
                                      : 'Unlinked'}
                                  </div>
                                </div>
                                <RestrictedAction action={ACTIONS.UPDATE_REQUEST}>
                                  <button
                                    type="button"
                                    className="erm-add-btn"
                                    onClick={() => handleAddTest(test)}
                                    title="Link to this request"
                                  >
                                    +
                                  </button>
                                </RestrictedAction>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="erm-test-list">
                  {filteredTests.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#888',
                        background: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                      }}
                    >
                      No tests match your search.
                    </div>
                  ) : (
                    filteredTests.map((test) => {
                      const statusClass = String(test.status || 'NOT_STARTED')
                        .toLowerCase()
                        .replaceAll('_', '-')
                        .replace(/\s+/g, '-');
                      return (
                        <div key={test.id || test.testId} className="erm-test-item">
                          <div className="erm-test-main">
                            <div className="erm-test-title">
                              {test.vgcpid || test.id}: {test.description || 'No Description'}
                            </div>
                            <div className="erm-test-meta">
                              {test.assignee ||
                                test.testerName ||
                                test.assignedTesterName ||
                                'Unassigned'}
                              <span className={`status-pill erm-status-pill ${statusClass}`}>
                                {formatStatus(test.status) || 'Not Started'}
                              </span>
                            </div>
                          </div>
                          <RestrictedAction action={ACTIONS.UPDATE_REQUEST}>
                            <button
                              type="button"
                              className="erm-x"
                              onClick={() => handleRemoveTest(test)}
                              disabled={saving}
                              title="Remove Control"
                            >
                              ×
                            </button>
                          </RestrictedAction>
                        </div>
                      );
                    })
                  )}

                  <div className="erm-create-control-row">
                    <RestrictedAction action={ACTIONS.CREATE_TEST}>
                      <button
                        type="button"
                        className={`erm-create-control-link ${saving || !isManager ? 'erm-create-control-link--disabled' : ''}`}
                        onClick={() => {
                          if (!saving) setIsCreateTestOpen(true);
                        }}
                        disabled={saving}
                        title="Create New Control for this Request"
                      >
                        + Create New Control for this Request
                      </button>
                    </RestrictedAction>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="erm-footer">
          <button
            type="button"
            className="erm-btn erm-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="erm-btn erm-btn--primary"
            onClick={handleSaveChanges}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <CreateTestModal
        isOpen={isCreateTestOpen}
        onClose={() => setIsCreateTestOpen(false)}
        defaultRequestId={requestId}
        onCreated={async (created) => {
          const refreshedTests = await fetchTestsByRequestId(requestId, { details: true });
          setAssociatedTests(normalizeTests(refreshedTests));

          if (onUpdated) await onUpdated(created, true);
          setIsCreateTestOpen(false);
        }}
        onUpdated={async (updated) => {
          const updatedTest = objectToCamelCase(updated);
          setAssociatedTests((prev) =>
            prev.map((t) => (t.testId === updatedTest.testId ? { ...t, ...updatedTest } : t))
          );
          if (onUpdated) await onUpdated(updated);
        }}
      />
    </div>
  );
}

function formatStatus(s) {
  const v = String(s || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    .replace(/\b(Dat|Oet|Oat)\b/g, (m) => m.toUpperCase());

  return v || '-';
}
