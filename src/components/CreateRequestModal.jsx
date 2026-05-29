import React, { useEffect, useState } from 'react';
import '../styles/components/CreateRequestModal.css';
import { createRequest } from '../api/RequestsAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  ActionButton,
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
} from './ui';

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DUMMY_CURRENT_USER_ID = 1;
const DEFAULT_PRIORITY = 'LOW';

export default function CreateRequestModal({ isOpen, onClose, onCreated }) {
  const [priority, setPriority] = useState(DEFAULT_PRIORITY);
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
    setPriority(DEFAULT_PRIORITY);
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
    <Modal
      className="crm-modal"
      overlayClassName="crm-overlay"
      labelledBy="create-request-title"
      onClose={onClose}
    >
      <Modal.Header
        className="crm-header"
        titleClassName="crm-title"
        closeClassName="crm-close"
        title="Create New Request"
        titleId="create-request-title"
        onClose={onClose}
      />

      <Modal.Body as="form" className="crm-body" onSubmit={handleSubmit}>
        <FormGrid className="crm-grid">
          <FormField label="Request ID" required>
            <FormInput
              className="crm-input"
              value={`REQ-${currentYear}-(Auto-generated)`}
              title="This ID will be generated automatically upon creation"
              disabled
            />
          </FormField>

          <FormField label="Priority" required error={fieldErrors.priority}>
            <FormSelect
              className="crm-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={submitting}
              aria-invalid={fieldErrors.priority ? 'true' : 'false'}
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </FormSelect>
          </FormField>

          <FormField label="Requested By" required error={fieldErrors.requestedBy} full>
            <FormInput
              className="crm-input"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              disabled={submitting}
              placeholder="Name"
              aria-invalid={fieldErrors.requestedBy ? 'true' : 'false'}
            />
          </FormField>

          <FormField label="Request Date" required>
            <FormInput
              className="crm-input"
              type="date"
              value={requestDate}
              title="Matches the database created_at timestamp"
              disabled
            />
          </FormField>

          <FormField label="Due Date" required error={fieldErrors.dueDate}>
            <FormInput
              className="crm-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
              aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
            />
          </FormField>

          <FormField label="Description" required error={fieldErrors.description} full>
            <FormTextarea
              className="crm-textarea"
              placeholder="Describe the purpose of this request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              aria-invalid={fieldErrors.description ? 'true' : 'false'}
            />
          </FormField>
        </FormGrid>
      </Modal.Body>

      <Modal.Footer className="crm-footer">
        <ActionButton
          className="crm-btn crm-btn--ghost"
          variant="cancel"
          type="button"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </ActionButton>

        <ActionButton
          className="crm-btn crm-btn--primary"
          type="submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Request'}
        </ActionButton>
      </Modal.Footer>
    </Modal>
  );
}
