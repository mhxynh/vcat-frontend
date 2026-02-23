import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/ControlsCatalog';
import Tracker from './pages/ControlsTracker';

const NotFound = () => <h2>404: Page Not Found</h2>;

export default function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
