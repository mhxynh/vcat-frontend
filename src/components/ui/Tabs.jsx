import React from 'react';
import { cx } from '../../utils/classNames';
import './Tabs.css';

export default function Tabs({ children, className = '', ...props }) {
  return (
    <div className={cx('app-tabs', className)} {...props}>
      {children}
    </div>
  );
}

function TabButton({
  children,
  active = false,
  count,
  className = '',
  activeClassName = '',
  countClassName = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx('app-tab', className, active && 'app-tab--active', active && activeClassName)}
      {...props}
    >
      <span>{children}</span>
      {count > 0 ? <span className={cx('app-tab-count', countClassName)}>{count}</span> : null}
    </button>
  );
}

Tabs.Tab = TabButton;
