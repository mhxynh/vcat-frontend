import React, { useEffect } from 'react';

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  itemName,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClassName = 'dcm-confirm-btn dcm-confirm-btn--delete',
  cancelButtonClassName = 'dcm-confirm-btn dcm-confirm-btn--cancel',
  confirmDisabled = false,
  cancelDisabled = false,
  closeOnOverlay = true,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <div
      className="dcm-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-modal-title"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="dcm-confirm-modal" onMouseDown={stop}>
        <h2 id="confirm-action-modal-title" className="dcm-confirm-title">
          {title}
        </h2>

        <div className="dcm-confirm-message">
          {message ? <p className="dcm-confirm-question">{message}</p> : null}

          {itemName ? <p className="dcm-confirm-id">{itemName}</p> : null}

          {warning ? (
            <p className="dcm-confirm-warning">
              <strong>{warning}</strong>
            </p>
          ) : null}
        </div>

        <div className="dcm-confirm-actions">
          <button
            type="button"
            className={`${cancelButtonClassName} modal-action-cancel`}
            onClick={onClose}
            disabled={cancelDisabled}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`${confirmButtonClassName} modal-action-primary`}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
