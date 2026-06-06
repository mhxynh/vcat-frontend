import React from 'react';
import Icon from './common/Icon';
import { Button } from './ui';

export default function ExportButton({
  isLoading = false,
  isPageLoading = false,
  disabled = false,
  onClick,
}) {
  const isDisabled = disabled || isLoading || isPageLoading;

  return (
    <Button
      className="btn btn--white export-button"
      variant="success"
      onClick={onClick}
      disabled={isDisabled}
      isLoading={isLoading}
    >
      {!isLoading ? <Icon name="upload" category="actions" size="sm" color="#ffffff" /> : null}
      {isLoading ? 'Exporting...' : 'Export'}
    </Button>
  );
}
