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

  const handleSubmit = (e) => {
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

    onAdd(trimmedUrl);
    setUrl('');
    setError('');
  };

  const handleCancel = () => {
    setUrl('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="aalm-overlay" onClick={handleCancel}>
      <div className="aalm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aalm-header">
          <h2 className="aalm-title">Add Attachment Link</h2>
          <button className="aalm-close" type="button" onClick={handleCancel}>
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
                type="text"
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
                className="aalm-btn aalm-btn--cancel"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" className="aalm-btn aalm-btn--primary" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
