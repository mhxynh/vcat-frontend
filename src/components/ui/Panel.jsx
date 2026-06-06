import React from 'react';
import { cx } from '../../utils/classNames';
import './Panel.css';

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
