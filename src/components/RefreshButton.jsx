import React from 'react';

export default function RefreshButton({
  isLoading = false,
  isPageLoading = false,
  disabled = false,
  onClick,
}) {
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <button
      className="btn btn--blue refresh-button"
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading || isPageLoading}
    >
      {(isLoading || isPageLoading) && (
        <span className="refresh-button__spinner" aria-hidden="true" />
      )}
      {isLoading || isPageLoading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
