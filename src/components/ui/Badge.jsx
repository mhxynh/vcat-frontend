import React from 'react';
import { cx } from '../../utils/classNames';

export default function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return (
    <span className={cx('badge', tone && `badge--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
