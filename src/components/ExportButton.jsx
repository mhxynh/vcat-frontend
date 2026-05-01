import React from 'react';

export default function ExportButton({ isLoading = false, disabled = false, onClick }) {
  return (
    <button
      className="btn btn--white export-button"
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading && <span className="export-button__spinner" aria-hidden="true" />}
      {isLoading ? 'Exporting...' : 'Export'}
    </button>
  );
}
