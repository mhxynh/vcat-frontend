import React, { useEffect, useState } from 'react';
import { createControl } from '../api/ControlsAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';

export default function CreateControlModal({ isOpen, onClose, onCreated }) {
  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(null);
  const [initialStatus, setInitialStatus] = useState('active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid('');
    setDescription('');
    setControlOwner('');
    setControlSme('');
    setEscalation(null);
    setInitialStatus('active');
    setError('');
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
    setError('');
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

      if (onCreated) await onCreated();

      showSuccessToast({
        title: 'Control Created',
        message: `${trimmedId} has been created successfully.`,
      });

      onClose();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to create control';
      setError(errorMessage);

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
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-control-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="create-control-title">
            Create New Control
          </h2>

          <button type="button" className="modal-x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={handleCreate}>
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">
                Control ID{' '}
                <span className="form-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. VGCP-123456"
                value={vgcpid}
                onChange={(e) => setVgcpid(e.target.value)}
                aria-invalid={fieldErrors.vgcpid ? 'true' : 'false'}
              />
              {fieldErrors.vgcpid ? <div className="field-error">{fieldErrors.vgcpid}</div> : null}
            </div>

            <div className="form-field">
              <label className="form-label">
                Initial Status{' '}
                <span className="form-req" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                className="form-input"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
              >
                <option value="active">Active</option>
              </select>
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">
                Description{' '}
                <span className="form-req" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Enter detailed control description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={fieldErrors.description ? 'true' : 'false'}
              />
              {fieldErrors.description ? (
                <div className="field-error">{fieldErrors.description}</div>
              ) : null}
            </div>

            <div className="form-field">
              <label className="form-label">
                Control Owner{' '}
                <span className="form-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="form-input"
                placeholder="Name"
                value={controlOwner}
                onChange={(e) => setControlOwner(e.target.value)}
                aria-invalid={fieldErrors.controlOwner ? 'true' : 'false'}
              />
              {fieldErrors.controlOwner ? (
                <div className="field-error">{fieldErrors.controlOwner}</div>
              ) : null}
            </div>

            <div className="form-field">
              <label className="form-label">Control SME</label>
              <input
                className="form-input"
                placeholder="Name"
                value={controlSme}
                onChange={(e) => setControlSme(e.target.value)}
              />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">
                Escalation Required?{' '}
                <span className="form-req" aria-hidden="true">
                  *
                </span>
              </label>

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
              {fieldErrors.escalation ? (
                <div className="field-error">{fieldErrors.escalation}</div>
              ) : null}
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" className="btn btn--white" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn--red"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Control'}
          </button>
        </div>
      </div>
    </div>
  );
}
