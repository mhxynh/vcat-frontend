import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

const Home = () => <h2>Project Dashboard</h2>;
const Summary = () => <h2>Summary</h2>;
const Catalog = () => <h2>Catalog</h2>;
const Controls = () => <h2>Controls</h2>;
const NotFound = () => <h2>404: Page Not Found</h2>;

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/summary" element={<Summary/>} />
            <Route path="/catalog" element={<Catalog/>} />
            <Route path="/controls" element={<Controls/>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;