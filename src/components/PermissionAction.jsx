import React from 'react';
import RestrictedAction from './RestrictedAction';
import { showErrorToast } from '../utils/toast';

export default function PermissionAction({ action, children }) {
  function handleClick(e) {
    const blockedWrapper = e.target.closest('.restricted-action--blocked');
    if (!blockedWrapper) return;

    e.preventDefault();
    e.stopPropagation();
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

  return (
    <div onClick={handleClick}>
      <RestrictedAction action={action}>{children}</RestrictedAction>
    </div>
  );
}
