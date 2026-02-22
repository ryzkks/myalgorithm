import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Check, Crown, Zap, Star, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const planIcons = { starter: Zap, creator: Crown, pro: Star };

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const pollPaymentStatus = useCallback(async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      toast.error("Payment status check timed out");
      return;
    }
    try {
      const res = await axios.get(`${API}/billing/status/${sessionId}`, { withCredentials: true });
      if (res.data.payment_status === "paid") {
        toast.success("Payment successful! Your plan has been upgraded.");
        await refreshUser();
        fetchData();
        setSearchParams({});
        return;
      }
      if (res.data.status === "expired") {
        toast.error("Payment session expired");
        setSearchParams({});
        return;
      }
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch {
      toast.error("Error checking payment status");
    }
  }, [refreshUser, setSearchParams]);

  const fetchData = async () => {
    try {
      const [p, h] = await Promise.all([
        axios.get(`${API}/billing/plans`, { withCredentials: true }),
        axios.get(`${API}/billing/history`, { withCredentials: true }),
      ]);
      setPlans(p.data);
      setHistory(h.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, []);

  const handleCheckout = async (planId) => {
    setCheckingOut(planId);
    try {
      const originUrl = window.location.origin;
      const res = await axios.post(`${API}/billing/checkout`, { plan_id: planId, origin_url: originUrl }, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error("Failed to start checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="billing-page">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Billing</h1>
        <p className="text-slate-400">Manage your subscription and payment history</p>
      </div>

      {/* Current Plan */}
      <div className="glass-card rounded-2xl p-6" data-testid="current-plan-section">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Outfit'] text-lg font-semibold text-white">Current Plan</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-semibold capitalize">
            {user?.plan || "free"}
          </span>
          {user?.plan === "free" && (
            <span className="text-sm text-slate-400">Upgrade to unlock all features</span>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="plans-grid">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id] || Zap;
          const isPopular = plan.id === "creator";
          const isCurrent = user?.plan === plan.id;
          return (
            <div key={plan.id}
              className={`glass-card rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-1 ${
                isPopular ? "neon-border" : ""
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-bold">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] text-cyan-400" strokeWidth={1.5} />
                </div>
                <h3 className="font-['Outfit'] text-lg font-bold text-white">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold font-['Outfit'] text-white">${plan.price}</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {(plan.features || []).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button disabled className="w-full rounded-xl bg-slate-800 text-slate-400">Current Plan</Button>
              ) : (
                <Button onClick={() => handleCheckout(plan.id)} disabled={checkingOut === plan.id}
                  data-testid={`checkout-${plan.id}`}
                  className={`w-full rounded-xl font-semibold ${
                    isPopular
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}>
                  {checkingOut === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Started"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <div className="glass-card rounded-2xl p-6" data-testid="payment-history">
        <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-4">Payment History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No payment history yet</p>
        ) : (
          <div className="space-y-2">
            {history.map((txn) => (
              <div key={txn.transaction_id || txn.session_id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="text-sm text-white font-medium">{txn.plan_name}</p>
                  <p className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">${txn.amount?.toFixed(2)}</p>
                  <span className={`text-xs font-medium capitalize ${
                    txn.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {txn.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
