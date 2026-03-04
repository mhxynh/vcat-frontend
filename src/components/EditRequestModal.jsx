import React, { useEffect, useState, useMemo } from 'react';
import '../styles/components/EditRequestModal.css';
import { fetchRequestById, updateRequest } from '../api/RequestsAPI';
import { fetchTestsByRequestId } from '../api/TestsAPI';
import CreateTestModal from './CreateTestModal';

export default function EditRequestModal({ isOpen, onClose, requestId, onUpdated }) {
  const [priority, setPriority] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const [associatedTests, setAssociatedTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !requestId) return;

    const loadRequestData = async () => {
      setLoading(true);
      setError('');
      setFieldErrors({});
      try {
        const reqData = await fetchRequestById(requestId);

        setPriority(reqData.priority || 'MEDIUM');
        setRequestedBy(reqData.requestor || reqData.requestedBy || '');
        setRequestDate(reqData.requestDate || reqData.created_at || reqData.createdAt || '');
        setDueDate(reqData.dueDate || reqData.due_date || '');
        setDescription(reqData.description || '');

        const testsData = await fetchTestsByRequestId(requestId, { details: true });
        setAssociatedTests(Array.isArray(testsData) ? testsData : []);
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

      if (onUpdated) await onUpdated();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to update request.');
    } finally {
      setSaving(false);
    }
  };

  const formattedReqId = requestId ? `REQ-${String(requestId).padStart(4, '0')}` : '';
  const completedCount = associatedTests.filter(
    (t) => String(t.status).toUpperCase() === 'COMPLETED'
  ).length;

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return associatedTests;
    const q = searchQuery.toLowerCase();
    return associatedTests.filter(
      (t) =>
        String(t.vgcpid || t.id || '')
          .toLowerCase()
          .includes(q) ||
        String(t.title || t.description || '')
          .toLowerCase()
          .includes(q)
    );
  }, [associatedTests, searchQuery]);

  if (!isOpen) return null;

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
              {error && <div className="erm-error-msg">{error}</div>}

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
                    disabled={saving}
                    aria-invalid={fieldErrors.priority ? 'true' : 'false'}
                  >
                    <option value="CRITICAL">Critical Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                  {fieldErrors.priority && (
                    <div
                      className="field-error"
                      style={{ color: '#7a0000', fontSize: '12px', marginTop: '4px' }}
                    >
                      {fieldErrors.priority}
                    </div>
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
                    disabled={saving}
                    aria-invalid={fieldErrors.requestedBy ? 'true' : 'false'}
                  />
                  {fieldErrors.requestedBy && (
                    <div
                      className="field-error"
                      style={{ color: '#7a0000', fontSize: '12px', marginTop: '4px' }}
                    >
                      {fieldErrors.requestedBy}
                    </div>
                  )}
                </div>

                <div className="erm-field">
                  <label className="erm-label">Request Date*</label>
                  <input className="erm-input" type="date" value={requestDate || ''} disabled />
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
                    disabled={saving}
                    aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
                  />
                  {fieldErrors.dueDate && (
                    <div
                      className="field-error"
                      style={{ color: '#7a0000', fontSize: '12px', marginTop: '4px' }}
                    >
                      {fieldErrors.dueDate}
                    </div>
                  )}
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
                    disabled={saving}
                    aria-invalid={fieldErrors.description ? 'true' : 'false'}
                  />
                  {fieldErrors.description && (
                    <div
                      className="field-error"
                      style={{ color: '#7a0000', fontSize: '12px', marginTop: '4px' }}
                    >
                      {fieldErrors.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="erm-divider" />

              <div className="erm-section">
                <h3 className="erm-section-title">Associated Controls*</h3>
                <div className="erm-search-row">
                  <input
                    className="erm-search"
                    placeholder="Search controls..."
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={saving}
                  />
                  <span
                    onClick={() => setIsCreateTestOpen(true)}
                    disabled={saving}
                    style={{ marginLeft: '8px' }}
                  >
                    + Create New Control for this Request
                  </span>
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
                      const statusClass = String(test.status || 'Not Started')
                        .toLowerCase()
                        .replace(/\s+/g, '-');
                      return (
                        <div key={test.id || test.test_id} className="erm-test-item">
                          <div className="erm-test-main">
                            <div className="erm-test-title">
                              {test.vgcpid || test.id}:{' '}
                              {test.title || test.description || 'No Description'}
                            </div>
                            <div className="erm-test-meta">
                              <span className="meta-icon" style={{ marginRight: '4px' }}>
                                👤
                              </span>
                              {test.assignee || test.tester_name || 'Unassigned'}
                              <span
                                className={`status-pill ${statusClass}`}
                                style={{ marginLeft: '12px', padding: '2px 8px', fontSize: '11px' }}
                              >
                                {test.status || 'Not Started'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="erm-x"
                            onClick={() =>
                              alert(`Remove Test ${test.vgcpid} functionality coming soon!`)
                            }
                            disabled={saving}
                            title="Remove Control"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
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
          setAssociatedTests((prev) => [created, ...prev]);
          if (onUpdated) await onUpdated();
          setIsCreateTestOpen(false);
        }}
      />
    </div>
  );
}
