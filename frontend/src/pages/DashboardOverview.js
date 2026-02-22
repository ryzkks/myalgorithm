import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Eye, Heart, Sparkles, ArrowRight, BarChart3, Zap, Target } from "lucide-react";
import { LevelBadge, AchievementGrid, DailyUsage } from "@/components/GamificationPanel";
import { MetricSkeleton, ListSkeleton, CardSkeleton } from "@/components/SkeletonCards";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardOverview() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ov, an] = await Promise.all([
          axios.get(`${API}/dashboard/overview`, { withCredentials: true }),
          axios.get(`${API}/dashboard/analyses`, { withCredentials: true }),
        ]);
        setOverview(ov.data);
        setAnalyses(an.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = overview?.metrics || {};
  const metricCards = [
    { label: "Reach Score", value: metrics.reach_score || 0, icon: Eye, color: "cyan", suffix: "/100" },
    { label: "Growth Rate", value: metrics.growth_rate || 0, icon: TrendingUp, color: "emerald", suffix: "%" },
    { label: "Engagement", value: metrics.engagement_score || 0, icon: Heart, color: "violet", suffix: "/100" },
    { label: "Avg Viral Score", value: metrics.avg_viral_score || 0, icon: Target, color: "amber", suffix: "" },
  ];

  const colorMap = {
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-cyan-500/10" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-400", glow: "shadow-violet-500/10" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/10" },
  };

  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1 transition-opacity duration-500">
            Welcome back, {user?.name?.split(" ")[0] || "Creator"}
          </h1>
          <p className="text-slate-400">Here's your content performance overview</p>
        </div>
        {overview?.daily_usage && overview.daily_usage.limit > 0 && (
          <div className="w-48">
            <DailyUsage usage={overview.daily_usage} />
          </div>
        )}
      </div>

      {/* Metric cards with stagger animation */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <MetricSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metrics-grid">
          {metricCards.map(({ label, value, icon: Icon, color, suffix }, i) => (
            <div key={label}
              className={`glass-card rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${colorMap[color].glow} opacity-0 animate-[fade-up_0.5s_ease-out_forwards]`}
              style={{ animationDelay: `${i * 100}ms` }}
              data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
                <div className={`w-9 h-9 rounded-xl ${colorMap[color].bg} flex items-center justify-center transition-transform duration-300 hover:scale-110`}>
                  <Icon className={`w-[18px] h-[18px] ${colorMap[color].text}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-bold font-['Outfit'] text-white">{value}{suffix}</p>
            </div>
          ))}
        </div>
      )}

      {/* Level + Achievements */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton lines={4} />
          <div className="lg:col-span-2"><CardSkeleton lines={5} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-0 animate-[fade-up_0.6s_ease-out_0.3s_forwards]">
          <LevelBadge level={overview?.level} />
          <div className="lg:col-span-2">
            <AchievementGrid achievements={overview?.all_achievements?.map(a => ({
              ...a,
              earned: overview?.achievements?.some(ea => ea.id === a.id) || false,
            })) || []} />
          </div>
        </div>
      )}

      {/* Recent Analyses + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 opacity-0 animate-[fade-up_0.6s_ease-out_0.4s_forwards]" data-testid="recent-analyses">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-['Outfit'] text-lg font-semibold text-white">Recent Analyses</h2>
            <Link to="/dashboard/analyze" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group">
              View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {loading ? (
            <ListSkeleton count={4} />
          ) : analyses.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No analyses yet</p>
              <Link to="/dashboard/analyze" data-testid="first-analysis-link"
                className="inline-flex items-center gap-2 text-cyan-400 text-sm mt-2 hover:text-cyan-300">
                Run your first analysis <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.slice(0, 5).map((a, i) => (
                <div key={a.analysis_id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group opacity-0 animate-[fade-up_0.4s_ease-out_forwards]"
                  style={{ animationDelay: `${500 + i * 80}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-sm font-bold text-cyan-400">{a.result?.viral_score || 0}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.content?.slice(0, 80)}...</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">{a.platform}</span>
                      <span className="text-slate-700">&middot;</span>
                      <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</span>
                      {a.favorited && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6 opacity-0 animate-[fade-up_0.6s_ease-out_0.5s_forwards]" data-testid="quick-actions">
          <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {(overview?.quick_actions || []).map((action) => (
              <Link key={action.link} to={action.link}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all duration-300 group"
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Zap className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 ml-auto transition-all group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          {/* Plan info */}
          <div className="mt-5 pt-5 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Current Plan</span>
              <span className={`text-xs font-bold uppercase ${
                user?.plan === "premium" ? "text-amber-400" : user?.plan === "pro" ? "text-cyan-400" : "text-slate-400"
              }`}>
                {user?.plan || "free"}
              </span>
            </div>
            {user?.plan === "free" && (
              <Link to="/dashboard/billing"
                className="mt-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"
                data-testid="upgrade-prompt">
                Upgrade for unlimited analyses <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// tiny import needed for favorited star
import { Star } from "lucide-react";
