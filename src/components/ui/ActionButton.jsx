import React from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function ActionButton({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  type,
  ...props
}) {
  const isButton = Component === 'button';
  const actionClass = variant === 'cancel' ? 'modal-action-cancel' : 'modal-action-primary';

  return (
    <Component
      className={cx(className, actionClass)}
      type={isButton ? type || 'button' : undefined}
      {...props}
    />
  );
}
