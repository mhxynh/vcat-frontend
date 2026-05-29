import React from 'react';
import { cx } from '../../utils/classNames';

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
  buttonClassName = '',
  activeButtonClassName = '',
  ariaLabel,
}) {
  return (
    <div className={cx('segmented-control', className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const itemValue = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        const isActive = itemValue === value;

        return (
          <button
            key={itemValue}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cx(
              'segmented-control__button',
              buttonClassName,
              isActive && 'segmented-control__button--active',
              isActive && activeButtonClassName
            )}
            onClick={() => onChange?.(itemValue)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
