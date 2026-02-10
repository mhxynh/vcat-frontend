import { BrowserRouter, Routes, Route } from "react-router-dom";
import Controls from "./pages/controls";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/controls" element={<Controls />} />
        <Route path="*" element={<div>Home</div>} />
      </Routes>
    </BrowserRouter>
  );
}
