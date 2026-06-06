import React from 'react';
import Icon from './common/Icon';
import { Button } from './ui';

export default function RefreshButton({
  isLoading = false,
  isPageLoading = false,
  disabled = false,
  onClick,
}) {
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <Button
      className="btn btn--blue refresh-button"
      variant="info"
      onClick={onClick}
      disabled={isDisabled}
      isLoading={isLoading}
    >
      {!isLoading ? <Icon name="refresh" category="actions" size="sm" color="#ffffff" /> : null}
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}
