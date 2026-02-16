import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Controls from './pages/ControlsCatalog';
import Tests from './pages/Tests';

const NotFound = () => <h2>404: Page Not Found</h2>;

export default function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Controls />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
