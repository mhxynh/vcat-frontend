import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { vcatTheme, components } from './pages/Login';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/ControlsCatalog';
import Tracker from './pages/ControlsTracker';
import '@aws-amplify/ui-react/styles.css';
import './styles/index.css';

const NotFound = () => <h2>404: Page Not Found</h2>;

// App.js
export default function App() {
  return (
    <ThemeProvider theme={vcatTheme}>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Authenticator components={components} hideSignUp={true}>
              {({ signOut, user }) => (
                <main style={{ width: '100%', padding: '20px' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/tracker" element={<Tracker />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              )}
            </Authenticator>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}
