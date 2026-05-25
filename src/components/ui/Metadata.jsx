import React from 'react';
import './Metadata.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function MetadataGrid({ children, className = '', ...props }) {
  return (
    <div className={cx('metadata-grid', className)} {...props}>
      {children}
    </div>
  );
}

export function MetadataItem({
  label,
  value,
  children,
  className = '',
  labelClassName = '',
  valueClassName = '',
}) {
  return (
    <div className={cx('metadata-item', className)}>
      <div className={cx('metadata-label', labelClassName)}>{label}</div>
      <div className={cx('metadata-value', valueClassName)}>{children ?? value ?? '-'}</div>
    </div>
  );
}
