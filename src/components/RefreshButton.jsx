import React from 'react';
import Icon from './common/Icon';

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
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="refresh-button__spinner" aria-hidden="true" />
      ) : (
        <Icon name="refresh" category="actions" size="sm" color="#ffffff" />
      )}
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
