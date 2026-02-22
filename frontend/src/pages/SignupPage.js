import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 hero-gradient grid-bg">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center" data-testid="signup-logo-link">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-cyan-400" />
          </div>
          <span className="font-['Outfit'] text-xl font-bold text-white">MyAlgorithm</span>
        </Link>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-['Outfit'] text-2xl font-bold text-white mb-2" data-testid="signup-heading">Create your account</h1>
          <p className="text-slate-400 text-sm mb-8">Start growing your social presence with AI</p>

          <button onClick={loginWithGoogle} data-testid="google-signup-btn"
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition-all duration-300 mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required data-testid="signup-name-input"
                  className="pl-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required data-testid="signup-email-input"
                  className="pl-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required data-testid="signup-password-input"
                  className="pl-10 pr-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} data-testid="signup-submit-btn"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
              {loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium" data-testid="login-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
