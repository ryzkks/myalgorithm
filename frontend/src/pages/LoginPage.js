import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      await fetch(`${API}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("If this email exists, a reset link has been sent.");
      setResetMode(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 hero-gradient grid-bg">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center group" data-testid="login-logo-link">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-cyan-400" />
          </div>
          <span className="font-['Outfit'] text-xl font-bold text-white">MyAlgorithm</span>
        </Link>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-['Outfit'] text-2xl font-bold text-white mb-2" data-testid="login-heading">
            {resetMode ? "Reset Password" : "Welcome back"}
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            {resetMode ? "Enter your email to receive a reset link" : "Sign in to your MyAlgorithm account"}
          </p>

          {!resetMode ? (
            <>
              <button
                onClick={loginWithGoogle}
                data-testid="google-login-btn"
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition-all duration-300 mb-6"
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" required data-testid="login-email-input"
                      className="pl-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password" required data-testid="login-password-input"
                      className="pl-10 pr-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setResetMode(true)} className="text-xs text-cyan-400 hover:text-cyan-300" data-testid="forgot-password-link">
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" disabled={loading} data-testid="login-submit-btn"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                  {loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required data-testid="reset-email-input"
                  className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl" />
              </div>
              <Button type="submit" data-testid="reset-submit-btn"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 rounded-xl">
                Send Reset Link
              </Button>
              <button type="button" onClick={() => setResetMode(false)} className="w-full text-sm text-slate-400 hover:text-white">
                Back to login
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium" data-testid="signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
