import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function PlanGate({ requiredPlan = "pro", children, fallback }) {
  const { user } = useAuth();
  const planOrder = { free: 0, pro: 1, premium: 2 };
  const userLevel = planOrder[user?.plan] || 0;
  const requiredLevel = planOrder[requiredPlan] || 1;

  if (userLevel >= requiredLevel) return children;

  if (fallback) return fallback;

  return (
    <div className="glass-card rounded-2xl p-8 text-center" data-testid="plan-gate">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="font-['Outfit'] text-lg font-bold text-white mb-2">
        {requiredPlan === "premium" ? "Premium" : "Pro"} Feature
      </h3>
      <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
        This feature requires {requiredPlan === "premium" ? "Premium" : "Pro"} plan.
        Upgrade to unlock advanced tools and insights.
      </p>
      <Link to="/dashboard/billing" data-testid="upgrade-link"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        Upgrade Now <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function PlanBadge({ plan }) {
  const colors = {
    free: "bg-slate-800 text-slate-400 border-slate-700",
    pro: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    premium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[plan] || colors.free}`}
      data-testid="plan-badge">
      {plan || "free"}
    </span>
  );
}
