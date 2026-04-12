import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { ToastContainer } from 'react-toastify';
import { vcatTheme, components, formFields } from './pages/Login';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/ControlsCatalog';
import Tracker from './pages/ControlsTracker';
import '@aws-amplify/ui-react/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.css';

const NotFound = () => <h2>404: Page Not Found</h2>;

export default function App() {
  return (
    <ThemeProvider theme={vcatTheme}>
      <Authenticator.Provider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Authenticator components={components} formFields={formFields} hideSignUp={true}>
                {({ signOut, user }) => (
                  <main style={{ width: '100%', padding: '20px' }}>
                    <Routes>
                      <Route path="/" element={<Dashboard user={user} />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/tracker" element={<Tracker />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>

                    <ToastContainer
                      position="top-right"
                      autoClose={5000}
                      newestOnTop
                      closeOnClick={false}
                      pauseOnHover={false}
                      draggable={false}
                      hideProgressBar={false}
                      theme="light"
                      toastStyle={{
                        background: 'transparent',
                        boxShadow: 'none',
                        padding: 0,
                        minHeight: 'unset',
                      }}
                      bodyStyle={{
                        padding: 0,
                        margin: 0,
                      }}
                    />
                  </main>
                )}
              </Authenticator>
            </div>
          </div>
        </Router>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
