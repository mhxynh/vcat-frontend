import React from 'react';
import Icon from './common/Icon';
import { Button } from './ui';

export default function ImportButton({
  isLoading = false,
  isPageLoading = false,
  disabled = false,
  onClick,
}) {
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <Button
      className="btn btn--import"
      variant="warning"
      onClick={onClick}
      disabled={isDisabled}
      isLoading={isLoading}
    >
      {!isLoading ? <Icon name="download" category="actions" size="sm" color="#ffffff" /> : null}
      {isLoading ? 'Importing...' : 'Import'}
    </Button>
  );
}
