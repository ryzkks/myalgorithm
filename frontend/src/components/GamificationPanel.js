import { Trophy, Sparkles, Flame, TrendingUp, Crown, Star, BarChart3, Zap, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const iconMap = {
  sparkles: Sparkles, "bar-chart": BarChart3, trophy: Trophy,
  flame: Flame, zap: Zap, "trending-up": TrendingUp, crown: Crown, star: Star,
};

export function LevelBadge({ level, compact = false }) {
  if (!level) return null;
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20" data-testid="level-badge-compact">
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] font-bold text-cyan-400">LVL {level.level}</span>
      </div>
    );
  }
  return (
    <div className="glass-card rounded-2xl p-5" data-testid="level-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
            <span className="text-lg font-bold font-['Outfit'] text-cyan-400">{level.level}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{level.name}</p>
            <p className="text-xs text-slate-500">{level.xp} XP</p>
          </div>
        </div>
        {level.next_name && (
          <p className="text-[10px] text-slate-500 text-right">
            Next: <span className="text-slate-400">{level.next_name}</span>
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500">Progress</span>
          <span className="text-cyan-400 font-medium">{level.progress}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${level.progress}%` }}
          />
        </div>
        {level.next_xp && (
          <p className="text-[10px] text-slate-600">{level.next_xp - level.xp} XP to next level</p>
        )}
      </div>
    </div>
  );
}

export function AchievementGrid({ achievements = [], compact = false }) {
  if (!achievements.length) return null;
  const shown = compact ? achievements.slice(0, 6) : achievements;
  return (
    <div className="glass-card rounded-2xl p-5" data-testid="achievements-card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white font-['Outfit']">Achievements</h3>
        <span className="ml-auto text-[10px] text-slate-500">
          {achievements.filter((a) => a.earned).length}/{achievements.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {shown.map((ach) => {
          const Icon = iconMap[ach.icon] || Star;
          return (
            <div
              key={ach.id}
              className={`relative p-3 rounded-xl border transition-all duration-300 group ${
                ach.earned
                  ? "bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40"
                  : "bg-white/[0.01] border-slate-800/50 opacity-40"
              }`}
              data-testid={`achievement-${ach.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${ach.earned ? "text-cyan-400" : "text-slate-600"}`} />
                {!ach.earned && <Lock className="w-2.5 h-2.5 text-slate-600 absolute top-2 right-2" />}
              </div>
              <p className={`text-xs font-medium ${ach.earned ? "text-white" : "text-slate-500"}`}>{ach.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{ach.desc}</p>
              {ach.earned && (
                <span className="text-[9px] text-cyan-500/60 mt-1 block">+{ach.xp} XP</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DailyUsage({ usage }) {
  if (!usage || usage.limit === -1) return null;
  const pct = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  return (
    <div className="glass-card rounded-2xl p-4" data-testid="daily-usage">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Daily Analyses</span>
        <span className={`text-xs font-bold ${pct >= 100 ? "text-red-400" : "text-cyan-400"}`}>
          {usage.used}/{usage.limit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-red-500" : pct >= 66 ? "bg-amber-500" : "bg-cyan-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {pct >= 100 && (
        <p className="text-[10px] text-red-400 mt-1.5">Limit reached. Upgrade for unlimited.</p>
      )}
    </div>
  );
}

export function XpToast({ amount, reason }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
        <Zap className="w-3 h-3 text-cyan-400" />
      </div>
      <span className="text-white font-medium">+{amount} XP</span>
      <span className="text-slate-400">{reason}</span>
    </div>
  );
}
