import React, { useEffect, useState } from 'react';
import '../styles/components/CreateRequestModal.css';
import { createRequest } from '../api/RequestsAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DUMMY_CURRENT_USER_ID = 1;

export default function CreateRequestModal({ isOpen, onClose, onCreated }) {
  const [priority, setPriority] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const [requestDate, setRequestDate] = useState(todayIso());
  const currentYear = new Date().getFullYear();

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setFieldErrors({});
    setPriority('');
    setRequestedBy('');
    setRequestDate(todayIso());
    setDueDate('');
    setDescription('');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
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

    try {
      setSubmitting(true);

      const createdReq = await createRequest({
        requestor: requestedBy.trim(),
        dueDate: dueDate,
        priority: String(priority).toUpperCase(),
        description: description.trim(),
        createdBy: DUMMY_CURRENT_USER_ID,
      });

      await onCreated?.(createdReq);

      showSuccessToast({
        title: 'Request Created',
        message: 'The request has been created successfully.',
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to create request.';
      showErrorToast({
        title: 'Request Create Failed',
        message: `An error occurred while creating the request: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="crm-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="presentation"
    >
      <div className="crm-modal" role="dialog" aria-modal="true" aria-label="Create New Request">
        <div className="crm-header">
          <h2 className="crm-title">Create New Request</h2>
          <button className="crm-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="crm-body" onSubmit={handleSubmit}>
          <div className="crm-grid">
            <div className="crm-field">
              <label className="crm-label">
                Request ID
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="crm-input"
                value={`REQ-${currentYear}-(Auto-generated)`}
                title="This ID will be generated automatically upon creation"
                disabled
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Priority
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                className="crm-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={submitting}
                aria-invalid={fieldErrors.priority ? 'true' : 'false'}
              >
                <option value="" disabled></option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              {fieldErrors.priority ? (
                <div className="field-error">{fieldErrors.priority}</div>
              ) : null}
            </div>

            <div className="crm-field crm-field--full">
              <label className="crm-label">
                Requested By
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="crm-input"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                disabled={submitting}
                placeholder="Enter requester name..."
                aria-invalid={fieldErrors.requestedBy ? 'true' : 'false'}
              />
              {fieldErrors.requestedBy ? (
                <div className="field-error">{fieldErrors.requestedBy}</div>
              ) : null}
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Request Date
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="crm-input"
                type="date"
                value={requestDate}
                title="Matches the database created_at timestamp"
                disabled
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">
                Due Date
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="crm-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
                aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
              />
              {fieldErrors.dueDate ? (
                <div className="field-error">{fieldErrors.dueDate}</div>
              ) : null}
            </div>

            <div className="crm-field crm-field--full">
              <label className="crm-label">
                Description
                <span className="crm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                className="crm-textarea"
                placeholder="Describe the purpose of this request..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                aria-invalid={fieldErrors.description ? 'true' : 'false'}
              />
              {fieldErrors.description ? (
                <div className="field-error">{fieldErrors.description}</div>
              ) : null}
            </div>
          </div>
        </form>

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
            className="crm-btn crm-btn--primary"
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
