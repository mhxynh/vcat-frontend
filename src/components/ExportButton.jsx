import React from 'react';

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
      {isLoading && <span className="export-button__spinner" aria-hidden="true" />}
      {isLoading ? 'Exporting...' : 'Export'}
    </button>
  );
}
