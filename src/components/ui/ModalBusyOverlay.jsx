import React from 'react';
import { cx } from '../../utils/classNames';
import './ModalBusyOverlay.css';

export default function ModalBusyOverlay({
  visible,
  message = 'Updating...',
  className = '',
  cardClassName = '',
  spinnerClassName = '',
  textClassName = '',
}) {
  if (!visible) return null;

  return (
    <div className={cx('modal-busy-overlay', className)} role="status" aria-live="polite">
      <div className={cx('modal-busy-card', cardClassName)}>
        <span className={cx('modal-busy-spinner', spinnerClassName)} aria-hidden="true" />
        <span className={cx('modal-busy-text', textClassName)}>{message}</span>
      </div>
    </div>
  );
}
