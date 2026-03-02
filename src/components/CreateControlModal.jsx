import React, { useEffect, useState } from 'react';
import { createControl } from '../api/ControlsAPI';

export default function CreateControlModal({ isOpen, onClose, onCreated }) {
  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(false);
  const [initialStatus, setInitialStatus] = useState('active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid('');
    setDescription('');
    setControlOwner('');
    setControlSme('');
    setEscalation(false);

    // FE default: Active
    setInitialStatus('active');

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
    if (!vgcpid.trim() || !description.trim() || !controlOwner.trim()) {
      setError('Please fill in Control ID, Description, Control Owner, and Escalation.');
      return;
    }

    setSubmitting(true);
    try {
      const isActive = initialStatus === 'active';

      await createControl({
        vgcpid: vgcpid.trim(),
        description: description.trim(),
        controlOwner: controlOwner.trim(),
        controlSme: controlSme.trim(),
        escalation,
        isActive: isActive,
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

        <form className="modal-body" onSubmit={handleCreate}>
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
              <label className="form-label">
                Initial Status <span aria-hidden="true">*</span>
              </label>
              <select
                className="form-input"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
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
              <label className="form-label">Control SME</label>
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
