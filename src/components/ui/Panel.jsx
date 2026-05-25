import React from 'react';
import './Panel.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function Panel({
  as: Component = 'div',
  children,
  className = '',
  tone = 'default',
  ...props
}) {
  return (
    <Component className={cx('app-panel', tone && `app-panel--${tone}`, className)} {...props}>
      {children}
    </Component>
  );
}
