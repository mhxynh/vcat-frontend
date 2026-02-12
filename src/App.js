import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/dashboard";
import Controls from "./pages/controls";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/controls" element={<Controls />} />
      </Routes>
    </BrowserRouter>
  );
}
