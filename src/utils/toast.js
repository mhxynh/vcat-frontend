import { toast } from 'react-toastify';
import AppToast from '../components/toast/AppToast';

const commonOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  closeButton: true,
  icon: false,
};

export function showSuccessToast({ title, message }) {
  toast(<AppToast type="success" title={title} message={message} />, {
    ...commonOptions,
    type: 'success',
  });
}

export function showErrorToast({ title, message }) {
  toast(<AppToast type="error" title={title} message={message} />, {
    ...commonOptions,
    type: 'error',
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
