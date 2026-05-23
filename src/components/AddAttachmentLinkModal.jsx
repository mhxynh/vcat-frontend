import React, { useEffect, useState } from 'react';
import '../styles/components/AddAttachmentLinkModal.css';

export default function AddAttachmentLinkModal({ isOpen, onClose, onAdd, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setError('');
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError('Enter a valid URL that includes the protocol, such as https://');
      return;
    }

    try {
      await onAdd(trimmedUrl);
      setUrl('');
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to add link. Please try again.');
    }
  }

  const handleCancel = () => {
    if (isLoading) return;
    setUrl('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="aalm-overlay" onClick={handleCancel} role="presentation">
      <div
        className="aalm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-attachment-link-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aalm-header">
          <h2 className="aalm-title" id="add-attachment-link-title">
            Add Attachment Link
          </h2>
          <button
            className="aalm-close"
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="aalm-body">
          <p className="aalm-description">
            Add a link to an external file or document to attach to this control test.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="aalm-form-group">
              <label htmlFor="aalm-url" className="aalm-label">
                Link URL
              </label>
              <input
                id="aalm-url"
                type="url"
                className={`aalm-input ${error ? 'aalm-input--error' : ''}`}
                placeholder="https://example.com/file.pdf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              {error && <div className="aalm-error">{error}</div>}
            </div>

            <div className="aalm-footer">
              <button
                type="button"
                className="aalm-btn aalm-btn--cancel modal-action-cancel"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="aalm-btn aalm-btn--primary modal-action-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
