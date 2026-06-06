import React from 'react';
import { cx } from '../../utils/classNames';
import ModalCloseButton from './ModalCloseButton';
import './Modal.css';

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

function ModalBody({ as: Component = 'div', children, className = '', ...props }) {
  return (
    <Component className={cx('app-modal-body', className)} {...props}>
      {children}
    </Component>
  );
}

function ModalSection({ as: Component = 'section', children, className = '', ...props }) {
  return (
    <Component className={cx('app-modal-section', className)} {...props}>
      {children}
    </Component>
  );
}

function ModalDivider({ className = '', ...props }) {
  return <div className={cx('app-modal-divider', className)} {...props} />;
}

function ModalSectionTitle({ children, className = '', icon = null, iconClassName = '' }) {
  return (
    <div className={cx('app-modal-section-title', className)}>
      {icon ? (
        <span className={cx('app-modal-section-title-icon', iconClassName)} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </div>
  );
}

function ModalFooter({ children, className = '' }) {
  return <div className={cx('app-modal-footer', className)}>{children}</div>;
}

function ModalActionFooter({ children, actions, className = '', actionsClassName = '' }) {
  return (
    <div className={cx('app-modal-action-footer', className)}>
      {children}
      <div className={cx('app-modal-action-footer-actions', actionsClassName)}>{actions}</div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Section = ModalSection;
Modal.Divider = ModalDivider;
Modal.SectionTitle = ModalSectionTitle;
Modal.Footer = ModalFooter;
Modal.ActionFooter = ModalActionFooter;

export default Modal;
