import React from 'react';
import './FeedbackState.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

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
