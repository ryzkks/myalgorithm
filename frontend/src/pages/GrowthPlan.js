import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, Lightbulb, TrendingUp, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dayColors = {
  monday: "cyan", tuesday: "emerald", wednesday: "violet",
  thursday: "amber", friday: "rose", saturday: "blue", sunday: "teal",
};

export default function GrowthPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/growth-plan`, { withCredentials: true })
      .then((res) => setPlan(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="growth-plan-page">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Growth Plan</h1>
        <p className="text-slate-400">Your personalized weekly content strategy</p>
      </div>

      {/* Weekly Schedule */}
      <div className="glass-card rounded-2xl p-6" data-testid="weekly-schedule">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Outfit'] text-lg font-semibold text-white">Weekly Posting Strategy</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {plan?.weekly_strategy && Object.entries(plan.weekly_strategy).map(([day, data]) => (
            <div key={day} className="bg-white/[0.02] rounded-xl p-4 border border-slate-800/50 hover:border-cyan-500/20 transition-all"
              data-testid={`schedule-${day}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {day}
                </span>
                <span className="text-xs text-slate-500">{data.time}</span>
              </div>
              <p className="text-sm font-medium text-white mb-1">{data.type}</p>
              <p className="text-xs text-slate-400">{data.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Posting Times */}
        <div className="glass-card rounded-2xl p-6" data-testid="posting-times">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Outfit'] text-lg font-semibold text-white">Best Posting Times</h2>
          </div>
          <div className="space-y-4">
            {(plan?.best_posting_times || []).map((slot) => (
              <div key={slot.day} className="bg-white/[0.02] rounded-xl p-4">
                <p className="text-sm font-medium text-white mb-2">{slot.day}</p>
                <div className="flex flex-wrap gap-2">
                  {slot.times.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Topics */}
        <div className="glass-card rounded-2xl p-6" data-testid="recommended-topics">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Outfit'] text-lg font-semibold text-white">Recommended Topics</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(plan?.recommended_topics || []).map((topic) => (
              <span key={topic} className="px-3 py-2 rounded-xl bg-white/[0.03] border border-slate-800/50 text-sm text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content Ideas */}
      <div className="glass-card rounded-2xl p-6" data-testid="content-ideas">
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Outfit'] text-lg font-semibold text-white">Content Ideas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(plan?.content_ideas || []).map((idea, i) => (
            <div key={i} className="group bg-white/[0.02] rounded-xl p-4 border border-slate-800/50 hover:border-cyan-500/20 hover:-translate-y-0.5 transition-all cursor-default">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 mt-0.5 flex-shrink-0 transition-colors" />
                <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{idea}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
