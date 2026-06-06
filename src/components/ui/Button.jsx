import React from 'react';
import { cx } from '../../utils/classNames';

const variantClassByLegacyClass = {
  'btn--white': 'success',
  'btn--blue': 'info',
  'btn--red': 'danger',
  'btn--import': 'warning',
  'btn--new': 'primary',
};

function legacyVariantFromClassName(className = '') {
  const classList = className.split(/\s+/);
  const legacyClass = classList.find((item) => variantClassByLegacyClass[item]);
  return legacyClass ? variantClassByLegacyClass[legacyClass] : null;
}

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  variant,
  size = 'md',
  isLoading = false,
  disabled = false,
  type,
  ...props
}) {
  const resolvedVariant = variant || legacyVariantFromClassName(className) || 'neutral';
  const isButton = Component === 'button';
  const isDisabled = disabled || isLoading;

  return (
    <Component
      className={cx('ui-button', `ui-button--${resolvedVariant}`, `ui-button--${size}`, className)}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={isLoading || undefined}
      type={isButton ? type || 'button' : undefined}
      {...props}
    >
      {isLoading ? <span className="ui-button__spinner" aria-hidden="true" /> : null}
      {children}
    </Component>
  );
}
