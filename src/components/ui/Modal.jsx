import React from 'react';
import ModalCloseButton from './ModalCloseButton';
import './Modal.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function Modal({
  children,
  className = '',
  overlayClassName = '',
  onClose,
  closeOnOverlayClick = true,
  labelledBy,
  ...props
}) {
  return (
    <div
      className={cx('app-modal-overlay', overlayClassName)}
      role="presentation"
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cx('app-modal', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  titleId,
  children,
  className = '',
  titleClassName = '',
  closeClassName = '',
  onClose,
  closeDisabled = false,
}) {
  return (
    <div className={cx('app-modal-header', className)}>
      <h2 className={cx('app-modal-title', titleClassName)} id={titleId}>
        {title}
      </h2>
      {children}
      {onClose ? (
        <ModalCloseButton className={closeClassName} onClick={onClose} disabled={closeDisabled} />
      ) : null}
    </div>
  );
}

function ModalBody({ children, className = '', ...props }) {
  return (
    <div className={cx('app-modal-body', className)} {...props}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className = '' }) {
  return <div className={cx('app-modal-footer', className)}>{children}</div>;
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
