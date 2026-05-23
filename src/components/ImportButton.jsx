import React from 'react';
import Icon from './common/Icon';
import { Button } from './ui';

export default function ImportButton({ isPageLoading = false, disabled = false, onClick }) {
  const isDisabled = disabled || isPageLoading;

  return (
    <Button className="btn btn--import" variant="warning" onClick={onClick} disabled={isDisabled}>
      <Icon name="upload" category="actions" size="sm" color="#ffffff" />
      Import
    </Button>
  );
}
