import React from 'react';
import './ModalCloseButton.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function ModalCloseButton({
  className = '',
  label = 'Close',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx('modal-close-button', className)}
      aria-label={label}
      {...props}
    >
      <span className="modal-close-button__icon" aria-hidden="true">
        &times;
      </span>
    </button>
  );
}
