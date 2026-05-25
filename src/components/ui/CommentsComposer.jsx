import React from 'react';
import ActionButton from './ActionButton';
import './CommentsComposer.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function CommentsComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a comment...',
  inputDisabled = false,
  submitDisabled = false,
  isSubmitting = false,
  className = '',
  inputClassName = '',
  buttonClassName = '',
  iconClassName = '',
  submitLabel = 'Send',
  submitIcon = '➤',
}) {
  function handleKeyDown(e) {
    if (e.key !== 'Enter' || inputDisabled || submitDisabled) return;
    e.preventDefault();
    onSubmit?.();
  }

  return (
    <div className={cx('comments-composer', className)}>
      <input
        className={cx('comments-composer-input', inputClassName)}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={inputDisabled}
        onKeyDown={handleKeyDown}
      />
      <ActionButton
        className={cx('comments-composer-send', buttonClassName)}
        type="button"
        onClick={onSubmit}
        aria-label={submitLabel}
        isLoading={isSubmitting}
        disabled={submitDisabled}
      >
        <span className={cx('comments-composer-icon', iconClassName)}>
          {isSubmitting ? '...' : submitIcon}
        </span>
      </ActionButton>
    </div>
  );
}
