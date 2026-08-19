import { NavLink, Route, Routes } from "react-router-dom";
import Icon from "./components/Icon";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { DISCLAIMER } from "./config/diseases";

// Persistent left-sidebar navigation shown once "logged in" (demo: always).
// Not rendered on the Sign In / Sign Up routes.
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/analysis", label: "Analysis", icon: "analytics", end: false },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", end: false },
  { to: "/history", label: "History", icon: "history", end: false },
];

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-container-low border-r border-outline-variant">
      <div className="p-5 flex items-center gap-3 border-b border-outline-variant/50">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary">
          <Icon name="ecg" className="text-[18px]" />
        </div>
        <div>
          <h2 className="text-headline-sm text-on-surface leading-tight">
            Health Risk
          </h2>
          <p className="text-caption text-on-surface-variant">Predictor</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col p-3 gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-md transition ${
                isActive
                  ? "bg-surface-container-highest text-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`
            }
          >
            <Icon name={item.icon} className="text-[20px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-outline-variant/50">
        <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-surface-container-highest text-primary text-label-md rounded-lg hover:bg-surface-variant transition">
          <Icon name="trending_up" className="text-[16px]" />
          Upgrade Analytics
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="bg-surface border-b border-outline-variant shadow-sm shrink-0">
      <div className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <Icon name="ecg" className="text-[16px]" />
          </div>
          <span className="text-headline-md text-primary">Health Risk Predictor</span>
        </div>
        <span className="hidden md:block text-headline-md text-primary">
          Health Risk Predictor
        </span>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition">
            <Icon name="settings" className="text-[20px]" />
          </button>
          <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition">
            <Icon name="account_circle" className="text-[20px]" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container-lowest shrink-0">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-4">
        <p className="text-caption text-on-surface-variant leading-relaxed">
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}

function AppShell() {
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
