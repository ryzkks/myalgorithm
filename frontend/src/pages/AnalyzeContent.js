import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AnalyzeContent() {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to analyze");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/analyze/content`, { content, platform }, { withCredentials: true });
      setResult(res.data);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const scoreBarColor = (score) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-cyan-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-8" data-testid="analyze-content-page">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Analyze Content</h1>
        <p className="text-slate-400">Get AI-powered insights on your content performance potential</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <div className="glass-card rounded-2xl p-6 space-y-5" data-testid="analyze-input-panel">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-slate-950/50 border-slate-800 text-white h-11 rounded-xl" data-testid="platform-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="tiktok" className="text-white hover:bg-slate-800">TikTok</SelectItem>
                <SelectItem value="instagram" className="text-white hover:bg-slate-800">Instagram</SelectItem>
                <SelectItem value="youtube" className="text-white hover:bg-slate-800">YouTube</SelectItem>
                <SelectItem value="general" className="text-white hover:bg-slate-800">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block">
              Content / Video Link / Caption
            </label>
            <Textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your video link, caption, script, or content description here..."
              className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white placeholder:text-slate-600 min-h-[200px] rounded-xl resize-none"
              data-testid="content-textarea"
            />
          </div>

          <Button onClick={handleAnalyze} disabled={loading} data-testid="analyze-btn"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Analyze Content</>
            )}
          </Button>
        </div>

        {/* Results panel */}
        <div className="glass-card rounded-2xl p-6" data-testid="analyze-results-panel">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-cyan-500/40" />
              </div>
              <p className="text-slate-400 text-sm">Enter your content and click analyze to get AI insights</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4 animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-slate-300 text-sm">AI is analyzing your content...</p>
              <p className="text-slate-500 text-xs mt-1">This may take a few seconds</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-up">
              {/* Viral Score */}
              <div className="text-center" data-testid="viral-score-display">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Viral Potential Score</p>
                <div className={`text-6xl font-bold font-['Outfit'] ${scoreColor(result.viral_score)} mb-2`}>
                  {result.viral_score}
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(result.viral_score)}`}
                    style={{ width: `${result.viral_score}%` }} />
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <p className="text-sm text-slate-300 bg-white/[0.02] rounded-xl p-4 border border-slate-800/50" data-testid="analysis-summary">
                  {result.summary}
                </p>
              )}

              {/* Strengths */}
              <div data-testid="analysis-strengths">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {(result.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div data-testid="analysis-weaknesses">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Weaknesses</h3>
                </div>
                <ul className="space-y-2">
                  {(result.weaknesses || []).map((w, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div data-testid="analysis-suggestions">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Improvement Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {(result.suggestions || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
