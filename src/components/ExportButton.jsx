import React from 'react';
import Icon from './common/Icon';

export default function ExportButton({
  isLoading = false,
  isPageLoading = false,
  disabled = false,
  onClick,
}) {
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <button
      className="btn btn--white export-button"
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="export-button__spinner" aria-hidden="true" />
      ) : (
        <Icon name="upload" category="actions" size="sm" color="#ffffff" />
      )}
      {isLoading ? 'Exporting...' : 'Export'}
    </button>
  );
}
