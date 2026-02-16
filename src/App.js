import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/dashboard";
import Controls from "./pages/ControlsCatalog";
import KanbanBoard from "./pages/KanbanBoard";

export default function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
