import React from 'react';
import './SearchInput.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function SearchIcon({ className = '' }) {
  return (
    <span className={cx('app-search-input__icon', className)} aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path
          d="M10.75 10.75L14 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
  inputClassName = '',
  iconClassName = '',
  disabled = false,
  onFocus,
  title,
  ...props
}) {
  return (
    <div className={cx('app-search-input', disabled && 'app-search-input--disabled', className)}>
      <SearchIcon className={iconClassName} />
      <input
        type="text"
        className={cx('app-search-input__control', inputClassName)}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        onFocus={onFocus}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel || placeholder}
        {...props}
      />
    </div>
  );
}
