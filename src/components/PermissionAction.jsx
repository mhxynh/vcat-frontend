import React from 'react';
import RestrictedAction from './RestrictedAction';
import { showPermissionDeniedToast } from '../utils/toast';

export default function PermissionAction({ action, children }) {
  function handleClick(e) {
    const blockedWrapper = e.target.closest('.restricted-action--blocked');
    if (!blockedWrapper) return;

    e.preventDefault();
    e.stopPropagation();
    showPermissionDeniedToast();
  }

  return (
    <div onClick={handleClick}>
      <RestrictedAction action={action}>{children}</RestrictedAction>
    </div>
  );
}
