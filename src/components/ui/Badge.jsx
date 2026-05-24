import React from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return (
    <span className={cx('badge', tone && `badge--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
