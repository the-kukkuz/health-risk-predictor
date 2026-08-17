import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PredictionPage from "./pages/PredictionPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ModelInfoPage from "./pages/ModelInfoPage";
import { DISCLAIMER } from "./config/diseases";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/predict/diabetes", label: "Diabetes", end: false },
  { to: "/predict/heart", label: "Heart Disease", end: false },
  { to: "/analytics/diabetes", label: "Analytics", end: false },
  { to: "/models", label: "Model Info", end: false },
];

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              HR
            </div>
            <span className="font-semibold text-slate-800">
              Health Risk Predictor
            </span>
          </div>
          <nav className="flex gap-1 flex-wrap">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:text-brand-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict/:disease" element={<PredictionPage />} />
          <Route path="/analytics/:disease" element={<AnalyticsPage />} />
          <Route path="/models" element={<ModelInfoPage />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}
