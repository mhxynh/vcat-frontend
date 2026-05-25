import React, { forwardRef } from 'react';
import './Form.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function FormGrid({ children, className = '' }) {
  return <div className={cx('app-form-grid', className)}>{children}</div>;
}

export function FormField({
  children,
  label,
  htmlFor,
  required = false,
  error,
  full = false,
  className = '',
  labelClassName = '',
  requiredClassName = '',
  errorClassName = '',
}) {
  return (
    <div className={cx('app-form-field', full && 'app-form-field--full', className)}>
      {label ? (
        <label htmlFor={htmlFor} className={cx('app-form-label', labelClassName)}>
          {label}
          {required ? (
            <span className={cx('app-form-required', requiredClassName)} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? <div className={cx('field-error', errorClassName)}>{error}</div> : null}
    </div>
  );
}

export const FormInput = forwardRef(function FormInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={cx('app-form-control', className)} {...props} />;
});

export const FormSelect = forwardRef(function FormSelect(
  { className = '', children, ...props },
  ref
) {
  return (
    <select ref={ref} className={cx('app-form-control', className)} {...props}>
      {children}
    </select>
  );
});

export const FormTextarea = forwardRef(function FormTextarea({ className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx('app-form-control app-form-textarea', className)}
      {...props}
    />
  );
});
