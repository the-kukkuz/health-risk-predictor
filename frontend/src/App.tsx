import { useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, Navigate, Outlet } from "react-router-dom";
import Icon from "./components/Icon";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DISCLAIMER } from "./config/diseases";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "home", end: true },
  { to: "/analysis", label: "Risk Assessment", icon: "biotech", end: false },
  { to: "/dashboard", label: "Analytics", icon: "bar_chart", end: false },
  { to: "/history", label: "History", icon: "history", end: false },
];

function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const content = (
    <aside className="flex flex-col h-full w-60 shrink-0 bg-white border-r border-gray-200/80">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200/80">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <Icon name="ecg" className="text-[16px] text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
            HealthRisk
          </span>
        </Link>
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto btn-ghost p-1"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50/80 text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon name={item.icon} className="text-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-200/80">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-colors duration-150"
        >
          <Icon name="logout" className="text-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <div className="hidden md:block h-full">{content}</div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="relative z-10 animate-fade-in">{content}</div>
        </div>
      )}
    </>
  );
}

function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shrink-0">
      <div className="flex items-center justify-between h-14 px-5 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden btn-ghost p-1.5"
            aria-label="Open navigation"
          >
            <Icon name="menu" className="text-[20px]" />
          </button>
          <span className="hidden sm:inline-block text-xs font-medium text-gray-400">
            Clinical Risk Intelligence Platform
          </span>
        </div>

        <Link
          to="/analysis"
          className="btn-primary text-xs font-semibold py-2 px-3.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <Icon name="add" className="text-[16px]" />
          New assessment
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200/80 bg-white shrink-0 py-4">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p className="leading-relaxed max-w-2xl text-center md:text-left text-gray-400">
          {DISCLAIMER}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Protected app routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
