import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Controls from './pages/ControlsCatalog';
import Requests from './pages/Request';
import KanbanBoard from './pages/Kanban';
import CalendarView from './pages/Calendar';

const NotFound = () => <h2>404: Page Not Found</h2>;

export default function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
