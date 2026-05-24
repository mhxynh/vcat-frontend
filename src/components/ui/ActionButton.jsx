import React from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function ActionButton({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  isLoading = false,
  isPageLoading = false,
  type,
  ...props
}) {
  const isButton = Component === 'button';
  const actionClass = variant === 'cancel' ? 'modal-action-cancel' : 'modal-action-primary';
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <Component
      className={cx(className, actionClass)}
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={isLoading || undefined}
      {...props}
    />
  );
}
