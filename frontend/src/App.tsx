import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnalysePage from "./pages/AnalysePage";
import ResultsPage from "./pages/ResultsPage";
import RecordsPage from "./pages/RecordsPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/analyse" replace />} />
          <Route path="/analyse" element={<AnalysePage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}
