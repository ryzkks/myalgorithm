import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef } from "react";
import axios from "axios";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import Dashboard from "@/pages/Dashboard";
import DashboardOverview from "@/pages/DashboardOverview";
import AnalyzeContent from "@/pages/AnalyzeContent";
import GrowthPlan from "@/pages/GrowthPlan";
import Competitors from "@/pages/Competitors";
import AccountPage from "@/pages/AccountPage";
import BillingPage from "@/pages/BillingPage";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace("#", "?")).get("session_id");
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        await refreshUser();
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="text-cyan-400 text-lg">Authenticating...</div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
        <Route index element={<DashboardOverview />} />
        <Route path="analyze" element={<AnalyzeContent />} />
        <Route path="growth-plan" element={<GrowthPlan />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
