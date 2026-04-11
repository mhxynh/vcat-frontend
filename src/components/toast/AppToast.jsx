import React from 'react';
import './AppToast.css';

const ICONS = {
  success: '✓',
  error: '!',
  warning: '△',
  info: 'i',
};

export default function AppToast({ type = 'info', title, message }) {
  return (
    <div className={`app-toast app-toast--${type}`}>
      <div className="app-toast__main">
        <div className={`app-toast__icon app-toast__icon--${type}`}>{ICONS[type]}</div>

        <div className="app-toast__content">
          <div className="app-toast__title">{title}</div>
          {message ? <div className="app-toast__message">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}
