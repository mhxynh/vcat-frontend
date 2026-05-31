import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_APP_CLIENT_ID,
      loginWith: {
        email: true,
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
const app = <App />;
const shouldDisableStrictMode = process.env.REACT_APP_DISABLE_STRICT_MODE === 'true';

root.render(shouldDisableStrictMode ? app : <React.StrictMode>{app}</React.StrictMode>);
