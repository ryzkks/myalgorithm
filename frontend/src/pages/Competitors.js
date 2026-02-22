import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Search, TrendingUp, BarChart3, Loader2, Target, Zap, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Competitors() {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!username.trim()) {
      toast.error("Enter a competitor username");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/competitors/analyze`, { username, platform }, { withCredentials: true });
      setResult(res.data);
      toast.success("Competitor analysis complete!");
    } catch (err) {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="competitors-page">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Competitor Intelligence</h1>
        <p className="text-slate-400">Discover what top creators in your niche are doing differently</p>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-6" data-testid="competitor-search">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="@competitor_username"
              className="pl-10 bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11 rounded-xl"
              data-testid="competitor-username-input"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-950/50 border-slate-800 text-white h-11 rounded-xl" data-testid="competitor-platform-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
              <SelectItem value="tiktok" className="text-white">TikTok</SelectItem>
              <SelectItem value="youtube" className="text-white">YouTube</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={loading} data-testid="competitor-analyze-btn"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 px-6 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </Button>
        </div>
      </div>

      {/* Results */}
      {!result && !loading && (
        <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Enter a competitor's username to get insights</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-up" data-testid="competitor-results">
          {/* Header */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">@</span>
              </div>
              <div>
                <h2 className="font-['Outfit'] text-xl font-bold text-white">@{result.username}</h2>
                <p className="text-sm text-slate-400 capitalize">{result.platform}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Posting Freq</p>
                <p className="text-lg font-bold text-white">{result.posting_frequency}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Engagement</p>
                <p className="text-lg font-bold text-cyan-400">{result.avg_engagement_rate}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center sm:col-span-1 col-span-2">
                <p className="text-xs text-slate-500 mb-1">Growth</p>
                <p className="text-lg font-bold text-emerald-400">{result.growth_trend}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Content */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-['Outfit'] text-base font-semibold text-white">Top Content</h3>
              </div>
              <div className="space-y-3">
                {(result.top_performing_content || []).map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                    <div>
                      <p className="text-sm text-white">{c.type}</p>
                      <p className="text-xs text-slate-500">{c.topic}</p>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">{c.engagement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-cyan-400" />
                <h3 className="font-['Outfit'] text-base font-semibold text-white">Content Themes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.content_themes || []).map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">{t}</span>
                ))}
              </div>
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">Opportunities</h4>
                </div>
                <ul className="space-y-2">
                  {(result.opportunities || []).map((o, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
