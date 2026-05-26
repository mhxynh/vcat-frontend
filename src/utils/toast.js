import { toast } from 'react-toastify';
import AppToast from '../components/toast/AppToast';

const commonOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: false,
  draggable: false,
  closeButton: true,
  icon: false,
};

export function getUserFriendlyErrorMessage(
  message,
  fallback = 'Something went wrong. Please try again.'
) {
  const text = String(message || '').trim();
  if (!text) return fallback;

  const normalized = text.toLowerCase();

  if (
    normalized.includes('foreign key constraint') ||
    normalized.includes('violates foreign key') ||
    normalized.includes('is still referenced')
  ) {
    if (normalized.includes('table "controls"') || normalized.includes('tests_control_id_fkey')) {
      return 'This control cannot be deleted because it is still linked to one or more control tests. Remove or archive the related tests first, then try again.';
    }

    if (normalized.includes('table "requests"') || normalized.includes('tests_request_id_fkey')) {
      return 'This request cannot be deleted because it still has related control tests. Remove or archive the related tests first, then try again.';
    }

    return 'This item cannot be deleted because it is still linked to other records. Remove the related items first, then try again.';
  }

  if (normalized.includes('duplicate key') || normalized.includes('already exists')) {
    return 'This item already exists. Check the details and try again.';
  }

  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  return text;
}

export function showSuccessToast({ title, message }) {
  toast(<AppToast type="success" title={title} message={message} />, {
    ...commonOptions,
    type: 'success',
  });
}

export function showErrorToast({ title, message }) {
  toast(<AppToast type="error" title={title} message={getUserFriendlyErrorMessage(message)} />, {
    ...commonOptions,
    type: 'error',
  });
}

export function showPermissionDeniedToast() {
  showErrorToast({
    title: 'Permission Denied',
    message: 'Only managers have permission for this action. Contact a manager for access.',
  });
}

export function showWarningToast({ title, message }) {
  toast(<AppToast type="warning" title={title} message={message} />, {
    ...commonOptions,
    type: 'warning',
  });
}

export function showInfoToast({ title, message }) {
  toast(<AppToast type="info" title={title} message={message} />, {
    ...commonOptions,
    type: 'info',
  });
}
