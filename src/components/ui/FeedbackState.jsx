import React from 'react';
import { cx } from '../../utils/classNames';
import './FeedbackState.css';

export function LoadingState({ children = 'Loading...', className = '', ...props }) {
  return (
    <div className={cx('app-feedback-state app-feedback-state--loading', className)} {...props}>
      {children}
    </div>
  );
}

export function EmptyState({ children, className = '', ...props }) {
  return (
    <div className={cx('app-feedback-state app-feedback-state--empty', className)} {...props}>
      {children}
    </div>
  );
}

export function ErrorState({ children, className = '', prefix = 'Error: ', ...props }) {
  return (
    <div className={cx('app-feedback-state app-feedback-state--error', className)} {...props}>
      {prefix}
      {children}
    </div>
  );
}
