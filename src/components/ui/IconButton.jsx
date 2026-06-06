import React from 'react';
import { cx } from '../../utils/classNames';
import './IconButton.css';

export default function IconButton({
  as: Component = 'button',
  children,
  className = '',
  label,
  type,
  disabled = false,
  ...props
}) {
  const isButton = Component === 'button';

  return (
    <Component
      className={cx('app-icon-button', className)}
      aria-label={label}
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? disabled : undefined}
      aria-disabled={!isButton && disabled ? true : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
