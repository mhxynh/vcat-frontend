import React, { useEffect } from 'react';
import '../styles/components/CreateTestModal.css';

export default function CreateTestModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Only close when clicking the overlay, not inside the modal
    if (e.target === e.currentTarget) onClose?.();
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div className="ctm-overlay" onMouseDown={handleOverlayClick} role="presentation">
      <div
        className="ctm-modal"
        onMouseDown={stop}
        role="dialog"
        aria-modal="true"
        aria-label="Create Control Test"
      >
        <div className="ctm-header">
          <h2 className="ctm-title">Create Control Test</h2>
          <button className="ctm-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="ctm-body">
          <div className="ctm-grid">
            <div className="ctm-field">
              <label className="ctm-label" htmlFor="vgcpid">
                VGCPID<span className="ctm-req">*</span>
              </label>
              <input id="vgcpid" className="ctm-input" type="text" />
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="linkToRequest">
                Link to Request<span className="ctm-req">*</span>
              </label>
              <select id="linkToRequest" className="ctm-select" defaultValue="" disabled>
                <option value="" disabled>
                  Select request
                </option>
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="tester">
                Tester
              </label>
              <select id="tester" className="ctm-select" defaultValue="" disabled>
                <option value="" disabled>
                  Select tester
                </option>
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="testType">
                Test Type<span className="ctm-req">*</span>
              </label>
              <select id="testType" className="ctm-select" defaultValue="">
                <option value="" disabled>
                  Select test type
                </option>
                <option value="DAT Only">DAT Only</option>
                <option value="OET Only">OET Only</option>
                <option value="DAT & OET">DAT &amp; OET</option>
              </select>
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="dueDate">
                Due Date<span className="ctm-req">*</span>
              </label>
              <input id="dueDate" className="ctm-input" type="date" />
            </div>

            <div className="ctm-field">
              <label className="ctm-label" htmlFor="etaDate">
                ETA Date
              </label>
              <input id="etaDate" className="ctm-input" type="date" />
            </div>

            <div className="ctm-field ctm-field--full">
              <label className="ctm-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="ctm-textarea"
                placeholder="Enter test description..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="ctm-footer">
          <button className="ctm-btn ctm-btn--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="ctm-btn ctm-btn--primary" type="button">
            Create Control Test
          </button>
        </div>
      </div>
    </div>
  );
}
