import React, { useEffect } from 'react';

export default function CreateControlModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

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

          <button
            type="button"
            className="modal-x"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="form-field">
              <label className="form-label">Control ID</label>
              <input className="form-input" placeholder="e.g. VGCP-123456" />
            </div>

            <div className="form-field">
              <label className="form-label">Initial Status</label>
              <input className="form-input" />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Enter detailed control description..."
                rows={4}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Control Owner</label>
              <input className="form-input" placeholder="Name" />
            </div>

            <div className="form-field">
              <label className="form-label">Control SME</label>
              <input className="form-input" placeholder="Name" />
            </div>

            <div className="form-field form-field--full">
              <label className="form-label">Escalation Required?</label>
              <div
                className="radio-row"
                role="radiogroup"
                aria-label="Escalation Required"
              >
                <label className="radio-item">
                  <input type="radio" name="escalation" />
                  <span>Yes</span>
                </label>

                <label className="radio-item">
                  <input type="radio" name="escalation" defaultChecked />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--white" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="btn btn--red">
            Create Control
          </button>
        </div>
      </div>
    </div>
  );
}
