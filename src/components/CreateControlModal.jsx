import React, { useEffect, useState } from 'react';
import { createControl } from '../api/ControlsAPI';
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

export default function CreateControlModal({ isOpen, onClose, onCreated }) {
  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(null);
  const [initialStatus, setInitialStatus] = useState('active');

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid('');
    setDescription('');
    setControlOwner('');
    setControlSme('');
    setEscalation(null);
    setInitialStatus('active');
    setSubmitting(false);
    setFieldErrors({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  async function handleCreate(e) {
    e?.preventDefault();
    setFieldErrors({});

    const errs = {};
    if (!vgcpid.trim()) errs.vgcpid = 'Control ID is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!controlOwner.trim()) errs.controlOwner = 'Control Owner is required.';
    if (escalation === null) errs.escalation = 'Please select Yes or No.';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);

    try {
      const trimmedId = vgcpid.trim();
      const isActive = initialStatus === 'active';

      await createControl({
        vgcpid: trimmedId,
        description: description.trim(),
        controlOwner: controlOwner.trim(),
        controlSme: controlSme.trim(),
        escalation,
        isActive,
      });

      showSuccessToast({
        title: 'Control Created',
        message: `${trimmedId} has been created successfully.`,
      });

      onClose();

      if (onCreated) {
        Promise.resolve(onCreated()).catch(() => {
          showErrorToast({
            title: 'Refresh Failed',
            message:
              'The control was created, but the list could not refresh. Please try refreshing.',
          });
        });
      }
    } catch (e) {
      const errorMessage = e?.message || 'Failed to create control';
      showErrorToast({
        title: 'Control Create Failed',
        message: `An error occurred while creating the control: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      className="modal"
      overlayClassName="modal-overlay"
      labelledBy="create-control-title"
      onClose={onClose}
    >
      <Modal.Header
        className="modal-header"
        titleClassName="modal-title"
        closeClassName="modal-x"
        title="Create New Control"
        titleId="create-control-title"
        onClose={onClose}
      />

      <Modal.Body as="form" className="modal-body" onSubmit={handleCreate}>
        <FormGrid className="modal-grid">
          <FormField label="Control ID" required error={fieldErrors.vgcpid}>
            <FormInput
              className="form-input"
              placeholder="e.g. VGCP-123456"
              value={vgcpid}
              onChange={(e) => setVgcpid(e.target.value)}
              aria-invalid={fieldErrors.vgcpid ? 'true' : 'false'}
            />
          </FormField>

          <FormField label="Initial Status" required>
            <FormSelect
              className="form-input"
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
            >
              <option value="active">Active</option>
            </FormSelect>
          </FormField>

          <FormField label="Description" required error={fieldErrors.description} full>
            <FormTextarea
              className="form-textarea"
              placeholder="Enter detailed control description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={fieldErrors.description ? 'true' : 'false'}
            />
          </FormField>

          <FormField label="Control Owner" required error={fieldErrors.controlOwner}>
            <FormInput
              className="form-input"
              placeholder="Last name, first name"
              value={controlOwner}
              onChange={(e) => setControlOwner(e.target.value)}
              aria-invalid={fieldErrors.controlOwner ? 'true' : 'false'}
            />
          </FormField>

          <FormField label="Control SME">
            <FormInput
              className="form-input"
              placeholder="Last name, first name"
              value={controlSme}
              onChange={(e) => setControlSme(e.target.value)}
            />
          </FormField>

          <FormField label="Escalation Required?" required error={fieldErrors.escalation} full>
            <div
              className={`radio-row ${fieldErrors.escalation ? 'invalid' : ''}`}
              role="radiogroup"
              aria-label="Escalation Required"
            >
              <label className="radio-item">
                <input
                  type="radio"
                  name="escalation"
                  checked={escalation === true}
                  onChange={() => setEscalation(true)}
                />
                <span>Yes</span>
              </label>

              <label className="radio-item">
                <input
                  type="radio"
                  name="escalation"
                  checked={escalation === false}
                  onChange={() => setEscalation(false)}
                />
                <span>No</span>
              </label>
            </div>
          </FormField>
        </FormGrid>
      </Modal.Body>

      <Modal.Footer className="modal-footer">
        <ActionButton
          type="button"
          variant="cancel"
          className="btn btn--white"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </ActionButton>

        <ActionButton
          type="button"
          className="btn btn--red"
          onClick={handleCreate}
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Control'}
        </ActionButton>
      </Modal.Footer>
    </Modal>
  );
}
