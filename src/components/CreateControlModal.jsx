import React, { useEffect, useState } from 'react';
import { createControl } from '../api/ControlsAPI';

export default function CreateControlModal({ isOpen, onClose, onCreated }) {
  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(false);

  // initialStatus is not in the backend for vcat-backend/src/controls/main.py, so it is currently just UI only.
  const [initialStatus, setInitialStatus] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid('');
    setDescription('');
    setControlOwner('');
    setControlSme('');
    setEscalation(false);
    setInitialStatus('');
    setError('');
    setSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  async function handleCreate() {
    setError('');

    // Mandatory: vgcpid, description, control_owner, control_sme
    if (!vgcpid.trim() || !description.trim() || !controlOwner.trim() || !controlSme.trim()) {
      setError('Please fill in Control ID, Description, Control Owner, and Control SME.');
      return;
    }

    //the camelcase bug cant really be fixed since the backend is expecting control_owner and control_sme.
    setSubmitting(true);
    try {
      await createControl({
        vgcpid: vgcpid.trim(),
        description: description.trim(),
        control_owner: controlOwner.trim(),
        control_sme: controlSme.trim(),
        escalation,
      });

      if (onCreated) await onCreated();
      onClose();
    } catch (e) {
      setError(e?.message || 'Failed to create control');
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

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">
                Control ID <span aria-hidden="true">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. VGCP-123456"
                value={vgcpid}
                onChange={(e) => setVgcpid(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Initial Status</label>
              <input
                className="form-input"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
              />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">
                Description <span aria-hidden="true">*</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Enter detailed control description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Control Owner <span aria-hidden="true">*</span>
              </label>
              <input
                className="form-input"
                placeholder="Name"
                value={controlOwner}
                onChange={(e) => setControlOwner(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Control SME <span aria-hidden="true">*</span>
              </label>
              <input
                className="form-input"
                placeholder="Name"
                value={controlSme}
                onChange={(e) => setControlSme(e.target.value)}
                required
              />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">
                Escalation Required? <span aria-hidden="true">*</span>
              </label>

              <div className="radio-row" role="radiogroup" aria-label="Escalation Required">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="escalation"
                    checked={escalation === true}
                    onChange={() => setEscalation(true)}
                    required
                  />
                  <span>Yes</span>
                </label>

                <label className="radio-item">
                  <input
                    type="radio"
                    name="escalation"
                    checked={escalation === false}
                    onChange={() => setEscalation(false)}
                    required
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

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
